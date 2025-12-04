import propertiesRepository from './properties.repository.js';
import storageService from '../../shared/services/storage.service.js';
import { CreatePropertyInput } from './properties.schema.js';

class PropertiesService {
  async createProperty(
    landlordId: string,
    input: CreatePropertyInput,
    files: Express.Multer.File[]
  ) {
    // 1. Upload Images to MinIO
    const uploadPromises = files.map((file) => 
      storageService.uploadFile(file, `properties/${landlordId}`)
    );
    const imageUrls = await Promise.all(uploadPromises);

    // 2. Create Database Record
    const property = await propertiesRepository.create(landlordId, input, imageUrls);

    return property;
  }
}

export default new PropertiesService();