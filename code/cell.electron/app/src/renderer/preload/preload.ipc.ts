import { ipcRenderer } from 'electron';
import { Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { constants, t, rx } from '../common';

const { IPC } = constants;

/**
 * Hook into IPC events.
 */
export function init(args: { def: string; cache: t.IEnv['cache']; event$: Subject<t.AppEvent> }) {
  const { def, event$ } = args;
  const fire = (e: t.AppEvent) => event$.next(e);
  const isIpcEvent = (e: t.Event) => e.type.startsWith(IPC.EVENT_PREFIX);

  // Listen for global variables being broadcast through the electron IPC channels.
  const ipc$ = new Subject<t.IpcEvent>();
  ipcRenderer.on(IPC.CHANNEL, (ipc, event: t.IpcEvent) => ipc$.next(event));

  // Listen for IPC events fired by this window and broadcast
  // out to other processes (ie. "MAIN" | <renderer>'s).
  event$
    .pipe(
      filter(isIpcEvent),
      map((e) => e as t.IpcEvent),
      filter((e) => e.payload.source === args.def),
    )
    .subscribe((e) => {
      ipcRenderer.send(IPC.CHANNEL, e);
    });

  // Finish up.
  ferryIpcEventsToBus({ def, ipc$, fire });
}

/**
 * [Helpers]
 */

function ferryIpcEventsToBus(args: {
  def: string;
  ipc$: Observable<t.IpcEvent>;
  fire: (e: t.AppEvent) => void;
}) {
  const { ipc$, fire } = args;

  ipc$.subscribe((e) => {
    console.log('🌼 preload | ipc event:', e); // TEMP 🐷
  });

  ipc$
    .pipe(
      filter((e) => e.type === 'IPC/sheet/changed'),
      map((e) => e.payload as t.IpcSheetChanged),
      filter((e) => e.source !== args.def),
    )
    .subscribe((e) => fire({ type: 'SHEET/sync', payload: { ns: e.ns, changes: e.changes } }));

  // ipc$
  //   .pipe(
  //     filter((e) => e.type === 'IPC/debug'),
  //     map((e) => e.payload as t.IpcDebug),
  //     filter((e) => e.source !== args.def),
  //   )
  //   .subscribe((e) => fire({ type: 'SHEET/sync', payload: { ns: e.ns, changes: e.changes } }));
}
