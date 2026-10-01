import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CalendarDays, CheckCircle2, MapPin, Send, X } from 'lucide-react';
import api from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';

export default function EmployeeRequest() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    travel_date: '',
    pickup_location: '',
    destination: '',
    pickup_time: '',
    purpose: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(() => sessionStorage.getItem('employeeRequestFeedback') || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const response = await api.post('/requests', form);
      if (response.data.success) {
        const successMessage = 'Request submitted successfully and is awaiting approval.';
        setSuccess(successMessage);
        sessionStorage.setItem('employeeRequestFeedback', successMessage);
        setForm({
          travel_date: '',
          pickup_location: '',
          destination: '',
          pickup_time: '',
          purpose: '',
        });
      }
    } catch (err) {
      setError('Unable to submit your request. Please review the details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="EMPLOYEE" title="Request a Car">
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f2edf4] text-[#51245f]"><CalendarDays size={20} /></span>
          <div><h2 className="text-base font-semibold text-[#33333c]">Trip details</h2><p className="mt-1 text-sm text-[#777783]">Provide the date, route, and passenger information for your journey.</p></div>
        </div>
        <form onSubmit={handleSubmit} className="rounded-xl border border-[#e3e4e8] bg-white p-5 shadow-[0_1px_2px_rgba(20,20,30,0.04)] sm:p-7">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium text-[#4e4e58]">Travel date<input type="date" className="input" value={form.travel_date} onChange={(e) => setForm({ ...form, travel_date: e.target.value })} required /></label>
            <label className="space-y-1.5 text-sm font-medium text-[#4e4e58]">Pickup time<input type="time" className="input" value={form.pickup_time} onChange={(e) => setForm({ ...form, pickup_time: e.target.value })} required /></label>
            <label className="space-y-1.5 text-sm font-medium text-[#4e4e58]">Pickup location<span className="relative block"><MapPin size={16} className="absolute left-3 top-3 text-[#8a8a94]" /><input type="text" className="input input-leading-icon" value={form.pickup_location} onChange={(e) => setForm({ ...form, pickup_location: e.target.value })} required /></span></label>
            <label className="space-y-1.5 text-sm font-medium text-[#4e4e58]">Destination<input type="text" className="input" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} required /></label>
            <label className="space-y-1.5 text-sm font-medium text-[#4e4e58] sm:col-span-2">Business purpose<textarea className="input min-h-28 resize-y" rows="3" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} required /></label>
          </div>
          {error && <div role="alert" className="mt-5 flex items-start gap-2 rounded-lg border border-[#f0c9c6] bg-[#fff5f4] px-3 py-2.5 text-sm text-[#9f2f27]"><AlertCircle size={17} className="mt-0.5 shrink-0" />{error}</div>}
          {success && <div role="status" className="mt-5 flex items-center gap-2 rounded-lg border border-[#d9e7de] bg-[#f0f8f2] px-3 py-2.5 text-sm text-[#236343]"><CheckCircle2 size={17} className="shrink-0" /><span className="flex-1">{success}</span><button type="button" aria-label="Dismiss success message" className="rounded p-1 hover:bg-[#e4f1e8]" onClick={() => { setSuccess(''); sessionStorage.removeItem('employeeRequestFeedback'); }}><X size={16} /></button></div>}
          <div className="mt-6 flex flex-col-reverse justify-end gap-2 border-t border-[#ececf0] pt-5 sm:flex-row">
            <button type="button" className="btn-secondary" onClick={() => navigate('/employee/requests')}>View my requests</button>
            <button type="submit" className="btn-primary" disabled={submitting}><Send size={16} />{submitting ? 'Submitting…' : 'Submit request'}</button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
