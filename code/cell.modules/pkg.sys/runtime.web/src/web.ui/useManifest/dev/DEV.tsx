import React from 'react';
import { DevActions } from 'sys.ui.dev';
import { DevSample, DevSampleProps } from './DEV.Sample';
import { t, rx } from '../../common';
import { ManifestSelectorStateful } from '../../ManifestSelector';

type Ctx = {
  bus: t.EventBus;
  props: DevSampleProps;
  debug: { useUrl: boolean };
};

/**
 * Actions
 */
export const actions = DevActions<Ctx>()
  .namespace('hook.useManifest')
  .context((e) => {
    if (e.prev) return e.prev;

    const bus = rx.bus();

    const ctx: Ctx = {
      bus,
      props: {},
      debug: { useUrl: true },
    };
    return ctx;
  })

  .items((e) => {
    e.title('Dev');

    e.component((e) => {
      const bus = e.ctx.bus;
      return (
        <ManifestSelectorStateful
          bus={bus}
          showExports={false}
          style={{ MarginX: 15, marginTop: 10, marginBottom: 20 }}
          onChanged={(event) => {
            e.change.ctx((ctx) => (ctx.props.url = event.url));
          }}
        />
      );
    });

    e.boolean('use specified url', (e) => {
      //
      if (e.changing) e.ctx.debug.useUrl = e.changing.next;

      e.boolean.current = e.ctx.debug.useUrl;
    });

    e.hr();
  })

  .subject((e) => {
    const url = e.ctx.debug.useUrl ? e.ctx.props.url : undefined;

    e.settings({
      host: { background: -0.04 },
      layout: {
        label: {
          topLeft: 'useManifest (hook)',
          bottomRight: url ? url : 'note: "mock" manifest',
        },
        position: [150, 80],
        border: -0.1,
        cropmarks: -0.2,
        background: 1,
      },
    });
    e.render(<DevSample {...e.ctx.props} url={url} />);
  });

export default actions;
