import sets from '@/data/sets.json';
import type { Responses, Row, Source } from './survey.ts';

type Packed = { KA: string[]; KB: string[] } & Record<'U1' | 'U2', { A: unknown[][]; B: unknown[][] }>;
const S = sets as unknown as Packed;
const unpack = (keys: string[], rows: unknown[][]): Row[] =>
  rows.map((a) => { const o: Row = {}; keys.forEach((k, i) => { if (a[i] != null) o[k] = a[i]; }); return o; });

const U1: Responses = { A: unpack(S.KA, S.U1.A), B: unpack(S.KB, S.U1.B) };
const U2: Responses = { A: unpack(S.KA, S.U2.A), B: unpack(S.KB, S.U2.B) };
/** Simulated response sets. None of this is field data. */
export const DATASETS: Record<Exclude<Source, 'mine'>, Responses> = { U1, U2, both: { A: [...U1.A, ...U2.A], B: [...U1.B, ...U2.B] } };
