import { fs, t } from './common';

type Id = string;

export function VercelDeploymentFiles(args: {
  ctx: t.Ctx;
  teamId: Id;
  deploymentId: Id;
  url: string;
  list: t.VercelDeploymentFile[];
}): t.VercelHttpDeploymentFiles {
  const { ctx, list, teamId, deploymentId } = args;
  const { http, headers, version, token } = ctx;

  if (!args.url) {
    throw new Error(`An public endpoint URL is required.`);
  }

  const baseUrl = `https://${args.url.replace(/^http\:\/\//, '').replace(/\/*$/, '')}`;

  const api: t.VercelHttpDeploymentFiles = {
    list,

    /**
     * Save the deployment files locally.
     */
    async pull(targetDir) {
      await fs.ensureDir(targetDir);

      /**
       * TODO 🐷
       * - recursively save [children] folders.
       */
      type F = t.VercelDeploymentFile;
      type Error = t.VercelHttpFilesPullError;

      const results: { ok: boolean; file: F; error?: Error }[] = [];
      const result = (
        ok: boolean,
        dir: string,
        file: F,
        options: { error?: string; url?: string } = {},
      ) => {
        const { url = '' } = options;
        const error: Error | undefined = options.error
          ? { message: options.error, dir, file: { id: file.uid, name: file.name }, url }
          : undefined;
        results.push({ ok, file, error });
      };

      const saveFile = async (dir: string, file: F) => {
        let path = fs.join(dir, file.name);

        if (!path.startsWith('src/')) return;
        path = path.replace(/^src\//, '');
        console.log('path', path);

        const url = `${baseUrl}/${path}`;
        const res = await http.get(url);

        console.log(res.status, path);

        if (res.ok) {
          const out = fs.join(targetDir, path);
          await fs.ensureDir(fs.dirname(out));
          await fs.stream.save(out, res.body);
        }

        if (!res.ok) {
          console.log('FAIL', path);
        }

        return result(true, dir, file);
      };

      const saveDirectory = async (dir: string, file: F) => {
        await Promise.all(file.children.map((file) => save(dir, file)));
      };

      const save = async (dir: string, file: F) => {
        if (file.type === 'file') return saveFile(dir, file);
        if (file.type === 'directory') return saveDirectory(fs.join(dir, file.name), file);
        result(false, dir, file, { error: `File type '${file.type}' not supported.` });
      };

      // Process files.
      await Promise.all(list.map((file) => save('', file)));
      const errors = results.map((item) => item.error as Error).filter(Boolean);
      const ok = results.every((item) => item.ok);

      // console.log(
      //   'ok',
      //   results.map((e) => e.ok),
      // );

      console.log('-------------------------------------------');
      console.log('baseUrl', baseUrl);

      // Finish up.
      return { ok, errors };
    },
  };

  return api;
}
