import { IStoreClient } from '@platform/electron/lib/types';
import { IRendererDb } from '../../src/types';

export * from '../../src/types';
export * from './renderer/cli/types';

/**
 * Store
 */
export type ITestStore = IStoreClient<ITestStoreSettings>;
export type ITestStoreSettings = {
  dbKey?: string;
  dir: string;
  databases: string[];
};

/**
 * Database
 */
export type ITestDbData = {
  ['.sys/dbname']: string;
  ['.sys/watch']: string[];
};
export type ITestRendererDb = IRendererDb<ITestDbData>;

