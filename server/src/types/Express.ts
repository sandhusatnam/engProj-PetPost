import { Request } from 'express';

export interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  environment: string;
}
