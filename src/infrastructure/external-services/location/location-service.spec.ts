import { Test, TestingModule } from '@nestjs/testing';
import { LocationServiceImpl } from './location-service';
import { UserLocationInfo } from './types/user-location-info.type';
import { DistanceResult } from '../distance/types/distance-result.type';

describe('LocationServiceImpl', () => {
  let service: LocationServiceImpl;
  let viaCepService: any;
  let geocodingService: any;
  let distanceService: any;

  const mockViaCepResponse = {
    logradouro: 'Avenida Paulista',
    localidade: 'São Paulo',
    uf: 'SP',
    cep: '01310-200',
    bairro: 'Bela Vista',
  };

  const mockCoordinates = {
    lat: -23.5505,
    lng: -46.6333,
  };

  const mockDistanceResults: DistanceResult[] = [
    {
      distance: '5.2 km',
      duration: '15 min',
      distanceValue: 5200,
      distanceKm: 5.2,
    },
    {
      distance: '8.7 km',
      duration: '25 min',
      distanceValue: 8700,
      distanceKm: 8.7,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationServiceImpl,
        {
          provide: 'ViaCepService',
          useValue: {
            getAddressFromCep: jest.fn(),
          },
        },
        {
          provide: 'CachedGeocodingService',
          useValue: {
            getCoordinatesFromAddress: jest.fn(),
          },
        },
        {
          provide: 'CachedDistanceService',
          useValue: {
            calculateDistances: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LocationServiceImpl>(LocationServiceImpl);
    viaCepService = module.get('ViaCepService');
    geocodingService = module.get('CachedGeocodingService');
    distanceService = module.get('CachedDistanceService');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserLocationFromCep', () => {
    it('should return user location information from a CEP', async () => {
      // Arrange
      const cep = '01310-200';
      viaCepService.getAddressFromCep.mockResolvedValue(mockViaCepResponse);
      geocodingService.getCoordinatesFromAddress.mockResolvedValue(mockCoordinates);

      const expectedUserLocationInfo: UserLocationInfo = {
        fullAddress: 'Avenida Paulista, São Paulo, SP',
        formattedCep: '01310-200',
        userCoordinates: mockCoordinates,
        locationInfo: mockViaCepResponse,
      };

      // Act
      const result = await service.getUserLocationFromCep(cep);

      // Assert
      expect(result).toEqual(expectedUserLocationInfo);
      expect(viaCepService.getAddressFromCep).toHaveBeenCalledWith(cep);
      expect(geocodingService.getCoordinatesFromAddress).toHaveBeenCalledWith('Avenida Paulista, São Paulo, SP');
    });

    it('should throw an error when ViaCep service fails', async () => {
      // Arrange
      const cep = '01310-200';
      const error = new Error('ViaCep service error');
      viaCepService.getAddressFromCep.mockRejectedValue(error);

      // Act & Assert
      await expect(service.getUserLocationFromCep(cep)).rejects.toThrow(error);
      expect(viaCepService.getAddressFromCep).toHaveBeenCalledWith(cep);
      expect(geocodingService.getCoordinatesFromAddress).not.toHaveBeenCalled();
    });

    it('should throw an error when Geocoding service fails', async () => {
      // Arrange
      const cep = '01310-200';
      const error = new Error('Geocoding service error');
      viaCepService.getAddressFromCep.mockResolvedValue(mockViaCepResponse);
      geocodingService.getCoordinatesFromAddress.mockRejectedValue(error);

      // Act & Assert
      await expect(service.getUserLocationFromCep(cep)).rejects.toThrow(error);
      expect(viaCepService.getAddressFromCep).toHaveBeenCalledWith(cep);
      expect(geocodingService.getCoordinatesFromAddress).toHaveBeenCalledWith('Avenida Paulista, São Paulo, SP');
    });
  });

  describe('calculateDistances', () => {
    it('should return distance results', async () => {
      // Arrange
      const origins = { lat: -23.5505, lng: -46.6333 };
      const destinations = [
        { lat: '-23.5640', lng: '-46.6527' },
        { lat: '-23.5880', lng: '-46.6820' },
      ];
      
      distanceService.calculateDistances.mockResolvedValue(mockDistanceResults);

      // Act
      const results = await service.calculateDistances(origins, destinations);

      // Assert
      expect(results).toEqual(mockDistanceResults);
      expect(distanceService.calculateDistances).toHaveBeenCalledWith(origins, destinations);
    });

    it('should throw an error when Distance service fails', async () => {
      // Arrange
      const origins = { lat: -23.5505, lng: -46.6333 };
      const destinations = [
        { lat: '-23.5640', lng: '-46.6527' },
        { lat: '-23.5880', lng: '-46.6820' },
      ];
      
      const error = new Error('Distance service error');
      distanceService.calculateDistances.mockRejectedValue(error);

      // Act & Assert
      await expect(service.calculateDistances(origins, destinations)).rejects.toThrow(error);
      expect(distanceService.calculateDistances).toHaveBeenCalledWith(origins, destinations);
    });
  });
}); 