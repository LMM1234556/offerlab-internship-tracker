export const APPLICATION_STATUSES = [
  '准备投递',
  '已投递',
  '笔试',
  '面试',
  'Offer',
  '已拒绝',
  '已结束',
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const EVIDENCE_STATUSES = ['有证据', '需补强', '无证据'] as const;
export type EvidenceStatus = (typeof EVIDENCE_STATUSES)[number];

export interface RequirementEvidence {
  id: string;
  requirement: string;
  evidence: string;
  status: EvidenceStatus;
}

export const JOB_DIRECTIONS = [
  '数据分析',
  '商业分析',
  '产品分析',
  '数据产品',
  '其他',
] as const;

export const APPLICATION_SOURCES = [
  'BOSS直聘',
  '牛客',
  '公司官网',
  '内推',
  '实习僧',
  '其他',
] as const;

export interface InternshipApplication {
  id: string;
  company: string;
  role: string;
  direction: string;
  city: string;
  source: string;
  resumeVersion: string;
  status: ApplicationStatus;
  appliedAt: string;
  responseAt: string;
  followUpAt: string;
  jdUrl: string;
  requirements: RequirementEvidence[];
  evidenceCoverage: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversionRow {
  label: string;
  applications: number;
  responses: number;
  interviews: number;
  responseRate: number;
  interviewRate: number;
}
