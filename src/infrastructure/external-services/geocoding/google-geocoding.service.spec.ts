import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { of } from 'rxjs';
import { GoogleGeocodingService } from './google-geocoding.service';

describe('GoogleGeocodingService', () => {
  let service: GoogleGeocodingService;
  let httpService: any;
  let configService: any;

  const mockGoogleApiKey = 'test-api-key';
  
  const mockValidGeocodeResponse = {
    data: {
      results: [
        {
          geometry: {
            location: {
              lat: -23.5505,
              lng: -46.6333
            }
          },
          formatted_address: 'Avenida Paulista, São Paulo - SP, Brazil'
        }
      ],
      status: 'OK'
    }
  };

  const mockEmptyGeocodeResponse = {
    data: {
      results: [],
      status: 'ZERO_RESULTS'
    }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleGeocodingService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(mockGoogleApiKey),
          },
        },
      ],
    }).compile();

    service = module.get<GoogleGeocodingService>(GoogleGeocodingService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCoordinatesFromAddress', () => {
    it('should return coordinates for a valid address', async () => {
      // Arrange
      const address = 'Avenida Paulista, São Paulo, SP';
      httpService.get.mockReturnValue(of(mockValidGeocodeResponse));

      // Act
      const result = await service.getCoordinatesFromAddress(address);

      // Assert
      expect(result).toEqual({
        lat: -23.5505,
        lng: -46.6333
      });
      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent(address))
      );
      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining(`key=${mockGoogleApiKey}`)
      );
    });

    it('should throw BadRequestException for address that cannot be geocoded', async () => {
      // Arrange
      const address = 'Invalid address that should not exist anywhere';
      httpService.get.mockReturnValue(of(mockEmptyGeocodeResponse));

      // Act & Assert
      await expect(service.getCoordinatesFromAddress(address)).rejects.toThrow(BadRequestException);
      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent(address))
      );
    });

    it('should propagate HTTP errors', async () => {
      // Arrange
      const address = 'Avenida Paulista, São Paulo, SP';
      const error = new Error('Network error');
      httpService.get.mockImplementation(() => {
        throw error;
      });

      // Act & Assert
      await expect(service.getCoordinatesFromAddress(address)).rejects.toThrow(error);
      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent(address))
      );
    });

    it('should handle malformed API response', async () => {
      // Arrange
      const address = 'Avenida Paulista, São Paulo, SP';
      const malformedResponse = {
        data: {
          status: 'OK',
        }
      };
      httpService.get.mockReturnValue(of(malformedResponse));

      // Act & Assert
      await expect(service.getCoordinatesFromAddress(address)).rejects.toThrow(BadRequestException);
      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent(address))
      );
    });
  });
}); 