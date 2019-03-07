import { Subject } from 'rxjs';
import { share, takeUntil } from 'rxjs/operators';

import { value, str } from '../common';
import { invoker } from './invoke';
import * as t from './types';
import * as tree from './tree';

type IConstructorArgs = {
  name: string;
  handler: t.CommandHandler;
  children: Command[];
};

type ITreeMethods = {
  count: number;
  walk: (fn: tree.CommandTreeVisitor<Command>) => tree.ICommandTreeVisitorResult;
  find: (fn: tree.CommandTreeFilter<Command>) => Command | undefined;
};

export const DEFAULT = {
  HANDLER: (() => null) as t.CommandHandler,
};

/**
 * Represents a single [command] which is a named unit of functionality
 * within a program that can optionally take parameter input.
 */
export class Command<P extends object = any, A extends object = any> implements t.ICommand<P, A> {
  /**
   * [Static]
   */

  /**
   * Creates a new instance of a `Command`.
   */
  public static create<P extends object = any, A extends object = any>(
    title: string,
    handler?: t.CommandHandler,
  ): Command<P, A>;
  public static create<P extends object = any, A extends object = any>(
    args: Partial<IConstructorArgs> & { name: string }, // NB: Force name.
  ): Command<P, A>;
  public static create<P extends object = any, A extends object = any>(
    ...args: any
  ): Command<P, A> {
    return new Command<P, A>(toConstuctorArgs(args));
  }

  /**
   * Generates a unique-identifier for a `Command`.
   */
  public static toId(args: { name: string; parent?: number }): number {
    let id = str.hashCode(args.name);
    if (args.parent) {
      id = str.hashCode(`${args.parent}/${id}`);
    }
    return id;
  }

  /**
   * Helpers for working with a deep `Command` tree structure.
   */
  public static tree = tree;

  /**
   * [Constructor]
   */
  private constructor(args: Partial<IConstructorArgs>) {
    const { name, handler, children } = formatConstructorArgs(args);

    if (!name) {
      throw new Error(`A command 'name' must be specified.`);
    }

    if (typeof handler !== 'function') {
      throw new Error(`A command 'handler' must be a function.`);
    }

    this._.id = Command.toId({ name });
    this._.name = name;
    this._.handler = handler;
    this._.children = children;
  }

  /**
   * [Fields]
   */
  private readonly _ = {
    id: 0,
    name: '',
    handler: (undefined as unknown) as t.CommandHandler,
    children: [] as Command[],
    dispose$: new Subject(),
    events$: new Subject<t.CommandEvent>(),
    tree: (undefined as unknown) as ITreeMethods | undefined,
  };
  public readonly dispose$ = this._.dispose$.pipe(share());
  public readonly events$ = this._.events$.pipe(
    takeUntil(this.dispose$),
    share(),
  );

  /**
   * [Properties]
   */
  public get id() {
    return this._.id;
  }

  public get name() {
    return this._.name;
  }

  public get handler() {
    return this._.handler;
  }

  public get children(): Command[] {
    return this._.children;
  }

  public get length() {
    return this.children.length;
  }

  public get isDisposed() {
    return this._.dispose$.isStopped;
  }

  public get tree() {
    if (!this._.tree) {
      const self = this; // tslint:disable-line
      const methods: ITreeMethods = {
        get count() {
          return tree.count(self);
        },
        walk: fn => tree.walk<Command>(self, fn),
        find: fn => tree.find<Command>(self, fn),
      };
      this._.tree = methods;
    }
    return this._.tree;
  }

  /**
   * [Methods]
   */
  public dispose() {
    this._.dispose$.next();
    this._.dispose$.complete();
  }

  public as<P1 extends object, A1 extends object>(fn: (e: Command<P1, A1>) => void) {
    fn((this as unknown) as Command<P1, A1>);
    return this;
  }

  /**
   * Cast children to given types.
   */
  public childrenAs<P1 extends object, A1 extends object>(): Array<Command<P1, A1>> {
    return this.children;
  }

  /**
   * Adds a child command.
   */
  public add<P1 extends object = P, A1 extends object = A>(
    title: string,
    handler?: t.CommandHandler<P1, A1>,
  ): Command<P, A>;

  public add(args: t.ICommand<any, any> & { name: string }): Command<P, A>;

  public add(...input: any): Command<P, A> {
    const args = toConstuctorArgs(input);

    // Ensure the child does not already exist.
    if (this.children.some(e => e.name === args.name)) {
      throw new Error(`A child command named '${args.name}' already exists within '${this.name}'.`);
    }

    // Create the child.
    const child = new Command({ ...args });
    child._.id = Command.toId({ name: args.name, parent: this.id });

    // Finish up.
    child.events$.pipe(takeUntil(this.dispose$)).subscribe(e => this._.events$.next(e));
    this._.children = [...this._.children, child] as Command[];
    return this;
  }

  /**
   * Converts the builder to a simple object.
   */
  public toObject(): t.ICommand<P, A> {
    const children = this.children.map(child => child.toObject());
    const invoke: t.InvokeCommand<P, A> = options => this.invoke(options);
    return {
      id: this.id,
      name: this.name,
      handler: this.handler,
      events$: this.events$,
      invoke,
      children,
    };
  }

  /**
   * Creates an immutable clone of the object.
   */
  public clone(options: { deep?: boolean } = {}) {
    const deep = value.defaultValue(options.deep, true);
    let args = { ...this._ };
    if (deep) {
      args = { ...args, children: cloneChildren(this) };
    }
    return new Command<P>(args);
  }

  /**
   * Invokes the command's handler.
   */
  public invoke<R>(options: {
    props: P;
    args?: string | t.ICommandArgs<A>;
    timeout?: number;
  }): t.ICommandInvokePromise<P, A, R> {
    return invoker<P, A, R>({ ...options, command: this, events$: this._.events$ });
  }
}

/**
 * [Internal]
 */

function toConstuctorArgs(args: any): IConstructorArgs {
  if (typeof args[0] === 'string') {
    const [name, handler] = args;
    return formatConstructorArgs({ name, handler, children: [] });
  }
  if (args[0] instanceof Command) {
    const { name, handler, children } = args[0] as Command;
    return formatConstructorArgs({ name, handler, children });
  }
  if (typeof args[0] === 'object') {
    return formatConstructorArgs(args[0]);
  }
  throw new Error(`[Args] could not be interpreted.`);
}

function formatConstructorArgs(args: Partial<IConstructorArgs>): IConstructorArgs {
  args = { ...args };
  args.name = (args.name || '').trim();
  args.handler = args.handler || DEFAULT.HANDLER;
  args.children = args.children || [];
  return args as IConstructorArgs;
}

function cloneChildren(builder: Command): Command[] {
  return builder.children.map(child => child as Command).map(child => child.clone({ deep: true }));
}
