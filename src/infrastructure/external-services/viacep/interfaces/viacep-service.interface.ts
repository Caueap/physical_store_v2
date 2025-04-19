import { ViaCepAddress } from '../types/viacep-address.model';

export interface ViaCepService {
  getAddressFromCep(cep: string): Promise<ViaCepAddress>;
} 