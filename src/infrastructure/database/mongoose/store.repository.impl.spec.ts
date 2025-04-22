import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { StoreRepositoryImpl } from './store.repository.impl';
import { Store, StoreDocument } from '../../../domains/stores/entities/store.entity';
import { CreateStoreDto } from '../../../domains/stores/dtos/create-store.dto';
import { UpdateStoreDto } from '../../../domains/stores/dtos/update-store.dto';
import { EntityNotFoundException, EntityRelationshipException } from '../../../common/exceptions/domain.exceptions';
import { DuplicateEntityException } from '../../../common/exceptions/domain.exceptions';
import { DatabaseExceptionMapper } from '../../../common/exceptions/database.exceptions';

describe('StoreRepositoryImpl', () => {
  let repository: StoreRepositoryImpl;
  let storeModel: Model<StoreDocument>;
  let mockPdvModel: any;

  const mockStoreId = new Types.ObjectId().toString();
  const mockPdvId1 = new Types.ObjectId().toString();
  const mockPdvId2 = new Types.ObjectId().toString();

  const mockStore = {
    _id: mockStoreId,
    storeName: 'Test Store',
    takeOutInStore: true,
    shippingTimeInDays: 2,
    latitude: 40.7128,
    longitude: -74.006,
    address: '123 Test Street',
    city: 'Test City',
    district: 'Test District',
    state: 'SP',
    type: 'LOJA',
    country: 'Brazil',
    postalCode: '12345-678',
    telephoneNumber: 1234567890,
    emailAddress: 'test@store.com',
    pdvs: [new Types.ObjectId(mockPdvId1), new Types.ObjectId(mockPdvId2)],
  };

  const mockPdv1 = {
    _id: mockPdvId1,
    storeName: 'PDV 1',
    store: new Types.ObjectId(mockStoreId),
  };

  const mockPdv2 = {
    _id: mockPdvId2,
    storeName: 'PDV 2',
    store: new Types.ObjectId(mockStoreId),
  };

  beforeEach(async () => {
    mockPdvModel = {
      countDocuments: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      }),
    };

    jest.spyOn(DatabaseExceptionMapper, 'executeOperation').mockImplementation(async (operation) => {
      try {
        return await operation();
      } catch (error) {
        throw error;
      }
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoreRepositoryImpl,
        {
          provide: getModelToken(Store.name),
          useValue: {
            find: jest.fn().mockReturnThis(),
            findById: jest.fn().mockReturnThis(),
            findByIdAndUpdate: jest.fn().mockReturnThis(),
            findOne: jest.fn().mockReturnThis(),
            findOneAndUpdate: jest.fn().mockReturnThis(),
            deleteOne: jest.fn().mockReturnThis(),
            create: jest.fn(),
            populate: jest.fn().mockReturnThis(),
            exec: jest.fn(),
            db: {
              model: jest.fn().mockReturnValue(mockPdvModel),
            },
          },
        },
      ],
    }).compile();

    repository = module.get<StoreRepositoryImpl>(StoreRepositoryImpl);
    storeModel = module.get<Model<StoreDocument>>(getModelToken(Store.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated stores and total count', async () => {
      // Arrange
      const mockStores = [mockStore, { ...mockStore, _id: new Types.ObjectId().toString() }];
      jest.spyOn(storeModel, 'find').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockStores),
        }),
      } as any);

      // Act
      const result = await repository.findAll(10, 0);

      // Assert
      expect(result.stores).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(storeModel.find).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return a store when it exists', async () => {
      // Arrange
      jest.spyOn(storeModel, 'findById').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockStore),
        }),
      } as any);

      // Act
      const result = await repository.findById(mockStoreId);

      // Assert
      expect(result).toEqual(mockStore);
      expect(storeModel.findById).toHaveBeenCalledWith(mockStoreId);
    });

    it('should throw EntityNotFoundException when store does not exist', async () => {
      // Arrange
      jest.spyOn(storeModel, 'findById').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      } as any);

      // Act & Assert
      await expect(repository.findById(mockStoreId)).rejects.toThrow(EntityNotFoundException);
      expect(storeModel.findById).toHaveBeenCalledWith(mockStoreId);
    });
  });

  describe('findByState', () => {
    it('should return stores filtered by state when state is provided', async () => {
      // Arrange
      jest.spyOn(storeModel, 'find').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([mockStore]),
        }),
      } as any);

      // Act
      const result = await repository.findByState('SP', 10, 0);

      // Assert
      expect(result.state).toBeDefined();
      expect(result.stores).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should return stores grouped by state when no state is provided', async () => {
      // Arrange
      const mockStores = [
        mockStore,
        { ...mockStore, _id: new Types.ObjectId().toString(), state: 'RJ' },
      ];
      jest.spyOn(storeModel, 'find').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockStores),
      } as any);

      // Act
      const result = await repository.findByState(undefined, 10, 0);

      // Assert
      expect(result.groupedStores).toBeDefined();
      expect(result.totalStates).toBe(2); // SP and RJ
    });
  });

  describe('create', () => {
    it('should create a new store successfully', async () => {
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
      
      const createdStore = { _id: new Types.ObjectId().toString(), ...createStoreDto, type: 'LOJA' };
      jest.spyOn(storeModel, 'create').mockResolvedValue(createdStore as any);

      // Act
      const result = await repository.create(createStoreDto);

      // Assert
      expect(result).toEqual(createdStore);
      expect(storeModel.create).toHaveBeenCalledWith({
        ...createStoreDto,
        type: 'LOJA',
      });
    });

    it('should throw DuplicateEntityException when duplicate store name is provided', async () => {
      // Arrange
      const createStoreDto: CreateStoreDto = {
        storeName: 'Existing Store',
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
      
      const duplicateError = {
        name: 'MongoServerError',
        code: 11000,
        keyPattern: { storeName: 1 },
        keyValue: { storeName: 'Existing Store' },
        message: 'E11000 duplicate key error collection: test.stores index: storeName_1 dup key: { storeName: "Existing Store" }'
      };
      
      storeModel.create = jest.fn().mockRejectedValue(duplicateError);
      
      jest.spyOn(DatabaseExceptionMapper, 'executeOperation').mockImplementation(async () => {
        throw new DuplicateEntityException('Store', 'storeName: Existing Store');
      });

      // Act & Assert
      await expect(repository.create(createStoreDto)).rejects.toThrow(DuplicateEntityException);
    });
  });

  describe('update', () => {
    it('should update an existing store', async () => {
      // Arrange
      const updateStoreDto: UpdateStoreDto = {
        storeName: 'Updated Test Store',
      };
      
      const updatedStore = { ...mockStore, storeName: 'Updated Test Store' };
      jest.spyOn(storeModel, 'findByIdAndUpdate').mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedStore),
      } as any);

      // Act
      const result = await repository.update(mockStoreId, updateStoreDto);

      // Assert
      expect(result).toEqual(updatedStore);
      expect(storeModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockStoreId,
        updateStoreDto,
        { new: true }
      );
    });

    it('should throw EntityNotFoundException when updating non-existent store', async () => {
      // Arrange
      const updateStoreDto: UpdateStoreDto = {
        storeName: 'Updated Test Store',
      };
      
      jest.spyOn(storeModel, 'findByIdAndUpdate').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      // Act & Assert
      await expect(repository.update(mockStoreId, updateStoreDto)).rejects.toThrow(EntityNotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete a store with no associated PDVs', async () => {
      // Arrange
      const storeWithoutPdvs = { ...mockStore, pdvs: [] };
      
      jest.spyOn(storeModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(storeWithoutPdvs),
      } as any);
      
      jest.spyOn(storeModel, 'deleteOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      } as any);

      // Act
      const result = await repository.delete(mockStoreId);

      // Assert
      expect(result).toBe(true);
      expect(storeModel.findById).toHaveBeenCalledWith(mockStoreId);
      expect(storeModel.deleteOne).toHaveBeenCalledWith({ _id: mockStoreId });
    });

    it('should throw EntityRelationshipException when store has associated PDVs', async () => {
      // Arrange
      jest.spyOn(storeModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockStore),
      } as any);
      
      mockPdvModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(2),
      });

      // Act & Assert
      await expect(repository.delete(mockStoreId)).rejects.toThrow(EntityRelationshipException);
      expect(storeModel.findById).toHaveBeenCalledWith(mockStoreId);
      expect(mockPdvModel.countDocuments).toHaveBeenCalled();
    });

    it('should throw EntityNotFoundException when deleting non-existent store', async () => {
      // Arrange
      jest.spyOn(storeModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      // Act & Assert
      await expect(repository.delete(mockStoreId)).rejects.toThrow(EntityNotFoundException);
    });
  });

  describe('findAllWithPdvs', () => {
    it('should return all stores with their associated PDVs', async () => {
      // Arrange
      const mockStoreWithPdvs = {
        ...mockStore,
        pdvs: [mockPdv1, mockPdv2],
      };
      
      jest.spyOn(storeModel, 'find').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([mockStoreWithPdvs]),
        }),
      } as any);

      // Act
      const result = await repository.findAllWithPdvs();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].pdvs).toHaveLength(2);
      expect(storeModel.find).toHaveBeenCalled();
    });
  });
}); 