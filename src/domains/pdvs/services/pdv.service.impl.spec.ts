import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { PdvServiceImpl } from './pdv.service.impl';
import { CreatePdvDto } from '../dtos/create-pdv.dto';
import { UpdatePdvDto } from '../dtos/update-pdv.dto';

describe('PdvServiceImpl', () => {
  let service: PdvServiceImpl;
  let pdvRepository: any;
  let locationService: any;
  let shippingService: any;

  const mockStoreId = new Types.ObjectId().toString();
  const mockPdvId = new Types.ObjectId().toString();

  const mockPdv: any = {
    _id: mockPdvId,
    storeName: 'Test PDV',
    parentStoreId: mockStoreId,
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
    emailAddress: 'test@example.com'
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PdvServiceImpl,
        {
          provide: 'PdvRepository',
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            findByState: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: 'CachedShippingService',
          useValue: {
            calculateShipping: jest.fn(),
          },
        },
        {
          provide: 'LocationService',
          useValue: {
            getUserLocationFromCep: jest.fn(),
            calculateDistances: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PdvServiceImpl>(PdvServiceImpl);
    pdvRepository = module.get('PdvRepository');
    locationService = module.get('LocationService');
    shippingService = module.get('CachedShippingService');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPdv', () => {
    it('should create a PDV successfully', async () => {
      // Arrange
      pdvRepository.findAll.mockResolvedValue([]);
      pdvRepository.create.mockResolvedValue({
        _id: mockPdvId,
        ...createPdvDto,
        store: mockStoreId,
      });

      // Act
      const result = await service.createPdv(createPdvDto);

      // Assert
      expect(result).toBeDefined();
      expect((result as any)._id).toBe(mockPdvId);
      expect(result.storeName).toBe(createPdvDto.storeName);
      expect(result.store).toBe(mockStoreId);
      expect(pdvRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          storeName: 'New PDV',
          parentStoreId: mockStoreId,
        })
      );
    });

    it('should throw BadRequestException when PDV with same name exists', async () => {
      // Arrange
      pdvRepository.findAll.mockResolvedValue([
        { storeName: 'New PDV' },
      ]);

      // Act & Assert
      await expect(service.createPdv(createPdvDto)).rejects.toThrow(BadRequestException);
      expect(pdvRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a PDV successfully', async () => {
      // Arrange
      const updatePdvDto: UpdatePdvDto = {
        storeName: 'Updated PDV',
      };

      pdvRepository.findById.mockResolvedValue(mockPdv);
      pdvRepository.findAll.mockResolvedValue([mockPdv]);
      pdvRepository.update.mockResolvedValue({
        ...mockPdv,
        storeName: 'Updated PDV',
      });

      // Act
      const result = await service.update(mockPdvId, updatePdvDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.storeName).toBe('Updated PDV');
      expect(pdvRepository.update).toHaveBeenCalledWith(mockPdvId, updatePdvDto);
    });

    it('should throw NotFoundException when PDV does not exist', async () => {
      // Arrange
      const updatePdvDto: UpdatePdvDto = {
        storeName: 'Updated PDV',
      };

      pdvRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update(mockPdvId, updatePdvDto)).rejects.toThrow(NotFoundException);
      expect(pdvRepository.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when attempting to update to existing name', async () => {
      // Arrange
      const updatePdvDto: UpdatePdvDto = {
        storeName: 'Existing Other PDV',
      };

      const existingPdvs = [
        mockPdv,
        {
          _id: new Types.ObjectId().toString(),
          storeName: 'Existing Other PDV',
        },
      ];

      pdvRepository.findById.mockResolvedValue(mockPdv);
      pdvRepository.findAll.mockResolvedValue(existingPdvs);

      // Act & Assert
      await expect(service.update(mockPdvId, updatePdvDto)).rejects.toThrow(BadRequestException);
      expect(pdvRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete a PDV successfully', async () => {
      // Arrange
      pdvRepository.findById.mockResolvedValue(mockPdv);
      pdvRepository.delete.mockResolvedValue(true);

      // Act
      const result = await service.delete(mockPdvId);

      // Assert
      expect(result).toBe(true);
      expect(pdvRepository.findById).toHaveBeenCalledWith(mockPdvId);
      expect(pdvRepository.delete).toHaveBeenCalledWith(mockPdvId);
    });

    it('should throw NotFoundException when PDV does not exist', async () => {
      // Arrange
      pdvRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.delete(mockPdvId)).rejects.toThrow(NotFoundException);
      expect(pdvRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('getAllPdvs', () => {
    it('should return paginated PDVs', async () => {
      // Arrange
      const mockPdvs = [mockPdv, { ...mockPdv, _id: new Types.ObjectId().toString() }];
      pdvRepository.findAll.mockResolvedValue(mockPdvs);

      // Act
      const result = await service.getAllPdvs(10, 0);

      // Assert
      expect(result.pdvs.length).toBe(2);
      expect(result.total).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
    });
  });

  describe('getAllPdvsByState', () => {
    it('should return PDVs by state', async () => {
      // Arrange
      const mockResponse = {
        state: 'SP',
        pdvs: [mockPdv],
        total: 1,
        limit: 10,
        offset: 0,
      };
      pdvRepository.findByState.mockResolvedValue(mockResponse);

      // Act
      const result = await service.getAllPdvsByState('SP', 10, 0);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(pdvRepository.findByState).toHaveBeenCalledWith('SP', 10, 0);
    });
  });

  describe('getPdvById', () => {
    it('should return a PDV by ID', async () => {
      // Arrange
      pdvRepository.findById.mockResolvedValue(mockPdv);

      // Act
      const result = await service.getPdvById(mockPdvId);

      // Assert
      expect(result).toEqual(mockPdv);
      expect(pdvRepository.findById).toHaveBeenCalledWith(mockPdvId);
    });

    it('should throw NotFoundException when PDV does not exist', async () => {
      // Arrange
      pdvRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getPdvById(mockPdvId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPdvsByCep', () => {
    it('should return PDVs near a postal code with pagination', async () => {
      // Arrange
      const cep = '01310-200';
      const limit = 10;
      const offset = 0;
      const locationInfo = {
        formattedCep: '01310-200',
        userCoordinates: { lat: -23.5505, lng: -46.6333 },
        locationInfo: { localidade: 'São Paulo', uf: 'SP' }
      };
      
      const mockPdvs = [mockPdv];
      
      locationService.getUserLocationFromCep.mockResolvedValue(locationInfo);
      pdvRepository.findAll.mockResolvedValue(mockPdvs);
      locationService.calculateDistances.mockResolvedValue([
        { distance: '1.2 km', duration: '5 min', distanceValue: 1200 }
      ]);
      shippingService.calculateShipping.mockResolvedValue([
        { price: 'R$ 15,00', shippingDays: '3 dias úteis' }
      ]);

      // Act
      const result = await service.getPdvsByCep(cep, limit, offset);

      // Assert
      expect(result).toHaveProperty('pdvs');
      expect(result).toHaveProperty('pins');
      expect(result).toHaveProperty('limit', limit);
      expect(result).toHaveProperty('offset', offset);
      expect(locationService.getUserLocationFromCep).toHaveBeenCalledWith(cep);
      expect(pdvRepository.findAll).toHaveBeenCalled();
      expect(locationService.calculateDistances).toHaveBeenCalled();
      expect(shippingService.calculateShipping).toHaveBeenCalled();
    });

    it('should respect custom pagination parameters', async () => {
      // Arrange
      const cep = '01310-200';
      const limit = 20;
      const offset = 5;
      const locationInfo = {
        formattedCep: '01310-200',
        userCoordinates: { lat: -23.5505, lng: -46.6333 },
        locationInfo: { localidade: 'São Paulo', uf: 'SP' }
      };
      
      const mockPdvs = Array(30).fill(0).map((_, i) => ({
        ...mockPdv,
        _id: new Types.ObjectId().toString(),
        storeName: `PDV ${i+1}`
      }));
      
      locationService.getUserLocationFromCep.mockResolvedValue(locationInfo);
      pdvRepository.findAll.mockResolvedValue(mockPdvs);
      locationService.calculateDistances.mockResolvedValue(
        mockPdvs.map((_, i) => ({ 
          distance: `${i/10} km`, 
          duration: '5 min', 
          distanceValue: i*100 
        }))
      );
      shippingService.calculateShipping.mockResolvedValue([
        { price: 'R$ 15,00', shippingDays: '3 dias úteis' }
      ]);

      // Act
      const result = await service.getPdvsByCep(cep, limit, offset);

      // Assert
      expect(result).toHaveProperty('pdvs');
      expect(result.pdvs.length).toBeLessThanOrEqual(limit);
      expect(result).toHaveProperty('limit', limit);
      expect(result).toHaveProperty('offset', offset);
      expect(result).toHaveProperty('total', mockPdvs.length);
    });
  });
}); 