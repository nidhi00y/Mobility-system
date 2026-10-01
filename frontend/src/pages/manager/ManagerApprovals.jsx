import { useEffect, useState } from 'react';
import { Check, CheckCircle2, Inbox, X } from 'lucide-react';
import api from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';

export default function ManagerApprovals() {
  const [requests, setRequests] = useState([]);
  const [reasons, setReasons] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState(() => sessionStorage.getItem('managerApprovalFeedback') || '');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = () => {
    api.get('/manager/requests')
      .then((res) => { setRequests(res.data.requests || []); setLoadError(false); })
      .catch(() => { setLoadError(true); setMessage('Unable to load approvals. Please refresh and try again.'); })
      .finally(() => setIsLoading(false));
  };

  const approve = async (id) => {
    setBusyId(id);
    setMessage('');
    sessionStorage.removeItem('managerApprovalFeedback');
    try {
      await api.patch(`/manager/requests/${id}/approve`);
      const successMessage = 'Request approved and forwarded to HR for the final decision.';
      setMessage(successMessage);
      sessionStorage.setItem('managerApprovalFeedback', successMessage);
      loadRequests();
    } catch {
      setMessage('Unable to approve this request. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (id) => {
    if (!reasons[id]?.trim()) {
      setMessage('Add a rejection reason before rejecting a request.');
      return;
    }
    setBusyId(id);
    setMessage('');
    sessionStorage.removeItem('managerApprovalFeedback');
    try {
      const response = await api.patch(`/manager/requests/${id}/reject`, { rejection_reason: reasons[id] });
      setReasons((current) => ({ ...current, [id]: '' }));
      setMessage(response.data.message || 'Request rejected.');
      sessionStorage.setItem('managerApprovalFeedback', response.data.message || 'Request rejected.');
      loadRequests();
    } catch {
      setMessage('Unable to reject this request. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <DashboardLayout role="MANAGER" title="Pending Approvals">
      <div className="mb-5 flex items-end justify-between gap-3"><p className="page-intro">Review employee travel requests before forwarding them to HR.</p><span className="text-sm text-[#777783]">{requests.length} awaiting review</span></div>
      {message && <div role="status" className="mb-4 flex items-center gap-2 rounded-lg border border-[#d9e7de] bg-[#f0f8f2] px-4 py-3 text-sm text-[#236343]"><CheckCircle2 size={17} className="shrink-0" /><span className="flex-1">{message}</span><button type="button" aria-label="Dismiss status message" className="rounded p-1 hover:bg-[#e4f1e8]" onClick={() => { setMessage(''); sessionStorage.removeItem('managerApprovalFeedback'); }}><X size={16} /></button></div>}
      {isLoading ? (
        <div className="space-y-3" aria-label="Loading approvals">{[0, 1, 2].map((row) => <div key={row} className="skeleton h-32 rounded-xl" />)}</div>
      ) : loadError ? (
        <div role="alert" className="table-shell p-6 text-center text-sm text-[#9f2f27]">Unable to load approvals. Please refresh and try again.</div>
      ) : requests.length === 0 ? (
        <div className="table-shell flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center"><span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#f2edf4] text-[#51245f]"><Inbox size={22} /></span><h2 className="font-semibold text-[#33333c]">No pending approvals</h2><p className="mt-1 text-sm text-[#777783]">You’re up to date on your team’s requests.</p></div>
      ) : (
        <>
        <div className="table-shell hidden overflow-x-auto lg:block"><table className="enterprise-table min-w-[900px]"><thead><tr><th>Employee</th><th>Journey</th><th>Date & time</th><th>Purpose</th><th>Decision</th></tr></thead>
          <tbody>{requests.map((request) => (
            <tr key={request.id}>
              <td><p className="font-semibold text-[#34343d]">{request.employee_name}</p><p className="mt-1 text-xs text-[#777783]">{request.employee_email}</p></td>
              <td className="text-sm text-[#555560]">{request.pickup_location}<span className="px-1 text-[#9999a2]">to</span>{request.destination}</td>
              <td className="text-sm text-[#555560]">{String(request.travel_date).slice(0, 10)}<p className="mt-1 text-xs text-[#777783]">{request.pickup_time}</p></td>
              <td className="max-w-52 text-sm text-[#555560]">{request.purpose}</td>
              <td><div className="flex min-w-52 flex-col gap-2"><input className="input min-h-9" aria-label={`Rejection reason for ${request.employee_name}`} placeholder="Reason to reject" value={reasons[request.id] || ''} onChange={(event) => setReasons({ ...reasons, [request.id]: event.target.value })} /><div className="flex gap-2"><button className="btn-primary min-h-9 px-3" onClick={() => approve(request.id)} disabled={busyId === request.id}><Check size={15} />{busyId === request.id ? 'Approving…' : 'Approve'}</button><button className="btn-secondary min-h-9 px-3" onClick={() => reject(request.id)} disabled={busyId === request.id}><X size={15} />{busyId === request.id ? 'Working…' : 'Reject'}</button></div></div></td>
            </tr>
          ))}</tbody>
        </table></div>
        <div className="space-y-3 lg:hidden">
          {requests.map((request) => (
            <article key={request.id} className="rounded-xl border border-[#e3e4e8] bg-white p-4 shadow-[0_1px_2px_rgba(20,20,30,0.04)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><h2 className="font-semibold text-[#33333c]">{request.employee_name}</h2><p className="mt-0.5 break-all text-xs text-[#777783]">{request.employee_email}</p></div>
                <span className="status-badge status-pending shrink-0">Pending review</span>
              </div>
              <p className="mt-4 text-sm font-medium text-[#44444e]">{request.pickup_location} <span className="text-[#9696a0]">to</span> {request.destination}</p>
              <p className="mt-1 text-xs text-[#777783]">{String(request.travel_date).slice(0, 10)} · {request.pickup_time}</p>
              <p className="mt-3 border-t border-[#ececf0] pt-3 text-sm leading-5 text-[#555560]">{request.purpose}</p>
              <label className="mt-3 block"><span className="sr-only">Rejection reason for {request.employee_name}</span><input className="input" placeholder="Reason to reject" value={reasons[request.id] || ''} onChange={(event) => setReasons({ ...reasons, [request.id]: event.target.value })} /></label>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button className="btn-primary w-full" onClick={() => approve(request.id)} disabled={busyId === request.id}><Check size={16} />{busyId === request.id ? 'Approving…' : 'Approve'}</button>
                <button className="btn-secondary w-full" onClick={() => reject(request.id)} disabled={busyId === request.id}><X size={16} />{busyId === request.id ? 'Working…' : 'Reject'}</button>
              </div>
            </article>
          ))}
        </div>
        </>
      )}
    </DashboardLayout>
  );
}
