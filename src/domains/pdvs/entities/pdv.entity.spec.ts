import { Types } from 'mongoose';
import { Pdv, PdvSchema } from './pdv.entity';

describe('Pdv Entity', () => {
  describe('create', () => {
    it('should have default values defined in schema', () => {

      const takeOutInStoreField = PdvSchema.path('takeOutInStore');
      const shippingTimeField = PdvSchema.path('shippingTimeInDays');
      const typeField = PdvSchema.path('type');
      
      expect(takeOutInStoreField.options.default).toBe(true);
      expect(shippingTimeField.options.default).toBe(3);
      expect(typeField.options.default).toBe('PDV');
    });

    it('should create with required fields', () => {
      const mockStoreId = new Types.ObjectId();
      const pdv = new Pdv();
      
      pdv.storeName = 'Test PDV';
      pdv.store = mockStoreId;
      
      pdv.takeOutInStore = true;
      pdv.shippingTimeInDays = 3;
      pdv.type = 'PDV';

      expect(pdv).toBeDefined();
      expect(pdv.storeName).toBe('Test PDV');
      expect(pdv.store).toEqual(mockStoreId);
      expect(pdv.takeOutInStore).toBe(true);
      expect(pdv.shippingTimeInDays).toBe(3);
      expect(pdv.type).toBe('PDV');
    });

    it('should create with optional fields', () => {
      const mockStoreId = new Types.ObjectId();
      const pdv = new Pdv();
      
      pdv.storeName = 'Full PDV';
      pdv.store = mockStoreId;
      pdv.takeOutInStore = false;
      pdv.shippingTimeInDays = 5;
      pdv.latitude = 41.8781;
      pdv.longitude = -87.6298;
      pdv.address = '123 Test Street';
      pdv.city = 'Test City';
      pdv.district = 'Test District';
      pdv.state = 'SP';
      pdv.country = 'Brazil';
      pdv.postalCode = '12345-678';
      pdv.telephoneNumber = 1234567890;
      pdv.emailAddress = 'test@pdv.com';

      expect(pdv).toBeDefined();
      expect(pdv.storeName).toBe('Full PDV');
      expect(pdv.store).toEqual(mockStoreId);
      expect(pdv.takeOutInStore).toBe(false);
      expect(pdv.shippingTimeInDays).toBe(5);
      expect(pdv.latitude).toBe(41.8781);
      expect(pdv.longitude).toBe(-87.6298);
      expect(pdv.address).toBe('123 Test Street');
      expect(pdv.city).toBe('Test City');
      expect(pdv.state).toBe('SP');
    });

    it('should have schema defined', () => {
      expect(PdvSchema).toBeDefined();
    });
  });

  describe('Schema validation', () => {
    it('should have storeName marked as required in schema', () => {
      const storeNamePath = PdvSchema.path('storeName');
      expect(storeNamePath.options.required).toBeTruthy();
    });

    it('should have store reference marked as required in schema', () => {
      const storePath = PdvSchema.path('store');
      expect(storePath.options.required).toBeTruthy();
    });

    it('should have storeName marked as unique in schema', () => {
      const storeNamePath = PdvSchema.path('storeName');
      expect(storeNamePath.options.unique).toBeTruthy();
    });
  });

  describe('Relationships', () => {
    it('should properly reference Store model', () => {
      const storePath = PdvSchema.path('store');
      expect(storePath.options.ref).toBe('Store');
      expect(['ObjectId', 'Mixed'].includes(storePath.instance)).toBeTruthy();
    });
  });
}); 