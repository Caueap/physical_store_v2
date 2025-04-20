import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MelhorEnvioShippingService } from './melhor-envio.service';
import { CachedMelhorEnvioShippingService } from './cached-melhor-envio.service';

@Module({
  imports: [HttpModule],
  providers: [
    {
      provide: 'ShippingService',
      useClass: CachedMelhorEnvioShippingService,
    },
    MelhorEnvioShippingService,
  ],
  exports: ['ShippingService'],
})
export class ShippingModule {} 