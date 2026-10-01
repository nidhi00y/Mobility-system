import { useEffect, useState } from 'react';
import { Inbox } from 'lucide-react';
import api from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';

export default function HrPooling() {
  const [activePools, setActivePools] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    api.get('/hr/pooling')
      .then((response) => {
        setActivePools((response.data.pools || []).filter((pool) => pool.status === 'ACTIVE'));
      })
      .catch(() => setLoadError(true))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <DashboardLayout role="HR" title="Active Carpools">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <p className="page-intro">Review current pools and the employees included in each one.</p>
        {!isLoading && !loadError && <span className="status-badge status-pooled">{activePools.length} active</span>}
      </div>

      {isLoading ? (
        <div className="table-shell space-y-3 p-4" aria-label="Loading active carpools">
          {[0, 1, 2].map((row) => <div key={row} className="skeleton h-14 rounded-lg" />)}
        </div>
      ) : loadError ? (
        <div role="alert" className="table-shell p-5 text-sm text-[#9f2f27]">Unable to load active carpools. Please refresh and try again.</div>
      ) : activePools.length === 0 ? (
        <div className="table-shell flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#f2edf4] text-[#51245f]"><Inbox size={22} /></span>
          <h2 className="font-semibold text-[#33333c]">No active carpools</h2>
          <p className="mt-1 text-sm text-[#777783]">Confirmed pools will appear here with their members.</p>
        </div>
      ) : (
        <div className="table-shell overflow-x-auto">
          <table className="enterprise-table min-w-[760px]">
            <thead><tr><th>Pool</th><th>Journey</th><th>Travel date</th><th>Employees</th></tr></thead>
            <tbody>
              {activePools.map((pool) => (
                <tr key={pool.id}>
                  <td>
                    <span className="font-semibold text-[#3c3c45]">Pool #{pool.id}</span>
                    <span className="mt-1 block text-xs text-[#858590]">Created by {pool.created_by_name}</span>
                  </td>
                  <td className="text-sm text-[#555560]">{pool.destination || 'Journey details unavailable'}</td>
                  <td className="text-sm text-[#555560]">
                    {String(pool.travel_date).slice(0, 10)}
                    <span className="mt-1 block text-xs text-[#858590]">{pool.pickup_time}</span>
                  </td>
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
    </DashboardLayout>
  );
}
