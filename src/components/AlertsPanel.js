import React from 'react';
import { useQuery } from '@tanstack/react-query';
import client from '../api/client';

export default function AlertsPanel() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const res = await client.get('/items/alerts');
      return res.data;
    },
    staleTime: 5 * 60_000, // 5 minutes
    retry: false,
    refetchOnWindowFocus: false
  });

  if (isLoading) return <div>Loading alerts...</div>;
  if (isError) return <div className="text-red-600">Failed to load alerts</div>;

  const alerts = Array.isArray(data) ? data : (data?.alerts || []);

  return (
    <div className="bg-white p-4 rounded shadow">
      <h4 className="font-semibold mb-2">AI Alerts</h4>
      {alerts.length === 0 ? (
        <div className="text-sm text-slate-500">No alerts</div>
      ) : (
        <ul className="space-y-2">
          {alerts.map((a, i) => (
            <li key={i} className="text-sm">• {a.message || a}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
