import { calculateHeadlineMetrics, getDueFollowUps, groupConversions } from './analytics';
import type { ConversionRow, InternshipApplication } from './types';

interface DecisionOverviewProps {
  applications: InternshipApplication[];
  onEdit: (application: InternshipApplication) => void;
}

function ConversionTable({ title, rows }: { title: string; rows: ConversionRow[] }) {
  return (
    <section className="panel conversion-panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">CONVERSION</span>
          <h2>{title}</h2>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="panel-placeholder">至少完成一次投递后才会计算转化率。</p>
      ) : (
        <div className="conversion-list">
          {rows.map((row) => (
            <div className="conversion-row" key={row.label}>
              <div className="conversion-row__title">
                <strong>{row.label}</strong>
                <span>{row.applications} 次投递</span>
              </div>
              <div className="conversion-row__metric">
                <span>回复率 {row.responseRate}%</span>
                <div className="mini-bar" aria-hidden="true"><span style={{ width: `${row.responseRate}%` }} /></div>
              </div>
              <div className="conversion-row__metric">
                <span>面试率 {row.interviewRate}%</span>
                <div className="mini-bar mini-bar--accent" aria-hidden="true"><span style={{ width: `${row.interviewRate}%` }} /></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function DecisionOverview({ applications, onEdit }: DecisionOverviewProps) {
  const metrics = calculateHeadlineMetrics(applications);
  const sourceRows = groupConversions(applications, 'source');
  const resumeRows = groupConversions(applications, 'resumeVersion');
  const dueFollowUps = getDueFollowUps(applications);

  return (
    <>
      <section className="metrics-grid" aria-label="核心投递指标">
        <article className="metric-card metric-card--dark">
          <span>全部岗位</span>
          <strong>{metrics.total}</strong>
          <small>其中 {metrics.submitted} 个已完成投递</small>
        </article>
        <article className="metric-card">
          <span>回复率</span>
          <strong>{metrics.responseRate}%</strong>
          <small>{metrics.responses} 次回复 / {metrics.submitted} 次投递</small>
        </article>
        <article className="metric-card">
          <span>面试转化率</span>
          <strong>{metrics.interviewRate}%</strong>
          <small>{metrics.interviews} 个岗位进入面试或 Offer</small>
        </article>
        <article className={`metric-card ${metrics.dueFollowUps > 0 ? 'metric-card--warning' : ''}`}>
          <span>需要跟进</span>
          <strong>{metrics.dueFollowUps}</strong>
          <small>{metrics.dueFollowUps > 0 ? '已到计划跟进日期' : '目前没有逾期事项'}</small>
        </article>
      </section>

      <div className="decision-grid">
        <ConversionTable title="渠道效果" rows={sourceRows} />
        <ConversionTable title="简历版本效果" rows={resumeRows} />
      </div>

      <section className="panel follow-up-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">NEXT ACTION</span>
            <h2>待跟进事项</h2>
            <p>只显示已到期且仍在进行中的岗位</p>
          </div>
        </div>
        {dueFollowUps.length === 0 ? (
          <p className="panel-placeholder">目前没有需要立即跟进的岗位。</p>
        ) : (
          <div className="follow-up-list">
            {dueFollowUps.map((application) => (
              <button key={application.id} type="button" onClick={() => onEdit(application)}>
                <span className="follow-up-date">{application.followUpAt}</span>
                <span>
                  <strong>{application.company} · {application.role}</strong>
                  <small>{application.notes || '尚未填写下一步行动'}</small>
                </span>
                <span aria-hidden="true">→</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <p className="metric-caveat">
        口径说明：回复率和面试率仅以“已完成投递”的岗位为分母；样本较少时，差异只能用于复盘，不能证明某个渠道或简历版本必然更优。
      </p>
    </>
  );
}
