import * as t from './types';
import { Key, state } from '../common';
import * as reducers from './reducers';
import { data } from '../../data.graphql';

/**
 * Initializes a new store instance for managing a conversation thread.
 */
export function create(args: {
  initial: t.IThreadStoreModel;
  getGraphql: () => data.ConversationGraphql;
  keys?: Key;
}) {
  const { initial, getGraphql } = args;
  const keys = args.keys || new Key({});
  const store = state.create<t.IThreadStoreModel, t.ThreadEvent>({ initial });
  reducers.init({ store, keys, getGraphql });
  return store;
}
