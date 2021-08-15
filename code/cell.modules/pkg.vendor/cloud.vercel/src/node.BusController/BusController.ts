import { BusEvents, DEFAULT, rx, slug, t } from './common';

/**
 * Event controller.
 */
export function BusController(args: {
  fs: t.IPosixFs;
  bus: t.EventBus<any>;
  filter?: (e: t.VercelEvent) => boolean;
  version?: number;
}) {
  const { version = DEFAULT.version } = args;
  const bus = rx.busAsType<t.VercelEvent>(args.bus);
  const events = BusEvents({ bus, filter: args.filter });
  const { dispose, dispose$ } = events;

  /**
   * Info (Module)
   */
  events.info.req$.subscribe((e) => {
    const { tx = slug() } = e;

    const info: t.VercelInfo = {
      endpoint: { version },
    };

    bus.fire({
      type: 'vendor.vercel/info:res',
      payload: { tx, info },
    });
  });

  /**
   * API
   */
  return { dispose, dispose$ };
}
