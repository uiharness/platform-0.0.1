import { t } from './common';

/**
 * Error
 */
export type IError<T extends string = any> = {
  type: T;
  message: string;
  children?: IError[];
};

export type IErrorParent<T extends string = any> = { error?: IError<T> };

/**
 * Ref errors
 */
export type RefError = IRefError['type'];
export type IRefError = IRefErrorCircular | IRefErrorName;

type RefErrorProps = { path: string };
export type IRefErrorCircular = t.IError<'REF/circular'> & RefErrorProps;
export type IRefErrorName = t.IError<'REF/name'> & RefErrorProps;

/**
 * Func errors
 */
export type FuncError = IFuncError['type'];
export type IFuncError =
  | IFuncErrorNotFormula
  | IFuncErrorNotFound
  | IFuncErrorNotSupported
  | IFuncErrorInvoke;

type FuncErrorProps = { formula: string; path: string };
export type IFuncErrorNotFormula = t.IError<'FUNC/notFormula'> & FuncErrorProps;
export type IFuncErrorNotFound = t.IError<'FUNC/notFound'> & FuncErrorProps;

export type IFuncErrorNotSupported = IFuncErrorNotSupportedRange;
export type IFuncErrorNotSupportedRange = t.IError<'FUNC/notSupported/range'> & FuncErrorProps;

export type IFuncErrorInvoke = t.IError<'FUNC/invoke'> & FuncErrorProps;

/**
 * URI errors
 */

type UriErrorProps = { uri: string };
export type IUriError = t.IError<'URI'> & UriErrorProps;
