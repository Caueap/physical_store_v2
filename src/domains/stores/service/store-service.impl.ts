import { Inject, Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';

import { StoreRepository } from '../repository/store-repository.interface';
import { ShippingService } from '../../../infrastructure/external-services/shipping/interfaces/shipping-service.interface';
import { LocationService } from '../../../infrastructure/external-services/location/interfaces/location-service.interface';
import { StoresByCepResponse } from '../types/stores-by-cep-response.interface';
import { Store } from '../entities/store.entity';
import { CreateStoreDto } from '../dtos/create-store.dto';
import { LocationPoint } from '../../../common/interfaces/location-point.interface';
import { paginate } from '../../../utils/functions';
import { StoreService } from './store-service.interface';
import { UpdateStoreDto } from '../dtos/update-store.dto';
import { BusinessRuleException } from '../../../common/exceptions/domain.exceptions';

@Injectable()
export class StoreServiceImpl implements StoreService {
  private readonly logger = new Logger(StoreServiceImpl.name);

  constructor(
    @Inject('StoreRepository')
    private storeRepository: StoreRepository,
    @Inject('CachedShippingService')
    private shippingService: ShippingService,
    @Inject('LocationService')
    private locationService: LocationService,
  ) { }

  async getAllStores(limit: number, offset: number): Promise<{ stores: any[]; limit: number; offset: number; total: number; }> {
    this.logger.log(`Getting all stores with limit: ${limit}, offset: ${offset}`);
    const { stores, total } = await this.storeRepository.findAll(limit, offset);
    return {
      stores,
      limit,
      offset,
      total,
    };
  }

  async getStoreById(id: string): Promise<Store> {
    this.logger.log(`Getting store with ID: ${id}`);
    const store = await this.storeRepository.findById(id);
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    return store;
  }

  async getStoresByState(state?: string, limit = 10, offset = 0): Promise<any> {
    return this.storeRepository.findByState(state, limit, offset);
  }

  async getStoresByCep(cep: string, limit = 10, offset = 0): Promise<StoresByCepResponse> {
    const { formattedCep, userCoordinates, locationInfo } = await this.locationService.getUserLocationFromCep(cep);

    const stores = await this.storeRepository.findAllWithPdvs();

    
    const storePoints = this.collectStorePoints(stores);

    const storePointsWithDistance = await this.calculateDistancesToPoints(storePoints, userCoordinates);

    const storesWithShipping = await this.processStoresWithShipping(
      stores,
      storePointsWithDistance,
      formattedCep
    );

    const sortedStores = this.sortLocationsByDistance(storesWithShipping);
    const paginatedStores = paginate(sortedStores, limit, offset);

    const pins = this.createPinsForMap(sortedStores, userCoordinates, locationInfo);

    return {
      stores: paginatedStores,
      pins: pins,
      limit,
      offset,
      total: sortedStores.length
    };
  }

  private collectStorePoints(stores: any[]): LocationPoint[] {
    const storePoints: LocationPoint[] = [];

    stores.forEach(store => {
      if (store.latitude && store.longitude) {
        storePoints.push({
          type: 'STORE',
          storeId: store._id,
          lat: store.latitude,
          lng: store.longitude,
          storeName: store.storeName,
        });
      }
    });

    return storePoints;
  }

  private async calculateDistancesToPoints(
    points: LocationPoint[],
    userCoordinates: { lat: number, lng: number }
  ): Promise<LocationPoint[]> {
    if (points.length === 0) {
      return [];
    }

    const destinations = points.map(point => ({
      lat: point.lat,
      lng: point.lng
    }));

    const distanceResults = await this.locationService.calculateDistances(
      userCoordinates,
      destinations
    );

    points.forEach((point, index) => {
      const result = distanceResults[index];
      point.distance = result.distance;
      point.duration = result.duration;
      point.distanceValue = result.distanceValue;
      point.distanceKm = (result.distanceValue ?? 0) / 1000;
    });

    return points;
  }

  private async validateStoreLocation(
    latitude: number,
    longitude: number,
    excludeStoreId?: string
  ): Promise<void> {
    if (!latitude || !longitude) {
      return;
    }

    const { stores } = await this.storeRepository.findAll(1000, 0);
    
    const storeWithSameCoordinates = stores.find(store => {
      const storeId = (store as any)._id?.toString();
      if (storeId === excludeStoreId) {
        return false;
      }
      
      return store.latitude && 
             store.longitude && 
             store.latitude.toString() === latitude.toString() && 
             store.longitude.toString() === longitude.toString();
    });
    
    if (storeWithSameCoordinates) {
      throw new BusinessRuleException(
        `A store "${storeWithSameCoordinates.storeName}" already exists at these exact coordinates`,
        BusinessRuleException.STORE_LOCATION_CONFLICT
      );
    }
  }

  private async processStoresWithShipping(
    stores: any[],
    storePoints: LocationPoint[],
    formattedCep: string
  ): Promise<any[]> {
    const storesWithShipping: any[] = [];

    for (const store of stores) {
      const storePoint = storePoints.find(p =>
        p.type === 'STORE' && p.storeId.toString() === store._id.toString()
      );

      if (storePoint) {
        const storeShippingInfo = await this.shippingService.calculateShipping(
          store.postalCode || '',
          formattedCep
        );

        storesWithShipping.push({
          name: store.storeName,
          city: store.city,
          postalCode: store.postalCode,
          type: "LOJA",
          distance: storePoint.distance || "N/A",
          value: storeShippingInfo,
          coordinates: {
            lat: store.latitude,
            lng: store.longitude
          }
        });
      }
    }

    return storesWithShipping;
  }


  private sortLocationsByDistance(locations: any[]): any[] {
    return [...locations].sort((a, b) => {
      const aDistance = parseFloat((a.distance || "").replace(/[^\d.]/g, '')) || Infinity;
      const bDistance = parseFloat((b.distance || "").replace(/[^\d.]/g, '')) || Infinity;
      return aDistance - bDistance;
    });
  }

  private createPinsForMap(
    locations: any[],
    userCoordinates: { lat: number, lng: number },
    locationInfo: { localidade: string, uf: string }
  ): Array<{ position: { lat: number, lng: number }, title: string }> {
    const pins: Array<{ position: { lat: number, lng: number }, title: string }> = [];

    locations.forEach(location => {
      pins.push({
        position: {
          lat: parseFloat(location.coordinates.lat),
          lng: parseFloat(location.coordinates.lng)
        },
        title: location.name
      });
    });

    pins.push({
      position: {
        lat: userCoordinates.lat,
        lng: userCoordinates.lng
      },
      title: `Current Location: ${locationInfo.localidade}, ${locationInfo.uf}`
    });

    return pins;
  }

  async createStore(createStoreDto: CreateStoreDto): Promise<Store> {
    try {
      this.logger.log(`Creating store with name: ${createStoreDto.storeName}`);
      
      if (createStoreDto.latitude && createStoreDto.longitude) {
        await this.validateStoreLocation(
          createStoreDto.latitude,
          createStoreDto.longitude
        );
      }
      
      const { stores } = await this.storeRepository.findAll(1000, 0);
      const existingStore = stores.find(store => 
        store.storeName.toLowerCase() === createStoreDto.storeName.toLowerCase()
      );
      
      if (existingStore) {
        throw new BadRequestException({
          statusCode: 400,
          error: "Bad Request",
          message: "Validation failed",
          errors: [`A store with the name "${createStoreDto.storeName}" already exists`]
        });
      }
      
      return await this.storeRepository.create(createStoreDto);
    } catch (error) {
      this.logger.error(`Error creating store: ${error.message}`, error.stack);
      
      if (error instanceof BusinessRuleException) {
        throw error;
      }
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      if (error.code === 11000 && error.keyPattern?.storeName) {
        throw new BadRequestException(`A store with the name "${createStoreDto.storeName}" already exists`);
      }
      throw error;
    }
  }

  async updateStore(id: string, updateStoreDto: UpdateStoreDto): Promise<Store> {
    try {
      this.logger.log(`Updating store with ID: ${id}`);
      
      const existingStore = await this.getStoreById(id);
      
      const errors: string[] = [];
      
      if (updateStoreDto.latitude && updateStoreDto.longitude) {
        try {
          await this.validateStoreLocation(
            updateStoreDto.latitude,
            updateStoreDto.longitude,
            id
          );
        } catch (error) {
          if (error instanceof BusinessRuleException) {
            errors.push(error.message);
          }
        }
      }
      
      if (updateStoreDto.storeName && updateStoreDto.storeName !== existingStore.storeName) {
        const { stores } = await this.storeRepository.findAll(1000, 0);
        const storeWithSameName = stores.find(store => 
          store.storeName.toLowerCase() === updateStoreDto.storeName?.toLowerCase() && 
          (store as any)._id.toString() !== id
        );
        
        if (storeWithSameName) {
          errors.push(`A store with the name "${updateStoreDto.storeName}" already exists`);
        }
      }
      
      if (errors.length > 0) {
        throw new BadRequestException({
          statusCode: 400,
          error: "Bad Request",
          message: "Validation failed",
          errors: errors
        });
      }
      
      return await this.storeRepository.update(id, updateStoreDto);
    } catch (error) {
      this.logger.error(`Error updating store: ${error.message}`, error.stack);
      if (error instanceof BusinessRuleException) {
        throw error;
      }
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      if (error.code === 11000 && error.keyPattern?.storeName) {
        throw new BadRequestException(`A store with the name "${updateStoreDto.storeName}" already exists`);
      }
      throw error;
    }
  }

  async deleteStore(id: string): Promise<boolean> {
    this.logger.log(`Deleting store with ID: ${id}`);
    
    await this.getStoreById(id);
    try {
      return await this.storeRepository.delete(id);
    } catch (error) {
      if (error.message.includes('associated PDVs')) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

} 