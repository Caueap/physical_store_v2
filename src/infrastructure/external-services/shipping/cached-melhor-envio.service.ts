import { BadRequestException, Injectable, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { ShippingService } from './interfaces/shipping-service.interface';
import { ShippingOption } from './types/shipping-option.type';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CacheConfigService } from '../../../common/cache/cache-config.service';
import { Logger } from '@nestjs/common';

@Injectable()
export class CachedMelhorEnvioShippingService implements ShippingService {
  private readonly MELHOR_ENVIO_TOKEN: string | undefined;
  private readonly MELHOR_ENVIO_API_URL = 'https://www.melhorenvio.com.br/api/v2/me/shipment/calculate';
  private readonly SHIPPING_SERVICE_IDS = ["1", "2"];
  private readonly logger = new Logger(CachedMelhorEnvioShippingService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private cacheConfigService: CacheConfigService,
  ) {
    this.MELHOR_ENVIO_TOKEN = this.configService.get<string>('MELHOR_ENVIO_TOKEN');
  }

  async calculateShipping(
    fromPostalCode: string,
    toPostalCode: string,
  ): Promise<ShippingOption[]> {
    const normalizedFromPostalCode = fromPostalCode?.replace('-', '') || '';
    const normalizedToPostalCode = toPostalCode?.replace('-', '') || '';

    if (!normalizedFromPostalCode) {
      throw new BadRequestException(`Location has no postal code`);
    }

    const cacheKey = this.cacheConfigService.getShippingCacheKey(
      normalizedFromPostalCode,
      normalizedToPostalCode
    );

    const cachedResult = await this.cacheManager.get<ShippingOption[]>(cacheKey);
    if (cachedResult) {
      this.logger.log(`Cache hit for shipping calculation: ${cacheKey}`);
      return cachedResult;
    }

    this.logger.log(`Cache miss for shipping calculation: ${cacheKey}`);
    
    try {
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
          from: { postal_code: normalizedFromPostalCode },
          to: { postal_code: normalizedToPostalCode },
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

      await this.cacheManager.set(
        cacheKey, 
        formattedOptions, 
        this.cacheConfigService.getShippingTTL()
      );
      
      return formattedOptions;
    } catch (error) {
      this.logger.error(`Error calculating shipping with Melhor Envio:`, error);
      const fallbackResponse = [
        {
          shippingDays: "N/A",
          price: "N/A",
          description: "Erro ao calcular frete"
        }
      ];
      
      await this.cacheManager.set(cacheKey, fallbackResponse, 60 * 5);
      
      return fallbackResponse;
    }
  }
} 