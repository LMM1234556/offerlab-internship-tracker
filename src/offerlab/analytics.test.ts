import { describe, expect, it } from 'vitest';
import { calculateHeadlineMetrics, getDueFollowUps, groupConversions } from './analytics';
import type { InternshipApplication } from './types';

const base: Omit<InternshipApplication, 'id' | 'source' | 'resumeVersion' | 'status'> = {
  company: '演示公司',
  role: '数据分析实习生',
  direction: '数据分析',
  city: '上海',
  appliedAt: '2026-09-01',
  responseAt: '',
  followUpAt: '',
  jdUrl: '',
  requirements: [],
  evidenceCoverage: 80,
  notes: '',
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

const records: InternshipApplication[] = [
  { ...base, id: '1', source: '内推', resumeVersion: 'V2', status: '面试', responseAt: '2026-09-03' },
  { ...base, id: '2', source: '内推', resumeVersion: 'V2', status: '已投递', followUpAt: '2026-09-05' },
  { ...base, id: '3', source: '官网', resumeVersion: 'V1', status: '准备投递' },
];

describe('OfferLab analytics', () => {
  it('excludes prepared applications from conversion denominators', () => {
    expect(calculateHeadlineMetrics(records, new Date('2026-09-08T23:59:59'))).toEqual({
      total: 3,
      submitted: 2,
      responses: 1,
      responseRate: 50,
      interviews: 1,
      interviewRate: 50,
      dueFollowUps: 1,
    });
  });

  it('groups submitted records by source', () => {
    expect(groupConversions(records, 'source')).toEqual([
      {
        label: '内推',
        applications: 2,
        responses: 1,
        interviews: 1,
        responseRate: 50,
        interviewRate: 50,
      },
    ]);
  });

  it('returns only due and non-terminal follow-ups', () => {
    expect(getDueFollowUps(records, new Date('2026-09-08T23:59:59')).map((item) => item.id)).toEqual(['2']);
  });
});
