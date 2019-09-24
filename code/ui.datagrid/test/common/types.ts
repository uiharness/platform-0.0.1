import { Subject } from 'rxjs';

export * from '../../src/common/types';
export * from '@platform/cli.ui/lib/types';


export type ITestCommandProps = {
  state$: Subject<Partial<ITestState>>;
};

export type TestEditorType = 'debug' | 'default';
export type ITestState = {
  editor?: TestEditorType;
};
