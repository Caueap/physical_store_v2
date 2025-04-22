import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PdvRepositoryImpl } from './pdv.repository.impl';
import { Pdv } from '../../../domains/pdvs/entities/pdv.entity';
import { Store } from '../../../domains/stores/entities/store.entity';
import * as utils from '../../../utils/functions';

jest.mock('../../../utils/functions', () => ({
  getFullStateName: jest.fn().mockImplementation((state) => state === 'SP' ? 'São Paulo' : state),
  paginate: jest.fn().mockImplementation((items, limit, offset) => items.slice(offset, offset + limit)),
}));

describe('PdvRepositoryImpl', () => {
  let repository: PdvRepositoryImpl;
  let pdvModel: any;
  let storeModel: any;

  const mockStoreId = new Types.ObjectId();
  const mockPdvId = new Types.ObjectId();
  
  const mockPdv = {
    _id: mockPdvId,
    storeName: 'Test PDV',
    store: mockStoreId,
    state: 'São Paulo',
    takeOutInStore: true,
    shippingTimeInDays: 3,
  };

  const mockStore = {
    _id: mockStoreId,
    storeName: 'Parent Store',
    pdvs: [],
  };

  const mockPdvArray = [
    mockPdv,
    {
      _id: new Types.ObjectId(),
      storeName: 'Test PDV 2',
      store: mockStoreId,
      state: 'Rio de Janeiro',
      takeOutInStore: true,
      shippingTimeInDays: 3,
    },
  ];

  const pdvModelMock = {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };
  
  const storeModelMock = {
    findByIdAndUpdate: jest.fn(),
  };

  beforeEach(async () => {
 
    jest.clearAllMocks();
    
    pdvModelMock.constructor = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockImplementation(function() {
        return Promise.resolve({ ...this, _id: new Types.ObjectId() });
      })
    }));
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PdvRepositoryImpl,
        {
          provide: getModelToken(Pdv.name),
          useValue: pdvModelMock,
        },
        {
          provide: getModelToken(Store.name),
          useValue: storeModelMock,
        },
      ],
    }).compile();

    repository = module.get<PdvRepositoryImpl>(PdvRepositoryImpl);
    pdvModel = module.get(getModelToken(Pdv.name));
    storeModel = module.get(getModelToken(Store.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return an array of pdvs', async () => {
      // Arrange
      const findMock = {
        exec: jest.fn().mockResolvedValue(mockPdvArray),
      };
      pdvModel.find.mockReturnValue(findMock);

      // Act
      const result = await repository.findAll();

      // Assert
      expect(result).toEqual(mockPdvArray);
      expect(pdvModel.find).toHaveBeenCalled();
      expect(findMock.exec).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return a pdv when valid id is provided', async () => {
      // Arrange
      const findByIdMock = {
        exec: jest.fn().mockResolvedValue(mockPdv),
      };
      pdvModel.findById.mockReturnValue(findByIdMock);

      // Act
      const result = await repository.findById(mockPdvId);

      // Assert
      expect(result).toEqual(mockPdv);
      expect(pdvModel.findById).toHaveBeenCalledWith(mockPdvId);
      expect(findByIdMock.exec).toHaveBeenCalled();
    });

    it('should return null when pdv is not found', async () => {
      // Arrange
      const findByIdMock = {
        exec: jest.fn().mockResolvedValue(null),
      };
      pdvModel.findById.mockReturnValue(findByIdMock);
      const nonExistentId = new Types.ObjectId();

      // Act
      const result = await repository.findById(nonExistentId);

      // Assert
      expect(result).toBeNull();
      expect(pdvModel.findById).toHaveBeenCalledWith(nonExistentId);
      expect(findByIdMock.exec).toHaveBeenCalled();
    });
  });

  describe('findByState', () => {
    it('should find pdvs by specific state', async () => {
      // Arrange
      const findMock = {
        exec: jest.fn().mockResolvedValue([mockPdv]),
      };
      pdvModel.find.mockReturnValue(findMock);
      (utils.getFullStateName as jest.Mock).mockReturnValue('São Paulo');
      (utils.paginate as jest.Mock).mockReturnValue([mockPdv]);

      // Act
      const result = await repository.findByState('SP', 10, 0);

      // Assert
      expect(result).toEqual({
        state: 'São Paulo',
        total: 1,
        limit: 10,
        offset: 0,
        pdvs: [mockPdv],
      });
      expect(pdvModel.find).toHaveBeenCalledWith({
        state: expect.any(RegExp),
      });
      expect(utils.getFullStateName).toHaveBeenCalledWith('SP');
      expect(utils.paginate).toHaveBeenCalledWith([mockPdv], 10, 0);
    });

    it('should find pdvs grouped by state when no state is provided', async () => {
      // Arrange
      const findMock = {
        exec: jest.fn().mockResolvedValue(mockPdvArray),
      };
      pdvModel.find.mockReturnValue(findMock);
      
      (utils.paginate as jest.Mock).mockImplementation((items) => items);

      // Act
      const result = await repository.findByState(undefined, 10, 0);

      // Assert
      expect(result).toHaveProperty('totalStates');
      expect(result).toHaveProperty('limit', 10);
      expect(result).toHaveProperty('offset', 0);
      expect(result).toHaveProperty('groupedPdvs');
      expect(pdvModel.find).toHaveBeenCalledWith({});
    });
  });

  describe('create', () => {
    it('should create a new pdv and update the parent store', async () => {
      // Arrange
      const newPdv = {
        storeName: 'New PDV',
        store: mockStoreId,
        takeOutInStore: true,
        shippingTimeInDays: 3,
      };
      
      const savedPdv = {
        ...newPdv,
        _id: new Types.ObjectId(),
      };
      
      pdvModel.find = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([])
      });
      
      const saveMock = jest.fn().mockResolvedValue(savedPdv);
      
      (repository as any).pdvModel = function() {
        return { 
          save: saveMock
        };
      };
      
      storeModel.findByIdAndUpdate.mockResolvedValue(mockStore);

      // Act
      const result = await repository.create(newPdv as any);

      // Assert
      expect(result).toEqual(savedPdv);
      expect(saveMock).toHaveBeenCalled();
      expect(storeModel.findByIdAndUpdate).toHaveBeenCalledWith(
        savedPdv.store,
        expect.objectContaining({ 
          $push: expect.objectContaining({ 
            pdvs: expect.anything() 
          }) 
        })
      );
    });
  });

  describe('update', () => {
    it('should update an existing pdv', async () => {
      // Arrange
      const updatedPdv = {
        ...mockPdv,
        storeName: 'Updated PDV',
      };
      
      const findByIdAndUpdateMock = {
        exec: jest.fn().mockResolvedValue(updatedPdv),
      };
      
      pdvModel.findByIdAndUpdate.mockReturnValue(findByIdAndUpdateMock);
      
      const updateData = { storeName: 'Updated PDV' };

      // Act
      const result = await repository.update(mockPdvId, updateData as any);

      // Assert
      expect(result).toEqual(updatedPdv);
      expect(pdvModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockPdvId,
        updateData,
        { new: true }
      );
      expect(findByIdAndUpdateMock.exec).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete a pdv and update the parent store', async () => {
      // Arrange
      const pdvWithStoreMock = {
        ...mockPdv,
        _id: mockPdvId,
        store: mockStoreId
      };
      
      const findByIdMock = {
        exec: jest.fn().mockResolvedValue(pdvWithStoreMock),
      };
      pdvModel.findById.mockReturnValue(findByIdMock);
      
      pdvModel.findByIdAndDelete.mockResolvedValue(pdvWithStoreMock);
      storeModel.findByIdAndUpdate.mockResolvedValue(mockStore);

      // Act
      const result = await repository.delete(mockPdvId.toString());

      // Assert
      expect(result).toBe(true);
      expect(pdvModel.findById).toHaveBeenCalledWith(mockPdvId.toString());
      expect(storeModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockStoreId,
        expect.objectContaining({
          $pull: expect.objectContaining({
            pdvs: mockPdvId.toString()
          })
        })
      );
      expect(pdvModel.findByIdAndDelete).toHaveBeenCalledWith(mockPdvId.toString());
    });

    it('should return null when pdv is not found', async () => {
      // Arrange
      const findByIdMock = {
        exec: jest.fn().mockResolvedValue(null),
      };
      pdvModel.findById.mockReturnValue(findByIdMock);

      // Act
      const result = await repository.delete(mockPdvId.toString());

      // Assert
      expect(result).toBe(false);
      expect(pdvModel.findById).toHaveBeenCalledWith(mockPdvId.toString());
      expect(pdvModel.findByIdAndDelete).not.toHaveBeenCalled();
      expect(storeModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });
}); 