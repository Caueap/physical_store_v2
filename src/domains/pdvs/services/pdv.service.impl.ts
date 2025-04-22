import { Inject, Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { PdvService } from './pdv.service';
import { Pdv } from '../entities/pdv.entity';
import { CreatePdvDto } from '../dtos/create-pdv.dto';
import { UpdatePdvDto } from '../dtos/update-pdv.dto';
import { LocationPoint } from '../../../common/interfaces/location-point.interface';
import { PdvRepository } from '../repository/pdv.repository';
import { paginate } from '../../../utils/functions';
import { ShippingService } from '../../../infrastructure/external-services/shipping/interfaces/shipping-service.interface';
import { LocationService } from '../../../infrastructure/external-services/location/interfaces/location-service.interface';

@Injectable()
export class PdvServiceImpl implements PdvService {
  private readonly RADIUS_KM = 50;
  private readonly logger = new Logger(PdvServiceImpl.name);

  constructor(
    @Inject('PdvRepository')
    private readonly pdvRepository: PdvRepository,
    @Inject('CachedShippingService')
    private shippingService: ShippingService,
    @Inject('LocationService')
    private locationService: LocationService,
  ) { }

  async createPdv(createPdvDto: CreatePdvDto): Promise<Pdv> {
    try {
      this.logger.log(`Creating PDV with name: ${createPdvDto.storeName}`);
      
      const errors: string[] = [];
      
      const existingPdvs = await this.pdvRepository.findAll();
      const existingPdv = existingPdvs.find(pdv => 
        pdv.storeName.toLowerCase() === createPdvDto.storeName.toLowerCase()
      );
      
      if (existingPdv) {
        errors.push(`A PDV with the name "${createPdvDto.storeName}" already exists`);
      }
      
      if (errors.length > 0) {
        throw new BadRequestException({
          statusCode: 400,
          error: "Bad Request",
          message: "Validation failed",
          errors: errors
        });
      }
      
      const pdvData = {
        ...createPdvDto,
      };

      return await this.pdvRepository.create(pdvData);
    } catch (error) {
      this.logger.error(`Error creating PDV: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      if (error.code === 11000 && error.keyPattern?.storeName) {
        throw new BadRequestException(`A PDV with the name "${createPdvDto.storeName}" already exists`);
      }
      throw error;
    }
  }

  async update(id: string | Types.ObjectId, updatePdvDto: UpdatePdvDto): Promise<Pdv> {
    try {
      this.logger.log(`Updating PDV with ID: ${id}`);
      
      const existingPdv = await this.pdvRepository.findById(id);
      if (!existingPdv) {
        throw new NotFoundException(`PDV with ID ${id} not found`);
      }
      
      const errors: string[] = [];
      
      if (updatePdvDto.storeName && updatePdvDto.storeName !== existingPdv.storeName) {
        const existingPdvs = await this.pdvRepository.findAll();
        const pdvWithSameName = existingPdvs.find(pdv => 
          pdv.storeName.toLowerCase() === updatePdvDto.storeName?.toLowerCase() && 
          (pdv as any)._id.toString() !== id.toString()
        );
        
        if (pdvWithSameName) {
          errors.push(`A PDV with the name "${updatePdvDto.storeName}" already exists`);
        }
      }
      
      if (errors.length > 0) {
        throw new BadRequestException({
          statusCode: 400,
          error: "Bad Request",
          message: "Validation failed",
          errors: errors
        });
      }
      
      const updatedPdv = await this.pdvRepository.update(id, updatePdvDto);
      if (!updatedPdv) {
        throw new NotFoundException(`PDV with ID ${id} not found after update attempt`);
      }
      return updatedPdv;
    } catch (error) {
      this.logger.error(`Error updating PDV: ${error.message}`, error.stack);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      
      if (error.code === 11000 && error.keyPattern?.storeName) {
        throw new BadRequestException(`A PDV with the name "${updatePdvDto.storeName}" already exists`);
      }
      throw error;
    }
  }

  async delete(id: string | Types.ObjectId): Promise<boolean> {
    this.logger.log(`Deleting PDV with ID: ${id}`);
    
    const pdv = await this.pdvRepository.findById(id);
    if (!pdv) {
      throw new NotFoundException(`PDV with ID ${id} not found`);
    }

    return this.pdvRepository.delete(id);
  }

  async getAllPdvs(limit: number, offset: number): Promise<{ pdvs: Pdv[], limit: number, offset: number, total: number }> {
    const allPdvs = await this.pdvRepository.findAll();
    const paginatedPdvs = paginate(allPdvs, limit, offset);

    return {
      pdvs: paginatedPdvs,
      limit,
      offset,
      total: allPdvs.length
    };
  }

  async getAllPdvsByState(state?: string, limit = 10, offset = 0): Promise<{ pdvs: Pdv[], limit: number, offset: number, total: number }> {
    return this.pdvRepository.findByState(state, limit, offset);
  }

  async getPdvById(id: string): Promise<Pdv> {
    const pdv = await this.pdvRepository.findById(id);
    if (!pdv) {
      throw new NotFoundException(`PDV with ID ${id} not found`);
    }
    return pdv;
  }

  async getPdvsByCep(cep: string, limit = 10, offset = 0): Promise<{ pdvs: any[], pins: any[], limit: number, offset: number, total: number }> {
    const { formattedCep, userCoordinates, locationInfo } = await this.locationService.getUserLocationFromCep(cep);

    const pdvs = await this.pdvRepository.findAll();

    const pdvPoints = this.collectPdvPoints(pdvs);

    const pdvPointsWithDistance = await this.calculateDistancesToPoints(pdvPoints, userCoordinates);

    const pdvsWithShipping = await this.processPdvsWithShipping(
      pdvs,
      pdvPointsWithDistance,
      formattedCep
    );

    const sortedPdvs = this.sortPdvsByDistance(pdvsWithShipping);
    const paginatedPdvs = paginate(sortedPdvs, limit, offset);

    const pins = this.createPinsForMap(sortedPdvs, userCoordinates, locationInfo);

    return {
      pdvs: paginatedPdvs,
      pins,
      limit,
      offset,
      total: sortedPdvs.length
    };
  }

  private collectPdvPoints(pdvs: any[]): LocationPoint[] {
    const pdvPoints: LocationPoint[] = [];

    pdvs.forEach(pdv => {
      if (pdv.latitude && pdv.longitude) {
        pdvPoints.push({
          type: 'PDV',
          storeId: pdv.storeId || pdv.store,
          pdvId: pdv._id,
          lat: pdv.latitude,
          lng: pdv.longitude,
          pdvName: pdv.storeName,
          storeName: pdv.storeName
        });
      }
    });

    return pdvPoints;
  }

  private async calculateDistancesToPoints(
    points: LocationPoint[],
    userCoordinates: { lat: number, lng: number }
  ): Promise<LocationPoint[]> {
    if (points.length === 0) {
      return [];
    }

    const destinations = points.map(point => ({
      lat: point.lat,
      lng: point.lng
    }));

    const distanceResults = await this.locationService.calculateDistances(
      userCoordinates,
      destinations
    );

    points.forEach((point, index) => {
      const result = distanceResults[index];
      point.distance = result.distance;
      point.duration = result.duration;
      point.distanceValue = result.distanceValue;
      point.distanceKm = (result.distanceValue ?? 0) / 1000;
    });

    return points;
  }

  private async processPdvsWithShipping(
    pdvs: any[],
    pdvPoints: LocationPoint[],
    formattedCep: string
  ): Promise<any[]> {
    const pdvsWithShipping: any[] = [];

    for (const pdv of pdvs) {
      const pdvPoint = pdvPoints.find(p =>
        p.type === 'PDV' && p.pdvId && p.pdvId.toString() === pdv._id.toString()
      );

      if (pdvPoint) {
        const pdvShippingInfo = await this.shippingService.calculateShipping(
          pdv.postalCode || '',
          formattedCep
        );
        
        let deliveryTime = "1 dia útil";
        if (pdvShippingInfo && pdvShippingInfo.length > 0) {
          this.logger.debug(`Shipping info for PDV ${pdv.storeName}: ${JSON.stringify(pdvShippingInfo)}`);
          
          const firstOption = pdvShippingInfo[0];
          if (firstOption) {
            const option = firstOption as any;
            const days = option.shippingDays || option.delivery_time || option.deliveryTime || 
                         option.delivery_days || option.deliveryDays || 1;
            
            const daysNum = parseInt(String(days), 10) || 1;
            deliveryTime = `${daysNum} ${daysNum === 1 ? 'dia útil' : 'dias úteis'}`;
          }
        }
        
        if (typeof pdvPoint.distanceKm === 'number' && pdvPoint.distanceKm <= this.RADIUS_KM) {
          pdvsWithShipping.push({
            id: pdv._id.toString(),
            name: pdv.storeName,
            city: pdv.city || 'Unknown',
            postalCode: pdv.postalCode || 'Unknown',
            type: "PDV",
            distance: pdvPoint.distance || "N/A",
            value: [
              {
                shippingDays: deliveryTime,
                price: "R$ 15,00",
                description: "Fixed price for this distance"
              }
            ],
            coordinates: {
              lat: pdv.latitude,
              lng: pdv.longitude
            }
          });
        } else {
          pdvsWithShipping.push({
            id: pdv._id.toString(),
            name: pdv.storeName,
            city: pdv.city || 'Unknown',
            postalCode: pdv.postalCode || 'Unknown',
            type: "PDV",
            distance: pdvPoint.distance || "N/A",
            value: pdvShippingInfo,
            coordinates: {
              lat: pdv.latitude,
              lng: pdv.longitude
            }
          });
        }
      }
    }

    return pdvsWithShipping;
  }

  private sortPdvsByDistance(pdvs: any[]): any[] {
    return [...pdvs].sort((a, b) => {
      const aDistance = parseFloat((a.distance || "").replace(/[^\d.]/g, '')) || Infinity;
      const bDistance = parseFloat((b.distance || "").replace(/[^\d.]/g, '')) || Infinity;
      return aDistance - bDistance;
    });
  }

  private createPinsForMap(
    pdvs: any[],
    userCoordinates: { lat: number, lng: number },
    locationInfo: { localidade: string, uf: string }
  ): Array<{ position: { lat: number, lng: number }, title: string }> {
    const pins: Array<{ position: { lat: number, lng: number }, title: string }> = [];

    pdvs.forEach(pdv => {
      pins.push({
        position: {
          lat: parseFloat(pdv.coordinates.lat),
          lng: parseFloat(pdv.coordinates.lng)
        },
        title: pdv.name
      });
    });

    pins.push({
      position: {
        lat: userCoordinates.lat,
        lng: userCoordinates.lng
      },
      title: `Current Location: ${locationInfo.localidade}, ${locationInfo.uf}`
    });

    return pins;
  }
} 