import { SystemEvents } from '@platform/electron/lib/types';

/**
 * Store
 */
export type IMyStore = {
  count: number;
  foo: {
    bar: boolean;
  };
};

/**
 * EVENTS
 */
export type MyEvents =
  | SystemEvents
  | INewWindowEvent
  | IMessageEvent
  | IShowDevToolsEvent
  | IFooEvent
  | IBarEvent;

export type INewWindowEvent = {
  type: 'TEST/window/new';
  payload: {
    name?: string;
  };
};

export type IMessageEvent = {
  type: 'TEST/message';
  payload: { text: string };
};

export type IShowDevToolsEvent = {
  type: 'TEST/devTools/show';
  payload: { windowId: number };
};

export type IFooEvent = {
  type: 'FOO';
  payload: { count: number };
};

export type IBarEvent = {
  type: 'BAR';
  payload: {};
};
