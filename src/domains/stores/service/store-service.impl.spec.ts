import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';

import { StoreServiceImpl } from './store-service.impl';
import { CreateStoreDto } from '../dtos/create-store.dto';
import { UpdateStoreDto } from '../dtos/update-store.dto';
import { BusinessRuleException } from '../../../common/exceptions/domain.exceptions';

describe('StoreServiceImpl', () => {
  let service: StoreServiceImpl;

  const mockStoreRepository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByState: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findAllWithPdvs: jest.fn(),
  };

  const mockShippingService = {
    calculateShipping: jest.fn(),
  };

  const mockLocationService = {
    getUserLocationFromCep: jest.fn(),
    calculateDistances: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoreServiceImpl,
        {
          provide: 'StoreRepository',
          useValue: mockStoreRepository,
        },
        {
          provide: 'CachedShippingService',
          useValue: mockShippingService,
        },
        {
          provide: 'LocationService',
          useValue: mockLocationService,
        },
      ],
    }).compile();

    service = module.get<StoreServiceImpl>(StoreServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllStores', () => {
    it('should return all stores with pagination', async () => {
      // Arrange
      const limit = 10;
      const offset = 0;
      const mockStores = [{ id: '1', storeName: 'Store 1' }, { id: '2', storeName: 'Store 2' }];
      const total = 2;
      
      mockStoreRepository.findAll.mockResolvedValue({ stores: mockStores, total });

      // Act
      const result = await service.getAllStores(limit, offset);

      // Assert
      expect(mockStoreRepository.findAll).toHaveBeenCalledWith(limit, offset);
      expect(result).toEqual({
        stores: mockStores,
        limit,
        offset,
        total,
      });
    });
  });

  describe('getStoreById', () => {
    it('should return a store when it exists', async () => {
      // Arrange
      const storeId = '1';
      const mockStore = { id: storeId, storeName: 'Store 1' };
      
      mockStoreRepository.findById.mockResolvedValue(mockStore);

      // Act
      const result = await service.getStoreById(storeId);

      // Assert
      expect(mockStoreRepository.findById).toHaveBeenCalledWith(storeId);
      expect(result).toEqual(mockStore);
    });

    it('should throw NotFoundException when store does not exist', async () => {
      // Arrange
      const storeId = '999';
      
      mockStoreRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getStoreById(storeId)).rejects.toThrow(NotFoundException);
      expect(mockStoreRepository.findById).toHaveBeenCalledWith(storeId);
    });
  });

  describe('getStoresByState', () => {
    it('should return stores filtered by state', async () => {
      // Arrange
      const state = 'SP';
      const limit = 10;
      const offset = 0;
      const mockStores = [
        { id: '1', storeName: 'Store 1', state: 'SP' },
        { id: '2', storeName: 'Store 2', state: 'SP' }
      ];
      
      mockStoreRepository.findByState.mockResolvedValue({ stores: mockStores, total: 2 });

      // Act
      const result = await service.getStoresByState(state, limit, offset);

      // Assert
      expect(mockStoreRepository.findByState).toHaveBeenCalledWith(state, limit, offset);
      expect(result).toEqual({ stores: mockStores, total: 2 });
    });
  });

  describe('getStoresByCep', () => {
    it('should return stores sorted by distance to the given CEP', async () => {
      // Arrange
      const cep = '12345678';
      const limit = 10;
      const offset = 0;

      const locationInfo = {
        formattedCep: '12345-678',
        userCoordinates: { lat: -23.5505, lng: -46.6333 },
        locationInfo: { localidade: 'São Paulo', uf: 'SP' }
      };

      const mockStores = [
        { _id: '1', storeName: 'Store 1', latitude: -23.5605, longitude: -46.6433, postalCode: '12345000' },
        { _id: '2', storeName: 'Store 2', latitude: -23.5705, longitude: -46.6533, postalCode: '12345001' }
      ];

      mockLocationService.getUserLocationFromCep.mockResolvedValue(locationInfo);
      mockStoreRepository.findAllWithPdvs.mockResolvedValue(mockStores);
      mockLocationService.calculateDistances.mockResolvedValue([
        { distance: '1.2 km', duration: '5 min', distanceValue: 1200 },
        { distance: '2.4 km', duration: '10 min', distanceValue: 2400 }
      ]);
      mockShippingService.calculateShipping.mockResolvedValue({ value: 10, days: 3 });

      // Act
      const result = await service.getStoresByCep(cep, limit, offset);

      // Assert
      expect(mockLocationService.getUserLocationFromCep).toHaveBeenCalledWith(cep);
      expect(mockStoreRepository.findAllWithPdvs).toHaveBeenCalled();
      expect(mockLocationService.calculateDistances).toHaveBeenCalled();
      expect(mockShippingService.calculateShipping).toHaveBeenCalled();
      expect(result).toHaveProperty('stores');
      expect(result).toHaveProperty('pins');
      expect(result).toHaveProperty('limit', limit);
      expect(result).toHaveProperty('offset', offset);
    });
  });

  describe('createStore', () => {
    it('should create a new store', async () => {
      // Arrange
      const createStoreDto: CreateStoreDto = {
        storeName: 'New Store',
        latitude: -23.5505,
        longitude: -46.6333,
        address: 'Test Address',
        city: 'São Paulo',
        state: 'SP',
        postalCode: '12345678'
      };

      const createdStore = {
        id: '1',
        ...createStoreDto
      };

      mockStoreRepository.create.mockResolvedValue(createdStore);
      mockStoreRepository.findAll.mockResolvedValue({ stores: [], total: 0 });

      // Act
      const result = await service.createStore(createStoreDto);

      // Assert
      expect(mockStoreRepository.create).toHaveBeenCalledWith(createStoreDto);
      expect(result).toEqual(createdStore);
    });

    it('should throw BusinessRuleException when creating a store with existing coordinates', async () => {
      // Arrange
      const createStoreDto: CreateStoreDto = {
        storeName: 'New Store',
        latitude: -23.5505,
        longitude: -46.6333,
        address: 'Test Address',
        city: 'São Paulo',
        state: 'SP',
        postalCode: '12345678'
      };

      const existingStore = {
        _id: '1',
        storeName: 'Existing Store',
        latitude: -23.5505,
        longitude: -46.6333
      };

      mockStoreRepository.findAll.mockResolvedValue({ 
        stores: [existingStore], 
        total: 1 
      });

      // Act & Assert
      await expect(service.createStore(createStoreDto))
        .rejects.toThrow(BusinessRuleException);
    });
  });

  describe('updateStore', () => {
    it('should update an existing store', async () => {
      // Arrange
      const storeId = '1';
      const updateStoreDto: UpdateStoreDto = {
        storeName: 'Updated Store',
        address: 'Updated Address'
      };

      const existingStore = {
        id: storeId,
        storeName: 'Old Store',
        address: 'Old Address'
      };

      const updatedStore = {
        id: storeId,
        storeName: 'Updated Store',
        address: 'Updated Address'
      };

      mockStoreRepository.findById.mockResolvedValue(existingStore);
      mockStoreRepository.update.mockResolvedValue(updatedStore);
      mockStoreRepository.findAll.mockResolvedValue({ stores: [], total: 0 });

      // Act
      const result = await service.updateStore(storeId, updateStoreDto);

      // Assert
      expect(mockStoreRepository.findById).toHaveBeenCalledWith(storeId);
      expect(mockStoreRepository.update).toHaveBeenCalledWith(storeId, updateStoreDto);
      expect(result).toEqual(updatedStore);
    });

    it('should throw NotFoundException when updating non-existent store', async () => {
      // Arrange
      const storeId = '999';
      const updateStoreDto: UpdateStoreDto = {
        storeName: 'Updated Store'
      };

      mockStoreRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateStore(storeId, updateStoreDto))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteStore', () => {
    it('should delete an existing store', async () => {
      // Arrange
      const storeId = '1';
      const existingStore = {
        id: storeId,
        storeName: 'Store to Delete'
      };

      mockStoreRepository.findById.mockResolvedValue(existingStore);
      mockStoreRepository.delete.mockResolvedValue(true);

      // Act
      const result = await service.deleteStore(storeId);

      // Assert
      expect(mockStoreRepository.findById).toHaveBeenCalledWith(storeId);
      expect(mockStoreRepository.delete).toHaveBeenCalledWith(storeId);
      expect(result).toBe(true);
    });

    it('should throw NotFoundException when deleting non-existent store', async () => {
      // Arrange
      const storeId = '999';

      mockStoreRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.deleteStore(storeId))
        .rejects.toThrow(NotFoundException);
    });
  });
}); 