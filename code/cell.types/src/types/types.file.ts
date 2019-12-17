import { t } from '../common';

export type IFileProps = {
  filename?: string;
  filehash?: string;
  mimetype?: string;
  encoding?: string;
  location?: string;
};
export type IFileData = {
  props: IFileProps;
  hash?: string;
  error?: t.IError;
};
