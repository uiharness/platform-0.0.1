import React from 'react';
import { BulletList } from 'sys.ui.primitives/lib/ui/BulletList';

import { css, CssValue, t } from '../../common';
import { DocCard } from './DEV.DocCard';
import { SimpleDoc } from './DEV.types';

const ConnectorLines = BulletList.Renderers.Bullet.ConnectorLines.Component;

export type SampleProps = {
  docs?: t.CrdtDocEvents<SimpleDoc>[];
  style?: CssValue;
};

export const Sample: React.FC<SampleProps> = (props) => {
  const { docs = [] } = props;
  if (docs.length === 0) return null;

  /**
   * [Render]
   */
  const styles = {
    base: css({}),
  };

  const elCards = (
    <BulletList.Layout
      orientation={'x'}
      bullet={{ edge: 'far', size: 60 }}
      spacing={20}
      items={docs.map((doc) => ({ data: doc }))}
      renderers={{
        bullet: (e) => <ConnectorLines {...e} radius={25} />,
        body: (e) => (e.kind === 'Default' ? <DocCard doc={e.data} /> : undefined),
      }}
    />
  );

  return <div {...css(styles.base, props.style)}>{elCards}</div>;
};
