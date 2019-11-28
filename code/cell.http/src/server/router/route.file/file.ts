import { constants, ROUTES, Schema, t, toErrorPayload } from '../common';

/**
 * File-system routes (fs:).
 */
export function init(args: { db: t.IDb; router: t.IRouter }) {
  const { db, router } = args;

  const getParams = (req: t.Request) => {
    const params = req.params as t.IReqFileParams;
    const data = {
      id: (params.id || '').toString(),
      file: (params.file || '').toString(),
      uri: '',
    };

    const error: t.IError = {
      type: constants.ERROR.MALFORMED_URI,
      message: '',
    };

    const toMessage = (msg: string) => `Malformed "file:" URI, ${msg} ("${req.url}").`;

    if (!data.id) {
      error.message = toMessage('does not contain a namespace-identifier');
      return { ...data, status: 400, error };
    }

    if (!data.file) {
      error.message = toMessage('does not contain a file-identifier');
      return { ...data, status: 400, error };
    }

    try {
      data.uri = Schema.uri.create.file(data.id, data.file);
    } catch (err) {
      error.message = toMessage(err.message);
      return { ...data, status: 400, error };
    }

    return { ...data, status: 200, error: undefined };
  };

  /**
   * GET file (model).
   */
  router.get(ROUTES.FILE.BASE, async req => {
    const query = req.query as t.IReqFileQuery;
    const { status, id, error, uri } = getParams(req);
    const getModel: t.GetModel = () => null as any;
    return !id || error ? { status, data: { error } } : getFileResponse({ uri, getModel });
  });

  /**
   * POST binary-file.
   */
  router.post(ROUTES.FILE.BASE, async req => {
    const query = req.query as t.IReqPostFileQuery;
    const { status, id, error, uri } = getParams(req);
    // const getModel: t.GetModel = () => null as any;

    if (!id || error) {
      return { status, data: { error } };
    }

    // return !id ? { status, data: { error } } : getFileResponse({ uri, getModel });

    return { data: { foo: 123 } };
  });
}

/**
 * [Helpers]
 */

export async function getFileResponse(args: { uri: string; getModel: t.GetModel }) {
  try {
    return { data: { foo: 123 } };
    // TEMP 🐷

    const { uri } = args;
    const model = await args.getModel();
    const exists = Boolean(model.exists);
    const { createdAt, modifiedAt } = model;

    // const data = cell.value.squash.object(model.toObject()) || {};
    const data = {};

    const res = {
      uri,
      exists,
      createdAt,
      modifiedAt,
      data,
    };

    return { status: 200, data: res as t.IResGetFile };
  } catch (err) {
    return toErrorPayload(err);
  }
}
