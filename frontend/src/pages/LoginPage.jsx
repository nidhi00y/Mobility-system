import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await login(form.email, form.password);
      if (response.success) {
        const role = response.user.role;
        navigate(role === 'EMPLOYEE' ? '/employee/dashboard' : role === 'MANAGER' ? '/manager/dashboard' : '/hr/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f5f7] lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(440px,0.9fr)]">
      <section className="hidden flex-col justify-between bg-[#51245f] px-12 py-10 text-white lg:flex xl:px-20">
        <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-sm font-bold">MI</span><span><span className="block text-sm font-semibold">Mondelez International</span><span className="text-xs text-white/70">Mobility services</span></span></div>
        <div className="max-w-lg py-16"><p className="mb-4 text-xs font-semibold uppercase text-white/65">Employee travel workspace</p><h1 className="text-4xl font-semibold leading-tight">Travel coordination, made clear.</h1><p className="mt-5 max-w-md text-base leading-7 text-white/75">A single place to request company travel, review approvals, and coordinate shared journeys.</p></div>
        <p className="text-xs text-white/60">Internal use · Secure access</p>
      </section>
      <main className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#51245f] text-sm font-bold text-white">MI</span><span><span className="block text-sm font-semibold text-[#33333c]">Mondelez International</span><span className="text-xs text-[#777783]">Mobility services</span></span></div>
          <div className="mb-7"><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#f2edf4] text-[#51245f]"><ShieldCheck size={20} /></div><h2 className="text-2xl font-semibold text-[#282831]">Sign in</h2><p className="mt-1.5 text-sm text-[#777783]">Use your company account to continue.</p></div>
          <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-[#e3e4e8] bg-white p-6 shadow-[0_2px_8px_rgba(20,20,30,0.04)] sm:p-8">
            <label className="block space-y-1.5 text-sm font-medium text-[#4e4e58]">Work email<input className="input" type="email" name="email" autoComplete="username" value={form.email} onChange={handleChange} required /></label>
            <label className="block space-y-1.5 text-sm font-medium text-[#4e4e58]">Password<input className="input" type="password" name="password" autoComplete="current-password" value={form.password} onChange={handleChange} required /></label>
            {error && <p role="alert" className="rounded-lg border border-[#f0c9c6] bg-[#fff5f4] px-3 py-2.5 text-sm text-[#9f2f27]">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={loading}>{loading ? 'Signing in…' : <>Continue <ArrowRight size={16} /></>}</button>
          </form>
          <p className="mt-5 text-center text-xs text-[#858590]">Your account is managed by your organization.</p>
        </div>
      </main>
      </div>
  );
}
