import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5500/api';

const InterviewSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const authToken = localStorage.getItem('auth_token');
    if (!authToken) {
      setError('Authentication required to view saved sessions.');
      setLoading(false);
      return;
    }

    fetch(`${API_BASE}/interview-sessions`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setSessions(data.data);
        } else {
          setError(data.message || 'Unable to load sessions.');
        }
      })
      .catch(() => setError('Unable to load sessions.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>All Interview Sessions</h1>
      </div>
      {loading && <p>Loading saved sessions...</p>}
      {error && <p>{error}</p>}
      {!loading && !error && sessions.length === 0 && <p>No saved interview sessions found.</p>}
      <div className="session-list">
        {sessions.map((session) => (
          <Link
            key={session._id || session.id}
            to={`/interview/session/${session._id || session.id}`}
            className="session-card"
          >
            <div className="session-row">
              <span>{session.title || 'Interview Session'}</span>
              <strong>{session.score ?? 0}%</strong>
            </div>
            <div className="session-row session-meta">
              <span>{session.field || 'Unknown field'}</span>
              <span>{session.type || 'N/A'}</span>
              <span>{session.status || 'draft'}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default InterviewSessions;
