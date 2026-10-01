import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarPlus, CheckCircle2, ClipboardList, Clock3 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../services/api';

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    api.get('/requests/my')
      .then((response) => setRequests(response.data.requests || []))
      .catch(() => setLoadError(true))
      .finally(() => setIsLoading(false));
  }, []);

  const pendingCount = requests.filter((request) => request.status.startsWith('PENDING')).length;
  const confirmedCount = requests.filter((request) => ['CONFIRMED', 'CARPOOLED'].includes(request.status)).length;
  const stats = [
    { label: 'My requests', value: isLoading ? null : loadError ? '—' : requests.length, icon: ClipboardList, tone: 'bg-[#f2edf4] text-[#51245f]' },
    { label: 'Awaiting review', value: isLoading ? null : loadError ? '—' : pendingCount, icon: Clock3, tone: 'bg-[#fff4db] text-[#a45a08]' },
    { label: 'Confirmed', value: isLoading ? null : loadError ? '—' : confirmedCount, icon: CheckCircle2, tone: 'bg-[#e6f5ec] text-[#18794e]' },
  ];

  return (
    <DashboardLayout role="EMPLOYEE" title="Employee Dashboard">
      <div className="mb-6">
        <p className="text-lg font-semibold text-[#33333c]">Good to see you, {user?.name?.split(' ')[0] || 'colleague'}.</p>
        <p className="page-intro mt-1">Manage your travel requests and follow their status.</p>
      </div>
      {loadError && <div role="alert" className="mb-4 rounded-lg border border-[#f0c9c6] bg-[#fff5f4] px-4 py-3 text-sm text-[#9f2f27]">Unable to load your request summary.</div>}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="card flex items-start justify-between">
            <div><p className="text-sm font-medium text-[#686875]">{stat.label}</p><p className="mt-3 text-3xl font-semibold text-[#25252d]">{stat.value}</p></div>
            <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.tone}`}><stat.icon size={19} /></span>
          </div>
        ))}
      </div>
      <section className="mt-8 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <button className="group flex min-h-40 items-center justify-between rounded-xl bg-[#51245f] p-6 text-left text-white transition hover:bg-[#3f1b4a]" onClick={() => navigate('/employee/request')}>
          <span className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/10"><CalendarPlus size={23} /></span>
            <span><span className="block text-lg font-semibold">Submit a travel request</span><span className="mt-1 block text-sm text-white/75">Share your trip details for review</span></span>
          </span>
          <ArrowRight size={20} className="transition group-hover:translate-x-1" />
        </button>
        <button className="group flex min-h-40 items-center justify-between rounded-xl border border-[#e3e4e8] bg-white p-6 text-left transition hover:border-[#d4c4da] hover:shadow-sm" onClick={() => navigate('/employee/requests')}>
          <span className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#f2edf4] text-[#51245f]"><ClipboardList size={22} /></span>
            <span><span className="block text-base font-semibold text-[#33333c]">View my requests</span><span className="mt-1 block text-sm text-[#777783]">Review details and latest status</span></span>
          </span>
          <ArrowRight size={18} className="text-[#82828d] transition group-hover:translate-x-1 group-hover:text-[#51245f]" />
        </button>
      </section>
      <div className="mt-6 border-t border-[#e3e4e8] pt-4 text-sm text-[#777783]">
        Signed in as <span className="font-medium text-[#494953]">{user?.department || 'Employee'}</span>
      </div>
    </DashboardLayout>
  );
}
