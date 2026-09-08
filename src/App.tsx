import { useCallback, useEffect, useState } from 'react';
import ApplicationFormModal from './offerlab/ApplicationFormModal';
import ApplicationTable from './offerlab/ApplicationTable';
import DecisionOverview from './offerlab/DecisionOverview';
import { DEMO_APPLICATIONS } from './offerlab/demoData';
import { calculateEvidenceCoverage } from './offerlab/evidence';
import type { InternshipApplication } from './offerlab/types';
import './offerlab/offerlab.scss';

const STORAGE_KEY = 'offerlab_applications';
const MODE_KEY = 'offerlab_data_mode';
const STORAGE_VERSION = 2;

interface StoredData {
  version: number;
  applications: InternshipApplication[];
}

const isStoredData = (value: unknown): value is StoredData => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<StoredData>;
  return (candidate.version === 1 || candidate.version === STORAGE_VERSION)
    && Array.isArray(candidate.applications);
};

const normalizeApplication = (application: InternshipApplication): InternshipApplication => {
  const requirements = Array.isArray(application.requirements) ? application.requirements : [];
  return {
    ...application,
    requirements,
    evidenceCoverage: calculateEvidenceCoverage(requirements),
  };
};

const loadApplications = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEMO_APPLICATIONS;
    const parsed: unknown = JSON.parse(stored);
    return isStoredData(parsed)
      ? parsed.applications.map(normalizeApplication)
      : DEMO_APPLICATIONS;
  } catch {
    return DEMO_APPLICATIONS;
  }
};

const exportApplications = (applications: InternshipApplication[]) => {
  const columns: Array<{
    label: string;
    value: (application: InternshipApplication) => unknown;
  }> = [
    { label: '公司', value: (item) => item.company },
    { label: '岗位', value: (item) => item.role },
    { label: '方向', value: (item) => item.direction },
    { label: '城市', value: (item) => item.city },
    { label: '渠道', value: (item) => item.source },
    { label: '简历版本', value: (item) => item.resumeVersion },
    { label: '阶段', value: (item) => item.status },
    { label: '投递日期', value: (item) => item.appliedAt },
    { label: '首次回复', value: (item) => item.responseAt },
    { label: '跟进日期', value: (item) => item.followUpAt },
    { label: '证据覆盖度', value: (item) => item.evidenceCoverage },
    {
      label: 'JD要求与证据',
      value: (item) => item.requirements
        .map((requirement) => `${requirement.requirement}【${requirement.status}】→ ${requirement.evidence || '未填写证据'}`)
        .join(' | '),
    },
    { label: 'JD链接', value: (item) => item.jdUrl },
    { label: '备注', value: (item) => item.notes },
  ];
  const escapeCell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const rows = [
    columns.map(({ label }) => escapeCell(label)).join(','),
    ...applications.map((application) => columns
      .map(({ value }) => escapeCell(value(application)))
      .join(',')),
  ];
  const blob = new Blob([`\ufeff${rows.join('\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `OfferLab_投递记录_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

function App() {
  const [applications, setApplications] = useState<InternshipApplication[]>(loadApplications);
  const [activeView, setActiveView] = useState<'overview' | 'applications'>('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<InternshipApplication>();
  const [isDemo, setIsDemo] = useState(() => localStorage.getItem(MODE_KEY) !== 'local');

  useEffect(() => {
    const payload: StoredData = { version: STORAGE_VERSION, applications };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [applications]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingApplication(undefined);
  }, []);

  const openNewApplication = () => {
    setEditingApplication(undefined);
    setIsModalOpen(true);
  };

  const openEditApplication = (application: InternshipApplication) => {
    setEditingApplication(application);
    setIsModalOpen(true);
  };

  const saveApplication = (record: InternshipApplication) => {
    setApplications((current) => {
      const exists = current.some((item) => item.id === record.id);
      return exists
        ? current.map((item) => item.id === record.id ? record : item)
        : [record, ...current];
    });
    localStorage.setItem(MODE_KEY, 'local');
    setIsDemo(false);
    closeModal();
  };

  const deleteApplication = (record: InternshipApplication) => {
    if (!window.confirm(`确认删除“${record.company} · ${record.role}”吗？此操作不可撤销。`)) return;
    setApplications((current) => current.filter((item) => item.id !== record.id));
    localStorage.setItem(MODE_KEY, 'local');
    setIsDemo(false);
  };

  const resetDemo = () => {
    if (!window.confirm('载入演示数据会覆盖当前浏览器中的投递记录，确认继续吗？')) return;
    setApplications(DEMO_APPLICATIONS);
    localStorage.setItem(MODE_KEY, 'demo');
    setIsDemo(true);
    setActiveView('overview');
  };

  return (
    <div className="offerlab-app">
      <header className="app-header">
        <a className="brand" href="#top" aria-label="OfferLab 首页">
          <span className="brand-mark" aria-hidden="true">O</span>
          <span>
            <strong>OfferLab</strong>
            <small>实习投递决策助手</small>
          </span>
        </a>
        <nav aria-label="主导航">
          <button
            type="button"
            className={activeView === 'overview' ? 'active' : ''}
            onClick={() => setActiveView('overview')}
          >
            决策概览
          </button>
          <button
            type="button"
            className={activeView === 'applications' ? 'active' : ''}
            onClick={() => setActiveView('applications')}
          >
            投递管理
          </button>
        </nav>
        <button type="button" className="button button--primary header-action" onClick={openNewApplication}>
          ＋ 添加岗位
        </button>
      </header>

      <main id="top" className="app-main">
        <section className="hero">
          <div>
            <div className="hero-meta">
              <span>{isDemo ? '演示数据' : '本地数据'}</span>
              <span>数据仅保存在当前浏览器</span>
            </div>
            <h1>让每一次投递，<br /><em>都有证据可复盘。</em></h1>
            <p>
              跟踪岗位阶段，比较渠道与简历版本的真实转化，及时处理待跟进事项。
              指标只描述历史样本，不把小样本差异包装成确定结论。
            </p>
          </div>
          <div className="hero-actions">
            <button type="button" className="button button--primary" onClick={openNewApplication}>添加第一条记录</button>
            <button type="button" className="button button--ghost" onClick={() => exportApplications(applications)}>导出 CSV</button>
          </div>
        </section>

        {isDemo ? (
          <aside className="demo-notice">
            <span aria-hidden="true">i</span>
            <p><strong>当前展示匿名虚构数据。</strong> 公司、岗位和结果均用于产品演示，不代表真实投递或录用经历。</p>
          </aside>
        ) : null}

        {activeView === 'overview' ? (
          <DecisionOverview applications={applications} onEdit={openEditApplication} />
        ) : (
          <ApplicationTable
            applications={applications}
            onEdit={openEditApplication}
            onDelete={deleteApplication}
          />
        )}

        <section className="project-note">
          <div>
            <span className="eyebrow">BUILD NOTE</span>
            <h2>这是一个可解释的求职实验台，不是自动投递机器人。</h2>
          </div>
          <p>
            当前版本不抓取招聘平台、不自动填写申请表，也不使用 AI 编造简历经历。
            所有转化率都来自用户主动记录的数据，样本量和统计口径默认可见。
          </p>
          <button type="button" className="text-button" onClick={resetDemo}>重新载入演示数据</button>
        </section>
      </main>

      <footer className="app-footer">
        <span>OfferLab · 本地优先的求职复盘工具</span>
        <span>基于 MIT 开源项目二次开发</span>
      </footer>

      {isModalOpen ? (
        <ApplicationFormModal
          record={editingApplication}
          onClose={closeModal}
          onSave={saveApplication}
        />
      ) : null}
    </div>
  );
}

export default App;
