/* eslint-disable @typescript-eslint/no-unused-vars */

import { routes, t, util } from '../common';
import { exec } from './handler.exec';

/**
 * Routes for executing a function within the environment runtime.
 */
export function init(args: { db: t.IDb; router: t.IRouter; runtime?: t.RuntimeEnv }) {
  const { db, router, runtime } = args;

  /**
   * POST execute function
   */
  router.post(routes.RUNTIME.FUNC, async (req) => {
    try {
      if (!runtime) {
        throw new Error(`Runtime environment for executing functions not available.`);
      }

      const host = req.host;
      const query = req.query as t.IReqQueryFunc;
      const body = ((await req.body.json()) || {}) as t.IReqPostFuncBody;

      return exec({ host, db, runtime, body });
    } catch (err) {
      return util.toErrorPayload(err);
    }
  });
}
