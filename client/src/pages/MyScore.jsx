import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useZenuxAuth from "../hooks/useZenuxAuth";
import useAuth from "../hooks/useAuth";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5500/api';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
  @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
  --bg0: #000000;
  --bg1: #050505;
  --bg2: #0A0A0A;
  --bg3: #111111;

  --brd: #1A1A1A;
  --brd2: #242424;

  --t1: #FFFFFF;
  --t2: #A1A1AA;
  --t3: #71717A;

  --blue: #3B82F6;
  --green: #22C55E;
  --cyan: #06B6D4;
  --purple: #8B5CF6;
  --orange: #F97316;
  --yellow: #FACC15;
  --red: #EF4444;
}

  html, body, #root {
  width: 100%;
  height: 100%;
  overflow: hidden;

  background:
    radial-gradient(
      circle at top right,
      rgba(139,92,246,.08),
      transparent 30%
    ),
    #000;

  color: var(--t1);
  font-family: 'Outfit', sans-serif;
  font-size: 13px;
}

  .dash {
    display: grid;
    grid-template-rows: 52px 1fr;
    height: 100vh;
    background: var(--bg0);
    overflow: hidden;
  }

  /* TOPBAR */
  .topbar {
    padding: 0 24px;
    display: flex;
    background: #050505;
  border-bottom: 1px solid #151515;
    align-items: center;
    justify-content: space-between;
  }
  .topbar h1 { font-size: 20px; font-weight: 700; letter-spacing: -0.3px; }
  .topbar p  { font-size: 11.5px; color: var(--t2); margin-top: 1px; }
  .view-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 7px 14px;
    border: 1px solid var(--brd2);
    border-radius: 8px;
    background: var(--bg2);
    color: var(--t1);
    font-size: 12px; font-weight: 500;
    cursor: pointer;
    font-family: 'Outfit', sans-serif;
  }
  .view-btn i { color: var(--blue); font-size: 14px; }

  /* CONTENT GRID */
  .content {
    padding: 14px 20px;
    display: grid;
    grid-template-rows: auto auto auto;
    gap: 12px;
    overflow: hidden;
  }

  /* ROW 1 */
  .row1 { display: grid; grid-template-columns: 220px 1fr 1fr 1fr 1fr; gap: 10px; }

  .card,
.chart-card,
.bottom-card {
  background: #0A0A0A;
  border: 1px solid #1A1A1A;
  border-radius: 14px;
  padding: 14px;

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.03),
    0 8px 30px rgba(0,0,0,.45);

  transition: all .25s ease;
}

.card:hover,
.chart-card:hover,
.bottom-card:hover {
  transform: translateY(-2px);
  border-color: #2A2A2A;
}

  .overall-card { padding: 16px 18px; display: flex; flex-direction: column; align-items: flex-start; }
  .overall-label { font-size: 12px; font-weight: 600; margin-bottom: 10px; }
  .gauge-wrap { position: relative; width: 110px; height: 62px; margin: 0 auto 4px; }
  .gauge-val {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -10%);
    text-align: center;
  }
  .gauge-val .pct {
    display: block;
    font-family: 'JetBrains Mono', monospace;
    font-size: 22px; font-weight: 700;
    background: linear-gradient(135deg, var(--blue), var(--green));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .perf-label { font-size: 11px; color: var(--t2); text-align: center; width: 100%; margin-top: 2px; }
  .trend { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--green); margin-top: 6px; }
  .trend i { font-size: 12px; }

  .stat-card { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 4px; }
  .stat-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; margin-bottom: 4px; }
  .stat-val { font-family: 'JetBrains Mono', monospace; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
  .stat-title { font-size: 12px; color: var(--t2); font-weight: 500; }
  .stat-sub { font-size: 10.5px; color: var(--t3); }

  /* ROW 2 */
  .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .chart-card { background: var(--bg2); border: 1px solid var(--brd); border-radius: 12px; padding: 14px 16px; }
  .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  .card-title { font-size: 13px; font-weight: 600; }
  .dropdown {
    display: flex; align-items: center; gap: 5px;
    background: #111111;
  border: 1px solid #222222;
    border-radius: 7px; padding: 5px 10px;
    font-size: 11.5px; color: var(--t2); cursor: pointer;
    font-family: 'Outfit', sans-serif;
  }
  .dropdown i { font-size: 12px; }
  .chart-area { position: relative; height: 140px; }
  

  /* SKILL BARS */
  .skill-row { display: flex; align-items: center; gap: 8px; margin-bottom: 9px; }
  .skill-icon { width: 20px; height: 20px; border-radius: 5px; display: flex; align-items: center; justify-content: center; font-size: 11px; flex-shrink: 0; }
  .skill-name { width: 84px; font-size: 12px; color: var(--t2); flex-shrink: 0; }
  .skill-bar { flex: 1; height: 5px; background: var(--bg3); border-radius: 99px; overflow: hidden; }
  .skill-fill { height: 100%; border-radius: 99px; transition: width 1s cubic-bezier(.4,0,.2,1); }
  .skill-pct { font-size: 12px; font-weight: 600; width: 32px; text-align: right; flex-shrink: 0; }

  /* ROW 3 */
  .row3 { display: grid; grid-template-columns: 1.1fr 0.8fr 0.8fr 0.9fr; gap: 12px; }
  .bottom-card { background: var(--bg2); border: 1px solid var(--brd); border-radius: 12px; padding: 13px 14px; }

  /* RECENT INTERVIEWS */
  .view-all { font-size: 11px; color: var(--blue); cursor: pointer; font-weight: 500; background: none; border: none; font-family: 'Outfit', sans-serif; }
  .interview-row { display: flex; align-items: center; gap: 9px; padding: 7px 0; border-bottom: 1px solid var(--brd); }
  .interview-row:last-child { border-bottom: none; }
  .int-icon { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
  .int-info { flex: 1; min-width: 0; }
  .int-name { font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .int-sub { font-size: 10.5px; color: var(--t3); }
  .int-right { text-align: right; flex-shrink: 0; }
  .int-score { font-size: 13px; font-weight: 700; }
  .int-ago { font-size: 10px; color: var(--t3); }

  /* STRENGTHS / IMPROVE */
  .section-header { display: flex; align-items: center; gap: 6px; margin-bottom: 10px; }
  .section-header i { font-size: 15px; }
  .item-row { display: flex; align-items: flex-start; gap: 7px; margin-bottom: 8px; }
  .item-row i { font-size: 14px; margin-top: 1px; flex-shrink: 0; }
  .item-name { font-size: 12px; font-weight: 600; }
  .item-sub { font-size: 10.5px; color: var(--t3); }
  .keep-it-up { margin-top: 8px; padding: 7px 9px; background: rgba(34,211,126,.06); border-radius: 8px; font-size: 10.5px; color: var(--t2); }

  .focus-box { background: rgba(255,79,94,.07); border: 1px solid rgba(255,79,94,.2); border-radius: 9px; padding: 9px 11px; margin-top: 8px; display: flex; gap: 8px; align-items: flex-start; }
  .focus-icon { width: 28px; height: 28px; border-radius: 8px; background: rgba(255,79,94,.15); display: flex; align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0; }
  .focus-title { font-size: 11.5px; font-weight: 600; color: #ff7080; }
  .focus-sub { font-size: 10px; color: var(--t3); margin-top: 1px; }

  /* AI RECS */
  .ai-rec { display: flex; align-items: flex-start; gap: 8px; padding: 7px 0; border-bottom: 1px solid var(--brd); }
  .ai-rec:last-of-type { border-bottom: none; }
  .ai-rec-icon { width: 28px; height: 28px; border-radius: 8px; background: rgba(155,109,255,.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .ai-rec-text { flex: 1; min-width: 0; }
  .ai-rec-title { font-size: 11.5px; font-weight: 600; }
  .ai-rec-sub { font-size: 10px; color: var(--t3); margin-top: 1px; }
  .ai-rec-arr { color: var(--t3); font-size: 14px; margin-top: 4px; }
  .start-btn {
  width: 100%;
  margin-top: 10px;
  padding: 10px;

  background: linear-gradient(
    135deg,
    #8B5CF6,
    #6D28D9
  );

  border: none;
  border-radius: 10px;

  color: white;
  font-weight: 600;

  box-shadow:
    0 0 25px rgba(139,92,246,.25);

  transition: all .25s ease;
}

.start-btn:hover {
  transform: translateY(-2px);
  box-shadow:
    0 0 35px rgba(139,92,246,.4);
}
  .start-btn i { font-size: 14px; }
`;

// Live data containers - replaced static mocks

// ─── Gauge ───────────────────────────────────────────────────────────────────
function Gauge({ pct = 78 }) {
  const total = 143;
  const offset = total - (total * pct) / 100;
  return (
    <div className="gauge-wrap">
      <svg className="gauge-svg" viewBox="0 0 110 62">
        <defs>
          <linearGradient id="ggrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b8cff" />
            <stop offset="100%" stopColor="#22d37e" />
          </linearGradient>
        </defs>
        <path d="M10,58 A46,46 0 0,1 100,58" fill="none" stroke="#1f1f32" strokeWidth="9" strokeLinecap="round" />
        <path
          d="M10,58 A46,46 0 0,1 100,58"
          fill="none" stroke="url(#ggrad)" strokeWidth="9" strokeLinecap="round"
          strokeDasharray={total} strokeDashoffset={offset}
        />
      </svg>
      <div className="gauge-val">
        <span className="pct">{pct}%</span>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, iconBg, iconColor, value, title, sub }) {
  return (
    <div className="card stat-card">
      <div className="stat-icon" style={{ background: iconBg, color: iconColor }}>
        <i className={`ti ${icon}`} />
      </div>
      <div className="stat-val">{value}</div>
      <div className="stat-title">{title}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  );
}

// ─── Performance Chart (Canvas) ───────────────────────────────────────────────
function PerfChart({ sessions = [] }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    const loadChart = () => {
      if (!window.Chart || !canvasRef.current) return;
      if (chartRef.current) chartRef.current.destroy();

      // Sort sessions chronologically (oldest to newest) to show progress over time
      const sorted = [...sessions].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      const lastSix = sorted.slice(-6);
      
      let labels = lastSix.map(s => 
        new Date(s.updatedAt || s.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      );
      let dataPoints = lastSix.map(s => typeof s.score === 'number' ? s.score : 0);

      if (labels.length === 0) {
        labels = ["Start practicing"];
        dataPoints = [0];
      }

      const ctx = canvasRef.current.getContext("2d");
      const grad = ctx.createLinearGradient(0, 0, 0, 140);
      grad.addColorStop(0, "rgba(34,211,126,.18)");
      grad.addColorStop(1, "rgba(34,211,126,0)");

      chartRef.current = new window.Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [{
            data: dataPoints,
            borderColor: "#22d37e",
            borderWidth: 2,
            pointBackgroundColor: "#22d37e",
            pointBorderColor: "#08080e",
            pointBorderWidth: 2,
            pointRadius: 5,
            tension: 0.4,
            fill: true,
            backgroundColor: grad,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "#191927",
              borderColor: "#252538",
              borderWidth: 1,
              callbacks: { label: (c) => ` ${c.raw}%` },
            },
          },
          scales: {
            x: { grid: { color: "#1a1a28" }, ticks: { color: "#4a4a6e", font: { size: 10 } } },
            y: {
              grid: { color: "#1a1a28" },
              ticks: { color: "#4a4a6e", font: { size: 10 }, callback: (v) => v + "%" },
              min: 0, max: 100,
            },
          },
        },
      });
    };

    if (window.Chart) {
      loadChart();
    } else {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js";
      script.onload = loadChart;
      document.head.appendChild(script);
    }
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [sessions]);

  return (
    <div className="chart-area">
      <canvas ref={canvasRef} role="img" aria-label="Line chart of performance over time" />
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function MyScore() {
  const navigate = useNavigate();
  const customAuth = useAuth();
  const zenuxAuth = useZenuxAuth();
  const isAuthenticated = customAuth.isAuthenticated || zenuxAuth.isAuthenticated;
  const loading = customAuth.loading || zenuxAuth.loading;
  const [mounted, setMounted] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState('');
  const [avgScore, setAvgScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [recentScores, setRecentScores] = useState([]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/auth', { replace: true, state: { from: '/score' } });
    }
  }, [loading, isAuthenticated, navigate]);

  useEffect(() => setMounted(true), []);

  const fetchSessions = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setSessionsError('Authentication required');
      setSessionsLoading(false);
      return;
    }

    setSessionsLoading(true);
    setSessionsError('');
    try {
      const res = await fetch(`${API_BASE}/interview-sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setSessionsError(data?.message || 'Unable to load sessions');
        setSessions([]);
      } else {
        // Keep only completed interviews for My Score
        const completed = Array.isArray(data.data) ? data.data.filter(s => s.status === 'completed') : [];
        setSessions(completed);

        const scores = completed.map(s => (typeof s.score === 'number' ? s.score : 0));
        const total = scores.length;
        const avg = total ? Math.round(scores.reduce((a,b) => a+b, 0) / total) : 0;
        const best = total ? Math.max(...scores) : 0;

        setAvgScore(avg);
        setBestScore(best);
        setTotalCompleted(total);
        setRecentScores(scores.slice(-6));
      }
    } catch (err) {
      setSessionsError('Unable to load sessions');
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  }, [loading, isAuthenticated]);

  useEffect(() => {
    if (!loading && isAuthenticated) fetchSessions();
  }, [loading, isAuthenticated, fetchSessions]);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      window.addEventListener('interview-sessions-updated', fetchSessions);
      return () => {
        window.removeEventListener('interview-sessions-updated', fetchSessions);
      };
    }
  }, [loading, isAuthenticated, fetchSessions]);

  const computeSkills = () => {
    let totals = { accuracy: 0, technical: 0, communication: 0, confidence: 0 };
    let count = 0;

    sessions.forEach(session => {
      const feedbackMsgs = session.messages?.filter(m => m.type === 'feedback') || [];
      feedbackMsgs.forEach(msg => {
        if (msg.score) {
          totals.accuracy += msg.score.accuracy || 0;
          totals.technical += msg.score.technical || 0;
          totals.communication += msg.score.communication || 0;
          totals.confidence += msg.score.confidence || 0;
          count++;
        }
      });
    });

    const avg = (field) => count ? Math.round(totals[field] / count) : 0;

    return [
      { name: 'Accuracy', icon: 'ti-target', bg: 'rgba(34,211,126,.12)', color: '#22d37e', pct: avg('accuracy') },
      { name: 'Technical', icon: 'ti-code', bg: 'rgba(59,140,255,.12)', color: '#3b8cff', pct: avg('technical') },
      { name: 'Communication', icon: 'ti-message-dots', bg: 'rgba(155,109,255,.12)', color: '#9b6dff', pct: avg('communication') },
      { name: 'Confidence', icon: 'ti-award', bg: 'rgba(255,209,102,.12)', color: '#ffd166', pct: avg('confidence') },
    ];
  };

  const getStrengths = () => {
    const strengthsList = [];
    sessions.forEach(session => {
      const summaryMsg = session.messages?.find(m => m.type === 'summary');
      if (summaryMsg?.summary?.strengths) {
        summaryMsg.summary.strengths.forEach(str => {
          if (!strengthsList.some(item => item.name === str)) {
            strengthsList.push({ name: str, sub: `Demonstrated in ${session.title || 'interview'}` });
          }
        });
      }
    });

    if (strengthsList.length === 0) {
      return [
        { name: 'Complete an Interview', sub: 'Complete your first AI prep session to discover your strengths.' },
        { name: 'Clear Communication', sub: 'Try to speak clearly and structure your answers during prep.' }
      ];
    }
    return strengthsList.slice(0, 4);
  };

  const getImprove = () => {
    const weaknessesList = [];
    sessions.forEach(session => {
      const summaryMsg = session.messages?.find(m => m.type === 'summary');
      if (summaryMsg?.summary?.weaknesses) {
        summaryMsg.summary.weaknesses.forEach(weak => {
          if (!weaknessesList.some(item => item.name === weak)) {
            weaknessesList.push({ name: weak, sub: `Identified in ${session.title || 'interview'}`, color: 'var(--red)' });
          }
        });
      }
    });

    if (weaknessesList.length === 0) {
      return [
        { name: 'No Weaknesses Yet', sub: 'Keep practice sessions going to pinpoint topics to refine.', color: 'var(--cyan)' },
      ];
    }
    return weaknessesList.slice(0, 3);
  };

  const getAiRecs = () => {
    const recsList = [];
    sessions.forEach(session => {
      const summaryMsg = session.messages?.find(m => m.type === 'summary');
      if (summaryMsg?.summary?.recommendedTopics) {
        summaryMsg.summary.recommendedTopics.forEach(topic => {
          if (!recsList.some(item => item.title === topic)) {
            recsList.push({ title: topic, sub: 'Study and practice questions on this topic.', icon: 'ti-book-open' });
          }
        });
      }
    });

    if (recsList.length === 0) {
      return [
        { title: 'Core Tech Fundamentals', sub: 'Revise syntax, loops, memory, and runtime concepts.', icon: 'ti-sparkles' },
        { title: 'System Design Basics', sub: 'Learn APIs, cache, database indexing, and scaling.', icon: 'ti-target' }
      ];
    }
    return recsList.slice(0, 3);
  };

  const SKILLS = computeSkills();
  const STRENGTHS = getStrengths();
  const IMPROVE = getImprove();
  const AI_RECS = getAiRecs();

  return (
    <>
      <style>{styles}</style>
      {/* Tabler Icons */}
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css"
      />

      <div className="dash">
        {/* ── TOPBAR ── */}
        <div className="topbar">
          <div>
            <h1>My Score</h1>
            <p>Track your interview performance and improve every day.</p>
          </div>
          <button className="view-btn" onClick={() => navigate('/interview/history')}>
            <i className="ti ti-calendar" /> View All History
          </button>
        </div>

        <div className="content">
          {/* ── ROW 1: STAT CARDS ── */}
          <div className="row1">
            {/* Overall Score */}
            <div className="card overall-card">
              <div className="overall-label">Overall Score</div>
              <Gauge pct={avgScore} />
              <div className="perf-label">{avgScore >= 85 ? 'Interview-ready' : avgScore >= 70 ? 'Strong' : 'Needs practice'}</div>
              <div className="trend">
                <i className="ti ti-trending-up" /> {recentScores.length ? `${recentScores[recentScores.length-1] - (recentScores[0] || recentScores[recentScores.length-1])}% change` : 'No recent data'}
              </div>
            </div>
            <StatCard icon="ti-message-dots" iconBg="rgba(59,140,255,.12)" iconColor="#3b8cff"
              value={totalCompleted} title="Total Interviews" sub="Completed interviews only" />
            <StatCard icon="ti-circle-check" iconBg="rgba(34,211,126,.12)" iconColor="#22d37e"
              value={bestScore} title="Best Score" sub="Highest recorded score" />
            <StatCard icon="ti-clock" iconBg="rgba(255,209,102,.12)" iconColor="#ffd166"
              value="—" title="Avg. Time" sub="Unavailable" />
            <StatCard icon="ti-chart-line" iconBg="rgba(155,109,255,.12)" iconColor="#9b6dff"
              value={`${avgScore}%`} title="Average Score" sub="Average across completed interviews" />
          </div>

          {/* ── ROW 2: CHARTS ── */}
          <div className="row2">
            {/* Performance Over Time */}
            <div className="chart-card">
              <div className="card-header">
                <span className="card-title">Performance Over Time</span>
                <button className="dropdown">
                  <span>Last 6 Interviews</span>
                  <i className="ti ti-chevron-down" />
                </button>
              </div>
              {mounted && <PerfChart sessions={sessions} />}
            </div>

            {/* Section Wise Performance */}
            <div className="chart-card">
              <div className="card-header">
                <span className="card-title">Section Wise Performance</span>
                <button className="dropdown">
                  <span>All Sections</span>
                  <i className="ti ti-chevron-down" />
                </button>
              </div>
              {SKILLS.map((s) => (
                <div className="skill-row" key={s.name}>
                  <div className="skill-icon" style={{ background: s.bg, color: s.color }}>
                    <i className={`ti ${s.icon}`} />
                  </div>
                  <div className="skill-name">{s.name}</div>
                  <div className="skill-bar">
                    <div className="skill-fill" style={{ width: `${s.pct}%`, background: s.color }} />
                  </div>
                  <div className="skill-pct" style={{ color: s.color }}>{s.pct}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── ROW 3: BOTTOM CARDS ── */}
          <div className="row3">
            {/* Recent Interviews */}
            <div className="bottom-card">
              <div className="card-header">
                <span className="card-title">Recent Interviews</span>
                <button className="view-all" onClick={() => navigate('/interview/history')}>View All</button>
              </div>
              {sessionsLoading && <div>Loading recent interviews…</div>}
              {!sessionsLoading && sessions.length === 0 && <div className="history-empty">No completed interviews found.</div>}
              {!sessionsLoading && sessions.map((session) => (
                <div className="interview-row" key={session._id || session.id}>
                  <div className="int-icon" style={{ background: 'rgba(0,0,0,.06)', color: '#9b6dff' }}>
                    <i className={`ti ti-clipboard`} />
                  </div>
                  <div className="int-info">
                    <div className="int-name">{session.title || 'Interview Session'}</div>
                    <div className="int-sub">{(session.field || 'Unknown field') + ' · ' + (session.experience || session.type || '')}</div>
                  </div>
                  <div className="int-right">
                    <div className="int-score" style={{ color: '#22d37e' }}>{session.score ?? 0}%</div>
                    <div className="int-ago">{new Date(session.updatedAt || session.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Strengths */}
            <div className="bottom-card">
              <div className="section-header">
                <i className="ti ti-thumb-up" style={{ color: "var(--green)" }} />
                <span className="card-title">Strengths</span>
              </div>
              {STRENGTHS.map((s) => (
                <div className="item-row" key={s.name}>
                  <i className="ti ti-circle-check" style={{ color: "var(--green)" }} />
                  <div>
                    <div className="item-name">{s.name}</div>
                    <div className="item-sub">{s.sub}</div>
                  </div>
                </div>
              ))}
              <div className="keep-it-up">🎉 Keep it up! You are doing great in these areas.</div>
            </div>

            {/* Areas to Improve */}
            <div className="bottom-card">
              <div className="section-header">
                <i className="ti ti-trending-up" style={{ color: "var(--red)" }} />
                <span className="card-title">Areas to Improve</span>
              </div>
              {IMPROVE.map((item) => (
                <div className="item-row" key={item.name}>
                  <i className="ti ti-alert-circle" style={{ color: item.color }} />
                  <div>
                    <div className="item-name">{item.name}</div>
                    <div className="item-sub">{item.sub}</div>
                  </div>
                </div>
              ))}
              <div className="focus-box">
                <div className="focus-icon">
                  <i className="ti ti-target" style={{ color: "var(--red)" }} />
                </div>
                <div>
                  <div className="focus-title">Focus more on these areas</div>
                  <div className="focus-sub">Practice regularly to improve.</div>
                </div>
              </div>
            </div>

            {/* AI Recommendations */}
            <div className="bottom-card">
              <div className="section-header">
                <i className="ti ti-sparkles" style={{ color: "var(--purple)" }} />
                <span className="card-title">AI Recommendations</span>
              </div>
              {AI_RECS.map((rec) => (
                <div className="ai-rec" key={rec.title}>
                  <div className="ai-rec-icon">
                    <i className={`ti ${rec.icon}`} style={{ color: "var(--purple)", fontSize: 13 }} />
                  </div>
                  <div className="ai-rec-text">
                    <div className="ai-rec-title">{rec.title}</div>
                    <div className="ai-rec-sub">{rec.sub}</div>
                  </div>
                  <i className="ti ti-chevron-right ai-rec-arr" />
                </div>
              ))}
              <button className="start-btn" onClick={() => navigate('/interview')}>
                <i className="ti ti-bolt" /> Start New Interview
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}