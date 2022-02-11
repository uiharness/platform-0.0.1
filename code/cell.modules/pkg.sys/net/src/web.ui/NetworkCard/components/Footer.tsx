import React, { useEffect, useState } from 'react';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

import { CommandTextbox } from '../../Command.Textbox';
import {
  color,
  COLORS,
  css,
  CssValue,
  EventPipe,
  Icons,
  LocalPeerCard,
  t,
  useEventBusHistory,
} from '../common';

export type NetworkCardFooterProps = {
  bus: t.EventBus<any>;
  netbus: t.NetworkBus<any>;
  self: t.PeerId;
  style?: CssValue;
};

export const NetworkCardFooter: React.FC<NetworkCardFooterProps> = (props) => {
  const { bus, self, netbus } = props;

  const history = useEventBusHistory(netbus);
  const [recentlyFired, setRecentlyFired] = useState(false);

  /**
   * Initiate a new connection.
   */
  const startConnection = (command: string) => {
    const isReliable = true;
    const autoStartVideo = true;
    const remote = command;
    return LocalPeerCard.connect({ bus, remote, self, isReliable, autoStartVideo });
  };

  /**
   * Lifecycle
   */
  useEffect(() => {
    const dispose$ = new Subject<void>();
    const netbus$ = netbus.$.pipe(takeUntil(dispose$));

    netbus$.subscribe(() => setRecentlyFired(true));
    netbus$.pipe(debounceTime(1500)).subscribe(() => setRecentlyFired(false));

    return () => dispose$.next();
  }, []); // eslint-disable-line

  /**
   * [Render]
   */
  const styles = {
    base: css({
      boxSizing: 'border-box',
      position: 'relative',
      backgroundColor: color.alpha(COLORS.DARK, 0.85),
      borderTop: `solid 1px ${color.format(-0.16)}`,
      borderRadius: `0 0 3px 3px`,
      boxShadow: `inset 0 2px 6px ${color.format(-0.6)}`,
      Flex: 'x-stretch-stretch',
    }),
    left: css({
      flex: 2,
      paddingLeft: 10,
      paddingRight: 6,
      paddingTop: 10,
      paddingBottom: 4,
      borderRight: `solid 1px ${color.format(-0.15)}`,
    }),
    right: {
      base: css({
        flex: 1,
        paddingLeft: 15,
        paddingRight: 5,
        borderLeft: `solid 1px ${color.format(0.2)}`,
        Flex: 'x-center-center',
      }),
      pipe: css({ flex: 1 }),
      icon: css({
        marginLeft: 5,
        paddingTop: 3,
        opacity: recentlyFired ? 0.9 : 0.3,
        transition: `opacity 300ms`,
      }),
    },
  };

  const elPipe = (
    <EventPipe
      events={history.events}
      style={styles.right.pipe}
      theme={'Dark'}
      onEventClick={(item) => {
        console.log('event', item.event);
      }}
    />
  );

  return (
    <div {...css(styles.base, props.style)}>
      <div {...styles.left}>
        <CommandTextbox onAction={(e) => startConnection(e.text)} theme={'Dark'} />
      </div>
      <div {...styles.right.base}>
        <div {...styles.right.pipe}>{elPipe}</div>
        <div {...styles.right.icon}>
          <Icons.Event color={1} size={16} />
        </div>
      </div>
    </div>
  );
};
