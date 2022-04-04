import { filter, takeUntil } from 'rxjs/operators';
import { rx, slug, t, DEFAULT, Patch } from './common';

type J = t.JsonMap;
type Id = string;

/**
 * Event API for the "WebRuntime"
 */
export function JsonEvents(args: {
  instance: t.JsonBusInstance;
  filter?: t.JsonEventFilter;
  dispose$?: t.Observable<any>;
}): t.JsonEvents {
  const { dispose, dispose$ } = rx.disposable(args.dispose$);

  const bus = rx.busAsType<t.JsonEvent>(args.instance.bus);
  const instance = args.instance.id;
  const is = JsonEvents.is;

  const $ = bus.$.pipe(
    takeUntil(dispose$),
    filter((e) => is.instance(e, instance)),
    filter((e) => args.filter?.(e) ?? true),
  );

  /**
   * Base information about the module.
   */
  const info: t.JsonEvents['info'] = {
    req$: rx.payload<t.JsonInfoReqEvent>($, 'sys.json/info:req'),
    res$: rx.payload<t.JsonInfoResEvent>($, 'sys.json/info:res'),
    async get(options = {}) {
      const { timeout = DEFAULT.TIMEOUT } = options;
      const tx = slug();

      const op = 'info';
      const res$ = info.res$.pipe(filter((e) => e.tx === tx));
      const first = rx.asPromise.first<t.JsonInfoResEvent>(res$, { op, timeout });

      bus.fire({
        type: 'sys.json/info:req',
        payload: { tx, instance },
      });

      const res = await first;
      if (res.payload) return res.payload;

      const error = res.error?.message ?? 'Failed';
      return { tx, instance, error };
    },
  };

  /**
   * State.
   */
  const state: t.JsonEvents['state'] = {
    /**
     * GET
     */
    get: {
      req$: rx.payload<t.JsonStateReqEvent>($, 'sys.json/state:req'),
      res$: rx.payload<t.JsonStateResEvent>($, 'sys.json/state:res'),
      async fire<T extends J = J>(options: t.JsonEventsGetOptions = {}) {
        type R = t.JsonStateRes<T>;
        const { timeout = DEFAULT.TIMEOUT, key = DEFAULT.KEY } = options;
        const tx = slug();

        const op = 'state.get';
        const res$ = state.get.res$.pipe(filter((e) => e.tx === tx && e.key === key));
        const first = rx.asPromise.first<t.JsonStateResEvent>(res$, { op, timeout });

        bus.fire({
          type: 'sys.json/state:req',
          payload: { tx, instance, key },
        });

        const res = await first;
        if (res.payload) return res.payload as R;

        const error = res.error?.message ?? 'Failed';
        return { tx, instance, key, error } as R;
      },
    },

    /**
     * PUT
     */
    put: {
      req$: rx.payload<t.JsonStatePutReqEvent>($, 'sys.json/state.put:req'),
      res$: rx.payload<t.JsonStatePutResEvent>($, 'sys.json/state.put:res'),
      async fire<T extends J = J>(value: T, options: t.JsonEventsPutOptions = {}) {
        const { timeout = DEFAULT.TIMEOUT, key = DEFAULT.KEY } = options;
        const tx = slug();

        const op = 'state.put';
        const res$ = state.put.res$.pipe(filter((e) => e.tx === tx && e.key === key));
        const first = rx.asPromise.first<t.JsonStatePutResEvent>(res$, { op, timeout });

        bus.fire({
          type: 'sys.json/state.put:req',
          payload: { tx, instance, key, value },
        });

        const res = await first;
        if (res.payload) return res.payload;

        const error = res.error?.message ?? 'Failed';
        return { tx, instance, key, error };
      },
    },

    /**
     * PATCH
     */
    patch: {
      req$: rx.payload<t.JsonStatePatchReqEvent>($, 'sys.json/state.patch:req'),
      res$: rx.payload<t.JsonStatePatchResEvent>($, 'sys.json/state.patch:res'),
      async fire<T extends J = J>(
        handler: t.JsonStateMutator<T>,
        options: t.JsonEventsPatchOptions<T> = {},
      ): Promise<t.JsonStatePatchRes> {
        const { timeout = DEFAULT.TIMEOUT, key = DEFAULT.KEY, initial } = options;
        const tx = slug();

        const response = (error?: string): t.JsonStatePatchRes => {
          return { tx, instance, key, error };
        };

        const current = await state.get.fire({ timeout, key });
        if (current.error) return response(current.error);

        if (!current.value && initial) {
          const res = await state.put.fire<T>(initial, { key, timeout });
          if (res.error) return response(res.error);
        }

        const value = current.value ?? initial;
        if (!value) {
          const error = `Failed to patch, could not retrieve current state (key="${key}"). Ensure the [sys.json] controller has been started (instance="${instance}").`;
          return response(error);
        }

        const op = 'state.patch';
        const res$ = state.patch.res$.pipe(filter((e) => e.tx === tx && e.key === key));
        const first = rx.asPromise.first<t.JsonStatePatchResEvent>(res$, { op, timeout });

        const change = await Patch.changeAsync<T>(value as any, handler);
        bus.fire({
          type: 'sys.json/state.patch:req',
          payload: { tx, instance, key, op: change.op, patches: change.patches },
        });

        const res = await first;
        if (res.payload) return res.payload;

        const error = res.error?.message ?? 'Failed';
        return { tx, instance, key, error };
      },
    },
  };

  /**
   * API for a specific key/path.
   */
  function key<T extends J = J>(
    keyInput?: string,
    options: t.JsonEventsKeyOptions<T> = {},
  ): t.JsonEventsKey<T> {
    const key = keyInput ?? DEFAULT.KEY;
    const { timeout = DEFAULT.TIMEOUT } = options;

    return { key, timeout };
  }

  /**
   * API
   */
  return {
    instance: { bus: rx.bus.instance(bus), id: instance },
    $,
    dispose,
    dispose$,
    is,
    info,
    state,
  };
}

/**
 * Event matching.
 */
const matcher = (startsWith: string) => (input: any) => rx.isEvent(input, { startsWith });
JsonEvents.is = {
  base: matcher('sys.json/'),
  instance: (e: t.Event, instance: Id) => JsonEvents.is.base(e) && e.payload?.instance === instance,
};
