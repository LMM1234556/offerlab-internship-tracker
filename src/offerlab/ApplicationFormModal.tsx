import { FormEvent, useEffect, useRef, useState } from 'react';
import {
  APPLICATION_SOURCES,
  APPLICATION_STATUSES,
  JOB_DIRECTIONS,
  type ApplicationStatus,
  type InternshipApplication,
} from './types';
import { calculateEvidenceCoverage } from './evidence';
import EvidenceMatrixEditor from './EvidenceMatrixEditor';

interface ApplicationFormModalProps {
  record?: InternshipApplication;
  onClose: () => void;
  onSave: (record: InternshipApplication) => void;
}

const createBlankRecord = (): InternshipApplication => {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `application-${now.getTime()}`,
    company: '',
    role: '',
    direction: '数据分析',
    city: '',
    source: 'BOSS直聘',
    resumeVersion: '数据分析版 V1',
    status: '准备投递',
    appliedAt: today,
    responseAt: '',
    followUpAt: '',
    jdUrl: '',
    requirements: [],
    evidenceCoverage: 0,
    notes: '',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
};

export default function ApplicationFormModal({
  record,
  onClose,
  onSave,
}: ApplicationFormModalProps) {
  const [form, setForm] = useState<InternshipApplication>(() => record ?? createBlankRecord());
  const [error, setError] = useState('');
  const companyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    companyInputRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const update = <K extends keyof InternshipApplication>(
    key: K,
    value: InternshipApplication[K],
  ) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.company.trim() || !form.role.trim() || !form.appliedAt) {
      setError('请填写公司、岗位和投递日期。');
      return;
    }

    const requirements = form.requirements
      .filter((item) => item.requirement.trim())
      .map((item) => ({
        ...item,
        requirement: item.requirement.trim(),
        evidence: item.evidence.trim(),
      }));

    onSave({
      ...form,
      company: form.company.trim(),
      role: form.role.trim(),
      city: form.city.trim(),
      resumeVersion: form.resumeVersion.trim() || '未标记版本',
      requirements,
      evidenceCoverage: calculateEvidenceCoverage(requirements),
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div
      className="offerlab-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="offerlab-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="application-form-title"
      >
        <header className="offerlab-modal__header">
          <div>
            <span className="eyebrow">投递记录</span>
            <h2 id="application-form-title">{record ? '编辑岗位' : '添加岗位'}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="关闭表单" type="button">
            ×
          </button>
        </header>

        <form onSubmit={handleSubmit} className="offerlab-form">
          <div className="form-grid">
            <label>
              <span>公司 *</span>
              <input
                ref={companyInputRef}
                value={form.company}
                onChange={(event) => update('company', event.target.value)}
                placeholder="例如：某新能源汽车公司"
              />
            </label>
            <label>
              <span>岗位 *</span>
              <input
                value={form.role}
                onChange={(event) => update('role', event.target.value)}
                placeholder="例如：销售数据分析实习生"
              />
            </label>
            <label>
              <span>岗位方向</span>
              <select value={form.direction} onChange={(event) => update('direction', event.target.value)}>
                {JOB_DIRECTIONS.map((direction) => <option key={direction}>{direction}</option>)}
              </select>
            </label>
            <label>
              <span>城市</span>
              <input value={form.city} onChange={(event) => update('city', event.target.value)} placeholder="上海" />
            </label>
            <label>
              <span>投递渠道</span>
              <select value={form.source} onChange={(event) => update('source', event.target.value)}>
                {APPLICATION_SOURCES.map((source) => <option key={source}>{source}</option>)}
              </select>
            </label>
            <label>
              <span>简历版本</span>
              <input
                value={form.resumeVersion}
                onChange={(event) => update('resumeVersion', event.target.value)}
                placeholder="经营分析版 V2"
              />
            </label>
            <label>
              <span>当前阶段</span>
              <select
                value={form.status}
                onChange={(event) => update('status', event.target.value as ApplicationStatus)}
              >
                {APPLICATION_STATUSES.map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>
            <label>
              <span>投递日期 *</span>
              <input type="date" value={form.appliedAt} onChange={(event) => update('appliedAt', event.target.value)} />
            </label>
            <label>
              <span>首次回复日期</span>
              <input type="date" value={form.responseAt} onChange={(event) => update('responseAt', event.target.value)} />
            </label>
            <label>
              <span>计划跟进日期</span>
              <input type="date" value={form.followUpAt} onChange={(event) => update('followUpAt', event.target.value)} />
            </label>
            <label>
              <span>JD 链接</span>
              <input type="url" value={form.jdUrl} onChange={(event) => update('jdUrl', event.target.value)} placeholder="https://" />
            </label>
          </div>

          <EvidenceMatrixEditor
            requirements={form.requirements}
            onChange={(requirements) => update('requirements', requirements)}
          />

          <label className="form-full-width">
            <span>备注与下一步</span>
            <textarea
              value={form.notes}
              onChange={(event) => update('notes', event.target.value)}
              placeholder="记录岗位缺口、面试准备或跟进事项"
              rows={4}
            />
          </label>

          {error ? <p className="form-error" role="alert">{error}</p> : null}

          <footer className="offerlab-modal__footer">
            <button type="button" className="button button--ghost" onClick={onClose}>取消</button>
            <button type="submit" className="button button--primary">保存记录</button>
          </footer>
        </form>
      </section>
    </div>
  );
}
