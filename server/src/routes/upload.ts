import express, { Request, Response } from 'express';
import multer from 'multer';
import { PetService } from '../services/petService.js';
import { S3Service } from '../services/s3Service.js';
import { v4 as uuidv4 } from 'uuid';
import type { Pet, ApiResponse, UploadResponse } from '../types/Pet.js';

const router = express.Router();
const petService = new PetService();

let s3Service: S3Service | null = null;
const getS3Service = () => {
  if (!s3Service) {
    console.log('🔧 Initializing S3Service for the first time...');
    s3Service = new S3Service();
  }
  return s3Service;
};

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Strict S3-only: Reject if S3 not configured
    if (!getS3Service().isConfigured()) {
      const error = new Error('S3 storage not configured') as any;
      error.code = 'S3_NOT_CONFIGURED';
      cb(error, false);
      return;
    }
    
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      const error = new Error('Only image files allowed') as any;
      cb(error, false);
    }
  }
});

interface UploadPetRequest extends Request {
  file?: Express.Multer.File;
  body: {
    name: string;
    age: string;
    breed: string;
    description?: string;
  };
}

router.post('/pet', upload.single('image'), async (req: UploadPetRequest, res: Response<ApiResponse<Pet>>): Promise<void> => {
  try {
    const { name, age, breed, description } = req.body;
    const imageFile = req.file;

    if (!name || !age || !breed || !imageFile) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Name, age, breed, and image are required'
      });
      return;
    }

    console.log(`📸 Uploading pet: ${name} with image`);

    console.log('📡 Uploading image to S3...');
    const imageUrl = await getS3Service().uploadFile(imageFile);
    console.log('✅ Image uploaded to S3 successfully');
    
    const petData: Pet = {
      id: uuidv4(),
      name: name.trim(),
      age: parseInt(age),
      breed: breed.trim(),
      description: description?.trim() || '',
      image: imageUrl,
      dateAdded: new Date().toISOString().split('T')[0]!
    };

    const newPet = await petService.createPet(petData);

    console.log(`Pet ${name} uploaded successfully`);

    res.status(201).json({
      success: true,
      data: newPet,
      message: `Pet ${name} uploaded successfully`
    });

  } catch (error) {
    console.error('Error uploading pet:', error);
    
    res.status(500).json({
      success: false,
      error: 'Upload failed',
      message: error instanceof Error ? error.message : 'Failed to upload pet data'
    });
  }
});

interface ImageUploadRequest extends Request {
  file?: Express.Multer.File;
}

router.post('/image', upload.single('image'), async (req: ImageUploadRequest, res: Response<ApiResponse<UploadResponse>>): Promise<void> => {
  try {
    const imageFile = req.file;

    if (!imageFile) {
      res.status(400).json({
        success: false,
        error: 'No image file provided',
        message: 'Please select an image to upload'
      });
      return;
    }

    console.log('📸 Uploading image...');

    console.log('📡 Uploading image to S3...');
    const imageUrl = await getS3Service().uploadFile(imageFile);
    console.log('Image uploaded to S3 successfully');

    console.log('Image uploaded successfully');

    res.status(200).json({
      success: true,
      data: {
        imageUrl: imageUrl,
        filename: imageFile.originalname,
        size: imageFile.size
      },
      message: 'Image uploaded successfully'
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    
    res.status(500).json({
      success: false,
      error: 'Image upload failed',
      message: error instanceof Error ? error.message : 'Failed to upload image'
    });
  }
});

export { router as uploadRouter };
