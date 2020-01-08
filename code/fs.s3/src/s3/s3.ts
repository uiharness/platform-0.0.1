import { util, AWS, t, toContentType } from '../common';
import { get } from './s3.get';
import { put } from './s3.put';
import { list } from './s3.list';
import { deleteOne, deleteMany } from './s3.delete';
import { toPresignedUrl } from './s3.url';

export * from './s3.get';
export * from './s3.put';

export function init(args: t.S3Config): t.S3 {
  const endpoint = (args.endpoint || '').trim();
  const s3 = new AWS.S3({
    endpoint: new AWS.Endpoint(endpoint) as any,
    accessKeyId: args.accessKey,
    secretAccessKey: args.secret,
  });

  const res: t.S3 = {
    toContentType,
    endpoint,

    url(bucket: string, path?: string) {
      bucket = util.formatBucket(bucket);
      if (!bucket) {
        throw new Error(`No bucket provided.`);
      }
      path = util.formatKeyPath(path);
      return `https://${bucket}.${endpoint}/${path}`;
    },

    list(args: { bucket: string; prefix?: string; max?: number }) {
      return list({ ...args, s3 });
    },

    get(args: { bucket: string; key: string }) {
      return get({ ...args, s3 });
    },

    put(args: { bucket: string; key: string; source: string | Buffer; acl?: t.S3Permissions }) {
      return put({ ...args, s3 });
    },

    deleteOne(args: { bucket: string; key: string }) {
      return deleteOne({ ...args, s3 });
    },

    deleteMany(args: { bucket: string; keys: string[] }) {
      return deleteMany({ ...args, s3 });
    },

    bucket(name: string) {
      const bucket = name;
      return {
        bucket,
        endpoint,
        url(path?: string, options?: t.S3PresignedUrlArgs) {
          return options ? toPresignedUrl({ s3, bucket, path, options }) : res.url(bucket, path);
        },
        list(args: { prefix?: string; max?: number }) {
          return res.list({ ...args, bucket });
        },
        get(args: { key: string }) {
          return res.get({ ...args, bucket });
        },
        put(args: { key: string; source: string | Buffer; acl?: t.S3Permissions }) {
          return res.put({ ...args, bucket });
        },
        deleteOne(args: { key: string }) {
          return res.deleteOne({ ...args, bucket });
        },
        deleteMany(args: { keys: string[] }) {
          return res.deleteMany({ ...args, bucket });
        },
      };
    },
  };

  return res;
}
