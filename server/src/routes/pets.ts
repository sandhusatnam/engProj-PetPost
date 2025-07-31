import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { PetService } from '../services/petService.js';
import { validatePetData } from '../middleware/validation.js';
import type { Pet, ApiResponse, SearchCriteria } from '../types/Pet.js';

const router = express.Router();
const petService = new PetService();

router.get('/', async (req: Request, res: Response<ApiResponse<Pet[]>>): Promise<void> => {
  try {
    console.log('Fetching all pets...');
    const pets = await petService.getAllPets();
    
    res.status(200).json({
      success: true,
      data: pets,
      count: pets.length,
      message: 'Pets retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching pets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pets',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/:id', async (req: Request<{ id: string }>, res: Response<ApiResponse<Pet>>): Promise<void> => {
  try {
    const { id } = req.params;
    console.log(`Fetching pet with ID: ${id}`);
    
    const pet = await petService.getPetById(id);
    
    if (!pet) {
      res.status(404).json({
        success: false,
        error: 'Pet not found',
        message: `No pet found with ID: ${id}`
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: pet,
      message: 'Pet retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching pet:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pet',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/', validatePetData, async (req: Request, res: Response<ApiResponse<Pet>>): Promise<void> => {
  try {
    const petData: Pet = {
      id: uuidv4(),
      ...req.body,
      dateAdded: new Date().toISOString().split('T')[0]
    };
    
    console.log('Creating new pet:', petData.name);
    
    const newPet = await petService.createPet(petData);
    
    res.status(201).json({
      success: true,
      data: newPet,
      message: `Pet ${newPet.name} added successfully`
    });
  } catch (error) {
    console.error('Error creating pet:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create pet',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.put('/:id', validatePetData, async (req: Request<{ id: string }>, res: Response<ApiResponse<Pet>>): Promise<void> => {
  try {
    const { id } = req.params;
    console.log(`Updating pet with ID: ${id}`);
    
    const updatedPet = await petService.updatePet(id, req.body);
    
    if (!updatedPet) {
      res.status(404).json({
        success: false,
        error: 'Pet not found',
        message: `No pet found with ID: ${id}`
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: updatedPet,
      message: 'Pet updated successfully'
    });
  } catch (error) {
    console.error('Error updating pet:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update pet',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.delete('/:id', async (req: Request<{ id: string }>, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { id } = req.params;
    console.log(`Deleting pet with ID: ${id}`);
    
    const deleted = await petService.deletePet(id);
    
    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Pet not found',
        message: `No pet found with ID: ${id}`
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      message: 'Pet deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting pet:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete pet',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as petsRouter };
