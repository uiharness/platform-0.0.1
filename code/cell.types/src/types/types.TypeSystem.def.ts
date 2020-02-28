import { t } from '../common';

/**
 * Type Payload
 * (NB: can write directly to HTTP client )
 */
export type ITypeDefPayload = {
  ns: t.INsProps;
  columns: t.IColumnMap;
};

/**
 * Type Definitions.
 */
export type ITypeDef = {
  column: string;
  prop: string;
  type: string | ITypeRef;
  target?: t.CellTypeTarget;
  error?: t.IError;
};

export type IType = ITypeRef;

export type ITypeRef = {
  kind: 'REF';
  uri: string;
  typename: string;
  types: ITypeDef[];
};

export type ITypeValue = {
  kind: 'VALUE';
  typename: 'string' | 'number' | 'boolean' | 'null' | 'undefined';
};
