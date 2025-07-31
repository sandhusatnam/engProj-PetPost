import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import { petsRouter } from './routes/pets.js';
import { uploadRouter } from './routes/upload.js';
import type { ApiResponse, HealthCheckResponse } from './types/Pet.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));


// Logging
app.use(morgan('combined'));

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/health', (req: Request, res: Response<ApiResponse<HealthCheckResponse>>): void => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    },
    message: 'Server is healthy'
  });
});

// API routes
app.use('/api/pets', petsRouter);
app.use('/api/upload', uploadRouter);

// 404 handler
app.use('*', (req: Request, res: Response<ApiResponse>): void => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: 'The requested resource was not found on this server.'
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
  console.error('Error:', err);
  
  // Handle Multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        error: 'File too large',
        message: 'Please upload a file smaller than 5MB'
      });
      return;
    }
  }
  
  res.status(500).json({
    success: false,
    error: err.name || 'Internal Server Error',
    message: err.message || 'Something went wrong!'
  });
});

// Start server
app.listen(PORT, (): void => {
  console.log(`🚀 PostPet API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`☁️  File uploads: Direct to S3 (no local storage)`);
  
  if (!process.env.AWS_S3_BUCKET_NAME || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.warn(`⚠️  S3 not configured - uploads will fail`);
  }
});

export default app;
