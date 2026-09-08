import { describe, expect, it } from 'vitest';
import { calculateEvidenceCoverage } from './evidence';

describe('evidence coverage', () => {
  it('returns zero when no JD requirements are recorded', () => {
    expect(calculateEvidenceCoverage([])).toBe(0);
  });

  it('weights strong, partial and missing evidence transparently', () => {
    expect(calculateEvidenceCoverage([
      { id: '1', requirement: 'SQL', evidence: 'Olist 多表分析', status: '有证据' },
      { id: '2', requirement: 'A/B 实验', evidence: '只有方案设计', status: '需补强' },
      { id: '3', requirement: '行业经验', evidence: '', status: '无证据' },
    ])).toBe(50);
  });

  it('rounds recurring percentages to the nearest integer', () => {
    expect(calculateEvidenceCoverage([
      { id: '1', requirement: 'SQL', evidence: '项目证据', status: '有证据' },
      { id: '2', requirement: '实验', evidence: '', status: '无证据' },
      { id: '3', requirement: '沟通', evidence: '', status: '无证据' },
    ])).toBe(33);
  });
});
