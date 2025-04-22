import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CachedLocationServiceImpl } from './cached-location-service';
import { UserLocationInfo } from './types/user-location-info.type';
import { DistanceResult } from '../distance/types/distance-result.type';
import { CacheConfigService } from '../../../common/cache/cache-config.service';

describe('CachedLocationServiceImpl', () => {
  let service: CachedLocationServiceImpl;
  let viaCepService: any;
  let geocodingService: any;
  let distanceService: any;
  let cacheManager: any;
  let cacheConfigService: any;

  const mockViaCepResponse = {
    logradouro: 'Avenida Paulista',
    localidade: 'São Paulo',
    uf: 'SP',
    cep: '01310200',
    bairro: 'Bela Vista',
  };

  const mockCoordinates = {
    lat: -23.5505,
    lng: -46.6333,
  };

  const mockDistanceResult: DistanceResult = {
    distance: '5.2 km',
    duration: '15 min',
    distanceValue: 5200,
    distanceKm: 5.2,
  };

  const mockUserLocationInfo: UserLocationInfo = {
    fullAddress: 'Avenida Paulista, São Paulo, SP',
    formattedCep: '01310200',
    userCoordinates: mockCoordinates,
    locationInfo: mockViaCepResponse,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CachedLocationServiceImpl,
        {
          provide: 'ViaCepService',
          useValue: {
            getAddressFromCep: jest.fn(),
          },
        },
        {
          provide: 'GeocodingService',
          useValue: {
            getCoordinatesFromAddress: jest.fn(),
          },
        },
        {
          provide: 'DistanceService',
          useValue: {
            calculateDistances: jest.fn(),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
        {
          provide: CacheConfigService,
          useValue: {
            getLocationCacheKey: jest.fn(),
            getDistanceCacheKey: jest.fn(),
            getLocationTTL: jest.fn(),
            getDistanceTTL: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CachedLocationServiceImpl>(CachedLocationServiceImpl);
    viaCepService = module.get('ViaCepService');
    geocodingService = module.get('GeocodingService');
    distanceService = module.get('DistanceService');
    cacheManager = module.get(CACHE_MANAGER);
    cacheConfigService = module.get(CacheConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserLocationFromCep', () => {
    it('should return cached user location if available', async () => {
      // Arrange
      const cep = '01310-200';
      const normalizedCep = '01310200';
      const cacheKey = 'location:cep:01310200';
      
      cacheConfigService.getLocationCacheKey.mockReturnValue(cacheKey);
      cacheManager.get.mockResolvedValue(mockUserLocationInfo);

      // Act
      const result = await service.getUserLocationFromCep(cep);

      // Assert
      expect(result).toEqual(mockUserLocationInfo);
      expect(cacheConfigService.getLocationCacheKey).toHaveBeenCalledWith(normalizedCep);
      expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(viaCepService.getAddressFromCep).not.toHaveBeenCalled();
      expect(geocodingService.getCoordinatesFromAddress).not.toHaveBeenCalled();
    });

    it('should fetch and cache user location when not in cache', async () => {
      // Arrange
      const cep = '01310-200';
      const normalizedCep = '01310200';
      const cacheKey = 'location:cep:01310200';
      const ttl = 3600;
      
      cacheConfigService.getLocationCacheKey.mockReturnValue(cacheKey);
      cacheConfigService.getLocationTTL.mockReturnValue(ttl);
      cacheManager.get.mockResolvedValue(null);
      viaCepService.getAddressFromCep.mockResolvedValue(mockViaCepResponse);
      geocodingService.getCoordinatesFromAddress.mockResolvedValue(mockCoordinates);

      // Act
      const result = await service.getUserLocationFromCep(cep);

      // Assert
      expect(result).toEqual(mockUserLocationInfo);
      expect(cacheConfigService.getLocationCacheKey).toHaveBeenCalledWith(normalizedCep);
      expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(viaCepService.getAddressFromCep).toHaveBeenCalledWith(normalizedCep);
      expect(geocodingService.getCoordinatesFromAddress).toHaveBeenCalledWith('Avenida Paulista, São Paulo, SP');
      expect(cacheManager.set).toHaveBeenCalledWith(cacheKey, mockUserLocationInfo, ttl);
    });
  });

  describe('calculateDistances', () => {
    it('should return an empty array if destinations is empty', async () => {
      // Arrange
      const origins = { lat: -23.5505, lng: -46.6333 };
      const destinations: any[] = [];

      // Act
      const result = await service.calculateDistances(origins, destinations);

      // Assert
      expect(result).toEqual([]);
      expect(distanceService.calculateDistances).not.toHaveBeenCalled();
    });

    it('should return cached distance results when available', async () => {
      // Arrange
      const origins = { lat: -23.5505, lng: -46.6333 };
      const destinations = [{ lat: -23.5640, lng: -46.6527 }];
      const cacheKey = 'distance:-23.5505:-46.6333:-23.564:-46.6527';
      
      cacheConfigService.getDistanceCacheKey.mockReturnValue(cacheKey);
      cacheManager.get.mockResolvedValue(mockDistanceResult);

      // Act
      const result = await service.calculateDistances(origins, destinations);

      // Assert
      expect(result).toEqual([mockDistanceResult]);
      expect(cacheConfigService.getDistanceCacheKey).toHaveBeenCalledWith(
        origins.lat, origins.lng, -23.5640, -46.6527
      );
      expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(distanceService.calculateDistances).not.toHaveBeenCalled();
    });

    it('should fetch and cache distance results when not in cache', async () => {
      // Arrange
      const origins = { lat: -23.5505, lng: -46.6333 };
      const destinations = [{ lat: -23.5640, lng: -46.6527 }];
      const cacheKey = 'distance:-23.5505:-46.6333:-23.564:-46.6527';
      const ttl = 86400;
      
      cacheConfigService.getDistanceCacheKey.mockReturnValue(cacheKey);
      cacheConfigService.getDistanceTTL.mockReturnValue(ttl);
      cacheManager.get.mockResolvedValue(null);
      distanceService.calculateDistances.mockResolvedValue([mockDistanceResult]);

      // Act
      const result = await service.calculateDistances(origins, destinations);

      // Assert
      expect(result).toEqual([mockDistanceResult]);
      expect(cacheConfigService.getDistanceCacheKey).toHaveBeenCalledWith(
        origins.lat, origins.lng, -23.5640, -46.6527
      );
      expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(distanceService.calculateDistances).toHaveBeenCalledWith(
        origins, [{ lat: -23.5640, lng: -46.6527 }]
      );
      expect(cacheManager.set).toHaveBeenCalledWith(cacheKey, mockDistanceResult, ttl);
    });

    it('should bypass cache for large destination arrays', async () => {
      // Arrange
      const origins = { lat: -23.5505, lng: -46.6333 };
      const destinations = Array(11).fill({ lat: -23.5640, lng: -46.6527 });
      
      distanceService.calculateDistances.mockResolvedValue(
        Array(11).fill(mockDistanceResult)
      );

      // Act
      const result = await service.calculateDistances(origins, destinations);

      // Assert
      expect(result.length).toBe(11);
      expect(cacheManager.get).not.toHaveBeenCalled();
      expect(distanceService.calculateDistances).toHaveBeenCalledWith(origins, destinations);
      expect(cacheManager.set).not.toHaveBeenCalled();
    });

    it('should handle invalid coordinates gracefully', async () => {
      // Arrange
      const origins = { lat: -23.5505, lng: -46.6333 };
      const destinations = [{ lat: 'invalid', lng: 'invalid' }];
      
      // Act
      const result = await service.calculateDistances(origins, destinations);

      // Assert
      expect(result).toEqual([{
        distance: 'N/A',
        duration: 'N/A',
        distanceValue: 0,
        distanceKm: 0
      }]);
      expect(distanceService.calculateDistances).not.toHaveBeenCalled();
    });
  });

  describe('findByAddress', () => {
    it('should return cached coordinates if available', async () => {
      // Arrange
      const address = 'Avenida Paulista, São Paulo';
      const cacheKey = 'location:address:Avenida Paulista, São Paulo';
      
      cacheManager.get.mockResolvedValue(mockCoordinates);

      // Act
      const result = await service.findByAddress(address);

      // Assert
      expect(result).toEqual(mockCoordinates);
      expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(geocodingService.getCoordinatesFromAddress).not.toHaveBeenCalled();
    });

    it('should fetch coordinates when not in cache', async () => {
      // Arrange
      const address = 'Avenida Paulista, São Paulo';
      const cacheKey = 'location:address:Avenida Paulista, São Paulo';
      
      cacheManager.get.mockResolvedValue(null);
      geocodingService.getCoordinatesFromAddress.mockResolvedValue(mockCoordinates);

      // Act
      const result = await service.findByAddress(address);

      // Assert
      expect(result).toEqual(mockCoordinates);
      expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(geocodingService.getCoordinatesFromAddress).toHaveBeenCalledWith(address);
    });

    it('should return null when geocoding fails', async () => {
      // Arrange
      const address = 'Invalid Address';
      const cacheKey = 'location:address:Invalid Address';
      
      cacheManager.get.mockResolvedValue(null);
      geocodingService.getCoordinatesFromAddress.mockRejectedValue(new Error('Geocoding failed'));

      // Act
      const result = await service.findByAddress(address);

      // Assert
      expect(result).toBeNull();
      expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(geocodingService.getCoordinatesFromAddress).toHaveBeenCalledWith(address);
    });
  });
}); 