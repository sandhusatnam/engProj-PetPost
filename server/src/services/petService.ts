import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import type { Pet, CreatePetData, UpdatePetData, SearchCriteria, PetStatistics } from '../types/Pet.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class PetService {
  private dataDir: string;
  private petsFile: string;
  private initialized: boolean;

  constructor() {
    this.dataDir = path.join(__dirname, '..', '..', 'data');
    this.petsFile = path.join(this.dataDir, 'pets.json');
    this.initialized = false;
    console.log('Using JSON file for pet data storage');
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await fs.mkdir(this.dataDir, { recursive: true });

      try {
        await fs.access(this.petsFile);
      } catch (error) {
        console.log('Initialized pets.json with sample data');
      }

      this.initialized = true;
      console.log('PetService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize PetService:', error);
      throw error;
    }
  }

  async loadPets(): Promise<Pet[]> {
    await this.initialize();
    
    try {
      const data = await fs.readFile(this.petsFile, 'utf8');
      return JSON.parse(data) as Pet[];
    } catch (error) {
      console.error('Error loading pets:', error);
      return [];
    }
  }

  /**
   * Save pets to JSON file
   */
  async savePets(pets: Pet[]): Promise<void> {
    try {
      const data = JSON.stringify(pets, null, 2);
      await fs.writeFile(this.petsFile, data, 'utf8');
    } catch (error) {
      console.error('Error saving pets:', error);
      throw error;
    }
  }

  async getAllPets(): Promise<Pet[]> {
    const pets = await this.loadPets();

    return pets.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
  }

  async getPetById(id: string): Promise<Pet | null> {
    const pets = await this.loadPets();
    return pets.find(pet => pet.id === id) || null;
  }

  async createPet(petData: Pet): Promise<Pet> {
    const pets = await this.loadPets();
    
    const required: (keyof Pet)[] = ['id', 'name', 'age', 'breed', 'image'];
    for (const field of required) {
      if (!petData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    const ageNum = parseInt(String(petData.age));
    if (isNaN(ageNum) || ageNum < 0) {
      throw new Error('Age must be a valid positive number');
    }
    petData.age = ageNum;

    if (pets.find(pet => pet.id === petData.id)) {
      throw new Error(`Pet with ID ${petData.id} already exists`);
    }

    pets.push(petData);
    await this.savePets(pets);

    console.log(`Pet created: ${petData.name} (ID: ${petData.id})`);
    return petData;
  }

  async updatePet(id: string, updateData: UpdatePetData): Promise<Pet | null> {
    const pets = await this.loadPets();
    const petIndex = pets.findIndex(pet => pet.id === id);

    if (petIndex === -1) {
      return null;
    }

    const existingPet = pets[petIndex]!;

    const updatedPet: Pet = {
      id: id,
      name: updateData.name ?? existingPet.name,
      age: updateData.age ?? existingPet.age,
      breed: updateData.breed ?? existingPet.breed,
      description: updateData.description ?? existingPet.description,
      image: updateData.image ?? existingPet.image,
      dateAdded: existingPet.dateAdded
    };

    if (updateData.age !== undefined) {
      const ageNum = parseInt(String(updateData.age));
      if (isNaN(ageNum) || ageNum < 0) {
        throw new Error('Age must be a valid positive number');
      }
      updatedPet.age = ageNum;
    }

    pets[petIndex] = updatedPet;
    await this.savePets(pets);

    console.log(`Pet updated: ${updatedPet.name} (ID: ${id})`);
    return updatedPet;
  }

  async deletePet(id: string): Promise<boolean> {
    const pets = await this.loadPets();
    const petIndex = pets.findIndex(pet => pet.id === id);

    if (petIndex === -1) {
      return false;
    }

    const deletedPet = pets[petIndex]!;
    pets.splice(petIndex, 1);
    await this.savePets(pets);

    console.log(`Pet deleted: ${deletedPet.name} (ID: ${id})`);
    return true;
  }

  async searchPets(criteria: SearchCriteria): Promise<Pet[]> {
    const pets = await this.loadPets();
    
    return pets.filter(pet => {
      if (criteria.name && !pet.name.toLowerCase().includes(criteria.name.toLowerCase())) {
        return false;
      }
      if (criteria.breed && !pet.breed.toLowerCase().includes(criteria.breed.toLowerCase())) {
        return false;
      }
      if (criteria.minAge !== undefined && pet.age < criteria.minAge) {
        return false;
      }
      if (criteria.maxAge !== undefined && pet.age > criteria.maxAge) {
        return false;
      }
      return true;
    });
  }

  async getStatistics(): Promise<PetStatistics> {
    const pets = await this.loadPets();
    
    const stats: PetStatistics = {
      totalPets: pets.length,
      averageAge: pets.length > 0 ? pets.reduce((sum, pet) => sum + pet.age, 0) / pets.length : 0,
      breedCount: {},
      recentlyAdded: pets.filter(pet => {
        const addedDate = new Date(pet.dateAdded);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return addedDate >= weekAgo;
      }).length
    };

    // Count pets by breed
    pets.forEach(pet => {
      const breed = pet.breed.toLowerCase();
      stats.breedCount[breed] = (stats.breedCount[breed] || 0) + 1;
    });

    return stats;
  }
}
