import { Observable, Subject, BehaviorSubject } from 'rxjs';
import {
  takeUntil,
  take,
  takeWhile,
  map,
  filter,
  share,
  delay,
  distinctUntilChanged,
  debounceTime,
} from 'rxjs/operators';
import * as t from '../types';
import { value as valueUtil } from '../common';

const hyperdb = require('hyperdb');

/**
 * Promise based wrapper around a HyperDB instance.
 *
 * See:
 *  - https://github.com/mafintosh/hyperdb#api
 *
 */

export class HyperDb<D extends object = any> {
  /**
   * [Static]
   */
  public static create<D extends object = any>(args: { storage: string; dbKey?: string }) {
    const reduce = (a: any, b: any) => a;
    return new Promise<HyperDb<D>>((resolve, reject) => {
      const { storage, dbKey } = args;
      const options = { valueEncoding: 'utf-8', reduce };
      const db = args.dbKey ? hyperdb(storage, dbKey, options) : hyperdb(storage, options);
      db.on('ready', () => {
        resolve(new HyperDb<D>(db));
      });
    });
  }

  /**
   * [Fields]
   */
  public _ = {
    db: null as any,
    isDisposed: false,
    dispose$: new Subject(),
    events$: new Subject<t.DbEvent>(),
  };
  public readonly dispose$ = this._.dispose$.pipe(share());
  public readonly events$ = this._.events$.pipe(
    takeUntil(this.dispose$),
    share(),
  );

  /**
   * [Constructor]
   */
  private constructor(db: any) {
    this._.db = db;

    // const watcher = db.watch('', e => {
    //   console.log('e', e);
    // });
    // console.log('watcher', watcher);
  }

  /**
   * Disposes of the object and stops all related observables.
   */
  public dispose() {
    this._.dispose$.next();
  }
  public get isDisposed() {
    return this._.isDisposed;
  }

  /**
   * [Properties]
   */
  public get key(): Buffer {
    return this._.db.key;
  }

  public get discoveryKey(): Buffer {
    return this._.db.discoveryKey;
  }

  public get local(): t.IFeed {
    return this._.db.local;
  }

  /**
   * [Methods]
   */
  public replicate(options: { live?: boolean }) {
    const { live = false } = options;

    // NOTE: Tack userData onto the replicated database.
    //    This is used by the swarm-connection event to filter on peers
    //    that are looking for this database.
    //
    // See:
    //    Swarm connection event listener.
    //
    // See:
    //    https://github.com/karissa/hyperdiscovery/pull/12#pullrequestreview-95597621
    //    https://github.com/cblgh/hyperdb-examples
    //
    const userData = this.local.key;

    return this._.db.replicate({ live, userData });
  }

  /**
   * Check whether a key is authorized to write to the database.
   */
  public isAuthorized(peerKey: Buffer) {
    return new Promise<boolean>((resolve, reject) => {
      this._.db.authorized(peerKey, (err: Error, result: boolean) => {
        return err ? reject(err) : resolve(result);
      });
    });
  }

  /**
   * Authorize a peer to write to the database.
   */
  public async authorize(peerKey: Buffer) {
    return new Promise((resolve, reject) => {
      this._.db.authorize(peerKey, (err: Error) => {
        return err ? reject(err) : resolve();
      });
    });
  }
  /**
   * Gets a value from the database.
   */
  public async get<K extends keyof D>(key: K) {
    return new Promise<t.IDbValue<K, D[K]>>((resolve, reject) => {
      this._.db.get(key, (err: Error, result: any) => {
        return err ? reject(err) : resolve(toValue(result));
      });
    });
  }

  /**
   * Writes a value to the database.
   */
  public async put<K extends keyof D>(key: K, value: D[K]) {
    return new Promise<t.IDbValue<K, D[K]>>((resolve, reject) => {
      this._.db.put(key, value, (err: Error, result: any) => {
        return err ? reject(err) : resolve(toValue(result));
      });
    });
  }

  /**
   * [INTERNAL]
   */
  private fireError(error: Error) {
    this.next<t.IDbErrorEvent>('DB/error', { error });
  }

  private next<E extends t.DbEvent>(type: E['type'], payload: E['payload']) {
    const e = { type, payload };
    this._.events$.next(e as t.DbEvent);
  }
}

/**
 * [INTERNAL]
 */
function toValue<K, V>(result: any): t.IDbValue<K, V> {
  const isNil = result === null || result === undefined;
  const value = isNil ? undefined : (valueUtil.toType(result.value) as V);
  result = { ...result };
  delete result.value;
  return {
    value,
    meta: result as t.IDbValueMeta<K>,
  };
}
