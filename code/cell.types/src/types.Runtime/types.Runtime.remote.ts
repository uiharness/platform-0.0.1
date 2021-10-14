import { t } from '../common';

export type RuntimeRemote = {
  url: string; //         Remote manifest URL (eg ".../remoteEntry.js").
  namespace: string; //   The encoded FederatedModule "scope".
  entry: string; //       Module name (public "export" via compiler).
};

/**
 * Web
 */
export type RuntimeRemoteWeb = t.RuntimeRemote & {
  script(): RuntimeRemoteScript;
  module<M = any>(): Promise<M>;
  // useScript: RuntimeUseScript;
  useModule<M = any>(): RuntimeRemoteModule<M>;
};

export type RuntimeRemoteScript = t.Disposable & {
  $: t.Observable<t.RuntimeWebScriptEvent>;
  ready: Promise<t.RuntimeWebScript>;
};

// export type RuntimeUseScript = () => { ready: boolean; failed: boolean };

export type RuntimeRemoteModule<M = any> = {
  ready: boolean;
  failed: boolean;
  module?: M;
};
