import * as React from 'react';

import { is, shell } from './common';
import * as splash from './splash';

shell
  // Register application modules.
  .register('A', () => import('./modules/A'))
  .register('B', () => import('./modules/B'))
  .register('sheet', () => import('./modules/Sheet'))
  .register('controller', () => import('./modules/controller'))
  .default('controller');

export class App extends React.PureComponent {
  /**
   * [Properties]
   */
  private get loadDelay() {
    const delay = is.dev ? 1500 : 500; // NB: Simulate latency.
    return delay;
  }

  /**
   * [Render]
   */
  public render() {
    return <shell.Loader splash={splash.factory} theme={'DARK'} loadDelay={this.loadDelay} />;
  }
}
