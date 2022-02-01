import React from 'react';
import { DevActions } from 'sys.ui.dev';

import { BulletList, BulletListProps } from '..';
import { RenderCtx, sampleBodyRendererFactory, sampleBulletRendererFactory } from './DEV.renderers';

type D = { msg: string };

type Ctx = {
  props: BulletListProps;
  renderCtx: RenderCtx;
};

const CtxUtil = {
  addItem(ctx: Ctx) {
    const items = ctx.props.items || (ctx.props.items = []);
    const data: D = { msg: `item-${items.length}` };
    items.push(data);
  },
};

/**
 * Actions
 */
export const actions = DevActions<Ctx>()
  .namespace('ui.BulletList')
  .context((e) => {
    if (e.prev) return e.prev;

    const getRenderCtx = () => e.current?.renderCtx as RenderCtx;

    const ctx: Ctx = {
      props: {
        bulletEdge: 'near',
        orientation: 'vertical',
        bulletRenderer: sampleBulletRendererFactory(getRenderCtx),
        bodyRenderer: sampleBodyRendererFactory(getRenderCtx),
      },
      renderCtx: {
        bulletKind: 'Lines',
        bodyKind: 'Card',
        connectorRadius: 15,
      },
    };

    return ctx;
  })

  .init(async (e) => {
    const { ctx } = e;
    Array.from({ length: 3 }).forEach(() => CtxUtil.addItem(ctx));
  })

  .items((e) => {
    e.title('Props');

    e.select((config) => {
      config
        .title('orientation')
        .items(['vertical', 'horizontal'])
        .initial(config.ctx.props.orientation)
        .view('buttons')
        .pipe((e) => {
          if (e.changing) e.ctx.props.orientation = e.changing?.next[0].value;
        });
    });

    e.select((config) => {
      config
        .view('buttons')
        .title('bulletEdge')
        .initial(config.ctx.props.bulletEdge)
        .items(['near', 'far'])
        .pipe((e) => {
          if (e.changing) e.ctx.props.bulletEdge = e.changing?.next[0].value;
        });
    });

    e.title('Debug');

    e.select((config) => {
      config
        .view('buttons')
        .title('bullet <Kind>')
        .items(['Lines', 'Dot'])
        .initial(config.ctx.renderCtx.bulletKind)
        .pipe((e) => {
          if (e.changing) e.ctx.renderCtx.bulletKind = e.changing?.next[0].value;
        });
    });

    e.select((config) => {
      config
        .view('buttons')
        .title('body <Kind>')
        .items(['Card', 'Vanilla'])
        .initial(config.ctx.renderCtx.bodyKind)
        .pipe((e) => {
          if (e.changing) e.ctx.renderCtx.bodyKind = e.changing?.next[0].value;
        });
    });

    e.select((config) => {
      config
        .view('buttons')
        .title('radius')
        .items([0, 10, 15, 20])
        .initial(config.ctx.renderCtx.connectorRadius)
        .pipe((e) => {
          if (e.changing) e.ctx.renderCtx.connectorRadius = e.changing?.next[0].value;
        });
    });

    e.hr();
  })

  .items((e) => {
    e.title('Items');

    e.button('add', (e) => CtxUtil.addItem(e.ctx));
    e.button('clear', (e) => (e.ctx.props.items = []));

    e.hr();
  })

  .subject((e) => {
    const { items = [] } = e.ctx.props;
    const total = items.length;

    e.settings({
      host: { background: -0.04 },
      layout: total > 0 && {
        label: {
          topLeft: '<BulletList>',
          bottomRight: `Body/Sample:"${e.ctx.renderCtx.bodyKind}"`,
        },
        cropmarks: -0.2,
      },
    });

    e.render(items.length > 0 && <BulletList {...e.ctx.props} style={{}} />);
  });

export default actions;
