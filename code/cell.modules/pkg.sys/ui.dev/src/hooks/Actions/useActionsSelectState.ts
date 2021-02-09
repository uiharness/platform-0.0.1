import { useEffect, useState } from 'react';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

import { rx, t, Events } from '../../common';

/**
 * Monitor the state of a <Select> dropdown of a set of actions
 * and update a React state object, and store within a persistent store.
 */
export function useActionsSelectState(args: {
  bus: t.EventBus;
  actions?: t.Actions[];
  store?: t.ActionsSelectStore;
}) {
  const store = args.store;
  const list = args.actions || [];
  const bus = args.bus?.type<t.DevEvent>();
  const [selected, setSelected] = useState<t.Actions>();

  useEffect(() => {
    const dispose$ = new Subject<void>();
    const $ = bus.event$.pipe(
      takeUntil(dispose$),
      filter((e) => Events.isActionEvent(e)),
    );

    // Set initial state.
    if (!selected) {
      if (store) store().then((e) => setSelected(e || list[0]));
      if (!store) setSelected(list[0]);
    }

    // Monitor for changes to the dropdown.
    rx.payload<t.IActionsSelectChangedEvent>($, 'dev:actions/select/changed')
      .pipe()
      .subscribe((e) => {
        const current = list.find((actions) => actions.toObject().namespace === e.namespace);
        setSelected(current);
        if (store) store(current);
      });

    return () => dispose$.next();
  }, [bus, list]); // eslint-disable-line

  return { list, selected };
}
