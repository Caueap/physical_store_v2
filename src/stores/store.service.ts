import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Store, StoreDocument } from './models/store.model';
import { CreateStoreDto } from './dtos/create-store.dto';
import { getFullStateName } from '../utils/functions';
import { paginate } from 'src/utils/functions';
import { lastValueFrom } from 'rxjs';
import { CreatePdvDto } from './dtos/create-pdv.dto';
import { Pdv, PdvDocument } from './models/pdv.model';
import { LocationPoint } from './interfaces/location-point.interface';

@Injectable()
export class StoreService {
 
  private readonly GOOGLE_API_KEY: string | undefined;
  private readonly MELHOR_ENVIO_TOKEN: string | undefined;
  private readonly RADIUS_KM = 50;
  
  private readonly VIACEP_API_URL = 'https://viacep.com.br/ws';
  private readonly GOOGLE_GEOCODING_API_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
  private readonly GOOGLE_DISTANCE_API_URL = 'https://maps.googleapis.com/maps/api/distancematrix/json';
  private readonly MELHOR_ENVIO_API_URL = 'https://www.melhorenvio.com.br/api/v2/me/shipment/calculate';

  private readonly SHIPPING_SERVICE_IDS = ["1", "2"];

  constructor(
    @InjectModel(Store.name) private StoreModel: Model<StoreDocument>,
    @InjectModel(Pdv.name) private PdvModel: Model<PdvDocument>,
    private httpService: HttpService,
    private configService: ConfigService,
  ) { 
    this.GOOGLE_API_KEY = this.configService.get<string>('GOOGLE_API_KEY');
    this.MELHOR_ENVIO_TOKEN = this.configService.get<string>('MELHOR_ENVIO_TOKEN');
  }

  async getAllStores(limit: number, offset: number): Promise<any> {
    const allStores = await this.StoreModel.find().populate({ path: 'pdvs', model: 'Pdv' }).exec();
    const paginatedStores = paginate(allStores, limit, offset);

    return {
      stores: paginatedStores,
      limit,
      offset,
      total: allStores.length,
    };
  }

  async getStoresByCep(cep: string, limit = 10, offset = 0): Promise<StoresByCepResponse> {
    const { userCoordinates, formattedCep, locationInfo } = await this.getUserLocationFromCep(cep);

    const stores = await this.StoreModel.find().populate<{ pdvs: any[] }>({
      path: 'pdvs',
      model: 'Pdv'
    }).exec();
    
    const allPoints = await this.calculateDistancesToAllPoints(stores, userCoordinates);
    
    const allLocationsWithShipping = await this.processAllLocationsWithShipping(
      stores,
      allPoints,
      formattedCep
    );

    const sortedLocations = this.sortLocationsByDistance(allLocationsWithShipping);
    const paginatedLocations = paginate(sortedLocations, limit, offset);
    
    const pins = this.createPinsForMap(sortedLocations, userCoordinates, locationInfo);

    return {
      stores: paginatedLocations,
      pins: pins,
      limit,
      offset,
      total: sortedLocations.length
    };
  }

  private async getUserLocationFromCep(cep: string): Promise<UserLocationInfo> {
    
    const viacepUrl = `${this.VIACEP_API_URL}/${cep}/json/`;
    const viacepResponse = await lastValueFrom(this.httpService.get(viacepUrl));
    const { logradouro, localidade, uf, cep: formattedCep } = viacepResponse.data;

    if (!logradouro || !localidade || !uf) {
      throw new BadRequestException('Invalid CEP or incomplete address from ViaCEP');
    }

    const fullAddress = `${logradouro}, ${localidade}, ${uf}`;

   
    const geocodingUrl = `${this.GOOGLE_GEOCODING_API_URL}?address=${encodeURIComponent(fullAddress)}&key=${this.GOOGLE_API_KEY}`;
    const geocodeResponse = await lastValueFrom(this.httpService.get(geocodingUrl));
    const location = geocodeResponse.data.results?.[0]?.geometry?.location;

    if (!location) {
      throw new BadRequestException('Could not geocode the address');
    }

    return {
      fullAddress,
      formattedCep,
      userCoordinates: location,
      locationInfo: viacepResponse.data
    };
  }

  private collectLocationPoints(stores: any[]): LocationPoint[] {
    const allPoints: LocationPoint[] = [];
    
    stores.forEach(store => {
      if (store.latitude && store.longitude) {
        allPoints.push({
          type: 'STORE',
          storeId: store._id as Types.ObjectId,
          lat: store.latitude,
          lng: store.longitude,
          storeName: store.storeName,
        });
      }
      
      if (store.pdvs && store.pdvs.length > 0) {
        store.pdvs.forEach(pdv => {
          if (pdv.latitude && pdv.longitude) {
            allPoints.push({
              type: 'PDV',
              storeId: store._id as Types.ObjectId,
              pdvId: pdv._id,
              lat: pdv.latitude,
              lng: pdv.longitude,
              storeName: store.storeName,
              pdvName: pdv.storeName,
            });
          }
        });
      }
    });

    return allPoints;
  }

  private async calculateDistancesToAllPoints(
    stores: any[],
    userCoordinates: { lat: number, lng: number }
  ): Promise<LocationPoint[]> {
    const allPoints = this.collectLocationPoints(stores);
    
    if (allPoints.length === 0) {
      return [];
    }
    
    const destinations = allPoints.map(point => `${point.lat},${point.lng}`).join('|');
    const origins = `${userCoordinates.lat},${userCoordinates.lng}`;
    const distanceMatrixUrl = `${this.GOOGLE_DISTANCE_API_URL}?origins=${origins}&destinations=${destinations}&mode=driving&key=${this.GOOGLE_API_KEY}`;

    const distanceResponse = await lastValueFrom(this.httpService.get(distanceMatrixUrl));
    const distances = distanceResponse.data.rows[0]?.elements;

    if (!distances || distances.length !== allPoints.length) {
      throw new InternalServerErrorException('Error fetching distances');
    }
   
    allPoints.forEach((point, index) => {
      point.distance = distances[index].distance?.text;
      point.duration = distances[index].duration?.text;
      point.distanceValue = distances[index].distance?.value;
      point.distanceKm = (point.distanceValue ?? 0) / 1000;
    });

    return allPoints;
  }

  private async processAllLocationsWithShipping(
    stores: any[],
    allPoints: LocationPoint[],
    formattedCep: string
  ): Promise<LocationWithShipping[]> {
    const allLocationsWithShipping: LocationWithShipping[] = [];
    
    for (const store of stores) {
      
      const storePoint = allPoints.find(p =>
        p.type === 'STORE' && p.storeId.toString() === (store._id as Types.ObjectId).toString()
      );

      if (storePoint) {
        
        const storeShippingInfo = await this.calculateShipping(
          store.postalCode || '',
          formattedCep,
          this.MELHOR_ENVIO_TOKEN as string
        );

        allLocationsWithShipping.push({
          name: store.storeName,
          city: store.city,
          postalCode: store.postalCode,
          type: "LOJA",
          distance: storePoint.distance || "N/A",
          value: storeShippingInfo,
          coordinates: {
            lat: store.latitude,
            lng: store.longitude
          }
        });
      }
     
      if (store.pdvs && store.pdvs.length > 0) {
        for (const pdv of store.pdvs) {
          const pdvPoint = allPoints.find(p =>
            p.type === 'PDV' && p.pdvId?.toString() === pdv._id.toString()
          );

          if (pdvPoint) {
            
            if (typeof pdvPoint.distanceKm === 'number' && pdvPoint.distanceKm <= this.RADIUS_KM) {
              
              allLocationsWithShipping.push({
                name: pdv.storeName,
                city: pdv.city,
                postalCode: pdv.postalCode,
                type: "PDV",
                distance: pdvPoint.distance || "",
                value: [
                  {
                    shippingDays: "1 dias úteis",
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
              
              const pdvShippingInfo = await this.calculateShipping(
                pdv.postalCode || '',
                formattedCep,
                this.MELHOR_ENVIO_TOKEN as string
              );

              allLocationsWithShipping.push({
                name: pdv.storeName,
                city: pdv.city,
                postalCode: pdv.postalCode,
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
      }
    }

    return allLocationsWithShipping;
  }

  private sortLocationsByDistance(locations: LocationWithShipping[]): LocationWithShipping[] {
    return [...locations].sort((a, b) => {
      const aDistance = parseFloat((a.distance || "").replace(/[^\d.]/g, '')) || Infinity;
      const bDistance = parseFloat((b.distance || "").replace(/[^\d.]/g, '')) || Infinity;
      return aDistance - bDistance;
    });
  }

  private createPinsForMap(
    locations: LocationWithShipping[],
    userCoordinates: { lat: number, lng: number },
    locationInfo: { localidade: string, uf: string }
  ): MapPin[] {
    const pins: MapPin[] = [];
    
    locations.forEach(location => {
      pins.push({
        position: {
          lat: parseFloat(location.coordinates.lat),
          lng: parseFloat(location.coordinates.lng)
        },
        title: location.name
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
  
  private async calculateShipping(
    fromPostalCode: string,
    toPostalCode: string,
    melhorEnvioToken: string
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
            'Authorization': `Bearer ${melhorEnvioToken}`,
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

  async getStoresByState(state?: string, limit = 10, offset = 0): Promise<any> {
    if (state) {
      return await this.getStoresBySpecificState(state, limit, offset);
    } else {
      return await this.getStoresGroupedByState(limit, offset);
    }
  }

  private async getStoresBySpecificState(state: string, limit: number, offset: number): Promise<any> {
    const fullStateName = getFullStateName(state);
    if (!fullStateName) {
      throw new BadRequestException('Invalid state abbreviation');
    }

    const filter = { state: new RegExp(`^${fullStateName}$`, 'i') };
    const stores = await this.StoreModel.find(filter).populate('pdvs').exec();

    if (!stores || stores.length === 0) {
      throw new NotFoundException(`No stores found in state ${fullStateName}`);
    }

    const paginatedStores = paginate(stores, limit, offset);

    return {
      state: fullStateName,
      total: stores.length,
      limit,
      offset,
      stores: paginatedStores,
    };
  }

  private async getStoresGroupedByState(limit: number, offset: number): Promise<any> {
    const stores = await this.StoreModel.find({}).exec();

    if (!stores || stores.length === 0) {
      throw new NotFoundException('No stores found');
    }

    const grouped = this.groupStoresByState(stores);

    const paginatedStores: Record<string, any[]> = {};
    for (const [stateKey, list] of Object.entries(grouped)) {
      paginatedStores[stateKey] = paginate(list, limit, offset);
    }

    return {
      totalStates: Object.keys(grouped).length,
      limit,
      offset,
      groupedStores: paginatedStores,
    };
  }

  private groupStoresByState(stores: any[]): Record<string, any[]> {
    return stores.reduce((acc, store) => {
      const stateKey = (store.state);
      if (!acc[stateKey]) {
        acc[stateKey] = [];
      }
      acc[stateKey].push(store);
      return acc;
    }, {} as Record<string, any[]>);
  }

  async getStoreById(id: string): Promise<Store> {
    const store = await this.StoreModel.findById(id).populate('pdvs').exec();
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    return store;
  }

  async createStore(dto: CreateStoreDto) {
    return this.StoreModel.create({
      ...dto,
      type: 'LOJA',
    });
  }

  async createPdv(dto: CreatePdvDto) {
    const parent = await this.StoreModel.findById(dto.parentStoreId);
    if (!parent || parent.type !== 'LOJA') {
      throw new BadRequestException('Invalid or non-store parentStoreId');
    }

    const pdv = await this.PdvModel.create({
      ...dto,
      store: dto.parentStoreId,
      type: 'PDV',
    });

    parent.pdvs.push(pdv._id as Types.ObjectId);
    await parent.save();

    return pdv;
  }
}