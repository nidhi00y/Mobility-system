import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ClipboardCheck, ClipboardList, Clock3 } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../services/api';

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ myRequests: null, approvals: null });
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/requests/my'), api.get('/manager/requests')])
      .then(([myResponse, approvalResponse]) => setStats({
        myRequests: (myResponse.data.requests || []).length,
        approvals: (approvalResponse.data.requests || []).length,
      }))
      .catch(() => setLoadError(true));
  }, []);

  return (
    <DashboardLayout role="MANAGER" title="Manager Dashboard">
      <p className="page-intro mb-6">Review team travel and manage requests from one workspace.</p>
    {loadError && <div role="alert" className="mb-4 rounded-lg border border-[#f0c9c6] bg-[#fff5f4] px-4 py-3 text-sm text-[#9f2f27]">Dashboard information is temporarily unavailable.</div>}
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { label: 'My requests', value: stats.myRequests, icon: ClipboardList, tone: 'bg-[#f2edf4] text-[#51245f]' },
          { label: 'Awaiting my review', value: stats.approvals, icon: Clock3, tone: 'bg-[#fff4db] text-[#a45a08]' },
        ].map((stat) => (
          <div key={stat.label} className="card flex items-start justify-between">
            <div><p className="text-sm font-medium text-[#686875]">{stat.label}</p><p className="mt-3 text-3xl font-semibold text-[#25252d]">{loadError ? '—' : stat.value ?? <span className="skeleton inline-block h-8 w-12 rounded" />}</p></div>
            <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.tone}`}><stat.icon size={19} /></span>
          </div>
        ))}
      </div>
      <section className="mt-8">
        <h2 className="mb-3 text-base font-semibold text-[#33333c]">Your workspace</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            { label: 'My requests', description: 'Submit a journey or review your requests', path: '/manager/requests', icon: ClipboardList },
            { label: 'Pending approvals', description: 'Review requests from your team', path: '/manager/approvals', icon: ClipboardCheck },
          ].map((item) => (
            <button key={item.path} className="group flex min-h-28 items-center gap-4 rounded-xl border border-[#e3e4e8] bg-white p-5 text-left transition hover:border-[#d4c4da] hover:shadow-sm" onClick={() => navigate(item.path)}>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f2edf4] text-[#51245f]"><item.icon size={19} /></span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-[#33333c]">{item.label}</span><span className="mt-1 block text-sm text-[#777783]">{item.description}</span></span>
              <ArrowRight size={17} className="text-[#858590] transition group-hover:translate-x-0.5 group-hover:text-[#51245f]" />
            </button>
          ))}
        </div>
      </section>
    </DashboardLayout>
  );
}
