import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChartNoAxesCombined, CheckCircle2, ClipboardCheck, Layers3, UsersRound } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../services/api';

export default function HrDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ pending: null, confirmed: null, pools: null, people: null });
  const [activePools, setActivePools] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/hr/requests'), api.get('/hr/pooling'), api.get('/users')])
      .then(([requestResponse, poolResponse, userResponse]) => {
        const requests = requestResponse.data.requests || [];
        const pools = (poolResponse.data.pools || []).filter((pool) => pool.status === 'ACTIVE');
        setActivePools(pools);
        setStats({
          pending: requests.filter((request) => request.status === 'PENDING_HR_APPROVAL').length,
          confirmed: new Set(requests
            .filter((request) => ['CONFIRMED', 'CARPOOLED'].includes(request.status))
            .map((request) => request.user_id)).size,
          pools: pools.length,
          people: (userResponse.data.users || []).length,
        });
      })
      .catch(() => setError('Dashboard information is temporarily unavailable.'));
  }, []);

  const statCards = [
    { label: 'Pending requests', value: stats.pending, icon: ClipboardCheck, tone: 'bg-[#fff4db] text-[#a45a08]' },
    { label: 'Active carpools', value: stats.pools, icon: Layers3, tone: 'bg-[#eaf0fc] text-[#3159a8]' },
    { label: 'Confirmed users', value: stats.confirmed, icon: CheckCircle2, tone: 'bg-[#e6f5ec] text-[#18794e]' },
    { label: 'People managed', value: stats.people, icon: UsersRound, tone: 'bg-[#f2edf4] text-[#51245f]' },
  ];

  return (
    <DashboardLayout role="HR" title="HR Dashboard">
      <div className="mb-6">
        <p className="page-intro">A clear view of your organization’s travel requests and pool activity.</p>
      </div>
      {error && <div role="alert" className="mb-4 rounded-lg border border-[#f0c9c6] bg-[#fff5f4] px-4 py-3 text-sm text-[#9f2f27]">{error}</div>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="card flex min-h-32 items-start justify-between">
            <div>
              <p className="text-sm font-medium text-[#686875]">{stat.label}</p>
              <p className="mt-3 text-3xl font-semibold tracking-normal text-[#25252d]">{stat.value ?? <span className="skeleton inline-block h-8 w-12 rounded" />}</p>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.tone}`}><stat.icon size={19} strokeWidth={1.8} /></div>
          </div>
        ))}
      </div>

      <section className="mt-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#33333c]">Active carpools</h2>
            <p className="mt-1 text-sm text-[#777783]">Current pools and the employees included in each one.</p>
          </div>
          <span className="status-badge status-pooled">{stats.pools ?? '…'} active</span>
        </div>
        {error ? (
          <div role="alert" className="table-shell p-5 text-sm text-[#9f2f27]">Unable to load active carpool details.</div>
        ) : stats.pools === null ? (
          <div className="table-shell space-y-3 p-4" aria-label="Loading active carpools">{[0, 1].map((row) => <div key={row} className="skeleton h-12 rounded-lg" />)}</div>
        ) : activePools.length === 0 ? (
          <div className="table-shell p-5 text-sm text-[#777783]">There are no active carpools right now.</div>
        ) : (
          <div className="table-shell overflow-x-auto">
            <table className="enterprise-table min-w-[760px]">
              <thead><tr><th>Pool</th><th>Journey</th><th>Travel date</th><th>Employees</th></tr></thead>
              <tbody>
                {activePools.map((pool) => (
                  <tr key={pool.id}>
                    <td><span className="font-semibold text-[#3c3c45]">Pool #{pool.id}</span><span className="mt-1 block text-xs text-[#858590]">Created by {pool.created_by_name}</span></td>
                    <td className="text-sm text-[#555560]">{pool.destination || 'Journey details unavailable'}</td>
                    <td className="text-sm text-[#555560]">{String(pool.travel_date).slice(0, 10)}<span className="mt-1 block text-xs text-[#858590]">{pool.pickup_time}</span></td>
                    <td>
                      <span className="status-badge status-pooled">{pool.member_count} {pool.member_count === 1 ? 'person' : 'people'}</span>
                      <p className="mt-1.5 max-w-sm text-xs leading-5 text-[#777783]">{pool.member_names?.length ? pool.member_names.join(', ') : 'No members listed'}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#33333c]">Work queues</h2>
          <span className="text-xs font-medium text-[#888892]">HR workspace</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Pending requests', description: 'Review and confirm submissions', path: '/hr/pending-requests', icon: ClipboardCheck },
            { label: 'All requests', description: 'Search request history and status', path: '/hr/all-requests', icon: Layers3 },
            { label: 'User management', description: 'Manage employee access', path: '/hr/users', icon: UsersRound },
            { label: 'Analytics', description: 'Explore booking and pooling trends', path: '/hr/analytics', icon: ChartNoAxesCombined },
          ].map((item) => (
            <button key={item.path} className="group flex min-h-28 items-start gap-4 rounded-xl border border-[#e3e4e8] bg-white p-5 text-left shadow-[0_1px_2px_rgba(20,20,30,0.04)] transition hover:-translate-y-0.5 hover:border-[#d4c4da] hover:shadow-md" onClick={() => navigate(item.path)}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f2edf4] text-[#51245f]"><item.icon size={19} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-[#33333c]">{item.label}</span>
                <span className="mt-1 block text-sm text-[#777783]">{item.description}</span>
              </span>
              <ArrowRight size={17} className="mt-1 text-[#92929b] transition group-hover:translate-x-0.5 group-hover:text-[#51245f]" />
            </button>
          ))}
        </div>
      </section>
    </DashboardLayout>
  );
}
