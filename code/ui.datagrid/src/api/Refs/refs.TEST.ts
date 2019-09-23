import { expect } from 'chai';
import { t } from '../../common';
import { refs } from '.';

const testContext = (cells: t.IGridCells): t.IRefContext => {
  return {
    getCell: async (key: string) => cells[key],
  };
};

describe('refs', () => {
  describe('refs.outgoing', () => {
    it('undefined (not a formula)', async () => {
      const ctx = testContext({
        A2: { value: 123 },
      });
      const res = await refs.outgoing({ key: 'A2', ctx });
      expect(res).to.eql([]);
    });

    it('REF: A1 => A2', async () => {
      const ctx = testContext({
        A1: { value: '=A$2' },
        A2: { value: 123 },
      });
      const res = await refs.outgoing({ key: 'A1', ctx });
      const ref = res[0] as t.IRefOut;

      expect(res.length).to.eql(1);
      expect(ref.target).to.eql('VALUE');
      expect(ref.path).to.eql('A1/A2');
      expect(ref.param).to.eql(undefined);
    });

    it('REF: A1 => A2 => A3', async () => {
      const ctx = testContext({
        A1: { value: '=A$2' },
        A2: { value: '=$A3' },
        A3: { value: 123 },
      });
      const res = await refs.outgoing({ key: 'A1', ctx });
      const ref = res[0] as t.IRefOut;

      expect(res.length).to.eql(1);
      expect(ref.target).to.eql('VALUE');
      expect(ref.path).to.eql('A1/A2/A3');
    });

    it('REF: A1 => A1 (ERROR/CIRCULAR)', async () => {
      const ctx = testContext({
        A1: { value: '=A1' },
      });
      const res = await refs.outgoing({ key: 'A1', ctx });
      const error = res[0].error as t.IRefError;

      expect(res.length).to.eql(1);
      expect(res[0].path).to.eql('A1/A1');
      expect(error.type).to.eql('CIRCULAR');
    });

    it('REF: A1 => A2 => A3 => A1 (ERROR/CIRCULAR)', async () => {
      const ctx = testContext({
        A1: { value: '=A2' },
        A2: { value: '=A3' },
        A3: { value: '=A1' },
      });
      const res = await refs.outgoing({ key: 'A1', ctx });
      const error = res[0].error as t.IRefError;

      expect(res.length).to.eql(1);
      expect(res[0].path).to.eql('A1/A2/A3/A1');
      expect(error.type).to.eql('CIRCULAR');
    });

    it('REF: A1 => B (ERROR/NAME)', async () => {
      const ctx = testContext({
        A1: { value: '=A2' },
        A2: { value: '=B' },
      });
      const res = await refs.outgoing({ key: 'A1', ctx });
      const error = res[0].error as t.IRefError;

      expect(res.length).to.eql(1);
      expect(res[0].path).to.eql('A1/A2/B');
      expect(res[0].target).to.eql('UNKNOWN');

      expect(error.type).to.eql('NAME');
      expect(error.message).to.include('Unknown range: B');
    });

    it('REF: A1 => A2(func)', async () => {
      const ctx = testContext({
        A1: { value: '=A2' },
        A2: { value: '=SUM(1,2,3)' },
      });
      const res = await refs.outgoing({ key: 'A1', ctx });

      expect(res.length).to.eql(1);
      expect(res[0].target).to.eql('FUNC');
      expect(res[0].path).to.eql('A1/A2');
    });

    it('FUNC: =SUM(A2, 10, A3)', async () => {
      const ctx = testContext({
        A1: { value: '=SUM(A2, 10, A3)' },
        A2: { value: 123 },
        A3: { value: '=A4' },
        A4: { value: 456 },
      });
      const res = await refs.outgoing({ key: 'A1', ctx });

      expect(res.length).to.eql(2);

      expect(res[0].target).to.eql('VALUE');
      expect(res[0].param).to.eql(0);
      expect(res[0].path).to.eql('A1/A2');

      expect(res[1].target).to.eql('VALUE');
      expect(res[1].param).to.eql(2);
      expect(res[1].path).to.eql('A1/A3/A4');
    });

    it('FUNC to types: =SUM(..) => FUNC | VALUE | RANGE | FUNC', async () => {
      const ctx = testContext({
        A1: { value: '=SUM(999, A2, A3, A3:A4, A5)' },
        A2: { value: '=SUM(A3, 999)' },
        A3: { value: 1 },
        A4: { value: 2 },
        A5: { value: '=A4+2' },
      });
      const res = await refs.outgoing({ key: 'A1', ctx });

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

    it.skip('FUNC => range (ERROR/CIRCULAR)', async () => {
      // TEMP 🐷
    });

    it('FUNC (binary expression): =A2+5', async () => {
      const ctx = testContext({
        A1: { value: '=5 + A2 / (8 + A3)' },
        A2: { value: 1 },
        A3: { value: 2 },
      });
      const res = await refs.outgoing({ key: 'A1', ctx });
      expect(res.length).to.eql(2);

      expect(res[0].target).to.eql('FUNC');
      expect(res[0].path).to.eql('A1/A2');

      expect(res[1].target).to.eql('FUNC');
      expect(res[1].path).to.eql('A1/A3');
    });

    it.skip('FUNC (binary expression): =A2+A3 => A3', async () => {
      const ctx = testContext({
        A1: { value: '=A2+10+A3' },
        A2: { value: '=A3' },
        A3: { value: 3 },
      });
      const res = await refs.outgoing({ key: 'A1', ctx });
      // const ref = res[0] as t.IRefOut;
    });

    it.skip('FUNC (binary expression): =1+2', async () => {
      const ctx = testContext({
        A1: { value: '=1+2' },
      });
      const res = await refs.outgoing({ key: 'A1', ctx });
      // const ref = res[0] as t.IRefOut;
      // TEMP 🐷
    });

    it.skip('FUNC (binary expression, immediate ERROR/CIRCULAR): =A1+5', async () => {
      const ctx = testContext({
        A1: { value: '=A1+5' },
      });
      const res = await refs.outgoing({ key: 'A1', ctx });

      console.log('-------------------------------------------');
      console.log('res', res);
      // const ref = res[0] as t.IRefOut;
    });

    it.skip('FUNC (binary expression, immediate ERROR/CIRCULAR): =A1+5', async () => {
      const ctx = testContext({
        A1: { value: '=A2 + 5' },
        A2: { value: '=A1' },
      });
      const res = await refs.outgoing({ key: 'A1', ctx });
      // const ref = res[0] as t.IRefOut;
      // TEMP 🐷
    });

    it('REF/RANGE: A1 => B1:B9', async () => {
      const ctx = testContext({
        A1: { value: '=$B1:B$9' },
      });
      const res = await refs.outgoing({ key: 'A1', ctx });
      expect(res.length).to.eql(1);
      expect(res[0].target).to.eql('RANGE');
      expect(res[0].path).to.eql('A1/B1:B9');
    });

    it.skip('REF/RANGE (ERROR/CIRCULAR)', async () => {
      // TEMP 🐷
    });
  });
});
