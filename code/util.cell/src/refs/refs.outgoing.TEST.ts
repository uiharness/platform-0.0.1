import { expect, testContext } from './TEST';
import { refs } from '.';
import { t, MemoryCache } from '../common';

const outgoing = (args: refs.IOutgoingArgs) => {
  return refs.outgoing(args);
};

describe.only('refs.outgoing', () => {
  it('undefined (not a formula)', async () => {
    const ctx = testContext({
      A2: { value: 123 },
    });
    const res = await outgoing({ key: 'A2', ...ctx });
    expect(res).to.eql([]);
  });

  describe('REF', () => {
    it('A1 => A2', async () => {
      const ctx = testContext({
        A1: { value: '=A$2' },
        A2: { value: 123 },
      });
      const res = await outgoing({ key: 'A1', ...ctx });

      expect(res.length).to.eql(1);
      expect(res[0].target).to.eql('VALUE');
      expect(res[0].path).to.eql('A1/A2');
      expect(res[0].param).to.eql(undefined);
    });

    it('A1 => A2 => A3', async () => {
      const ctx = testContext({
        A1: { value: '=A$2' },
        A2: { value: '=$A3' },
        A3: { value: 123 },
      });
      const res = await outgoing({ key: 'A1', ...ctx });

      expect(res.length).to.eql(1);
      expect(res[0].target).to.eql('VALUE');
      expect(res[0].path).to.eql('A1/A2/A3');
    });

    it('A1 => A1 (ERROR/CIRCULAR)', async () => {
      const ctx = testContext({
        A1: { value: '=A1' },
      });
      const res = await outgoing({ key: 'A1', ...ctx });
      const error = res[0].error as t.IRefError;

      expect(res.length).to.eql(1);
      expect(res[0].path).to.eql('A1/A1');
      expect(error.type).to.eql('CIRCULAR');
    });

    it('A1 => A2 => A3 => A1 (ERROR/CIRCULAR)', async () => {
      const ctx = testContext({
        A1: { value: '=A2' },
        A2: { value: '=A3' },
        A3: { value: '=A1' },
      });
      const res = await outgoing({ key: 'A1', ...ctx });
      const error = res[0].error as t.IRefError;

      expect(res.length).to.eql(1);
      expect(res[0].path).to.eql('A1/A2/A3/A1');
      expect(error.type).to.eql('CIRCULAR');
    });

    it('A1 => B (ERROR/NAME)', async () => {
      const ctx = testContext({
        A1: { value: '=A2' },
        A2: { value: '=B' },
      });
      const res = await outgoing({ key: 'A1', ...ctx });
      const error = res[0].error as t.IRefError;

      expect(res.length).to.eql(1);
      expect(res[0].path).to.eql('A1/A2/B');
      expect(res[0].target).to.eql('UNKNOWN');

      expect(error.type).to.eql('NAME');
      expect(error.message).to.include('Unknown range: B');
    });

    it('A1 => A2(func)', async () => {
      const ctx = testContext({
        A1: { value: '=A2' },
        A2: { value: '=SUM(1,2,3)' },
      });
      const res = await outgoing({ key: 'A1', ...ctx });

      expect(res.length).to.eql(1);
      expect(res[0].target).to.eql('FUNC');
      expect(res[0].path).to.eql('A1/A2');
    });
  });

  describe('FUNC', () => {
    it('=SUM(A2, 10, A3)', async () => {
      const ctx = testContext({
        A1: { value: '=SUM(A2, 10, A3)' },
        A2: { value: 123 },
        A3: { value: '=A4' },
        A4: { value: 456 },
      });
      const res = await outgoing({ key: 'A1', ...ctx });

      expect(res.length).to.eql(2);

      expect(res[0].target).to.eql('VALUE');
      expect(res[0].param).to.eql(0);
      expect(res[0].path).to.eql('A1/A2');

      expect(res[1].target).to.eql('VALUE');
      expect(res[1].param).to.eql(2);
      expect(res[1].path).to.eql('A1/A3/A4');
    });

    it('params to types: =SUM(..) => FUNC | VALUE | RANGE | FUNC', async () => {
      const ctx = testContext({
        A1: { value: '=SUM(999, A2, A3, A3:A4, A5)' },
        A2: { value: '=SUM(A3, 999)' },
        A3: { value: '1' },
        A4: { value: 2 },
        A5: { value: '=A4+2' },
      });
      const res = await outgoing({ key: 'A1', ...ctx });

      expect(res.length).to.eql(4);

      expect(res[0].target).to.eql('FUNC');
      expect(res[0].path).to.eql('A1/A2');
      expect(res[0].param).to.eql(1);

      expect(res[1].target).to.eql('VALUE');
      expect(res[1].path).to.eql('A1/A3');
      expect(res[1].param).to.eql(2);

      expect(res[2].target).to.eql('RANGE');
      expect(res[2].path).to.eql('A1/A3:A4');
      expect(res[2].param).to.eql(3);

      expect(res[3].target).to.eql('FUNC');
      expect(res[3].path).to.eql('A1/A5');
      expect(res[3].param).to.eql(4);
    });

    describe('circular error', () => {
      it('param to range', async () => {
        const ctx = testContext({
          A1: { value: '=SUM(999, A2, A3)' },
          A2: { value: 123 },
          A3: { value: '=A1:B9' },
        });
        const res = await outgoing({ key: 'A1', ...ctx });

        expect(res.length).to.eql(2);

        expect(res[1].target).to.eql('RANGE');
        expect(res[1].path).to.eql('A1/A3/A1:B9');
        expect(res[1].param).to.eql(2);

        const error = res[1].error as t.IRefError;
        expect(error.type).to.eql('CIRCULAR');
      });

      it('param to range (immediate)', async () => {
        const ctx = testContext({
          A1: { value: '=SUM(999, A1:B9)' },
        });
        const res = await outgoing({ key: 'A1', ...ctx });

        expect(res.length).to.eql(1);

        expect(res[0].target).to.eql('RANGE');
        expect(res[0].path).to.eql('A1/A1:B9');
        expect(res[0].param).to.eql(1);

        const error = res[0].error as t.IRefError;
        expect(error.type).to.eql('CIRCULAR');
        expect(error.path).to.eql('A1/A1:B9');
      });

      it('func param reference self (immediate)', async () => {
        const ctx = testContext({
          A1: { value: '=SUM(999, A1)' },
        });
        const res = await outgoing({ key: 'A1', ...ctx });

        expect(res[0].target).to.eql('FUNC');
        expect(res[0].path).to.eql('A1/A1');
        expect(res[0].param).to.eql(1);

        const error = res[0].error as t.IRefError;
        expect(error.type).to.eql('CIRCULAR');
        expect(error.path).to.eql('A1/A1');
      });

      it('func => func', async () => {
        const ctx = testContext({
          A1: { value: '=SUM(999, A2)' },
          A2: { value: '=SUM(A1, 888)' },
        });
        const res = await outgoing({ key: 'A1', ...ctx });
        expect(res[0].target).to.eql('FUNC');
        expect(res[0].path).to.eql('A1/A2');
        expect(res[0].param).to.eql(1);

        const error = res[0].error as t.IRefError;
        expect(error.type).to.eql('CIRCULAR');
        expect(error.path).to.eql('A1/A2/A1');
      });

      it('FUNC => REF => FUNC', async () => {
        const ctx = testContext({
          A1: { value: '=SUM(999, A2)' },
          A2: { value: '=A3' },
          A3: { value: '=SUM(999, A1)' },
        });
        const res = await outgoing({ key: 'A1', ...ctx });

        expect(res[0].target).to.eql('FUNC');
        expect(res[0].path).to.eql('A1/A2/A3');
        expect(res[0].param).to.eql(1);

        const error = res[0].error as t.IRefError;
        expect(error.type).to.eql('CIRCULAR');
        expect(error.path).to.eql('A1/A2/A3/A1');
      });
    });
  });

  describe('FUNC (binary expression)', () => {
    it('=A4 + A2 / (8 + A3 - A5 * 2 +A2)', async () => {
      const ctx = testContext({
        A1: { value: '=A4 + A2 / (8 + A3 - A5 * 2 +A2)' },
        A2: { value: 1 },
        A3: { value: '=A4' },
        A4: { value: 2 },
        A5: { value: '=SUM(1, 99)' },
      });
      const res = await outgoing({ key: 'A1', ...ctx });

      expect(res.length).to.eql(5);

      expect(res[0].target).to.eql('VALUE');
      expect(res[1].target).to.eql('VALUE');
      expect(res[2].target).to.eql('VALUE');
      expect(res[3].target).to.eql('FUNC');
      expect(res[4].target).to.eql('VALUE');

      expect(res[0].path).to.eql('A1/A4');
      expect(res[1].path).to.eql('A1/A2');
      expect(res[2].path).to.eql('A1/A3/A4');
      expect(res[3].path).to.eql('A1/A5');
      expect(res[4].path).to.eql('A1/A2');

      expect(res[0].param).to.eql(0);
      expect(res[1].param).to.eql(1);
      expect(res[2].param).to.eql(3);
      expect(res[3].param).to.eql(4);
      expect(res[4].param).to.eql(6);
    });

    it('=5 + SUM(A2,A3) + A2 (FUNC/REF)', async () => {
      const ctx = testContext({
        A1: { value: '=5 + SUM(A2,A3) + A2' },
        A2: { value: 2 },
        A3: { value: 3 },
      });
      const res = await outgoing({ key: 'A1', ...ctx });

      console.log('res', res);

      // expect(res.length).to.eql(1);
      // expect(res[0].target).to.eql('RANGE');
      // expect(res[0].path).to.eql('A1/B1:B9');
      // expect(res[0].param).to.eql(1);
    });

    it('REF => FUNC', async () => {
      const ctx = testContext({
        A1: { value: '=A2' },
        A2: { value: '=SUM(A3,999,A4)' },
        A3: { value: 3 },
        A4: { value: 4 },
      });
      const res = await outgoing({ key: 'A1', ...ctx });

      expect(res.length).to.eql(1);
      expect(res[0].target).to.eql('FUNC');
      expect(res[0].path).to.eql('A1/A2');
    });

    it('"=5 + A1:B9" (RANGE => self)', async () => {
      const ctx = testContext({
        A1: { value: '=5 + B1:B9' },
      });
      const res = await outgoing({ key: 'A1', ...ctx });

      expect(res.length).to.eql(1);
      expect(res[0].target).to.eql('RANGE');
      expect(res[0].path).to.eql('A1/B1:B9');
      expect(res[0].param).to.eql(1);
    });

    it('"=1+2" (no refs)', async () => {
      const test = async (expr: string) => {
        const ctx = testContext({
          A1: { value: expr },
        });
        const res = await outgoing({ key: 'A1', ...ctx });
        expect(res).to.eql([]);
      };

      await test('1+2');
      await test('=1+2');
      await test('=1   +2');
      await test('=1+ 2');

      await test('1-2');
      await test('=1-2');
      await test('=1   -2');
      await test('=1- 2');
    });

    describe('circular error', () => {
      it('=5 + A1:B9 (RANGE)', async () => {
        const ctx = testContext({
          A1: { value: '=5 + A1:B9' },
        });
        const res = await outgoing({ key: 'A1', ...ctx });

        expect(res.length).to.eql(1);
        expect(res[0].target).to.eql('RANGE');
        expect(res[0].path).to.eql('A1/A1:B9');

        const error = res[0].error as t.IRefError;
        expect(error.type).to.eql('CIRCULAR');
      });

      it('=A1+5 => self (immediate)', async () => {
        const ctx = testContext({
          A1: { value: '=A1+5' },
        });
        const res = await outgoing({ key: 'A1', ...ctx });

        expect(res.length).to.eql(1);
        expect(res[0].target).to.eql('FUNC');
        expect(res[0].path).to.eql('A1');

        const error = res[0].error as t.IRefError;
        expect(error.type).to.eql('CIRCULAR');
      });

      it('"=A2 + 5" => REF => self ', async () => {
        const ctx = testContext({
          A1: { value: '=A2 + 5' },
          A2: { value: '=A1' },
        });
        const res = await outgoing({ key: 'A1', ...ctx });

        expect(res.length).to.eql(1);
        expect(res[0].target).to.eql('REF');
        expect(res[0].path).to.eql('A1/A2');

        const error = res[0].error as t.IRefError;
        expect(error.type).to.eql('CIRCULAR');
        expect(error.path).to.eql('A1/A2/A1');
      });

      it('"=A2 + 1" => FUNC => self ', async () => {
        const ctx = testContext({
          A1: { value: '=A2 + 1' },
          A2: { value: '=SUM(A1, A1)' },
        });

        const res = await outgoing({ key: 'A1', ...ctx });

        expect(res.length).to.eql(1);
        expect(res[0].target).to.eql('FUNC');
        expect(res[0].path).to.eql('A1/A2');

        const error = res[0].error as t.IRefError;
        expect(error.type).to.eql('CIRCULAR');
        expect(error.path).to.eql('A1/A2/A1');
      });
    });
  });

  describe('RANGE', () => {
    it('=B1:B9', async () => {
      const ctx = testContext({
        A1: { value: '=$B1:B$9' },
      });
      const res = await outgoing({ key: 'A1', ...ctx });
      expect(res.length).to.eql(1);
      expect(res[0].target).to.eql('RANGE');
      expect(res[0].path).to.eql('A1/B1:B9');
      expect(res[0].error).to.eql(undefined);
    });

    it('A1 => B1:B9', async () => {
      const ctx = testContext({
        A1: { value: '=A2' },
        A2: { value: '=$B1:B$9' },
      });
      const res = await outgoing({ key: 'A1', ...ctx });
      expect(res.length).to.eql(1);
      expect(res[0].target).to.eql('RANGE');
      expect(res[0].path).to.eql('A1/A2/B1:B9');
      expect(res[0].error).to.eql(undefined);
    });

    it('ERROR/CIRCULAR', async () => {
      const ctx = testContext({
        A1: { value: '=B$2' },
        B2: { value: '=A1:B$9' },
      });
      const res = await outgoing({ key: 'A1', ...ctx });

      expect(res.length).to.eql(1);
      expect(res[0].target).to.eql('RANGE');
      expect(res[0].path).to.eql('A1/B2/A1:B9');

      const error = res[0].error as t.IRefError;
      expect(error.type).to.eql('CIRCULAR');
      expect(error.message).to.include(
        'Range contains a cell that leads back to itself (A1/B2/A1:B9)',
      );
    });

    it('ERROR/CIRCULAR (immediate)', async () => {
      const ctx = testContext({
        A1: { value: '=A1:B9' },
      });
      const res = await outgoing({ key: 'A1', ...ctx });

      expect(res.length).to.eql(1);
      expect(res[0].target).to.eql('RANGE');
      expect(res[0].path).to.eql('A1/A1:B9');

      const error = res[0].error as t.IRefError;
      expect(error.type).to.eql('CIRCULAR');
      expect(error.message).to.include(
        'Range contains a cell that leads back to itself (A1/A1:B9)',
      );
    });
  });

  describe('cache', () => {
    it('uses memory cache', async () => {
      const cache = MemoryCache.create();
      const ctx = testContext({
        A1: { value: '=A4 + A2 / (8 + A3 - A5 * 2 +A2)' },
        A2: { value: 1 },
        A3: { value: '=A4' },
        A4: { value: 2 },
        A5: { value: '=SUM(1, 99)' },
      });
      const res1 = await outgoing({ key: 'A1', ...ctx });
      const res2 = await outgoing({ key: 'A1', ...ctx, cache });
      const res3 = await outgoing({ key: 'A1', ...ctx, cache });

      // Cached instance comparison.
      expect(res1).to.not.equal(res2);
      expect(res2).to.equal(res3); // NB: Cached.

      // Cached value comparison.
      expect(res1).to.eql(res2);
      expect(res2).to.eql(res3);
    });
  });
});
