import { BadRequestException, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { ShippingService } from './interfaces/shipping-service.interface';
import { ShippingOption } from './types/shipping-option.type';

@Injectable()
export class MelhorEnvioShippingService implements ShippingService {
  private readonly MELHOR_ENVIO_TOKEN: string | undefined;
  private readonly MELHOR_ENVIO_API_URL = 'https://www.melhorenvio.com.br/api/v2/me/shipment/calculate';
  private readonly SHIPPING_SERVICE_IDS = ["1", "2"];

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.MELHOR_ENVIO_TOKEN = this.configService.get<string>('MELHOR_ENVIO_TOKEN');
  }

  async calculateShipping(
    fromPostalCode: string,
    toPostalCode: string,
  ): Promise<ShippingOption[]> {
    try {
      
      const postalCode = fromPostalCode?.replace('-', '') || '';

      if (!postalCode) {
        throw new BadRequestException(`Location has no postal code`);
      }

      const productParams = {
        width: 15,
        height: 10,
        length: 20,
        weight: 1,
        insurance_value: 0,
        quantity: 1
      };

      const melhorEnvioResponse = await lastValueFrom(this.httpService.post(
        this.MELHOR_ENVIO_API_URL,
        {
          from: { postal_code: postalCode },
          to: { postal_code: toPostalCode.replace('-', '') },
          products: [{ id: "1", ...productParams }],
          options: {
            receipt: false,
            own_hand: false,
            insurance_value: 0,
            reverse: false,
            non_commercial: true
          },
          services: this.SHIPPING_SERVICE_IDS,
          validate: true
        },
        {
          headers: {
            'Authorization': `Bearer ${this.MELHOR_ENVIO_TOKEN}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      ));

      const options = melhorEnvioResponse.data;
      const filteredOptions = options.filter(opt => this.SHIPPING_SERVICE_IDS.includes(String(opt.id)));
      const formattedOptions = filteredOptions.map(opt => ({
        shippingDays: `${opt.delivery_time} dias úteis`,
        operationTypeCode: opt.id.toString(),
        price: `R$ ${parseFloat(opt.price).toFixed(2).replace('.', ',')}`,
        company: opt.company.name,
        operation: opt.name,
        description: `${opt.company.name} - ${opt.name}`
      }));

      return formattedOptions;
    } catch (error) {
      console.error('Error calculating shipping with Melhor Envio:', error);
      return [
        {
          shippingDays: "N/A",
          price: "N/A",
          description: "Erro ao calcular frete"
        }
      ];
    }
  }
} 