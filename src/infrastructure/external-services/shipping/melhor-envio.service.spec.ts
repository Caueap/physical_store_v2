import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { MelhorEnvioShippingService } from './melhor-envio.service';

describe('MelhorEnvioShippingService', () => {
  let service: MelhorEnvioShippingService;
  let httpService: any;
  let configService: any;

  const mockMelhorEnvioToken = 'test-token';
  
  const mockMelhorEnvioResponse = {
    data: [
      {
        id: 1,
        name: 'PAC',
        price: '15.00',
        delivery_time: 3,
        company: {
          name: 'Correios'
        }
      },
      {
        id: 2,
        name: 'SEDEX',
        price: '25.00',
        delivery_time: 1,
        company: {
          name: 'Correios'
        }
      }
    ]
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MelhorEnvioShippingService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(mockMelhorEnvioToken),
          },
        },
      ],
    }).compile();

    service = module.get<MelhorEnvioShippingService>(MelhorEnvioShippingService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateShipping', () => {
    it('should return shipping options from Melhor Envio', async () => {
      // Arrange
      const fromPostalCode = '01310-200';
      const toPostalCode = '22041-080';
      
      httpService.post.mockReturnValue(of(mockMelhorEnvioResponse));
      
      // Act
      const result = await service.calculateShipping(fromPostalCode, toPostalCode);
      
      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        shippingDays: '3 dias úteis',
        operationTypeCode: '1',
        price: 'R$ 15,00',
        company: 'Correios',
        operation: 'PAC',
        description: 'Correios - PAC'
      });
      expect(result[1]).toEqual({
        shippingDays: '1 dias úteis',
        operationTypeCode: '2',
        price: 'R$ 25,00',
        company: 'Correios',
        operation: 'SEDEX',
        description: 'Correios - SEDEX'
      });
      
      expect(httpService.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          from: { postal_code: '01310200' },
          to: { postal_code: '22041080' },
          services: ["1", "2"]
        }),
        expect.objectContaining({
          headers: {
            'Authorization': `Bearer ${mockMelhorEnvioToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        })
      );
    });

    it('should return fallback shipping options when fromPostalCode is missing', async () => {
      // Arrange
      const fromPostalCode = '';
      const toPostalCode = '22041-080';
      
      // Act
      const result = await service.calculateShipping(fromPostalCode, toPostalCode);
      
      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        shippingDays: 'N/A',
        price: 'N/A',
        description: 'Erro ao calcular frete'
      });
      expect(httpService.post).not.toHaveBeenCalled();
    });

    it('should handle API errors and return fallback response', async () => {
      // Arrange
      const fromPostalCode = '01310-200';
      const toPostalCode = '22041-080';
      
      httpService.post.mockImplementation(() => {
        throw new Error('API Error');
      });
      
      // Act
      const result = await service.calculateShipping(fromPostalCode, toPostalCode);
      
      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        shippingDays: 'N/A',
        price: 'N/A',
        description: 'Erro ao calcular frete'
      });
    });
  });
}); 