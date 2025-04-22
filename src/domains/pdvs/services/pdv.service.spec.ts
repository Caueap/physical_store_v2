import { Test, TestingModule } from '@nestjs/testing';
import { PdvServiceImpl } from './pdv.service.impl';
import { PdvRepository } from '../repository/pdv.repository';
import { CreatePdvDto } from '../dtos/create-pdv.dto';
import { UpdatePdvDto } from '../dtos/update-pdv.dto';
import { Types } from 'mongoose';
import { EntityNotFoundException } from '../../../common/exceptions/domain.exceptions';

describe('PdvService', () => {
  let service: PdvServiceImpl;
  let repository: PdvRepository;

  const mockPdvRepository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByState: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockShippingService = {
    calculateShipping: jest.fn(),
  };

  const mockLocationService = {
    getUserLocationFromCep: jest.fn(),
    calculateDistances: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PdvServiceImpl,
        {
          provide: 'PdvRepository',
          useValue: mockPdvRepository,
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

    service = module.get<PdvServiceImpl>(PdvServiceImpl);
    repository = module.get<PdvRepository>('PdvRepository');

    jest.clearAllMocks();
  });

  describe('getAllPdvs', () => {
    it('should return all pdvs with pagination', async () => {
      // Arrange
      const limit = 10;
      const offset = 0;
      const mockPdvs = [
        { _id: new Types.ObjectId(), storeName: 'PDV 1' },
        { _id: new Types.ObjectId(), storeName: 'PDV 2' },
      ];
      mockPdvRepository.findAll.mockResolvedValue(mockPdvs);

      // Act
      const result = await service.getAllPdvs(limit, offset);

      // Assert
      expect(result.pdvs).toEqual(mockPdvs);
      expect(result.total).toEqual(mockPdvs.length);
      expect(result.limit).toEqual(limit);
      expect(result.offset).toEqual(offset);
      expect(repository.findAll).toHaveBeenCalled();
    });
  });

  describe('getPdvById', () => {
    it('should return a pdv by id', async () => {
      // Arrange
      const pdvId = new Types.ObjectId().toString();
      const mockPdv = {
        _id: pdvId,
        storeName: 'Test PDV',
        takeOutInStore: true,
      };
      mockPdvRepository.findById.mockResolvedValue(mockPdv);

      // Act
      const result = await service.getPdvById(pdvId);

      // Assert
      expect(result).toEqual(mockPdv);
      expect(repository.findById).toHaveBeenCalledWith(pdvId);
    });

    it('should throw EntityNotFoundException if pdv not found', async () => {
      // Arrange
      const pdvId = new Types.ObjectId().toString();
      mockPdvRepository.findById.mockRejectedValue(new EntityNotFoundException('PDV', pdvId));

      // Act & Assert
      await expect(service.getPdvById(pdvId)).rejects.toThrow(EntityNotFoundException);
      expect(repository.findById).toHaveBeenCalledWith(pdvId);
    });
  });

  describe('getPdvsByState', () => {
    it('should return pdvs filtered by state with pagination', async () => {
      // Arrange
      const state = 'SP';
      const limit = 10;
      const offset = 0;
      const mockPdvs = {
        state: 'São Paulo',
        pdvs: [
          { _id: new Types.ObjectId(), storeName: 'PDV 1', state: 'São Paulo' },
          { _id: new Types.ObjectId(), storeName: 'PDV 2', state: 'São Paulo' },
        ],
        total: 2,
        limit: 10,
        offset: 0
      };
      mockPdvRepository.findByState.mockResolvedValue(mockPdvs);

      // Act
      const result = await service.getAllPdvsByState(state, limit, offset);

      // Assert
      expect(result).toEqual(mockPdvs);
      expect(repository.findByState).toHaveBeenCalledWith(state, limit, offset);
    });
  });

  describe('createPdv', () => {
    it('should create a new pdv', async () => {
      // Arrange
      const storeId = new Types.ObjectId().toString();
      const createPdvDto: CreatePdvDto = {
        storeName: 'New PDV',
        parentStoreId: storeId,
        takeOutInStore: true,
        shippingTimeInDays: 3,
      };
      
      const mockCreatedPdv = {
        _id: new Types.ObjectId(),
        storeName: createPdvDto.storeName,
        store: storeId,
        takeOutInStore: createPdvDto.takeOutInStore,
        shippingTimeInDays: createPdvDto.shippingTimeInDays,
      };
      
      mockPdvRepository.create.mockResolvedValue(mockCreatedPdv);
      mockPdvRepository.findAll.mockResolvedValue([]);

      // Act
      const result = await service.createPdv(createPdvDto);

      // Assert
      expect(result).toEqual(mockCreatedPdv);
      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
        storeName: 'New PDV',
        parentStoreId: storeId
      }));
    });
  });

  describe('updatePdv', () => {
    it('should update an existing pdv', async () => {
      // Arrange
      const pdvId = new Types.ObjectId().toString();
      const updatePdvDto: UpdatePdvDto = {
        storeName: 'Updated PDV',
        takeOutInStore: false,
        shippingTimeInDays: 2,
      };
      
      const mockUpdatedPdv = {
        _id: new Types.ObjectId(pdvId),
        storeName: updatePdvDto.storeName,
        takeOutInStore: updatePdvDto.takeOutInStore,
        shippingTimeInDays: updatePdvDto.shippingTimeInDays,
      };
      
      mockPdvRepository.update.mockResolvedValue(mockUpdatedPdv);
      mockPdvRepository.findById.mockResolvedValue({
        _id: new Types.ObjectId(pdvId),
        storeName: 'Original PDV'
      });
      mockPdvRepository.findAll.mockResolvedValue([]);

      // Act
      const result = await service.update(pdvId, updatePdvDto);

      // Assert
      expect(result).toEqual(mockUpdatedPdv);
      expect(repository.update).toHaveBeenCalledWith(pdvId, updatePdvDto);
    });
  });

  describe('deletePdv', () => {
    it('should delete a pdv by id', async () => {
      // Arrange
      const pdvId = new Types.ObjectId().toString();
      const mockDeletedPdv = {
        _id: pdvId,
        storeName: 'PDV to delete',
      };
      
      mockPdvRepository.delete.mockResolvedValue(true);
      mockPdvRepository.findById.mockResolvedValue(mockDeletedPdv);

      // Act
      const result = await service.delete(pdvId);

      // Assert
      expect(result).toBe(true);
      expect(repository.delete).toHaveBeenCalledWith(pdvId);
    });
  });
}); 