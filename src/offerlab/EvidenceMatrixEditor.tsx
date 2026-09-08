import { calculateEvidenceCoverage } from './evidence';
import {
  EVIDENCE_STATUSES,
  type EvidenceStatus,
  type RequirementEvidence,
} from './types';

interface EvidenceMatrixEditorProps {
  requirements: RequirementEvidence[];
  onChange: (requirements: RequirementEvidence[]) => void;
}

const createRequirement = (): RequirementEvidence => ({
  id: globalThis.crypto?.randomUUID?.() ?? `requirement-${Date.now()}`,
  requirement: '',
  evidence: '',
  status: '无证据',
});

export default function EvidenceMatrixEditor({ requirements, onChange }: EvidenceMatrixEditorProps) {
  const coverage = calculateEvidenceCoverage(requirements);

  const updateRequirement = (id: string, patch: Partial<RequirementEvidence>) => {
    onChange(requirements.map((item) => item.id === id ? { ...item, ...patch } : item));
  };

  return (
    <section className="evidence-editor" aria-labelledby="evidence-editor-title">
      <div className="evidence-editor__heading">
        <div>
          <span className="eyebrow">EVIDENCE MATRIX</span>
          <h3 id="evidence-editor-title">JD 要求—简历证据</h3>
          <p>逐条填写岗位要求，并关联简历中的真实经历。覆盖率由状态自动计算。</p>
        </div>
        <div className="evidence-editor__score">
          <strong>{coverage}%</strong>
          <span>{requirements.length} 项要求</span>
        </div>
      </div>

      {requirements.length === 0 ? (
        <div className="evidence-empty">
          <strong>尚未拆解 JD</strong>
          <p>建议只记录 3—6 项真正影响筛选的要求。</p>
        </div>
      ) : (
        <div className="evidence-list">
          {requirements.map((item, index) => (
            <article className="evidence-item" key={item.id}>
              <div className="evidence-item__index">{String(index + 1).padStart(2, '0')}</div>
              <div className="evidence-item__fields">
                <label>
                  <span>JD 核心要求</span>
                  <input
                    value={item.requirement}
                    onChange={(event) => updateRequirement(item.id, { requirement: event.target.value })}
                    placeholder="例如：熟练使用 SQL 完成多表分析"
                  />
                </label>
                <label>
                  <span>简历中的证据</span>
                  <textarea
                    value={item.evidence}
                    onChange={(event) => updateRequirement(item.id, { evidence: event.target.value })}
                    placeholder="例如：Olist 项目中建立订单级模型并完成独立复算"
                    rows={2}
                  />
                </label>
              </div>
              <div className="evidence-item__actions">
                <label>
                  <span>证据状态</span>
                  <select
                    value={item.status}
                    onChange={(event) => updateRequirement(item.id, { status: event.target.value as EvidenceStatus })}
                  >
                    {EVIDENCE_STATUSES.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => onChange(requirements.filter((requirement) => requirement.id !== item.id))}
                  aria-label={`删除第 ${index + 1} 项要求`}
                >
                  删除
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <button
        className="evidence-add"
        type="button"
        onClick={() => onChange([...requirements, createRequirement()])}
        disabled={requirements.length >= 8}
      >
        ＋ 添加 JD 要求 {requirements.length >= 8 ? '（最多 8 项）' : ''}
      </button>
    </section>
  );
}
