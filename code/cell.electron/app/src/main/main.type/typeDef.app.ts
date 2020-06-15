import { t, util, fs } from '../common';

/**
 * Define an application module.
 */
export async function add(args: {
  ctx: t.IContext;
  row: number;
  name: string;
  sourceDir: string;
  entryPath: string;
  devPort: number;
  force?: boolean;
  props: {
    width: number;
    height: number;
    minWidth?: number;
    minHeight?: number;
  };
}) {
  const { ctx } = args;
  const { client, apps } = ctx;

  const exists = Boolean(apps.find((row) => row.name === args.name));
  const create = !exists || args.force;

  // Create the app model in the sheet.
  if (create) {
    const entry = args.entryPath;
    const targetDir = fs.dirname(entry);

    const app = apps.row(args.row);
    const props = app.props;
    props.name = args.name;
    props.entry = args.entryPath;
    props.devPort = args.devPort;
    props.width = args.props.width;
    props.height = args.props.height;
    props.minWidth = args.props.minWidth;
    props.minHeight = args.props.minHeight;
    props.bytes = (await fs.size.dir(args.sourceDir)).bytes;

    // Upload the bundle as files to the cell (filesystem).
    await util.upload({
      host: client.http.origin,
      targetCell: app.types.map.fs.uri,
      sourceDir: args.sourceDir,
      targetDir,
    });
  }

  const app = apps.find((row) => row.name === args.name);
  return { app, created: create };
}
