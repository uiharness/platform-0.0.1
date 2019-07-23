import { cell as util } from '@platform/util.value.cell';

import { Grid, Editor } from '../api';
import * as hooks from './hooks';
import { constants } from '../common';

const { DEFAULT } = constants;

/**
 * Retrieves `handsontable` settings for a grid.
 */
export function getSettings(args: { totalColumns: number; getGrid: () => Grid }) {
  const { getGrid, totalColumns } = args;
  const selectionHandler = hooks.afterSelectionHandler(getGrid);

  const createColumns = (length: number) => {
    const col = {
      renderer: DEFAULT.CELL_RENDERER,
      editor: Editor,
    };
    return Array.from({ length }).map(() => col);
  };

  const rowHeights: any = (index: number) => {
    let height = DEFAULT.ROW_HEIGHT;
    const grid = getGrid();
    if (grid) {
      const row = grid.rows[index];
      height = row && row.height !== undefined ? row.height : height;
    }
    return height;
  };

  const colWidths: any = (index: number) => {
    let width = DEFAULT.COLUMN_WIDTH;
    const grid = getGrid();
    if (grid) {
      const key = util.toKey(index);
      const column = grid.columns[key];
      width = column && column.width !== undefined ? column.width : width;
    }
    return width;
  };

  const size = hooks.sizeHandlers(getGrid);
  const { afterColumnResize, afterRowResize, modifyColWidth, modifyRowHeight } = size;
  const { afterSelection, afterDeselect } = selectionHandler;

  const settings: Handsontable.DefaultSettings = {
    data: [],

    rowHeaders: true,
    rowHeights,

    colHeaders: true,
    colWidths,
    columns: createColumns(totalColumns),

    viewportRowRenderingOffset: 20,
    manualRowResize: true,
    manualColumnResize: true,
    renderAllRows: false, // Virtual scrolling.

    /**
     * Event Hooks.
     * - https://handsontable.com/docs/6.2.2/Hooks.html
     */
    beforeKeyDown: hooks.beforeKeyDownHandler(getGrid),
    beforeChange: hooks.beforeChangeHandler(getGrid),
    afterSelection,
    afterDeselect,
    afterColumnResize,
    afterRowResize,
    modifyColWidth,
    modifyRowHeight,

    // Mouse.
    beforeOnCellMouseDown: hooks.mouseCell(getGrid, 'DOWN'),
    beforeOnCellMouseUp: hooks.mouseCell(getGrid, 'UP'),
    beforeOnCellMouseOver: hooks.mouseCell(getGrid, 'ENTER'),
    beforeOnCellMouseOut: hooks.mouseCell(getGrid, 'LEAVE'),

    // Undo.
    beforeUndo: hooks.undo(getGrid, 'BEFORE', 'UNDO'),
    afterUndo: hooks.undo(getGrid, 'AFTER', 'UNDO'),
    beforeRedo: hooks.undo(getGrid, 'BEFORE', 'REDO'),
    afterRedo: hooks.undo(getGrid, 'AFTER', 'REDO'),
  };

  return settings;
}
