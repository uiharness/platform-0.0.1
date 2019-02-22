import { expect } from 'chai';
import { Db } from './Db.main';
import { fs } from '@platform/fs';

const dir = '.db/.test';

describe('Db.main', () => {
  afterEach(async () => fs.remove(dir));

  it('put/get value', async () => {
    const KEY = 'foo';
    const db = await Db.create({ dir });
    expect((await db.get(KEY)).value).to.eql(undefined);
    expect((await db.put(KEY, 123)).value).to.eql(123);
    expect((await db.get(KEY)).value).to.eql(123);
  });

  it('deletes a value', async () => {
    const KEY = 'foo';
    const db = await Db.create({ dir });
    expect((await db.put(KEY, 123)).value).to.eql(123);
    expect((await db.get(KEY)).value).to.eql(123);

    const res = await db.del(KEY);
    expect(res.value).to.eql(undefined);
    expect(res.meta.deleted).to.eql(true);
  });
});
