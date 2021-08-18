import { File } from '.';
import { FsIndexer } from '..';
import { expect, Hash, t, util } from '../test';

const fs = util.node;

describe('FileHash', () => {
  it('hash.files - [array]', () => {
    const file1: t.ManifestFile = { path: 'foo.txt', bytes: 1234, filehash: 'abc' };
    const file2: t.ManifestFile = { path: 'foo.txt', bytes: 1234, filehash: 'def' };
    const hash = Hash.sha256([file1.filehash, file2.filehash]);
    expect(File.Hash.files([file1, file2, undefined] as any)).to.eql(hash);
  });

  it('hash.files - {manifest}', async () => {
    const dir = fs.resolve('static.test');
    const indexer = FsIndexer({ fs, dir });
    const manifest = await indexer.manifest();
    const hash = Hash.sha256(manifest.files.map((file) => file.filehash));
    expect(manifest.hash.files).to.eql(hash);
    expect(File.Hash.files(manifest)).to.eql(hash);
  });

  it('hash.filehash', async () => {
    const dir = fs.resolve('static.test');
    const indexer = FsIndexer({ fs, dir });
    const manifest = await indexer.manifest();

    const filename = 'images/award.svg';
    const file = manifest.files.find((file) => file.path === filename);
    const hash = await File.Hash.filehash(fs, fs.join(dir, filename));

    expect(hash).to.match(/^sha256-/);
    expect(hash).to.eql(file?.filehash);
  });
});
