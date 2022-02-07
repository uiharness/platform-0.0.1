import React from 'react';
import { DevActions, ObjectView } from 'sys.ui.dev';

import { TextCopyEventHandler, TextCopy, TextCopyProps, TextCopyIcon } from '..';
import { css } from '../../common';
import { Icons } from '../../Icons';

type Ctx = {
  props: TextCopyProps;
  debug: {
    text: string;
    repeat: number;
    clipboard: { handler?: TextCopyEventHandler; use: boolean };
    icon: { edge: Required<TextCopyIcon['edge']>; use: boolean; offset: number };
  };
};

/**
 * Actions
 */
export const actions = DevActions<Ctx>()
  .namespace('ui.Text.Copy')
  .context((e) => {
    if (e.prev) return e.prev;
    const ctx: Ctx = {
      props: {
        icon: {
          element: <Icons.Copy size={14} color={-0.7} />,
        },
      },
      debug: {
        text: 'my text',
        repeat: 1,
        clipboard: { use: true },
        icon: { edge: 'E', use: true, offset: 2 },
      },
    };
    return ctx;
  })

  .init(async (e) => {
    const { ctx, bus } = e;
    ctx.debug.clipboard.handler = CopyToClipboard.factory(() => e.ctx);
    CopyToClipboard.update(ctx);
    Icon.update(ctx);
  })

  .items((e) => {
    e.title('Text');
    e.button('empty', (e) => (e.ctx.debug.text = ''));
    e.button('<Component>', (e) => (e.ctx.debug.text = '<Component>'));
    e.button('{Object}', (e) => (e.ctx.debug.text = '{Object}'));
    e.button('{One} <Two>', (e) => (e.ctx.debug.text = '{One} <Two>'));
    e.button('"my text"', (e) => (e.ctx.debug.text = 'my text'));
    e.hr();
  })

  .items((e) => {
    e.title('Icon');

    e.boolean('icon', (e) => {
      if (e.changing) e.ctx.debug.icon.use = e.changing.next;
      e.boolean.current = e.ctx.debug.icon.use;
      Icon.update(e.ctx);
    });

    e.select((config) => {
      config
        .view('buttons')
        .title('{icon.offset}')
        .items(['0', '2', '6'])
        .initial(config.ctx.debug.icon.offset.toString())
        .pipe((e) => {
          if (e.changing) e.ctx.debug.icon.offset = parseInt(e.changing?.next[0].value, 10);
          Icon.update(e.ctx);
        });
    });

    e.select((config) => {
      config
        .view('buttons')
        .title('{icon.edge}')
        .items(['N', 'S', 'W', 'E'])
        .initial(config.ctx.debug.icon.edge)
        .pipe((e) => {
          if (e.changing) e.ctx.debug.icon.edge = e.changing?.next[0].value;
          Icon.update(e.ctx);
        });
    });

    e.hr();
  })

  .items((e) => {
    e.title('Debug');

    e.boolean('copyToClipboard', (e) => {
      if (e.changing) e.ctx.debug.clipboard.use = e.changing.next;
      e.boolean.current = e.ctx.debug.clipboard.use;
      CopyToClipboard.update(e.ctx);
    });

    e.select((config) => {
      config
        .view('buttons')
        .title('repeat')
        .items([1, 2, 3])
        .initial(config.ctx.debug.repeat)
        .pipe((e) => {
          if (e.changing) e.ctx.debug.repeat = e.changing?.next[0].value;
        });
    });

    e.hr();

    e.component((e) => {
      const data = e.ctx.props;
      return <ObjectView name={'props'} data={data} style={{ MarginX: 15 }} fontSize={11} />;
    });
  })

  .subject((e) => {
    const props = e.ctx.props;
    const { inlineBlock } = props;
    const { repeat } = e.ctx.debug;

    e.settings({
      host: { background: -0.04 },
      layout: { cropmarks: -0.2 },
    });

    const styles = {
      base: css({}),
      multi: css({
        marginRight: inlineBlock ? 8 : 0,
        ':last-child': { marginRight: 0 },
      }),
    };

    const text = e.ctx.debug.text;

    if (repeat === 1)
      e.render(
        <TextCopy {...props} style={styles.base}>
          {text}
        </TextCopy>,
      );
    if (repeat > 1) {
      const length = repeat;
      const elements = Array.from({ length }).map((v, i) => {
        const style = css(styles.base, styles.multi);
        return (
          <TextCopy key={i} {...props} style={style}>
            {text}
          </TextCopy>
        );
      });

      e.render(<div>{elements}</div>);
    }
  });

export default actions;

/**
 * [Helpers]
 */

const CopyToClipboard = {
  factory(getCtx: () => Ctx): TextCopyEventHandler {
    return (e) => {
      const ctx = getCtx();
      e.copy(ctx.debug.text);
    };
  },
  update(ctx: Ctx) {
    ctx.props.onCopy = ctx.debug.clipboard.use ? ctx.debug.clipboard.handler : undefined;
  },
};

const Icon = {
  update(ctx: Ctx) {
    const icon = ctx.debug.icon;
    const { edge, offset } = icon;
    ctx.props.icon = !icon.use
      ? undefined
      : {
          edge,
          offset,
          element() {
            // NB: or simple element reference, rather than function.
            return <Icons.Copy size={14} color={-0.7} />;
          },
        };
  },
};
