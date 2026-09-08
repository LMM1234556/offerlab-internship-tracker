import type { RequirementEvidence } from './types';

const EVIDENCE_WEIGHTS = {
  有证据: 1,
  需补强: 0.5,
  无证据: 0,
} as const;

export const calculateEvidenceCoverage = (requirements: RequirementEvidence[]) => {
  if (requirements.length === 0) return 0;
  const total = requirements.reduce((sum, item) => sum + EVIDENCE_WEIGHTS[item.status], 0);
  return Math.round((total / requirements.length) * 100);
};
