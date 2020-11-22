import { FileCache, fs, PATH, Path, t, Urls, log, logger, HttpClient } from './common';

type B = t.RuntimeBundleOrigin;

export const NodeRuntime = {
  /**
   * Initialize an instance of the Node runtime.
   */
  init(args: { cachedir?: string } = {}) {
    const cachedir = args.cachedir || PATH.CACHE_DIR;

    const runtime: t.RuntimeEnvNode = {
      name: 'node',

      /**
       * Determine if the given bundle has been pulled.
       */
      async exists(input) {
        const bundle = Bundle(input, cachedir);
        return bundle.cache.exists(PATH.MANIFEST_FILENAME);
      },

      /**
       * Pull the given bundle.
       */
      async pull(input, options = {}) {
        const { silent } = options;
        const bundle = Bundle(input, cachedir);

        if (!silent) {
          const url = bundle.urls.manifest;
          const from = logger.format.url(url.toString());
          const to = Path.trimBase(bundle.cache.dir);
          const table = log.table({ border: false });

          const add = (key: string, value: string) => {
            table.add([log.gray(` • ${log.white(key)}`), log.gray(value)]);
          };
          add('from ', from);
          add('to', to);

          log.info();
          log.info.gray(`pulling bundle`);
          table.log();
          log.info();
        }

        const client = HttpClient.create(bundle.host).cell(bundle.uri);
        const errors: Error[] = [];
        let count = 0;

        const pullList = async () => {
          try {
            const filter = bundle.dir.append('**');
            const list = await client.files.list({ filter });
            return list.body;
          } catch (error) {
            errors.push(error);
            return [];
          }
        };

        const list = await pullList();

        await Promise.all(
          list.map(async (file) => {
            const res = await client.file.name(file.path).download();
            if (typeof res.body === 'object') {
              count++;
              const filename = bundle.dir.path
                ? file.path.substring(bundle.dir.path.length + 1)
                : file.path;
              const path = fs.join(bundle.cache.dir, filename);
              await fs.stream.save(path, res.body as any);
            }
          }),
        );

        if (!silent) {
          const bytes = (await fs.size.dir(bundle.cache.dir)).toString({ round: 0 });
          const size = count > 0 ? `(${log.yellow(bytes)})` : '';
          log.info.gray(`${log.green(count)} files pulled ${size}`);
          logger.errors(errors);
          logger.hr().newline();
        }

        const ok = errors.length === 0;
        return { ok, errors };
      },

      /**
       * Delete the given bundle (if it exists).
       */
      async remove(input) {
        const bundle = Bundle(input, cachedir);
        const dir = bundle.cache.dir;
        let count = 0;
        if (await fs.pathExists(dir)) {
          count++;
          await fs.remove(dir);
        }
      },

      /**
       * Remove all bundles
       */
      async clear() {
        await fs.remove(cachedir);
      },

      /**
       * Pull and run the given bundle.
       */
      async run(input, options = {}) {
        const { silent } = options;
        const bundle = Bundle(input, cachedir);
        // TODO 🐷
        // return false;
      },
    };

    return runtime;
  },
};

/**
 * [Helpers]
 */

function Bundle(bundle: B, cachedir: string) {
  const { host, uri } = bundle;
  const dir = Path.dir(bundle.dir);

  const hostdir = bundle.host
    .replace(/^http:\/\//, '')
    .replace(/^https:\/\//, '')
    .replace(/\:/g, '-');
  const cache = FileCache.create({
    fs,
    dir: fs.join(cachedir, hostdir, bundle.uri.replace(/\:/g, '-'), dir.path),
  });

  const res = {
    toObject: () => bundle,
    host,
    uri,
    dir,
    cache,
    get urls() {
      const urls = Urls.create(bundle.host).cell(bundle.uri);
      return {
        files: urls.files.list.query({ filter: `${dir.path}/**` }),
        manifest: urls.file.byName(Path.dir(dir.path).append(PATH.MANIFEST_FILENAME)),
      };
    },
  };

  return res;
}
