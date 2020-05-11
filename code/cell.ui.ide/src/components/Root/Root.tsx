import * as React from 'react';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { time, css, color, CssValue, t, Client } from '../../common';
import { WindowTitleBar, WindowFooterBar } from '../primitives';
import { Monaco } from '../Monaco';

export type IRootProps = { uri: string; env: t.IEnv; style?: CssValue };
export type IRootState = {};

export class Root extends React.PureComponent<IRootProps, IRootState> {
  public state: IRootState = {};
  private state$ = new Subject<Partial<IRootState>>();
  private unmounted$ = new Subject<{}>();

  private monaco!: Monaco;
  private monacoRef = (ref: Monaco) => (this.monaco = ref);

  /**
   * [Lifecycle]
   */
  constructor(props: IRootProps) {
    super(props);
  }

  public componentDidMount() {
    this.state$.pipe(takeUntil(this.unmounted$)).subscribe(e => this.setState(e));
  }

  public componentWillUnmount() {
    this.unmounted$.next();
    this.unmounted$.complete();
  }

  /**
   * [Render]
   */
  public render() {
    const { uri, env } = this.props;
    const styles = {
      base: css({
        Absolute: 0,
        overflow: 'hidden',
      }),
      titlebar: css({
        Absolute: [0, 0, null, 0],
      }),
      body: css({
        Absolute: [WindowTitleBar.HEIGHT, 0, 0, 0],
        display: 'flex',
        Flex: 'vertical-strecth-stretch',
      }),
      editor: css({
        position: 'relative',
        flex: 1,
      }),
    };
    return (
      <div {...css(styles.base, this.props.style)}>
        <WindowTitleBar style={styles.titlebar} address={uri} />
        <div {...styles.body}>
          <div {...styles.editor}>
            <Monaco ref={this.monacoRef} />
          </div>
          <WindowFooterBar>{this.renderFooter()}</WindowFooterBar>
        </div>
      </div>
    );
  }

  private renderFooter() {
    const styles = {
      base: css({
        PaddingX: 10,
        Flex: 'center-start',
        fontSize: 11,
        color: color.format(-0.62),
      }),
      div: css({
        marginLeft: 10,
        marginRight: 10,
        width: 0,
        height: '100%',
        borderLeft: `solid 1px ${color.format(-0.15)}`,
        borderRight: `solid 1px ${color.format(0.7)}`,
      }),
    };
    return (
      <div {...styles.base}>
        <div onClick={this.handlePullTypes}>Pull Types</div>
        <div {...styles.div} />
        <div onClick={this.handleClearTypes}>Clear Types</div>
      </div>
    );
  }

  /**
   * Handlers
   */

  private loadedTypeLibs: t.IDisposable[] = [];

  private handlePullTypes = async () => {
    const addLib = (filename: string, content: string) => {
      const ref = this.monaco.addLib(filename, content);
      this.loadedTypeLibs.push(ref);
    };

    addLib(
      'facts.d.ts',
      `
declare class Facts {
  static next(): string;
}

    `,
    );

    const { env } = this.props;
    const http = Client.http(env.host);

    const ns = http.ns(env.def);
    const info = await ns.read();
    const typeNs = info.body.data.ns.props?.type?.implements || '';

    const client = Client.typesystem(env.host);
    const ts = await client.typescript(typeNs, { exports: false });

    console.log(`declaration (${typeNs})\n\n`, ts.toString());

    addLib('tmp.d.ts', ts.toString());
  };

  private handleClearTypes = () => {
    this.loadedTypeLibs.forEach(ref => ref.dispose());
  };
}
