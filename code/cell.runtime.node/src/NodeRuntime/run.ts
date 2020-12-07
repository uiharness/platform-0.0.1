import { BundleWrapper } from '../BundleWrapper';
import { fs, log, logger, PATH, t, deleteUndefined } from '../common';
import { pullMethod } from './pull';
import { invoke } from './run.invoke';

/**
 * Factory for the [run] method.
 */
export function runMethod(args: { cachedir: string }) {
  const { cachedir } = args;
  const pull = pullMethod({ cachedir });

  /**
   * Pull and run the given bundle.
   */
  const fn: t.RuntimeEnvNode['run'] = async (bundleInput, options = {}) => {
    const { silent, timeout, hash } = options;
    const bundle = BundleWrapper.create(bundleInput, cachedir);
    const exists = await bundle.isCached();
    const isPullRequired = !exists || options.pull;
    let elapsed = { prep: -1, run: -1 };

    const errors: t.IRuntimeError[] = [];
    const addError = (message: string, stack?: string) =>
      errors.push(
        deleteUndefined({
          type: 'RUNTIME/run',
          bundle: bundle.toObject(),
          message,
          stack,
        }),
      );

    const done = (result?: t.JsonMap) => {
      const ok = errors.length === 0;
      return { ok, entry, result, errors, manifest, elapsed };
    };

    // Ensure the bundle has been pulled locally.
    if (isPullRequired) {
      const res = await pull(bundleInput, { silent });
      errors.push(...res.errors);
      if (!res.ok || errors.length > 0) {
        return done();
      }
    }

    const loadManifest = async () => {
      const path = fs.join(bundle.cache.dir, PATH.MANIFEST);
      const exists = await fs.pathExists(path);
      if (!exists) {
        const err = `A bundle manifest file does not exist ${bundle.toString()}.`;
        addError(err);
        return undefined;
      } else {
        try {
          const manifest = (await fs.readJson(path)) as t.BundleManifest;
          return manifest;
        } catch (error) {
          const msg = error.message;
          const err = `Failed while reading bundle manifest for ${bundle.toString()}. ${msg}`;
          addError(err);
          return undefined;
        }
      }
    };

    const manifest = await loadManifest();
    if (!manifest) {
      return done();
    }

    const entry = (options.entry || manifest.entry || '').trim().replace(/^\/*/, '');

    if (!silent) {
      const size = fs.size.toString(manifest.bytes, { round: 0 });
      const table = log.table({ border: false });
      const add = (key: string, value: string) => {
        table.add([log.green(key), log.gray(value)]);
      };

      add('runtime  ', 'node');
      add('target', `${manifest.target} (${manifest.mode})`);
      add('manifest ', logger.format.url(bundle.urls.manifest));
      add('files ', logger.format.url(bundle.urls.files));
      add('entry', entry);
      add('size', `${log.yellow(size)} (${manifest.files.length} files)`);

      log.info();
      table.log();
      logger.hr().newline();
    }

    // Execute the code.
    const dir = bundle.cache.dir;
    const res = await invoke({ manifest, dir, silent, in: options.in, timeout, entry, hash });
    elapsed = res.elapsed;
    res.errors.forEach((err) => addError(err.message, err.stack));

    // Finish up.
    return done(res.result);
  };
  return fn;
}
