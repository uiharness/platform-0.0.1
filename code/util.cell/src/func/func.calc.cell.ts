import { ast } from '../ast';
import { t } from '../common';
import { CellRange } from '../range/CellRange';
import * as util from './util';
import { cell as cellUtil } from '../cell';
import { getExprFunc } from './func.expressionMap';

/**
 * Calculate.
 */
export async function calculate<D = any>(args: {
  cell: string;
  refs: t.IRefs;
  getValue: t.RefGetValue;
  getFunc: t.GetFunc;
}): Promise<t.IFuncResponse<D>> {
  const { cell, refs, getValue, getFunc } = args;
  const formula = (await getValue(cell)) || '';
  const isFormula = util.isFormula(formula);
  const node = isFormula ? ast.toTree(formula) : undefined;
  const type = util.toRefTarget(formula);

  const fail = (errorType: t.FuncError, message: string) => {
    const error: t.IFuncError = {
      type: errorType,
      message,
      cell: { key: cell, value: formula },
    };
    const res: t.IFuncResponse<D> = { ok: false, type, cell, formula, error };
    return res;
  };

  // Ensure the node is a function/expression.
  if (!node || !isFormula) {
    const error = `The value of cell ${cell} is not a formula. Must start with "=".`;
    return fail('NOT_FORMULA', error);
  }

  // Disallow RANGE types.
  // NB: Ranges can be used as parameters, but a range on it's own (eg "=A1:Z9")
  //     makes no sense from this context of calculating something.
  if (type === 'RANGE') {
    const error = `The cell ${cell} is a range which is not supported.`;
    return fail('NOT_SUPPORTED/RANGE', error);
  }

  // Evaluate the function/expression.
  let data: any;
  let error: t.IFuncError | undefined;
  try {
    if (node.type === 'binary-expression') {
      data = await evalExpr({ cell, formula, node, refs, getValue, getFunc });
    }
    if (node.type === 'function') {
      data = await evalFunc({ cell, formula, node, refs, getValue, getFunc });
    }
    if (node.type === 'cell') {
      data = await getCellRefValue({ cell, node, refs, getValue, getFunc });
    }
  } catch (err) {
    error = util.fromError(err, { cell: { key: cell, value: formula } });
  }

  // Finish up.
  const ok = !error;
  const res: t.IFuncResponse<D> = { ok, type, cell, formula, data };
  return error ? { ...res, error } : res;
}

/**
 * [Internal]
 */

const evalNode = async (args: {
  cell: string;
  formula: string;
  node: ast.Node;
  refs: t.IRefs;
  getValue: t.RefGetValue;
  getFunc: t.GetFunc;
}) => {
  const { node, cell, formula, refs, getValue, getFunc } = args;

  if (ast.isValueNode(node)) {
    return (node as any).value;
  }
  if (node.type === 'binary-expression') {
    return evalExpr({ cell, formula, node, refs, getValue, getFunc }); // <== RECURSION 🌳
  }
  if (node.type === 'function') {
    return evalFunc({ cell, formula, node, refs, getValue, getFunc }); // <== RECURSION 🌳
  }
  if (node.type === 'cell') {
    return getCellRefValue({ cell, refs, node, getValue, getFunc }); // <== RECURSION 🌳
  }
  if (node.type === 'cell-range') {
    return getRangeValues({
      cell,
      node: node as ast.CellRangeNode,
      refs,
      getValue,
      getFunc,
    }); // <== RECURSION 🌳
  }
};

/**
 * Execute a binary-expression (eg "=A+A1").
 */
const evalExpr = async (args: {
  cell: string;
  formula: string;
  node: ast.BinaryExpressionNode;
  refs: t.IRefs;
  getValue: t.RefGetValue;
  getFunc: t.GetFunc;
  level?: number;
}) => {
  const { cell, formula, node, refs, getValue, getFunc, level = 0 } = args;
  const func = await getExprFunc(getFunc, node.operator);
  if (!func) {
    const err = `Binary expression operator '${node.operator}' is not mapped to a corresponding function.`;
    throw new Error(err);
  }

  const toValue = async (node: ast.Node) => {
    return node.type === 'binary-expression'
      ? evalExpr({ cell, formula, refs, getValue, getFunc, node, level: level + 1 }) // <== RECURSION 🌳
      : evalNode({ cell, formula, node, getValue, getFunc, refs });
  };

  // Retrieve left/right parameters.
  const left = await toValue(node.left);
  const right = await toValue(node.right);
  const params = [left, right];

  // Invoke the function.
  const res: t.FuncResponse = await func({ params });
  return res;
};

/**
 * Execute a function (eg "=SUM(1,A1)").
 */
const evalFunc = async (args: {
  cell: string;
  formula: string;
  node: ast.FunctionNode;
  refs: t.IRefs;
  getValue: t.RefGetValue;
  getFunc: t.GetFunc;
  level?: number;
}) => {
  const { cell, formula, node, refs, getValue, getFunc } = args;
  const name = node.name;
  const namespace = node.namespace || 'sys';

  // Lookup the function.
  const func = await getFunc({ name, namespace });
  if (!func) {
    throw util.toError({
      type: 'NOT_FOUND',
      message: `The function [${namespace}.${name}] was not found.`,
      cell: { key: cell, value: formula },
    });
  }

  // Calculate parameter values.
  const getParam = (node: ast.Node) => evalNode({ cell, formula, node, refs, getValue, getFunc });
  const params = await Promise.all(node.arguments.map(node => getParam(node)));

  // Invoke the function.
  const res: t.FuncResponse = await func({ params });
  return res;
};

/**
 * Lookup a cell REF (eg =A1) and return it's evaluated value.
 */
const getCellRefValue = async (args: {
  cell: string;
  node: ast.CellNode;
  refs: t.IRefs;
  getValue: t.RefGetValue;
  getFunc: t.GetFunc;
}) => {
  const { cell, refs, getValue, getFunc } = args;
  util.throwIfCircular({ cell, refs });

  // Read the current cell value for the node.
  const targetKey = cellUtil.toRelative(args.node.key);
  let value = (await getValue(targetKey)) || '';

  // Calculate formulas into final values.
  if (util.isFormula(value)) {
    value = await evalNode({
      node: ast.toTree(value) as ast.BinaryExpressionNode | ast.FunctionNode,
      cell: targetKey,
      formula: value,
      refs,
      getValue,
      getFunc,
    }); // <== RECURSION 🌳
  }

  // Finish up.
  return value;
};

/**
 * Execute a function that contains a range.
 */
const getRangeValues = async (args: {
  cell: string;
  node: ast.CellRangeNode;
  refs: t.IRefs;
  getValue: t.RefGetValue;
  getFunc: t.GetFunc;
}) => {
  const { cell, node, refs, getValue, getFunc } = args;
  util.throwIfCircular({ cell, refs });
  const range = CellRange.fromCells(node.left.key, node.right);
  const wait = range.keys.map(async cell => {
    const value = await getValue(cell);
    return util.isFormula(value)
      ? (await calculate({ cell, refs, getValue, getFunc })).data // <== RECURSION 🌳
      : value;
  });
  return (await Promise.all(wait)) as any[];
};
