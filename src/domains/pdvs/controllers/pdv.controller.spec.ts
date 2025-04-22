import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { PdvController } from './pdv.controller';
import { CreatePdvDto } from '../dtos/create-pdv.dto';
import { UpdatePdvDto } from '../dtos/update-pdv.dto';
import { GetAllPdvsDto } from '../dtos/get-all-pdvs.dto';
import { GetPdvsByStateDto } from '../dtos/get-pdvs-by-state.dto';

describe('PdvController', () => {
  let controller: PdvController;
  let service: any;

  const mockStoreId = new Types.ObjectId().toString();
  const mockPdvId = new Types.ObjectId().toString();

  const mockPdv = {
    _id: mockPdvId,
    storeName: 'Test PDV',
    store: mockStoreId,
    takeOutInStore: true,
    shippingTimeInDays: 3,
    latitude: -23.5505,
    longitude: -46.6333,
    address: 'Test Address',
    city: 'Test City',
    district: 'Test District',
    state: 'SP',
    country: 'Brazil',
    postalCode: '01310-200',
  };

  const mockResponse = {
    pdvs: [mockPdv],
    total: 1,
    limit: 10,
    offset: 0,
  };

  beforeEach(async () => {
    const mockPdvService = {
      getAllPdvs: jest.fn(),
      getAllPdvsByState: jest.fn(),
      getPdvsByCep: jest.fn(),
      getPdvById: jest.fn(),
      createPdv: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PdvController],
      providers: [
        {
          provide: 'PdvService',
          useValue: mockPdvService,
        },
      ],
    }).compile();

    controller = module.get<PdvController>(PdvController);
    service = module.get('PdvService');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllPdvs', () => {
    it('should return paginated PDVs', async () => {
      // Arrange
      const paginationParams: GetAllPdvsDto = { limit: 10, offset: 0 };
      service.getAllPdvs.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.getAllPdvs(paginationParams);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(service.getAllPdvs).toHaveBeenCalledWith(paginationParams.limit, paginationParams.offset);
    });
  });

  describe('getPdvsByState', () => {
    it('should return PDVs filtered by state with pagination', async () => {
      // Arrange
      const paginationParams: GetPdvsByStateDto = { limit: 10, offset: 0 };
      service.getAllPdvsByState.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.getPdvsByState('SP', paginationParams);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(service.getAllPdvsByState).toHaveBeenCalledWith('SP', paginationParams.limit, paginationParams.offset);
    });

    it('should throw BadRequestException when state is empty', async () => {
      // Arrange
      const paginationParams: GetPdvsByStateDto = { limit: 10, offset: 0 };

      // Act & Assert
      await expect(controller.getPdvsByState('', paginationParams)).rejects.toThrow(BadRequestException);
      expect(service.getAllPdvsByState).not.toHaveBeenCalled();
    });
  });

  describe('getPdvsByCep', () => {
    it('should return PDVs by CEP with default pagination parameters', async () => {
      // Arrange
      const cep = '01310-200';
      const mockPdvsByCep = {
        pdvs: [mockPdv],
        pins: [{ position: { lat: -23.5505, lng: -46.6333 }, title: 'Test PDV' }],
        total: 1,
        limit: 10,
        offset: 0,
      };
      service.getPdvsByCep.mockResolvedValue(mockPdvsByCep);

      // Act
      const result = await controller.getPdvsByCep(cep, {});

      // Assert
      expect(result).toEqual(mockPdvsByCep);
      expect(service.getPdvsByCep).toHaveBeenCalledWith(cep, 10, 0);
    });

    it('should call getPdvsByCep with custom pagination parameters when provided', async () => {
      // Arrange
      const cep = '01310-200';
      const paginationParams: GetAllPdvsDto = { limit: 20, offset: 5 };
      const mockPdvsByCep = {
        pdvs: [mockPdv],
        pins: [{ position: { lat: -23.5505, lng: -46.6333 }, title: 'Test PDV' }],
        total: 1,
        limit: 20,
        offset: 5,
      };
      service.getPdvsByCep.mockResolvedValue(mockPdvsByCep);

      // Act
      const result = await controller.getPdvsByCep(cep, paginationParams);

      // Assert
      expect(result).toEqual(mockPdvsByCep);
      expect(service.getPdvsByCep).toHaveBeenCalledWith(cep, paginationParams.limit, paginationParams.offset);
    });
  });

  describe('getPdvById', () => {
    it('should return a PDV by id', async () => {
      // Arrange
      service.getPdvById.mockResolvedValue(mockPdv);

      // Act
      const result = await controller.getPdvById(mockPdvId);

      // Assert
      expect(result).toEqual(mockPdv);
      expect(service.getPdvById).toHaveBeenCalledWith(mockPdvId);
    });

    it('should throw NotFoundException when PDV is not found', async () => {
      // Arrange
      service.getPdvById.mockRejectedValue(new NotFoundException(`PDV with ID ${mockPdvId} not found`));

      // Act & Assert
      await expect(controller.getPdvById(mockPdvId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createPdv', () => {
    it('should create a new PDV', async () => {
      // Arrange
      const createPdvDto: CreatePdvDto = {
        storeName: 'New PDV',
        parentStoreId: mockStoreId,
        takeOutInStore: true,
        shippingTimeInDays: 3,
        latitude: -23.5505,
        longitude: -46.6333,
        address: 'Test Address',
        city: 'Test City',
        district: 'Test District',
        state: 'SP',
        country: 'Brazil',
        postalCode: '01310-200',
        telephoneNumber: 1234567890,
        emailAddress: 'test@example.com',
      };
      
      const createdPdv = { ...createPdvDto, _id: mockPdvId };
      service.createPdv.mockResolvedValue(createdPdv);

      // Act
      const result = await controller.createPdv(createPdvDto);

      // Assert
      expect(result).toEqual(createdPdv);
      expect(service.createPdv).toHaveBeenCalledWith(createPdvDto);
    });

    it('should throw BadRequestException when PDV with same name exists', async () => {
      // Arrange
      const createPdvDto: CreatePdvDto = {
        storeName: 'Existing PDV',
        parentStoreId: mockStoreId,
        takeOutInStore: true,
        shippingTimeInDays: 3,
        latitude: -23.5505,
        longitude: -46.6333,
        address: 'Test Address',
        city: 'Test City',
        district: 'Test District',
        state: 'SP',
        country: 'Brazil',
        postalCode: '01310-200',
        telephoneNumber: 1234567890,
        emailAddress: 'test@example.com',
      };

      service.createPdv.mockRejectedValue(new BadRequestException(`A PDV with the name "${createPdvDto.storeName}" already exists`));

      // Act & Assert
      await expect(controller.createPdv(createPdvDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('updatePdv', () => {
    it('should update an existing PDV', async () => {
      // Arrange
      const updatePdvDto: UpdatePdvDto = {
        storeName: 'Updated PDV',
      };
      
      const updatedPdv = { ...mockPdv, storeName: 'Updated PDV' };
      service.update.mockResolvedValue(updatedPdv);

      // Act
      const result = await controller.updatePdv(mockPdvId, updatePdvDto);

      // Assert
      expect(result).toEqual(updatedPdv);
      expect(service.update).toHaveBeenCalledWith(mockPdvId, updatePdvDto);
    });

    it('should throw NotFoundException when updating non-existent PDV', async () => {
      // Arrange
      const updatePdvDto: UpdatePdvDto = {
        storeName: 'Updated PDV',
      };

      service.update.mockRejectedValue(new NotFoundException(`PDV with ID ${mockPdvId} not found`));

      // Act & Assert
      await expect(controller.updatePdv(mockPdvId, updatePdvDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deletePdv', () => {
    it('should delete an existing PDV', async () => {
      // Arrange
      service.delete.mockResolvedValue(true);

      // Act
      await controller.deletePdv(mockPdvId);

      // Assert
      expect(service.delete).toHaveBeenCalledWith(mockPdvId);
    });

    it('should throw NotFoundException when deleting non-existent PDV', async () => {
      // Arrange
      service.delete.mockRejectedValue(new NotFoundException(`PDV with ID ${mockPdvId} not found`));

      // Act & Assert
      await expect(controller.deletePdv(mockPdvId)).rejects.toThrow(NotFoundException);
    });
  });
}); 