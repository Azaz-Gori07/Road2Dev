import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useStore } from '../store/useStore';

export default function Dashboard() {
  const { user, token } = useStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    api.get('/api/dashboard')
      .then(res => setData(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div>Loading dashboard...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!data) return <div>Please login to view dashboard.</div>;

  return (
    <div className="container">
      <h1>Dashboard</h1>
      <div className="grid">
        <div className="card"><h3>Stats</h3><p>{data.stats || 'No stats available'}</p></div>
        <div className="card"><h3>Activity</h3><p>{data.activity || 'No recent activity'}</p></div>
      </div>
    </div>
  );
}