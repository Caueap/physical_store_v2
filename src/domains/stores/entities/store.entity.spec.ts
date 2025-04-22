import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model, Types } from 'mongoose';
import { Store, StoreDocument } from './store.entity';

describe('Store Entity', () => {
  let storeModel: Model<StoreDocument>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getModelToken(Store.name),
          useValue: {
            new: jest.fn().mockImplementation((dto) => dto),
            constructor: jest.fn().mockImplementation((dto) => dto),
            create: jest.fn(),
            findOne: jest.fn(),
            findOneAndUpdate: jest.fn(),
            find: jest.fn(),
            exec: jest.fn(),
          },
        },
      ],
    }).compile();

    storeModel = module.get<Model<StoreDocument>>(getModelToken(Store.name));
  });

  it('should be defined', () => {
    expect(storeModel).toBeDefined();
  });

  describe('Store creation', () => {
    it('should create a store successfully', async () => {
      // Arrange
      const storeData = {
        storeName: 'Test Store',
        takeOutInStore: true,
        shippingTimeInDays: 2,
        latitude: 40.7128,
        longitude: -74.006,
        address: '123 Test Street',
        city: 'Test City',
        district: 'Test District',
        state: 'Test State',
        country: 'Test Country',
        postalCode: '12345',
        telephoneNumber: 1234567890,
        emailAddress: 'test@store.com',
        pdvs: [],
      };

      jest.spyOn(storeModel, 'create').mockImplementationOnce(() => Promise.resolve(storeData as any));

      // Act
      const result = await storeModel.create(storeData);

      // Assert
      expect(result).toEqual(storeData);
      expect(storeModel.create).toHaveBeenCalledWith(storeData);
    });
  });

  describe('Store validation', () => {
    it('should validate required fields', () => {
      const validateStore = (data: any): { isValid: boolean; errors?: string[] } => {
        const errors: string[] = [];
        
        if (!data.storeName) {
          errors.push('Store name is required');
        }
        
        return {
          isValid: errors.length === 0,
          errors: errors.length ? errors : undefined,
        };
      };

      const validData = { storeName: 'Valid Store' };
      expect(validateStore(validData).isValid).toBe(true);
      
      const invalidData = { storeName: '' };
      const validation = validateStore(invalidData);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Store name is required');
    });
  });

  describe('Store relationships', () => {
    it('should populate PDVs when requested', async () => {
      // Arrange
      const storeId = new Types.ObjectId();
      const pdv1Id = new Types.ObjectId();
      const pdv2Id = new Types.ObjectId();
      
      const storeWithPdvs = {
        _id: storeId,
        storeName: 'Store with PDVs',
        pdvs: [
          {
            _id: pdv1Id,
            storeName: 'PDV 1',
            store: storeId,
          },
          {
            _id: pdv2Id,
            storeName: 'PDV 2',
            store: storeId,
          },
        ],
      };

      jest.spyOn(storeModel, 'findOne').mockReturnValueOnce({
        populate: jest.fn().mockReturnValueOnce({
          exec: jest.fn().mockResolvedValueOnce(storeWithPdvs),
        }),
      } as any);

      // Act
      const result = await storeModel.findOne({ _id: storeId }).populate('pdvs').exec();

      // Assert
      expect(result).toEqual(storeWithPdvs);
      expect(result!.pdvs.length).toBe(2);
      expect(storeModel.findOne).toHaveBeenCalledWith({ _id: storeId });
    });
  });
}); 