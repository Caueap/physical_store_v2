import { Test, TestingModule } from '@nestjs/testing';
import { StoreController } from './store.controller';
import { CreateStoreDto } from '../dtos/create-store.dto';
import { UpdateStoreDto } from '../dtos/update-store.dto';
import { Types } from 'mongoose';
import { HttpException, NotFoundException, ValidationPipe } from '@nestjs/common';

describe('StoreController', () => {
  let controller: StoreController;
  let storeServiceMock: any;

  const mockStore = {
    _id: new Types.ObjectId().toString(),
    storeName: 'Test Store',
    takeOutInStore: true,
    shippingTimeInDays: 2,
    latitude: 40.7128,
    longitude: -74.006,
    address: '123 Test Street',
    city: 'Test City',
    district: 'Test District',
    state: 'SP',
    country: 'Brazil',
    postalCode: '12345-678',
    telephoneNumber: 1234567890,
    emailAddress: 'test@store.com',
  };

  beforeEach(async () => {
    storeServiceMock = {
      getAllStores: jest.fn(),
      getStoreById: jest.fn(),
      getStoresByState: jest.fn(),
      getStoresByCep: jest.fn(),
      createStore: jest.fn(),
      updateStore: jest.fn(),
      deleteStore: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StoreController],
      providers: [
        {
          provide: 'StoreService',
          useValue: storeServiceMock,
        },
      ],
    }).compile();

    controller = module.get<StoreController>(StoreController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllStores', () => {
    it('should return an array of stores with pagination info', async () => {
      // Arrange
      const paginatedResult = {
        stores: [mockStore],
        limit: 10,
        offset: 0,
        total: 1,
      };
      storeServiceMock.getAllStores.mockResolvedValue(paginatedResult);

      // Act
      const result = await controller.getAllStores(10, 0);

      // Assert
      expect(result).toEqual(paginatedResult);
      expect(storeServiceMock.getAllStores).toHaveBeenCalledWith(10, 0);
    });
  });

  describe('getStoreById', () => {
    it('should return a single store by ID', async () => {
      // Arrange
      storeServiceMock.getStoreById.mockResolvedValue(mockStore);

      // Act
      const result = await controller.getStoreById(mockStore._id);

      // Assert
      expect(result).toEqual(mockStore);
      expect(storeServiceMock.getStoreById).toHaveBeenCalledWith(mockStore._id);
    });

    it('should throw NotFoundException when store is not found', async () => {
      // Arrange
      const nonExistentId = new Types.ObjectId().toString();
      storeServiceMock.getStoreById.mockRejectedValue(new NotFoundException(`Store with ID ${nonExistentId} not found`));

      // Act & Assert
      await expect(controller.getStoreById(nonExistentId)).rejects.toThrow(NotFoundException);
      expect(storeServiceMock.getStoreById).toHaveBeenCalledWith(nonExistentId);
    });
  });

  describe('getStoresByState', () => {
    it('should return stores filtered by state', async () => {
      // Arrange
      const stateResult = {
        stores: [mockStore],
        limit: 10,
        offset: 0,
        total: 1,
      };
      storeServiceMock.getStoresByState.mockResolvedValue(stateResult);

      // Act
      const result = await controller.getStoresByState('SP', 10, 0);

      // Assert
      expect(result).toEqual(stateResult);
      expect(storeServiceMock.getStoresByState).toHaveBeenCalledWith('SP', 10, 0);
    });
  });

  describe('getStoresByCep', () => {
    it('should return stores filtered by CEP', async () => {
      // Arrange
      const cepResult = {
        stores: [mockStore],
        limit: 10,
        offset: 0,
        total: 1,
        originalAddress: {
          postalCode: '12345-678',
          city: 'Test City',
          state: 'SP',
        }
      };
      storeServiceMock.getStoresByCep.mockResolvedValue(cepResult);

      // Act
      const result = await controller.getStoresByCep('12345-678', 10, 0);

      // Assert
      expect(result).toEqual(cepResult);
      expect(storeServiceMock.getStoresByCep).toHaveBeenCalledWith('12345-678', 10, 0);
    });
  });

  describe('createStore', () => {
    it('should create a new store', async () => {
      // Arrange
      const createStoreDto: CreateStoreDto = {
        storeName: 'New Test Store',
        takeOutInStore: true,
        shippingTimeInDays: 2,
        latitude: 40.7128,
        longitude: -74.006,
        address: '123 Test Street',
        city: 'Test City',
        district: 'Test District',
        state: 'SP',
        country: 'Brazil',
        postalCode: '12345-678',
        telephoneNumber: 1234567890,
        emailAddress: 'test@store.com',
      };
      const createdStore = { _id: new Types.ObjectId().toString(), ...createStoreDto };
      storeServiceMock.createStore.mockResolvedValue(createdStore);

      // Act
      const result = await controller.createStore(createStoreDto);

      // Assert
      expect(result).toEqual(createdStore);
      expect(storeServiceMock.createStore).toHaveBeenCalledWith(createStoreDto);
    });
  });

  describe('updateStore', () => {
    it('should update an existing store', async () => {
      // Arrange
      const updateStoreDto: UpdateStoreDto = {
        storeName: 'Updated Test Store',
      };
      const updatedStore = { ...mockStore, ...updateStoreDto };
      storeServiceMock.updateStore.mockResolvedValue(updatedStore);

      // Act
      const result = await controller.updateStore(mockStore._id, updateStoreDto);

      // Assert
      expect(result).toEqual(updatedStore);
      expect(storeServiceMock.updateStore).toHaveBeenCalledWith(mockStore._id, updateStoreDto);
    });

    it('should throw NotFoundException when updating a non-existent store', async () => {
      // Arrange
      const nonExistentId = new Types.ObjectId().toString();
      const updateStoreDto: UpdateStoreDto = {
        storeName: 'Updated Test Store',
      };
      storeServiceMock.updateStore.mockRejectedValue(new NotFoundException(`Store with ID ${nonExistentId} not found`));

      // Act & Assert
      await expect(controller.updateStore(nonExistentId, updateStoreDto)).rejects.toThrow(NotFoundException);
      expect(storeServiceMock.updateStore).toHaveBeenCalledWith(nonExistentId, updateStoreDto);
    });
  });

  describe('deleteStore', () => {
    it('should delete a store and return no content', async () => {
      // Arrange
      storeServiceMock.deleteStore.mockResolvedValue(true);

      // Act & Assert
      await expect(controller.deleteStore(mockStore._id)).resolves.toBeUndefined();
      expect(storeServiceMock.deleteStore).toHaveBeenCalledWith(mockStore._id);
    });

    it('should throw NotFoundException when deleting a non-existent store', async () => {
      // Arrange
      const nonExistentId = new Types.ObjectId().toString();
      storeServiceMock.deleteStore.mockRejectedValue(new NotFoundException(`Store with ID ${nonExistentId} not found`));

      // Act & Assert
      await expect(controller.deleteStore(nonExistentId)).rejects.toThrow(NotFoundException);
      expect(storeServiceMock.deleteStore).toHaveBeenCalledWith(nonExistentId);
    });
  });
}); 