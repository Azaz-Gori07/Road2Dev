import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useZenuxAuth from '../hooks/useZenuxAuth';
import useAuth from '../hooks/useAuth';
import './InterviewHistory.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5500/api';

const InterviewHistory = () => {
  const navigate = useNavigate();
  const customAuth = useAuth();
  const zenuxAuth = useZenuxAuth();
  const isAuthenticated = customAuth.isAuthenticated || zenuxAuth.isAuthenticated;
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSessions = useCallback(async () => {
    const authToken = localStorage.getItem('auth_token');
    if (!authToken) {
      setError('Authentication required to view saved sessions.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/interview-sessions`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        setError(data?.message || 'Unable to load interview history.');
        setSessions([]);
      } else {
        setSessions(Array.isArray(data.data) ? data.data : []);
      }
    } catch {
      setError('Unable to load interview history.');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setError('Authentication required to view saved sessions.');
      setLoading(false);
      return;
    }
    fetchSessions();
  }, [fetchSessions, isAuthenticated]);

  useEffect(() => {
    const handleUpdate = () => fetchSessions();
    window.addEventListener('interview-sessions-updated', handleUpdate);
    return () => window.removeEventListener('interview-sessions-updated', handleUpdate);
  }, [fetchSessions]);

  const filteredSessions = useMemo(() => {
    if (!search.trim()) return sessions;
    const value = search.toLowerCase();
    return sessions.filter((session) => {
      return [session.title, session.field, session.stack, session.type, session.status]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(value));
    });
  }, [search, sessions]);

  const formatDate = (value) => {
    if (!value) return 'Unknown';
    return new Date(value).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const confirmDelete = async () => {
    if (!deleteCandidate) return;
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Authentication required to delete a session.');
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/interview-sessions/${deleteCandidate._id || deleteCandidate.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        setError(data?.message || 'Unable to delete session.');
      } else {
        setSessions((prev) => prev.filter((session) => session._id !== (deleteCandidate._id || deleteCandidate.id)));
        setDeleteCandidate(null);
        window.dispatchEvent(new Event('interview-sessions-updated'));
      }
    } catch {
      setError('Unable to delete session.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="page-container interview-history-page">
      <div className="page-header history-header">
        <div>
          <h1>Interview History</h1>
          <p>Browse saved interviews, review feedback, and open past sessions.</p>
        </div>
        <button className="history-button" onClick={fetchSessions}>
          Refresh History
        </button>
      </div>

      <div className="history-toolbar">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by title, field, stack, or status"
          className="history-search"
        />
        <div className="history-count">
          {loading ? 'Loading...' : `${filteredSessions.length} results`}
        </div>
      </div>

      {error && <div className="history-error">{error}</div>}
      {!loading && !error && filteredSessions.length === 0 && (
        <div className="history-empty">No interview history found.</div>
      )}

      <div className="history-grid">
        {filteredSessions.map((session) => (
          <div key={session._id || session.id} className="history-card">
            <div className="history-card-top">
              <div>
                <h2>{session.title || 'Interview Session'}</h2>
                <div className="history-meta">
                  <span>{session.field || 'Field'}</span>
                  <span>{session.stack || 'Stack'}</span>
                </div>
              </div>
              <span className={`history-status ${session.status?.toLowerCase() || 'draft'}`}>
                {session.status || 'Draft'}
              </span>
            </div>

            <div className="history-body">
              <div className="history-row">
                <span>Score</span>
                <strong>{session.score ?? 0}%</strong>
              </div>
              <div className="history-row">
                <span>Type</span>
                <strong>{session.type || 'N/A'}</strong>
              </div>
              <div className="history-row">
                <span>Date</span>
                <strong>{formatDate(session.updatedAt || session.createdAt)}</strong>
              </div>
            </div>

            <div className="history-actions">
              <button className="btn-secondary" onClick={() => navigate(`/interview/session/${session._id || session.id}`)}>
                Open
              </button>
              <button className="btn-danger" onClick={() => setDeleteCandidate(session)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {deleteCandidate && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Delete interview session?</h3>
            <p>
              "{deleteCandidate.title || 'Interview Session'}" will be removed permanently from your history and
              recent sidebar list.
            </p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setDeleteCandidate(null)} disabled={isDeleting}>
                Cancel
              </button>
              <button className="btn-danger" onClick={confirmDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting…' : 'Delete now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewHistory;
