import * as React from 'react';
import * as t from '../common/types';

/**
 * The React [Context] used to pass down common modules to components.
 *
 * To use add a static `contextType` to the consuming component,
 * eg:
 *
 *      import { shell } from '@platform/ui.shell'
 *
 *      export class MyView extends React.PureComponent {
 *        public static contextType = shell.Context;
 *        public context!: shell.ReactContext
 *      }
 *
 * See:
 *    https://reactjs.org/docs/context.html
 */
export const Context = React.createContext<t.IShellContext>({} as any);
Context.displayName = '@platform/shell/Context';

/**
 * Used to strongly type the [context] on a React component.
 * eg:
 *
 *      import { shell } from '@platform/ui.shell'
 *
 *      export class MyView extends React.PureComponent {
 *        public static contextType = shell.Context;
 *        public context!: shell.ReactContext
 *      }
 *
 */
export type ReactContext = React.ContextType<typeof Context>;

/**
 * Factory for creating a <Provider> component to pass a
 * store (and optionally additional props) through the react
 * hierarchy to child components.
 */
export function createProvider<P = {}>(args: {
  loader: t.ILoader;
  splash: t.ISplash;
  theme: t.ShellTheme;
  ctx?: P;
}): React.FunctionComponent {
  const { loader, splash, theme } = args;
  const context: t.IShellContext = {
    loader,
    splash,
    theme,
    ...(args.ctx || {}), // Optional props to extend the context with.
  };
  return (props: { children?: React.ReactNode } = {}) => (
    <Context.Provider value={context}>{props.children}</Context.Provider>
  );
}
