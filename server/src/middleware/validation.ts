import { Request, Response, NextFunction } from 'express';
import type { ApiResponse } from '../types/Pet.js';

export const validatePetData = (req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
  const { name, age, breed } = req.body;
  const errors: string[] = [];

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Name is required and must be a non-empty string');
  } else if (name.trim().length > 50) {
    errors.push('Name must be 50 characters or less');
  }

  if (age === undefined || age === null) {
    errors.push('Age is required');
  } else {
    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 30) {
      errors.push('Age must be a number between 0 and 30');
    }
  }

  if (!breed || typeof breed !== 'string' || breed.trim().length === 0) {
    errors.push('Breed is required and must be a non-empty string');
  } else if (breed.trim().length > 100) {
    errors.push('Breed must be 100 characters or less');
  }

  if (req.body.description && typeof req.body.description === 'string') {
    if (req.body.description.length > 500) {
      errors.push('Description must be 500 characters or less');
    }
  }

  if (req.body.image && typeof req.body.image === 'string') {
    try {
      new URL(req.body.image);
    } catch (error) {
      errors.push('Image must be a valid URL');
    }
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: 'Please correct the following errors',
      details: errors
    });
    return;
  }

  req.body.name = name.trim();
  req.body.age = parseInt(age);
  req.body.breed = breed.trim();
  if (req.body.description) {
    req.body.description = req.body.description.trim();
  }

  next();
};

export const validateSearchParams = (req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
  const { name, breed, minAge, maxAge } = req.query;
  const errors: string[] = [];

  if (minAge !== undefined) {
    const minAgeNum = parseInt(minAge as string);
    if (isNaN(minAgeNum) || minAgeNum < 0) {
      errors.push('minAge must be a non-negative number');
    } else {
      req.query.minAge = minAgeNum.toString();
    }
  }

  if (maxAge !== undefined) {
    const maxAgeNum = parseInt(maxAge as string);
    if (isNaN(maxAgeNum) || maxAgeNum < 0) {
      errors.push('maxAge must be a non-negative number');
    } else {
      req.query.maxAge = maxAgeNum.toString();
    }
  }

  if (req.query.minAge !== undefined && req.query.maxAge !== undefined) {
    const min = parseInt(req.query.minAge as string);
    const max = parseInt(req.query.maxAge as string);
    if (min > max) {
      errors.push('minAge cannot be greater than maxAge');
    }
  }

  if (name && (name as string).length > 50) {
    errors.push('name parameter must be 50 characters or less');
  }

  if (breed && (breed as string).length > 100) {
    errors.push('breed parameter must be 100 characters or less');
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      error: 'Invalid search parameters',
      details: errors,
      message: 'Please correct the following errors'
    });
    return;
  }

  next();
};
