import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MelhorEnvioShippingService } from './melhor-envio.service';

@Module({
  imports: [HttpModule],
  providers: [
    {
      provide: 'ShippingService',
      useClass: MelhorEnvioShippingService,
    },
  ],
  exports: ['ShippingService'],
})
export class ShippingModule {} 