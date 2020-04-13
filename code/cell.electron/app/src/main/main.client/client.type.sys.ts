import { Subject } from 'rxjs';

import { Client, t, time, constants, Uri } from '../common';
import * as sync from './client.sync';
import { upload } from './client.upload';

const SYS = constants.SYS;
const NS = SYS.NS;

/**
 * Writes (initializes) system data.
 */
export async function getOrCreateSys(host: string) {
  const http = Client.http(host);
  const ns = http.ns(NS.APP);

  // Ensure the root application model exists in the DB.
  if (!(await ns.exists())) {
    await ns.write({ ns: { type: { implements: NS.TYPE.APP } } });
  }

  const flush$ = new Subject<{}>();

  // Load the app model.
  const type = Client.type({ http });
  const sheet = await type.sheet<t.CellApp>(NS.APP);
  sync.saveMonitor({ http, state: sheet.state, flush$ });

  const app = sheet.cursor().row(0);
  await app.ready();

  // Retrieve windows.
  const windows = await app.props.windows.ready();
  const windowDefs = await app.props.windowDefs.ready();
  sync.saveMonitor({ http, state: windows.sheet.state, flush$ });
  sync.saveMonitor({ http, state: windowDefs.sheet.state, flush$ });

  // Finish up.
  const ctx: t.IAppCtx = {
    host,
    sheet,
    app,
    windows,
    windowDefs,
    async flush() {
      flush$.next();
      await time.wait(300); // HACK: this ensure the changes are flushed to the DB. Do this in a more predictable way.
    },
  };
  return ctx;
}

/**
 * Creates the IDE window definition.
 */
export async function writeIdeDef(args: { kind: string; ctx: t.IAppCtx; uploadDir?: string }) {
  const { ctx, kind, uploadDir } = args;
  const defs = await ctx.windowDefs.cursor();
  const exists = defs.rows.some(def => def.props.kind === kind);
  if (exists) {
    // return;
  }

  const def = defs.row(0);
  def.props.kind = kind;

  if (uploadDir) {
    const host = ctx.host;
    const targetCell = Uri.create.cell(def.uri.ns, 'A1');
    await upload({ host, targetCell, sourceDir: uploadDir });
  }

  // Finish up.
  await ctx.flush();
}
