import React from 'react';

import { constants, css, defaultValue, t } from '../../common';
import { useActionPanelController, useRedraw } from '../../hooks/Actions';
import { Item } from '../ActionPanel.Item';

export type ActionPanelProps = t.ActionPanelProps & {
  bus: t.EventBus;
  actions: t.Actions<any>;
};

export const ActionPanel: React.FC<ActionPanelProps> = (props) => {
  const { actions, bus } = props;
  const scrollable = defaultValue(props.scrollable, true);
  const model = actions.toObject();
  const { namespace, items } = model;
  const defs = actions.toDefs();

  useActionPanelController({ bus, actions });
  useRedraw({
    name: '<ActionPanel>',
    bus,
    actions,
    paths: ['ctx/current', 'items', 'initialized'],
  });

  const styles = {
    base: css({
      Scroll: scrollable,
      overflowY: scrollable ? 'scroll' : 'hidden',
      userSelect: 'none',
      boxSizing: 'border-box',
      color: constants.COLORS.DARK,
      fontFamily: constants.FONT.SANS,
      fontSize: 14,
    }),
    spacer: css({ height: 80 }),
  };

  const elItems = items.map((item, i) => {
    console.log('item', item);
    const key = `item.${namespace}.${i}`;

    const def = defs.find((def) => def.kind === item.kind);

    const Component = def?.Component;

    if (Component) return <Component key={key} namespace={namespace} model={item} bus={bus} />;

    // if (def) return def.render({ namespace, model, bus });

    return <Item key={key} namespace={namespace} model={item} bus={bus} />;
  });

  return (
    <div {...css(styles.base, props.style)} className={constants.CSS.ACTIONS}>
      {elItems}
      {items.length > 0 && <div {...styles.spacer} />}
    </div>
  );
};
