import type { ConversionRow, InternshipApplication } from './types';

const INTERVIEW_STATUSES = new Set(['面试', 'Offer']);
const TERMINAL_STATUSES = new Set(['Offer', '已拒绝', '已结束']);

const toRate = (part: number, total: number) =>
  total === 0 ? 0 : Math.round((part / total) * 100);

export const hasResponse = (application: InternshipApplication) =>
  Boolean(application.responseAt);

export const reachedInterview = (application: InternshipApplication) =>
  INTERVIEW_STATUSES.has(application.status);

export const calculateHeadlineMetrics = (
  applications: InternshipApplication[],
  today = new Date(),
) => {
  const submitted = applications.filter((item) => item.status !== '准备投递');
  const responses = submitted.filter(hasResponse);
  const interviews = submitted.filter(reachedInterview);
  const dueFollowUps = applications.filter((item) => {
    if (!item.followUpAt || TERMINAL_STATUSES.has(item.status)) return false;
    const dueDate = new Date(`${item.followUpAt}T23:59:59`);
    return dueDate <= today;
  });

  return {
    total: applications.length,
    submitted: submitted.length,
    responses: responses.length,
    responseRate: toRate(responses.length, submitted.length),
    interviews: interviews.length,
    interviewRate: toRate(interviews.length, submitted.length),
    dueFollowUps: dueFollowUps.length,
  };
};

export const groupConversions = (
  applications: InternshipApplication[],
  key: 'source' | 'resumeVersion',
): ConversionRow[] => {
  const groups = new Map<string, InternshipApplication[]>();

  applications
    .filter((item) => item.status !== '准备投递')
    .forEach((item) => {
      const label = item[key] || '未填写';
      const current = groups.get(label) ?? [];
      current.push(item);
      groups.set(label, current);
    });

  return Array.from(groups.entries())
    .map(([label, items]) => {
      const responses = items.filter(hasResponse).length;
      const interviews = items.filter(reachedInterview).length;
      return {
        label,
        applications: items.length,
        responses,
        interviews,
        responseRate: toRate(responses, items.length),
        interviewRate: toRate(interviews, items.length),
      };
    })
    .sort((a, b) => b.applications - a.applications || a.label.localeCompare(b.label));
};

export const getDueFollowUps = (
  applications: InternshipApplication[],
  today = new Date(),
) => applications
  .filter((item) => {
    if (!item.followUpAt || TERMINAL_STATUSES.has(item.status)) return false;
    return new Date(`${item.followUpAt}T23:59:59`) <= today;
  })
  .sort((a, b) => a.followUpAt.localeCompare(b.followUpAt));
