import { BadRequestException, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { ViaCepService } from './interfaces/viacep-service.interface';
import { ViaCepAddress } from './types/viacep-address.model';

@Injectable()
export class ViaCepServiceImpl implements ViaCepService {
  private readonly VIACEP_API_URL = 'https://viacep.com.br/ws';

  constructor(private readonly httpService: HttpService) {}

  async getAddressFromCep(cep: string): Promise<ViaCepAddress> {
    const viacepUrl = `${this.VIACEP_API_URL}/${cep}/json/`;
    const viacepResponse = await lastValueFrom(this.httpService.get(viacepUrl));
    const { logradouro, localidade, uf, bairro, cep: formattedCep } = viacepResponse.data;

    if (!logradouro || !localidade || !uf) {
      throw new BadRequestException('Invalid CEP or incomplete address from ViaCEP');
    }

    return {
      logradouro,
      localidade,
      uf,
      bairro,
      cep: formattedCep,
      ...viacepResponse.data
    };
  }
} 