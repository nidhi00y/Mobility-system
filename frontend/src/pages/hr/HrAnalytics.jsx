import { useEffect, useMemo, useState } from 'react';
import { Activity, CalendarRange, ChartNoAxesCombined, Search, UsersRound } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';

const periodOptions = [
  { value: 'year', label: 'Yearly' },
  { value: 'quarter', label: 'Quarterly' },
  { value: 'month', label: 'Monthly' },
];

const chartColors = {
  booked: '#51245f',
  pooled: '#188477',
  rejected: '#c24d45',
  confirmed: '#33845a',
  grid: '#ececf0',
  axis: '#777783',
};

export default function HrAnalytics() {
  const [period, setPeriod] = useState('month');
  const [analytics, setAnalytics] = useState({ timeline: [], employees: [] });
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);
    setError('');
    api.get('/hr/analytics', { params: { period } })
      .then((response) => {
        if (!isCurrent) return;
        setAnalytics({
          timeline: response.data.timeline || [],
          employees: response.data.employees || [],
        });
      })
      .catch(() => {
        if (isCurrent) setError('Unable to load analytics. Please refresh and try again.');
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });
    return () => { isCurrent = false; };
  }, [period]);

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();
    return analytics.employees.filter((employee) =>
      [employee.employee_id, employee.name, employee.department]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [analytics.employees, search]);

  const totals = useMemo(() => analytics.timeline.reduce((summary, item) => ({
    booked: summary.booked + Number(item.booked || 0),
    pooled: summary.pooled + Number(item.pooled || 0),
    rejected: summary.rejected + Number(item.rejected || 0),
    confirmed: summary.confirmed + Number(item.confirmed || 0),
  }), { booked: 0, pooled: 0, rejected: 0, confirmed: 0 }), [analytics.timeline]);

  const employeeTotals = useMemo(() => analytics.employees.reduce((summary, employee) => ({
    booked: summary.booked + Number(employee.booked || 0),
    pooled: summary.pooled + Number(employee.pooled || 0),
    rejected: summary.rejected + Number(employee.rejected || 0),
    confirmed: summary.confirmed + Number(employee.confirmed || 0),
  }), { booked: 0, pooled: 0, rejected: 0, confirmed: 0 }), [analytics.employees]);

  const statCards = [
    { label: 'Bookings', value: totals.booked, icon: CalendarRange, tone: 'bg-[#f2edf4] text-[#51245f]' },
    { label: 'Pooled requests', value: totals.pooled, icon: UsersRound, tone: 'bg-[#e4f3f1] text-[#18786e]' },
    { label: 'Confirmed', value: totals.confirmed, icon: Activity, tone: 'bg-[#e6f5ec] text-[#18794e]' },
    { label: 'Rejected', value: totals.rejected, icon: ChartNoAxesCombined, tone: 'bg-[#fff0ee] text-[#b2473f]' },
  ];

  const chartTooltip = {
    contentStyle: { border: '1px solid #e3e4e8', borderRadius: 8, boxShadow: '0 8px 24px rgba(31,31,40,.08)' },
    labelStyle: { color: '#33333c', fontWeight: 600 },
  };

  return (
    <DashboardLayout role="HR" title="Travel Analytics">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <p className="page-intro max-w-2xl">Track booking volume, pooling activity, and request outcomes across the organization.</p>
        <div className="inline-flex rounded-lg border border-[#dedee4] bg-white p-1" role="group" aria-label="Analytics time period">
          {periodOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={period === option.value}
              onClick={() => setPeriod(option.value)}
              className={`min-h-9 rounded-md px-3 text-sm font-medium transition-colors ${period === option.value ? 'bg-[#51245f] text-white' : 'text-[#62626e] hover:bg-[#f5f5f7]'}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div role="alert" className="mb-4 rounded-lg border border-[#f0c9c6] bg-[#fff5f4] px-4 py-3 text-sm text-[#9f2f27]">{error}</div>}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="card flex min-h-28 items-start justify-between">
            <div>
              <p className="text-sm font-medium text-[#686875]">{stat.label}</p>
              <p className="mt-3 text-3xl font-semibold text-[#25252d]">{isLoading ? <span className="skeleton inline-block h-8 w-12 rounded" /> : stat.value}</p>
            </div>
            <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.tone}`}><stat.icon size={19} strokeWidth={1.8} /></span>
          </div>
        ))}
      </div>

      <section className="mb-6 rounded-xl border border-[#e3e4e8] bg-white p-5 shadow-[0_1px_2px_rgba(20,20,30,0.04)] sm:p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-2">
          <div><h2 className="text-base font-semibold text-[#33333c]">Bookings and pooling trend</h2><p className="mt-1 text-sm text-[#777783]">Requests by booking date, grouped {period === 'year' ? 'by year' : period === 'quarter' ? 'by quarter' : 'by month'}.</p></div>
          <span className="text-xs font-medium text-[#777783]">{analytics.timeline.length} periods</span>
        </div>
        {isLoading ? (
          <div className="skeleton h-[300px] rounded-lg" aria-label="Loading booking trend" />
        ) : analytics.timeline.length === 0 ? (
          <div className="flex h-[300px] flex-col items-center justify-center rounded-lg bg-[#fafafc] text-center"><ChartNoAxesCombined size={25} className="mb-3 text-[#92929b]" /><p className="text-sm font-medium text-[#555560]">No booking activity yet</p><p className="mt-1 text-xs text-[#858590]">The trend will appear when requests are submitted.</p></div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.timeline} margin={{ top: 8, right: 8, left: -16, bottom: 4 }}>
              <CartesianGrid stroke={chartColors.grid} vertical={false} />
              <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fill: chartColors.axis, fontSize: 12 }} tickMargin={10} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: chartColors.axis, fontSize: 12 }} />
              <Tooltip {...chartTooltip} />
              <Legend verticalAlign="top" align="right" height={34} iconType="circle" />
              <Bar dataKey="booked" name="Bookings" fill={chartColors.booked} radius={[4, 4, 0, 0]} maxBarSize={44} />
              <Bar dataKey="pooled" name="Pooled" fill={chartColors.pooled} radius={[4, 4, 0, 0]} maxBarSize={44} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div><h2 className="text-base font-semibold text-[#33333c]">Request activity by employee</h2><p className="mt-1 text-sm text-[#777783]">Booking and decision counts grouped by employee ID.</p></div>
          <label className="relative w-full sm:w-72"><span className="sr-only">Search by employee ID or name</span><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#858590]" /><input className="input input-leading-icon" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search employee ID or name" /></label>
        </div>
        {isLoading ? (
          <div className="table-shell space-y-3 p-4" aria-label="Loading employee analytics">{[0, 1, 2, 3].map((row) => <div key={row} className="skeleton h-12 rounded-lg" />)}</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="table-shell p-5 text-sm text-[#777783]">{search ? 'No employees match this search.' : 'No employee booking data yet.'}</div>
        ) : (
          <div className="table-shell overflow-x-auto">
            <table className="enterprise-table min-w-[760px]">
              <thead><tr><th>Employee</th><th>Department</th><th>Bookings</th><th>Rejected</th><th>Confirmed</th><th>Pooled</th></tr></thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee.employee_id || employee.name}>
                    <td><p className="font-semibold text-[#393943]">{employee.name}</p><p className="mt-1 text-xs text-[#777783]">{employee.employee_id || 'No employee ID'}</p></td>
                    <td className="text-sm text-[#555560]">{employee.department || '—'}</td>
                    <td className="font-semibold text-[#3c3c45]">{employee.booked}</td>
                    <td><span className="status-badge status-rejected">{employee.rejected}</span></td>
                    <td><span className="status-badge status-confirmed">{employee.confirmed}</span></td>
                    <td><span className="status-badge status-pooled">{employee.pooled}</span></td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr className="bg-[#fafafc] font-semibold"><td colSpan="2">Visible employee totals</td><td>{filteredEmployees.reduce((sum, employee) => sum + Number(employee.booked || 0), 0)}</td><td>{filteredEmployees.reduce((sum, employee) => sum + Number(employee.rejected || 0), 0)}</td><td>{filteredEmployees.reduce((sum, employee) => sum + Number(employee.confirmed || 0), 0)}</td><td>{filteredEmployees.reduce((sum, employee) => sum + Number(employee.pooled || 0), 0)}</td></tr></tfoot>
            </table>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
