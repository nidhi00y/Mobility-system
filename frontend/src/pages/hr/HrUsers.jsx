import { useEffect, useState } from 'react';
import { Search, UserPlus, UsersRound } from 'lucide-react';
import api from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';

export default function HrUsers() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    name: '',
    employee_id: '',
    email: '',
    department: '',
    role: 'EMPLOYEE',
    manager_id: '',
    password: '',
  });

  const loadUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.users || []);
      setLoadError(false);
    } catch {
      setLoadError(true);
      setMessage('Unable to load users. Please refresh and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');
    try {
      await api.post('/users', { ...form, manager_id: form.manager_id ? Number(form.manager_id) : null });
      setForm({ name: '', employee_id: '', email: '', department: '', role: 'EMPLOYEE', manager_id: '', password: '' });
      setMessage('User created successfully.');
      await loadUsers();
    } catch {
      setMessage('Unable to create the user. Check the details and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const visibleUsers = users.filter((user) => [user.name, user.employee_id, user.email, user.department, user.role].filter(Boolean).join(' ').toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout role="HR" title="User Management">
      <div className="mb-5 flex items-end justify-between gap-3"><p className="page-intro">Create and review employee access for the mobility workspace.</p><span className="text-sm text-[#777783]">{users.length} users</span></div>
      {message && <div role="status" className="mb-4 rounded-lg border border-[#e3e4e8] bg-white px-4 py-3 text-sm text-[#555560]">{message}</div>}
      <section className="mb-7 rounded-xl border border-[#e3e4e8] bg-white p-5 shadow-[0_1px_2px_rgba(20,20,30,0.04)] sm:p-6">
        <div className="mb-5 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f2edf4] text-[#51245f]"><UserPlus size={19} /></span><div><h2 className="font-semibold text-[#33333c]">Create user</h2><p className="mt-0.5 text-sm text-[#777783]">Set up an employee or manager profile.</p></div></div>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="space-y-1.5 text-sm font-medium text-[#4e4e58]">Full name<input className="input" placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
          <label className="space-y-1.5 text-sm font-medium text-[#4e4e58]">Employee ID<input className="input" placeholder="Employee ID" value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} required /></label>
          <label className="space-y-1.5 text-sm font-medium text-[#4e4e58]">Work email<input className="input" type="email" placeholder="name@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
          <label className="space-y-1.5 text-sm font-medium text-[#4e4e58]">Department<input className="input" placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} required /></label>
          <label className="space-y-1.5 text-sm font-medium text-[#4e4e58]">Role<select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="EMPLOYEE">Employee</option><option value="MANAGER">Manager</option><option value="HR">HR</option></select></label>
          <label className="space-y-1.5 text-sm font-medium text-[#4e4e58]">Manager ID<input className="input" placeholder="Optional" value={form.manager_id} onChange={(e) => setForm({ ...form, manager_id: e.target.value })} /></label>
          <label className="space-y-1.5 text-sm font-medium text-[#4e4e58] sm:col-span-2 lg:col-span-3">Temporary password<input className="input max-w-xl" type="password" placeholder="Temporary password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></label>
          <div className="flex justify-end border-t border-[#ececf0] pt-4 sm:col-span-2 lg:col-span-3"><button className="btn-primary" type="submit" disabled={isSaving}><UserPlus size={16} />{isSaving ? 'Creating…' : 'Create user'}</button></div>
        </form>
      </section>
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><UsersRound size={18} className="text-[#686875]" /><h2 className="text-base font-semibold text-[#33333c]">Organization users</h2></div><label className="relative w-full sm:w-72"><span className="sr-only">Search users</span><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#858590]" /><input className="input input-leading-icon" placeholder="Search users" value={search} onChange={(event) => setSearch(event.target.value)} /></label></div>
        {isLoading ? <div className="table-shell space-y-3 p-4">{[0, 1, 2].map((row) => <div key={row} className="skeleton h-12 rounded-lg" />)}</div> : loadError ? <div role="alert" className="table-shell p-5 text-sm text-[#9f2f27]">Unable to load users. Please refresh and try again.</div> : visibleUsers.length === 0 ? <div className="table-shell p-5 text-sm text-[#777783]">No users match this search.</div> : (
          <div className="table-shell overflow-x-auto"><table className="enterprise-table min-w-[720px]"><thead><tr><th>Employee</th><th>Employee ID</th><th>Department</th><th>Role</th><th>Access</th></tr></thead><tbody>{visibleUsers.map((user) => <tr key={user.id}><td><p className="font-semibold text-[#393943]">{user.name}</p><p className="mt-1 text-xs text-[#777783]">{user.email}</p></td><td className="text-sm text-[#555560]">{user.employee_id || '—'}</td><td className="text-sm text-[#555560]">{user.department || '—'}</td><td><span className="rounded-md bg-[#f2f2f5] px-2 py-1 text-xs font-semibold text-[#565660]">{user.role}</span></td><td><span className="status-badge status-confirmed">Active</span></td></tr>)}</tbody></table></div>
        )}
      </section>
    </DashboardLayout>
  );
}
