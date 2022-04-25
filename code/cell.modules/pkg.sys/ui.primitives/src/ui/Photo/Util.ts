import { t, R, DEFAULT } from './common';

export const Util = {
  /**
   * Convert "loose" photo definition imports into a
   * precise data-type used by the <Photo> component.
   */
  toDefs(inputDef: t.PhotoDefInput = [], inputMeta?: t.PhotoDefaults): t.Photo[] {
    const meta = R.mergeDeepRight(DEFAULT.meta, inputMeta ?? {}) as t.PhotoDefaults;
    const list = Array.isArray(inputDef) ? inputDef : [inputDef];

    const defs = list
      .map((item) => (typeof item === 'string' ? { url: item } : item))
      .map((def) => ({ ...def, transition: def.transition ?? meta.transition }));

    return defs;
  },
};
