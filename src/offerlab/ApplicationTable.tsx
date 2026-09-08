import { useDeferredValue, useMemo, useState } from 'react';
import { APPLICATION_STATUSES, type InternshipApplication } from './types';

interface ApplicationTableProps {
  applications: InternshipApplication[];
  onEdit: (application: InternshipApplication) => void;
  onDelete: (application: InternshipApplication) => void;
}

const statusTone: Record<string, string> = {
  准备投递: 'neutral',
  已投递: 'blue',
  笔试: 'purple',
  面试: 'orange',
  Offer: 'green',
  已拒绝: 'red',
  已结束: 'neutral',
};

export default function ApplicationTable({ applications, onEdit, onDelete }: ApplicationTableProps) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('全部阶段');
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const filteredApplications = useMemo(() => [...applications]
    .filter((application) => {
      const matchesStatus = status === '全部阶段' || application.status === status;
      const haystack = [
        application.company,
        application.role,
        application.direction,
        application.city,
        application.source,
        application.resumeVersion,
      ].join(' ').toLowerCase();
      return matchesStatus && haystack.includes(deferredQuery);
    })
    .sort((a, b) => b.appliedAt.localeCompare(a.appliedAt)), [applications, deferredQuery, status]);

  return (
    <section className="panel applications-panel" aria-labelledby="applications-title">
      <div className="section-heading applications-heading">
        <div>
          <span className="eyebrow">APPLICATIONS</span>
          <h2 id="applications-title">投递明细</h2>
          <p>共 {filteredApplications.length} 条符合当前条件</p>
        </div>
        <div className="table-filters">
          <label>
            <span className="visually-hidden">搜索投递记录</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索公司、岗位、渠道…"
            />
          </label>
          <label>
            <span className="visually-hidden">筛选投递阶段</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option>全部阶段</option>
              {APPLICATION_STATUSES.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </div>
      </div>

      {filteredApplications.length === 0 ? (
        <div className="empty-state">
          <strong>没有匹配的投递记录</strong>
          <p>调整筛选条件，或者添加一个新岗位。</p>
        </div>
      ) : (
        <div className="table-scroll">
          <table className="applications-table">
            <thead>
              <tr>
                <th>公司与岗位</th>
                <th>方向 / 城市</th>
                <th>渠道</th>
                <th>简历版本</th>
                <th>证据覆盖</th>
                <th>阶段</th>
                <th>投递日期</th>
                <th><span className="visually-hidden">操作</span></th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.map((application) => (
                <tr key={application.id}>
                  <td>
                    <strong>{application.company}</strong>
                    <span>{application.role}</span>
                  </td>
                  <td>
                    <strong>{application.direction}</strong>
                    <span>{application.city || '未填写城市'}</span>
                  </td>
                  <td>{application.source}</td>
                  <td>{application.resumeVersion}</td>
                  <td>
                    <div className="coverage-cell">
                      <div className="coverage-track" aria-hidden="true">
                        <span style={{ width: `${application.evidenceCoverage}%` }} />
                      </div>
                      <span>{application.evidenceCoverage}%</span>
                    </div>
                  </td>
                  <td><span className={`status-pill status-pill--${statusTone[application.status]}`}>{application.status}</span></td>
                  <td>{application.appliedAt}</td>
                  <td>
                    <div className="row-actions">
                      {application.jdUrl ? <a href={application.jdUrl} target="_blank" rel="noreferrer">JD</a> : null}
                      <button type="button" onClick={() => onEdit(application)}>编辑</button>
                      <button type="button" className="danger-link" onClick={() => onDelete(application)}>删除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
