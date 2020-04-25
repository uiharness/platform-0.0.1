import { t } from '../common';


/**
 * Payloads
 */
export type IPayload<D> = { status: number; data: D };

export type IErrorPayload = IHttpErrorPayload | IFsHttpErrorPayload;
export type IHttpErrorPayload = IPayload<t.IHttpError>;
export type IFsHttpErrorPayload = IPayload<t.IFsHttpError>;

export type IUriResponse<D, L extends IUrlMap = {}> = {
  uri: string;
  exists: boolean;
  createdAt: number;
  modifiedAt: number;
  data: D;
  urls: L;
};

export type IUrlMap = { [key: string]: string };

/**
 * Info (System)
 */
export type IUrlQuerySysUid = { total?: number };

export type IResGetSysInfo = {
  deployment: string;
  system: string;
  domain: string;
  region: string;
  deployedAt?: string;
  hash?: string;
};

export type IResGetSysUid = string[];
