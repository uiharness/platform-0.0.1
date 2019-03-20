/**
 * Global events subscribed to only once and consumed as [Observable] event producers.
 */

import { animationFrameScheduler, fromEvent as rxFromEvent, Observable, Subject } from 'rxjs';
import { FromEventTarget } from 'rxjs/internal/observable/fromEvent';
import { map, merge, observeOn, share } from 'rxjs/operators';
import { is } from '../common';
import { IMouseEvent, KeypressEvent, KeypressObservable } from './types';

export * from './types';

const fromEvent = <T>(source: FromEventTarget<any> | undefined, event: string): Observable<T> => {
  return source ? rxFromEvent(source, event).pipe(share()) : new Subject<any>().pipe(share()); // NB: Safe when server-rendered.
};

const fromDocumentEvent = <T>(event: string): Observable<T> =>
  fromEvent(is.browser ? document : undefined, event);

const fromWindowEvent = <T>(event: string): Observable<T> =>
  fromEvent(is.browser ? window : undefined, event);

/**
 * Mouse events.
 */
export const click$ = fromDocumentEvent<IMouseEvent>('click');
export const mouseDown$ = fromDocumentEvent<IMouseEvent>('mousedown');
export const mouseUp$ = fromDocumentEvent<IMouseEvent>('mouseup');
export const mouseMove$ = fromDocumentEvent<IMouseEvent>('mousemove');

export const hashChange$ = fromWindowEvent<HashChangeEvent>('hashchange');
export const resize$ = fromWindowEvent<{}>('resize').pipe(
  observeOn(animationFrameScheduler),
  share(),
);

/**
 * Keyboard events.
 */

const toKeypress = (e: KeyboardEvent, isPressed: boolean) => {
  const { key, code, charCode, altKey, ctrlKey, shiftKey, metaKey, char } = e;
  const isModifier = key === 'Meta' || key === 'Control' || key === 'Alt' || key === 'Shift';
  const event: KeypressEvent = {
    isPressed,
    key,
    code,
    charCode,
    char,
    altKey,
    ctrlKey,
    shiftKey,
    metaKey,
    isModifier,
    preventDefault: () => e.preventDefault(),
    stopPropagation: () => e.stopPropagation(),
    stopImmediatePropagation: () => e.stopImmediatePropagation(),
  };
  return event;
};

export const keyDown$ = fromDocumentEvent<KeyboardEvent>('keydown').pipe(
  map(e => toKeypress(e, true)),
  share(),
);

export const keyUp$ = fromDocumentEvent<KeyboardEvent>('keyup').pipe(
  map(e => toKeypress(e, false)),
  share(),
);

export const keyPress$ = keyDown$.pipe(merge(keyUp$)) as KeypressObservable;
