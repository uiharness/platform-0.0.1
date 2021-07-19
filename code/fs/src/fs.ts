import * as path from 'path';

import { t } from './common';
import { File as file } from './file';
import { Glob as glob } from './glob';
import { is } from './is';
import { merge } from './merge';
import { size } from './size';
import { unzip, zip } from './zip';
import { ancestor } from './ancestor';
import { match } from './match';
import { env } from './env';
import { stream } from './stream';
import { sort } from './sort';

import {
  readdir,
  readdirSync,
  ensureDir,
  ensureDirSync,
  writeFile,
  writeFileSync,
  readFile,
  readFileSync,
  move,
  moveSync,
  copy,
  copySync,
  copyFile,
  copyFileSync,
  remove,
  removeSync,
  rename,
  renameSync,
  createReadStream,
  createWriteStream,
  pathExists,
  pathExistsSync,
  existsSync,
  lstat,
  lstatSync,
  readJson,
  readJsonSync,
  writeJson,
  writeJsonSync,
  appendFile,
  appendFileSync,
} from 'fs-extra';

const { join, resolve, dirname, basename, extname } = path;
const exists: t.IFs['exists'] = (path) => pathExists(path);

/**
 * Extended [file-system] object.
 * NOTE:
 *    This [fs] object can be cast to the general
 *    `IFs` interface found in [@platform/types].
 */
export const fs = {
  readdir,
  readdirSync,
  ensureDir,
  ensureDirSync,
  writeFile,
  writeFileSync,
  readFile,
  readFileSync,
  copy,
  copySync,
  copyFile,
  copyFileSync,
  move,
  moveSync,
  remove,
  removeSync,
  createReadStream,
  createWriteStream,
  rename,
  renameSync,
  pathExists,
  pathExistsSync,
  exists,
  existsSync,
  readJson,
  readJsonSync,
  writeJson,
  writeJsonSync,
  appendFile,
  appendFileSync,
  lstat,
  lstatSync,

  // [IFs] path helpers
  path,
  join,
  resolve,
  dirname,
  basename,
  extname,

  /**
   * Helpers for determining the size of file-system items.
   */
  size,

  /**
   * Helpers for working with streams.
   */
  stream,

  /**
   * Helpers for searching for glob patterns.
   */
  glob,

  /**
   * Helpers for semantically sorting filenames and paths.
   */
  sort,

  /**
   * Helpers for working with file content.
   */
  file,

  /**
   * Helpers for walking up the ancestor hierarchy.
   */
  ancestor,

  /**
   * Merges directories.
   */
  merge,

  /**
   * Match file patterns.
   */
  match,

  /**
   * Flag helpers.
   */
  is,

  /**
   * Load [.env] files into [process.env].
   */
  env,

  /**
   * Zipping.
   */
  zip,
  unzip,
};
