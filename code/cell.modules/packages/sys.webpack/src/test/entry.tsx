import '@platform/polyfill';

import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { Subject } from 'rxjs';

console.log('entry', 'hello world.');

(async () => {
  class Foo {
    public static count = 123;
  }
  new Foo();

  // @ts-ignore
  const f = import('foo/Header');

  f.then((e) => {
    console.log('e', e.foo());
  });
})();

/**
 * Insert some UI
 */
const App = () => {
  return <h1 style={{ fontFamily: 'sans-serif' }}>Hello World!</h1>;
};

const within = document.body.appendChild(document.createElement('div'));
ReactDOM.render(<App />, within);

const s = new Subject();
s.subscribe((e) => console.log('e > ', e));
Array.from({ length: 10 }).forEach((v, i) => s.next(i));
