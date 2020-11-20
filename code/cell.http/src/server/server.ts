import { constants, log, micro, t, value, Router, fs as filesystem } from '../common';
import { prepareResponse } from './global';

export { Config } from './config';
export { logger } from './logger';

const { PKG } = constants;

/**
 * Initializes a new server instance.
 */
export function create(args: {
  db: t.IDb;
  fs: t.IFileSystem;
  name?: string;
  deployedAt?: number | string;
  logger?: t.ILog;
  prod?: boolean;
}) {
  const { db, name, fs } = args;
  const logger = args.logger || log;
  const base = filesystem.resolve('.');
  const dir = fs.dir.startsWith(base) ? fs.dir.substring(base.length) : fs.dir;
  const deployedAt =
    typeof args.deployedAt === 'string' ? value.toNumber(args.deployedAt) : args.deployedAt;

  // Log any uncaught exceptions.
  process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION');
    logger.error(err.message);
    logger.info();
  });

  // Routes.
  const body = micro.body;
  const router = Router.create({ name, db, fs, body, deployedAt });

  // Setup the micro-service.
  const deps = PKG.dependencies || {};
  const app = micro.create({
    cors: true,
    logger,
    router,
    log: {
      module: `${log.white(PKG.name)}@${PKG.version}`,
      schema: log.green(deps['@platform/cell.schema']),
      router: deps['@platform/cell.http.router'],
      fs: `[${log.white(fs.type === 'LOCAL' ? 'local' : fs.type)}]${dir}`,
      s3: fs.type !== 'S3' ? undefined : fs.endpoint.origin,
    },
  });

  // Make common checks/adjustments to responses before they are sent over the wire.
  app.response$.subscribe(prepareResponse);

  // Finish up.
  return app;
}
