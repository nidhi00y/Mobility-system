import { useEffect, useRef, useState } from 'react';
import { Check, CheckCircle2, Clock3, Inbox, MapPin, Search, UsersRound, X } from 'lucide-react';
import api from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';

export default function HrRequests({ view = 'all' }) {
  const [requests, setRequests] = useState([]);
  const [reasons, setReasons] = useState({});
  const [selected, setSelected] = useState([]);
  const [confirmingAction, setConfirmingAction] = useState('');
  const [message, setMessage] = useState(() => sessionStorage.getItem('hrRequestFeedback') || '');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [filters, setFilters] = useState({ search: '', department: '', location: '', date: '', status: '' });
  const selectAllRef = useRef(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const response = await api.get('/hr/requests');
      const nextRequests = response.data.requests || [];
      setRequests(nextRequests);
      setLoadError(false);
      return nextRequests;
    } catch {
      setLoadError(true);
      setMessage('Unable to load requests. Please refresh and try again.');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const reject = async (id) => {
    const rejectionReason = reasons[id]?.trim();
    if (!rejectionReason) {
      setMessage('Enter a rejection reason before rejecting this request.');
      return;
    }
    sessionStorage.removeItem('hrRequestFeedback');
    try {
      const response = await api.patch(`/hr/requests/${id}/reject`, { rejection_reason: rejectionReason });
      setReasons((current) => ({ ...current, [id]: '' }));
      const successMessage = response.data.message || 'Request rejected.';
      setMessage(successMessage);
      sessionStorage.setItem('hrRequestFeedback', successMessage);
      await loadRequests();
    } catch {
      setMessage('Unable to reject this request. Please try again.');
    }
  };

  const openConfirmation = (action, requestId = null) => {
    setConfirmDialog({ action, requestId });
  };

  const confirmSelected = async () => {
    if (!confirmDialog) return;
    const { action, requestId } = confirmDialog;
    const requestIds = action === 'single' ? [requestId] : selected;
    if (requestIds.length < (action === 'single' ? 1 : 2)) return;

    setConfirmingAction(action === 'single' ? `request:${requestId}` : action);
    setMessage('');
    sessionStorage.removeItem('hrRequestFeedback');
    try {
      const endpoint = action === 'single'
        ? `/hr/requests/${requestId}/confirm`
        : action === 'pool' ? '/hr/requests/confirm-pool' : '/hr/requests/confirm-all';
      const response = await api.post(endpoint, { requestIds });
      await loadRequests();
      if (action === 'single') {
        setSelected((current) => current.filter((id) => id !== requestId));
        const notification = response.data.emailNotifications;
        const successMessage = notification?.queued
          ? 'Request confirmed. The requester confirmation email is queued.'
          : notification?.skipped
            ? 'Request confirmed, but email is not configured.'
            : 'Request confirmed.';
        setMessage(successMessage);
        sessionStorage.setItem('hrRequestFeedback', successMessage);
      } else {
        setSelected([]);
        const confirmationMessage = action === 'pool'
          ? `${response.data.confirmed} requests confirmed and pooled.`
          : `${response.data.confirmed} requests confirmed individually.`;
        const delivery = response.data.emailNotifications;
        const deliveryMessage = delivery?.skipped
          ? ` Email notifications were skipped for ${delivery.skipped} request${delivery.skipped === 1 ? '' : 's'} because SMTP is not configured.`
          : delivery?.failed
            ? ` Email sent to ${delivery.sent} of ${delivery.total} requesters; ${delivery.failed} email${delivery.failed === 1 ? '' : 's'} failed.`
            : delivery?.queued
              ? ` Confirmation email queued for ${delivery.queued} request${delivery.queued === 1 ? '' : 's'}.`
              : '';
        setMessage(confirmationMessage + deliveryMessage);
        sessionStorage.setItem('hrRequestFeedback', confirmationMessage + deliveryMessage);
      }
      setConfirmDialog(null);
    } catch (error) {
      setMessage('Unable to process the selected requests. Please try again.');
    } finally {
      setConfirmingAction('');
    }
  };

  const toggleRequest = (request) => {
    if (selected.includes(request.id)) {
      setSelected(selected.filter((id) => id !== request.id));
      return;
    }

    setMessage('');
    setSelected([...selected, request.id]);
  };

  const displayStatus = (status) => ({
    CARPOOLED: 'Pooled',
    CONFIRMED: 'Confirmed',
    APPROVED: 'Approved',
    PENDING_HR_APPROVAL: 'Pending HR review',
    PENDING_MANAGER_APPROVAL: 'Pending manager',
    REJECTED: 'Rejected',
  }[status] || status.replaceAll('_', ' '));
  const statusClass = (status) => {
    if (status === 'REJECTED') return 'status-badge status-rejected';
    if (status === 'CARPOOLED') return 'status-badge status-pooled';
    if (status === 'CONFIRMED' || status === 'APPROVED') return 'status-badge status-confirmed';
    return 'status-badge status-pending';
  };
  const visibleRequests = view === 'pending'
    ? requests.filter((request) => request.status === 'PENDING_HR_APPROVAL')
    : requests;
  const departmentOptions = [...new Set(requests.map((request) => request.department).filter(Boolean))].sort();
  const locationOptions = [...new Set(requests.map((request) => request.pickup_location).filter(Boolean))].sort();
  const displayedRequests = visibleRequests.filter((request) => {
    const query = filters.search.trim().toLowerCase();
    const searchable = [request.employee_name, request.employee_id, request.department, request.pickup_location, request.destination]
      .filter(Boolean).join(' ').toLowerCase();
    return (!query || searchable.includes(query)) &&
      (!filters.department || request.department === filters.department) &&
      (!filters.location || request.pickup_location === filters.location) &&
      (!filters.date || String(request.travel_date).slice(0, 10) === filters.date) &&
      (!filters.status || request.status === filters.status);
  });
  const visiblePendingIds = displayedRequests
    .filter((request) => request.status === 'PENDING_HR_APPROVAL')
    .map((request) => request.id);
  const selectedPendingCount = visiblePendingIds.filter((id) => selected.includes(id)).length;
  const allPendingSelected = visiblePendingIds.length > 0 && selectedPendingCount === visiblePendingIds.length;
  const canPoolSelected = selectedPendingCount >= 2 && selectedPendingCount <= 4;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = selectedPendingCount > 0 && !allPendingSelected;
    }
  }, [selectedPendingCount, allPendingSelected]);

  const toggleSelectAll = (checked) => {
    setSelected((current) => checked
      ? [...new Set([...current, ...visiblePendingIds])]
      : current.filter((id) => !visiblePendingIds.includes(id)));
  };

  const updateFilter = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value }));
    setSelected([]);
  };

  const selectedEmployees = requests.filter((request) => selected.includes(request.id));
  const confirmationIsPool = confirmDialog?.action === 'pool';
  const confirmationCount = confirmDialog?.action === 'single' ? 1 : selected.length;

  return (
    <DashboardLayout role="HR" title={view === 'pending' ? 'Pending Requests' : 'All Requests'}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <p className="page-intro max-w-2xl">
          {view === 'pending'
            ? 'Review and confirm employee travel requests, individually or as a shared pool.'
            : 'Search and review request activity across the organization.'}
        </p>
        <span className="text-sm text-[#777783]">{displayedRequests.length} {displayedRequests.length === 1 ? 'request' : 'requests'}</span>
      </div>
      {message && <div role="status" className="mb-4 flex items-center gap-2 rounded-lg border border-[#d9e7de] bg-[#f0f8f2] px-4 py-3 text-sm text-[#236343]"><CheckCircle2 size={17} className="shrink-0" /><span className="flex-1">{message}</span><button type="button" aria-label="Dismiss status message" className="rounded p-1 hover:bg-[#e4f1e8]" onClick={() => { setMessage(''); sessionStorage.removeItem('hrRequestFeedback'); }}><X size={16} /></button></div>}
      <section aria-label="Request filters" className="mb-4 grid gap-3 rounded-xl border border-[#e3e4e8] bg-white p-4 md:grid-cols-2 xl:grid-cols-5">
        <label className="relative md:col-span-2 xl:col-span-1">
          <span className="sr-only">Search requests</span>
          <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#858590]" />
          <input className="input input-leading-icon" placeholder="Search people or trips" value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} />
        </label>
        <select className="input" aria-label="Filter by department" value={filters.department} onChange={(event) => updateFilter('department', event.target.value)}>
          <option value="">All departments</option>
          {departmentOptions.map((department) => <option key={department} value={department}>{department}</option>)}
        </select>
        <select className="input" aria-label="Filter by pickup location" value={filters.location} onChange={(event) => updateFilter('location', event.target.value)}>
          <option value="">All pickup locations</option>
          {locationOptions.map((location) => <option key={location} value={location}>{location}</option>)}
        </select>
        <input className="input" type="date" aria-label="Filter by date" value={filters.date} onChange={(event) => updateFilter('date', event.target.value)} />
        <select className="input" aria-label="Filter by status" value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
          <option value="">All statuses</option>
          {[...new Set(requests.map((request) => request.status))].map((status) => <option key={status} value={status}>{displayStatus(status)}</option>)}
        </select>
      </section>
      {isLoading ? (
        <div className="table-shell p-4" aria-label="Loading requests">
          <div className="space-y-4">{[0, 1, 2, 3, 4].map((row) => <div key={row} className="skeleton h-12 rounded-lg" />)}</div>
        </div>
      ) : loadError ? (
        <div role="alert" className="table-shell p-6 text-center text-sm text-[#9f2f27]">Unable to load requests. Please refresh and try again.</div>
      ) : displayedRequests.length === 0 ? (
        <div className="table-shell flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#f2edf4] text-[#51245f]">
            <Inbox size={22} strokeWidth={1.8} />
          </div>
          <h2 className="text-base font-semibold text-[#33333c]">{view === 'pending' && requests.every((request) => request.status !== 'PENDING_HR_APPROVAL') ? 'No pending requests' : 'No matching requests'}</h2>
          <p className="mt-1 max-w-sm text-sm text-[#777783]">{view === 'pending' && requests.every((request) => request.status !== 'PENDING_HR_APPROVAL') ? 'All current carpool requests have been processed.' : 'Try changing or clearing your filters.'}</p>
        </div>
      ) : (
      <>
      <div className={view === 'pending' ? 'table-shell hidden lg:block' : 'table-shell'}>
        <div className="overflow-x-auto">
          <table className="enterprise-table min-w-[980px]">
            <thead>
              <tr>
                <th>
                  {view === 'pending' ? (
                    <label className="flex items-center gap-2">
                      <input
                        ref={selectAllRef}
                        type="checkbox"
                        checked={allPendingSelected}
                        onChange={(event) => toggleSelectAll(event.target.checked)}
                        aria-label="Select all pending requests"
                      />
                      <span>Select All</span>
                    </label>
                  ) : 'Request'}
                </th>
                <th>Employee</th>
                <th>Department</th>
                <th>Journey</th>
                <th>Requested date</th>
                <th>Pickup time</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
                {displayedRequests.map((request) => (
                  <tr key={request.id} className={selected.includes(request.id) ? 'bg-[#f8f4fa]' : ''}>
                    <td>
                      {view === 'pending' && (
                        <input
                          type="checkbox"
                          className="h-5 w-5 cursor-pointer accent-sky-600"
                          aria-label={`Select ${request.employee_name}'s pending request`}
                          checked={selected.includes(request.id)}
                          onChange={() => toggleRequest(request)}
                        />
                      )}
                    </td>
                    <td>
                      <div className="font-semibold text-[#34343d]">{request.employee_name}</div>
                      <div className="mt-1 text-xs text-[#777783]">{request.employee_id || 'Employee ID unavailable'}</div>
                    </td>
                    <td className="text-sm text-[#555560]">{request.department || '—'}</td>
                    <td>
                      <div className="flex items-start gap-2 text-sm text-[#44444e]"><MapPin size={15} className="mt-0.5 shrink-0 text-[#82828d]" /><span>{request.pickup_location} <span className="text-[#9696a0">to</span> {request.destination}</span></div>
                    </td>
                    <td className="text-sm text-[#555560]">{String(request.travel_date).slice(0, 10)}</td>
                    <td className="text-sm text-[#555560]"><span className="inline-flex items-center gap-1.5"><Clock3 size={14} className="text-[#8b8b95]" />{request.pickup_time}</span></td>
                    <td><span className={statusClass(request.status)}>{displayStatus(request.status)}</span></td>
                    <td>
                      {view === 'pending' && request.status === 'PENDING_HR_APPROVAL' ? (
                        <div className="flex min-w-44 flex-col gap-2">
                          <input
                            className="input min-h-9"
                            aria-label={`Rejection reason for ${request.employee_name}`}
                            placeholder="Reason to reject"
                            value={reasons[request.id] || ''}
                            onChange={(event) => setReasons({ ...reasons, [request.id]: event.target.value })}
                          />
                          <div className="flex flex-wrap gap-2">
                            <button className="btn-primary min-h-9 px-3" onClick={() => openConfirmation('single', request.id)} disabled={Boolean(confirmingAction)}>
                              Confirm
                            </button>
                            <button className="btn-secondary min-h-9 px-3" onClick={() => reject(request.id)} disabled={Boolean(confirmingAction)}>
                              Reject
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      {view === 'pending' && (
        <div className="space-y-3 lg:hidden">
          {displayedRequests.map((request) => (
            <article key={request.id} className={`rounded-xl border border-[#e3e4e8] bg-white p-4 shadow-[0_1px_2px_rgba(20,20,30,0.04)] ${selected.includes(request.id) ? 'ring-1 ring-[#d4c4da]' : ''}`}>
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 shrink-0 accent-[#51245f]"
                  aria-label={`Select ${request.employee_name}'s pending request`}
                  checked={selected.includes(request.id)}
                  onChange={() => toggleRequest(request)}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-[#33333c]">{request.employee_name}</p>
                    <span className={statusClass(request.status)}>{displayStatus(request.status)}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-[#777783]">{request.employee_id || 'Employee ID unavailable'}{request.department ? ` · ${request.department}` : ''}</p>
                  <p className="mt-3 text-sm text-[#44444e]">{request.pickup_location} <span className="text-[#9696a0]">to</span> {request.destination}</p>
                  <p className="mt-1 text-xs text-[#777783]">{String(request.travel_date).slice(0, 10)} · {request.pickup_time}</p>
                  <label className="mt-3 block">
                    <span className="sr-only">Rejection reason for {request.employee_name}</span>
                    <input
                      className="input min-h-9"
                      placeholder="Reason to reject"
                      value={reasons[request.id] || ''}
                      onChange={(event) => setReasons({ ...reasons, [request.id]: event.target.value })}
                    />
                  </label>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button className="btn-primary w-full" onClick={() => openConfirmation('single', request.id)} disabled={Boolean(confirmingAction)}>Confirm</button>
                    <button className="btn-secondary w-full" onClick={() => reject(request.id)} disabled={Boolean(confirmingAction)}>Reject</button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      </>
      )}
      {view === 'pending' && (
        <div className="sticky bottom-0 z-10 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e3e4e8] bg-white px-4 py-3 shadow-[0_8px_24px_rgba(31,31,40,0.08)]">
          <span className="text-sm font-semibold text-[#3c3c45]">Selected: {selectedPendingCount} {selectedPendingCount === 1 ? 'request' : 'requests'}</span>
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary" onClick={() => openConfirmation('all')} disabled={selectedPendingCount < 2 || Boolean(confirmingAction)}>
              {confirmingAction === 'all' ? <><span className="skeleton h-3 w-3 rounded-full" />Confirming...</> : 'Confirm All'}
            </button>
            <button className="btn-primary" onClick={() => openConfirmation('pool')} disabled={!canPoolSelected || Boolean(confirmingAction)}>
              {confirmingAction === 'pool' ? <><span className="skeleton h-3 w-3 rounded-full" />Confirming...</> : 'Confirm & Pool'}
            </button>
          </div>
          {selectedPendingCount > 4 && <span className="w-full text-right text-xs text-slate-500">A pool can contain up to 4 requests.</span>}
        </div>
      )}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17151a]/40 p-4" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-md rounded-xl border border-[#e3e4e8] bg-white p-6 shadow-2xl">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#f2edf4] text-[#51245f]">
              {confirmationIsPool ? <UsersRound size={19} /> : <Check size={19} />}
            </div>
            <h2 id="confirm-title" className="text-lg font-semibold text-[#292832]">
              {confirmDialog.action === 'single' ? 'Confirm this request?' : confirmationIsPool ? `Confirm and pool ${confirmationCount} requests?` : `Confirm ${confirmationCount} selected requests?`}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#686875]">
              {confirmationIsPool
                ? 'All selected employees will be confirmed together as one shared pool.'
                : 'Each selected request will be confirmed individually.'}
            </p>
            <ul className="my-4 max-h-32 space-y-1 overflow-y-auto rounded-lg bg-[#f8f8fa] px-3 py-2 text-sm text-[#494953]">
              {(confirmDialog.action === 'single' ? requests.filter((request) => request.id === confirmDialog.requestId) : selectedEmployees).map((request) => (
                <li key={request.id}>{request.employee_name}</li>
              ))}
            </ul>
            <div className="mt-6 flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setConfirmDialog(null)} disabled={Boolean(confirmingAction)}>
                <X size={16} />Cancel
              </button>
              <button className="btn-primary" onClick={confirmSelected} disabled={Boolean(confirmingAction)}>
                {confirmingAction ? 'Confirming...' : 'Confirm'}
              </button>
            </div>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}
