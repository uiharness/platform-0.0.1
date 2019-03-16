import * as React from 'react';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

import { time, color, css, datagrid, ObjectView, MeasureSize } from './common';

const PADDING = 10;

export type ITestEditorProps = {};
export type ITestEditorState = {
  value?: string;
  width?: number;
  textWidth?: number;
};

export class TestEditor extends React.PureComponent<ITestEditorProps, ITestEditorState> {
  public state: ITestEditorState = {};
  private unmounted$ = new Subject();
  private state$ = new Subject<Partial<ITestEditorState>>();

  public static contextType = datagrid.EditorContext;
  public context!: datagrid.ReactEditorContext;

  private el!: HTMLDivElement;
  private elRef = (ref: HTMLDivElement) => (this.el = ref);
  private input!: HTMLInputElement;
  private inputRef = (ref: HTMLInputElement) => (this.input = ref);

  /**
   * [Lifecycle]
   */
  public componentWillMount() {
    this.state$.pipe(takeUntil(this.unmounted$)).subscribe(e => this.setState(e));

    const keys$ = this.context.keys$;
    keys$
      .pipe(filter(e => e.isEnter))
      .subscribe(e => this.context.complete({ value: this.input.value }));

    // this.context.autoCancel = false;
    // keys$.pipe(filter(e => e.isEscape)).subscribe(e => this.context.cancel());
  }

  public componentDidMount() {
    this.input.focus();
    this.updateSize();
  }

  public componentWillUnmount() {
    this.unmounted$.next();
  }

  /**
   * [Methods]
   */
  public updateSize() {
    const content = <div {...STYLES.inputText}>{this.state.value}</div>;
    const textSize = MeasureSize.measure({ content, style: STYLES.input });
    const textWidth = textSize.width;

    const cell = this.context.cell;
    const width = cell.width + cell.sibling.right.width - PADDING * 2 - 10;

    this.state$.next({ textWidth, width });
  }

  /**
   * [Render]
   */
  public render() {
    const styles = {
      base: css({
        boxSizing: 'border-box',
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        padding: PADDING,
        borderRadius: 4,
        border: `solid 1px ${color.format(-0.1)}`,
        width: this.state.width,
      }),
      input: css({
        outline: 'none',
        marginBottom: 4,
      }),
    };

    const data = {
      state: this.state,
      context: this.context,
    };

    return (
      <div ref={this.elRef} {...styles.base}>
        <input
          {...css(STYLES.inputText, styles.input)}
          ref={this.inputRef}
          value={this.state.value || ''}
          onChange={this.handleChange}
        />
        <ObjectView name={'editor'} data={data} fontSize={9} />
      </div>
    );
  }

  /**
   * [Handlers]
   */
  private handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    this.state$.next({ value });
    time.delay(0, () => this.updateSize());
  };
}

/**
 * [Internal]
 */
const STYLES = {
  inputText: css({
    fontSize: 14,
  }),
  input: css({
    boxSizing: 'border-box',
    outline: 'none',
    marginBottom: 4,
  }),
};
