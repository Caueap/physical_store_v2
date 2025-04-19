import { Pdv } from '../entities/pdv.entity';
import { Store } from '../../stores/entities/store.entity';

export type PdvWithStore = Pdv & {
  store: Store;
}; 