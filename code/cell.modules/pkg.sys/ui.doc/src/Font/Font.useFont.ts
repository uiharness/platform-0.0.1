import { useEffect, useState } from 'react';
import { load } from './Font.load';

import { t } from '../common';
import { Util } from './Util';

/**
 * Hook for ensuring fonts are loaded within the document.
 */
export function useFont(definition: t.FontDefinition | t.FontDefinition[]) {
  const [fonts, setFonts] = useState<FontFace[]>([]);
  const [ready, setReady] = useState(false);

  const defs = Array.isArray(definition) ? definition : [definition].sort();
  const keys = defs.map((def) => Util.toKeyString(def)).join(';');

  useEffect(() => {
    let isDisposed = false;

    load(definition).then((fonts) => {
      if (!isDisposed) {
        setReady(true);
        setFonts(fonts);
      }
    });

    return () => {
      isDisposed = true;
    };
  }, [keys]); // eslint-disable-line

  return {
    ready,
    fonts,
  };
}
