import React from 'react';
import { DevActions, lorem } from 'sys.ui.dev';

import { MinSize, MinSizeProps } from '..';
import { MinSizeProperties } from '../MinSize.Properties';
import { MinSizeHideStrategies, color, t, css } from '../common';

import { SampleChild } from './DEV.Sample.Child';

type Ctx = {
  size?: t.DomRect;
  props: MinSizeProps;
};

/**
 * Actions
 */
export const actions = DevActions<Ctx>()
  .namespace('sys.ui.MinSize')
  .context((e) => {
    if (e.prev) return e.prev;
    return {
      props: {
        minWidth: 600,
        minHeight: 450,
        hideStrategy: 'css:opacity',
        onResize: ({ size }) => {
          e.change.ctx((ctx) => (ctx.size = size));
        },
      },
    };
  })

  .items((e) => {
    e.title('Minimum Size');

    e.hr();

    e.component((e) => {
      return (
        <MinSizeProperties
          size={e.ctx.size}
          props={e.ctx.props}
          style={{ MarginX: 20, MarginY: 10 }}
        />
      );
    });

    e.hr();
  })

  .items((e) => {
    e.title('Modify');

    e.select((config) => {
      const items = MinSizeHideStrategies;
      config
        .title('hideStrategy')
        .items(items)
        .initial(items[0])
        .view('buttons')
        .pipe((e) => {
          const current = e.select.current[0];
          const label = current ? current.label : `<unknown>`;
          e.select.label = label;
          if (e.changing) e.ctx.props.hideStrategy = current.value;
        });
    });

    e.hr();
  })

  .subject((e) => {
    e.settings({
      host: { background: -0.04 },
      layout: {
        label: '<MinSize>',
        position: [150, 80],
        border: -0.1,
        cropmarks: -0.2,
        background: 1,
      },
    });

    const styles = {
      base: css({ padding: 20, overflow: 'hidden' }),
      warning: {
        base: css({
          flex: 1,
          Flex: 'center-center',
        }),
        inner: css({
          padding: 40,
          border: `dashed 2px ${color.format(-0.2)}`,
          borderRadius: 20,
        }),
      },
    };

    const elWarning = (
      <div {...styles.warning.base}>
        <div {...styles.warning.inner}>Too Small</div>
      </div>
    );

    const { minWidth, minHeight } = e.ctx.props;
    const el = (
      <MinSize {...e.ctx.props} style={{ flex: 1 }} warningElement={elWarning}>
        <SampleChild minWidth={minWidth} minHeight={minHeight} />
      </MinSize>
    );

    e.render(el);
  });

export default actions;
