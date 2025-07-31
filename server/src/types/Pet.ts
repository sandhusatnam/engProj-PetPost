export interface Pet {
  id: string;
  name: string;
  age: number;
  breed: string;
  description?: string;
  image: string;
  dateAdded: string;
}

export interface CreatePetData {
  name: string;
  age: number;
  breed: string;
  description?: string;
  image: string;
}

export interface UpdatePetData {
  name?: string;
  age?: number;
  breed?: string;
  description?: string;
  image?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message: string;
  details?: string[];
  count?: number;
}

export interface SearchCriteria {
  name?: string;
  breed?: string;
  minAge?: number;
  maxAge?: number;
}

export interface PetStatistics {
  totalPets: number;
  averageAge: number;
  breedCount: Record<string, number>;
  recentlyAdded: number;
}

export interface UploadResponse {
  imageUrl: string;
  filename: string;
  size: number;
}

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  environment: string;
}
