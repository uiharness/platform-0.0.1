import { t } from '../../common';
import * as error from './error';

/**
 * Initialize behavior controllers.
 */
export function init(args: { ctx: t.IAppContext; store: t.IAppStore }) {
  error.init(args);
}
