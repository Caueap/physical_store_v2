import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { BadRequestException } from '@nestjs/common';
import { of } from 'rxjs';
import { ViaCepServiceImpl } from './viacep.service';

describe('ViaCepServiceImpl', () => {
  let service: ViaCepServiceImpl;
  let httpService: any;

  const mockValidViaCepResponse = {
    data: {
      cep: '01310-200',
      logradouro: 'Avenida Paulista',
      complemento: 'de 1867 ao fim - lado ímpar',
      bairro: 'Bela Vista',
      localidade: 'São Paulo',
      uf: 'SP',
      ibge: '3550308',
      gia: '1004',
      ddd: '11',
      siafi: '7107'
    }
  };

  const mockInvalidViaCepResponse = {
    data: {
      erro: true
    }
  };

  const mockIncompleteViaCepResponse = {
    data: {
      cep: '00000-000',
      logradouro: '',
      localidade: '',
      uf: ''
    }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ViaCepServiceImpl,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ViaCepServiceImpl>(ViaCepServiceImpl);
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAddressFromCep', () => {
    it('should return address information for a valid CEP', async () => {
      // Arrange
      const cep = '01310-200';
      httpService.get.mockReturnValue(of(mockValidViaCepResponse));

      // Act
      const result = await service.getAddressFromCep(cep);

      // Assert
      expect(result).toEqual({
        ...mockValidViaCepResponse.data
      });
      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining(cep)
      );
    });

    it('should throw BadRequestException for invalid CEP', async () => {
      // Arrange
      const cep = '99999-999';
      httpService.get.mockReturnValue(of(mockInvalidViaCepResponse));

      // Act & Assert
      await expect(service.getAddressFromCep(cep)).rejects.toThrow(BadRequestException);
      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining(cep)
      );
    });

    it('should throw BadRequestException for incomplete address information', async () => {
      // Arrange
      const cep = '00000-000';
      httpService.get.mockReturnValue(of(mockIncompleteViaCepResponse));

      // Act & Assert
      await expect(service.getAddressFromCep(cep)).rejects.toThrow(BadRequestException);
      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining(cep)
      );
    });

    it('should propagate HTTP errors', async () => {
      // Arrange
      const cep = '01310-200';
      const error = new Error('Network error');
      httpService.get.mockImplementation(() => {
        throw error;
      });

      // Act & Assert
      await expect(service.getAddressFromCep(cep)).rejects.toThrow(error);
      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining(cep)
      );
    });
  });
}); 