import { useEffect, useState } from 'react';
import { CalendarDays, Inbox, MapPin } from 'lucide-react';
import api from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';

export default function EmployeeRequests() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const displayStatus = (status) => {
    if (status === 'CARPOOLED') return 'Confirmed - pooled';
    if (status === 'CONFIRMED') return 'Confirmed';
    return status.replaceAll('_', ' ');
  };

  useEffect(() => {
    api.get('/requests/my')
      .then((res) => setRequests(res.data.requests || []))
      .catch(() => setHasError(true))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <DashboardLayout role="EMPLOYEE" title="My Requests">
      <p className="page-intro mb-5">Track each submission and review its latest decision.</p>
      {hasError && <div role="alert" className="mb-4 rounded-lg border border-[#f0c9c6] bg-[#fff5f4] px-4 py-3 text-sm text-[#9f2f27]">Unable to load your requests. Please refresh and try again.</div>}
      {isLoading && (
        <div className="space-y-3" aria-label="Loading requests">{[0, 1, 2].map((row) => <div key={row} className="skeleton h-28 rounded-xl" />)}</div>
      )}
      {!isLoading && !hasError && requests.length === 0 ? (
        <div className="table-shell flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#f2edf4] text-[#51245f]"><Inbox size={22} /></span>
          <h2 className="font-semibold text-[#33333c]">No requests yet</h2>
          <p className="mt-1 text-sm text-[#777783]">Your submitted travel requests will appear here.</p>
        </div>
      ) : null}
      {!isLoading && !hasError && requests.length > 0 && (
        <div className="space-y-3">
          {requests.map((request) => {
            const badge = request.status === 'REJECTED' ? 'status-badge status-rejected' : request.status === 'CARPOOLED' ? 'status-badge status-pooled' : ['CONFIRMED', 'APPROVED'].includes(request.status) ? 'status-badge status-confirmed' : 'status-badge status-pending';
            return (
              <article key={request.id} className="rounded-xl border border-[#e3e4e8] bg-white p-5 shadow-[0_1px_2px_rgba(20,20,30,0.04)]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><h2 className="font-semibold text-[#33333c]">{request.destination}</h2><p className="mt-1 flex items-center gap-1.5 text-sm text-[#777783]"><CalendarDays size={14} />{String(request.travel_date).slice(0, 10)} · {request.pickup_time}</p></div>
                  <span className={badge}>{displayStatus(request.status)}</span>
                </div>
                <div className="mt-4 grid gap-3 border-t border-[#ececf0] pt-4 text-sm sm:grid-cols-2">
                  <p className="flex items-start gap-2 text-[#555560]"><MapPin size={15} className="mt-0.5 shrink-0 text-[#888892]" /><span><span className="text-[#888892]">Pickup</span><br />{request.pickup_location}</span></p>
                  <p className="text-[#555560]"><span className="text-[#888892]">Purpose</span><br />{request.purpose}</p>
                </div>
                {request.status === 'REJECTED' && request.rejection_reason && (
                  <div className="mt-4 rounded-lg border border-[#f0d1ce] bg-[#fff7f6] px-4 py-3">
                    <p className="text-xs font-semibold uppercase text-[#9f2f27]">Rejection reason</p>
                    <p className="mt-1 text-sm leading-5 text-[#57413f]">{request.rejection_reason}</p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
