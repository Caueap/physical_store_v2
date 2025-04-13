import { statesUfs } from './states-ufs'

export const paginate = <T>(items: T[], limit: number, offset: number): T[] => {
  return items.slice(offset, offset + limit);
};

export const getFullStateName = (abbr: string): string | undefined => {
  return statesUfs[abbr.toUpperCase()];
};
