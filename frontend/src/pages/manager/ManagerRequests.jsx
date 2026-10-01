import { useEffect, useState } from 'react';
import { CalendarDays, MapPin, Send } from 'lucide-react';
import api from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';

export default function ManagerRequests() {
  const [form, setForm] = useState({
    travel_date: '',
    pickup_location: '',
    destination: '',
    pickup_time: '',
    passenger_count: 1,
    purpose: '',
  });
  const [requests, setRequests] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const loadRequests = async () => {
    try {
      const response = await api.get('/requests/my');
      setRequests(response.data.requests || []);
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      await api.post('/requests', form);
      setForm({ travel_date: '', pickup_location: '', destination: '', pickup_time: '', passenger_count: 1, purpose: '' });
      setMessage('Request submitted for review.');
      await loadRequests();
    } catch {
      setMessage('Unable to submit your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const statusClass = (status) => status === 'REJECTED' ? 'status-badge status-rejected' : ['CONFIRMED', 'APPROVED'].includes(status) ? 'status-badge status-confirmed' : status === 'CARPOOLED' ? 'status-badge status-pooled' : 'status-badge status-pending';

  return (
    <DashboardLayout role="MANAGER" title="My Requests">
      <p className="page-intro mb-5">Submit a business journey and review the status of your requests.</p>
      {message && <div role="status" className="mb-4 rounded-lg border border-[#e3e4e8] bg-white px-4 py-3 text-sm text-[#555560]">{message}</div>}
      <form onSubmit={submit} className="rounded-xl border border-[#e3e4e8] bg-white p-5 shadow-[0_1px_2px_rgba(20,20,30,0.04)] sm:p-7">
        <div className="mb-5 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f2edf4] text-[#51245f]"><CalendarDays size={20} /></span><div><h2 className="font-semibold text-[#33333c]">Trip details</h2><p className="mt-0.5 text-sm text-[#777783]">Provide the itinerary and business purpose.</p></div></div>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm font-medium text-[#4e4e58]">Travel date<input type="date" className="input" value={form.travel_date} onChange={(e) => setForm({ ...form, travel_date: e.target.value })} required /></label>
          <label className="space-y-1.5 text-sm font-medium text-[#4e4e58]">Pickup time<input type="time" className="input" value={form.pickup_time} onChange={(e) => setForm({ ...form, pickup_time: e.target.value })} required /></label>
          <label className="space-y-1.5 text-sm font-medium text-[#4e4e58]">Pickup location<span className="relative block"><MapPin size={16} className="absolute left-3 top-3 text-[#8a8a94]" /><input type="text" className="input pl-9" value={form.pickup_location} onChange={(e) => setForm({ ...form, pickup_location: e.target.value })} required /></span></label>
          <label className="space-y-1.5 text-sm font-medium text-[#4e4e58]">Destination<input type="text" className="input" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} required /></label>
          <label className="space-y-1.5 text-sm font-medium text-[#4e4e58]">Passengers<input type="number" min="1" className="input" value={form.passenger_count} onChange={(e) => setForm({ ...form, passenger_count: Number(e.target.value) })} required /></label>
          <label className="space-y-1.5 text-sm font-medium text-[#4e4e58] sm:col-span-2">Business purpose<textarea rows="3" className="input min-h-24 resize-y" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} required /></label>
        </div>
        <div className="mt-6 flex justify-end border-t border-[#ececf0] pt-5"><button type="submit" className="btn-primary" disabled={submitting}><Send size={16} />{submitting ? 'Submitting…' : 'Submit request'}</button></div>
      </form>
      <section className="mt-8">
        <h2 className="mb-3 text-base font-semibold text-[#33333c]">Recent requests</h2>
        {isLoading ? <div className="table-shell space-y-3 p-4">{[0, 1, 2].map((row) => <div key={row} className="skeleton h-11 rounded-lg" />)}</div> : loadError ? <div role="alert" className="table-shell p-5 text-sm text-[#9f2f27]">Unable to load recent requests.</div> : requests.length === 0 ? <div className="table-shell p-5 text-sm text-[#777783]">No requests submitted yet.</div> : (
          <div className="table-shell overflow-x-auto"><table className="enterprise-table min-w-[620px]"><thead><tr><th>Destination</th><th>Travel date</th><th>Status</th></tr></thead><tbody>{requests.slice(0, 5).map((request) => <tr key={request.id}><td className="font-medium text-[#393943]">{request.destination}</td><td className="text-sm text-[#555560]">{String(request.travel_date).slice(0, 10)}</td><td><span className={statusClass(request.status)}>{request.status.replaceAll('_', ' ')}</span></td></tr>)}</tbody></table></div>
        )}
      </section>
    </DashboardLayout>
  );
}
