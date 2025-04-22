import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CachedDistanceService } from './cached-distance.service';
import { CacheConfigService } from '../../../common/cache/cache-config.service';
import { Coordinates } from '../geocoding/types/coordinates.type';
import { DistanceResult } from './types/distance-result.type';
import { Logger } from '@nestjs/common';

describe('CachedDistanceService', () => {
  let service: CachedDistanceService;
  let distanceServiceMock: any;
  let cacheManagerMock: any;
  let cacheConfigServiceMock: any;

  const originCoordinates: Coordinates = { lat: 40.7128, lng: -74.006 };
  const destinationCoordinates: Coordinates[] = [
    { lat: 34.0522, lng: -118.2437 },
    { lat: 41.8781, lng: -87.6298 },
  ];

  const mockDistanceResults = [
    {
      origin: originCoordinates,
      destination: destinationCoordinates[0],
      distance: '4,500 km',
      duration: '41 hours',
      distanceValue: 4500000,
      durationValue: 147600,
    },
    {
      origin: originCoordinates,
      destination: destinationCoordinates[1],
      distance: '1,300 km',
      duration: '12 hours',
      distanceValue: 1300000,
      durationValue: 43200,
    },
  ] as unknown as DistanceResult[];

  beforeEach(async () => {
    distanceServiceMock = {
      calculateDistances: jest.fn().mockResolvedValue(mockDistanceResults),
    };

    cacheManagerMock = {
      get: jest.fn(),
      set: jest.fn().mockResolvedValue(undefined),
    };

    cacheConfigServiceMock = {
      getDistanceTTL: jest.fn().mockReturnValue(3600),
    };

    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CachedDistanceService,
        { provide: 'DistanceService', useValue: distanceServiceMock },
        { provide: CACHE_MANAGER, useValue: cacheManagerMock },
        { provide: CacheConfigService, useValue: cacheConfigServiceMock },
      ],
    }).compile();

    service = module.get<CachedDistanceService>(CachedDistanceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateDistances', () => {
    it('should return cached result when available', async () => {
      // Arrange
      cacheManagerMock.get.mockResolvedValue(mockDistanceResults);

      // Act
      const result = await service.calculateDistances(originCoordinates, destinationCoordinates);

      // Assert
      expect(result).toEqual(mockDistanceResults);
      expect(cacheManagerMock.get).toHaveBeenCalled();
      expect(distanceServiceMock.calculateDistances).not.toHaveBeenCalled();
      expect(cacheManagerMock.set).not.toHaveBeenCalled();
    });

    it('should calculate and cache results when cache misses', async () => {
      // Arrange
      cacheManagerMock.get.mockResolvedValue(null);

      // Act
      const result = await service.calculateDistances(originCoordinates, destinationCoordinates);

      // Assert
      expect(result).toEqual(mockDistanceResults);
      expect(cacheManagerMock.get).toHaveBeenCalled();
      expect(distanceServiceMock.calculateDistances).toHaveBeenCalledWith(
        originCoordinates, 
        destinationCoordinates
      );
      expect(cacheManagerMock.set).toHaveBeenCalled();
    });

    it('should use distance service directly when cache operations fail', async () => {
      // Arrange
      cacheManagerMock.get.mockRejectedValue(new Error('Cache error'));

      // Act
      const result = await service.calculateDistances(originCoordinates, destinationCoordinates);

      // Assert
      expect(result).toEqual(mockDistanceResults);
      expect(cacheManagerMock.get).toHaveBeenCalled();
      expect(distanceServiceMock.calculateDistances).toHaveBeenCalledWith(
        originCoordinates, 
        destinationCoordinates
      );
    });
  });

  describe('generateCacheKey', () => {
    it('should generate consistent cache keys regardless of destination order', async () => {
      cacheManagerMock.get.mockImplementation((key: string) => {
        return null;
      });
      
      await service.calculateDistances(originCoordinates, destinationCoordinates);
      const firstKey = cacheManagerMock.set.mock.calls[0][0];
      
      jest.clearAllMocks();
      cacheManagerMock.get.mockResolvedValue(null);
      
      await service.calculateDistances(originCoordinates, [...destinationCoordinates].reverse());
      const secondKey = cacheManagerMock.set.mock.calls[0][0];
      
      expect(firstKey).toEqual(secondKey);
    });
  });
}); 