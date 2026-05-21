import { useEffect, useRef, useState } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
  @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg0: #08080e;
    --bg1: #0e0e18;
    --bg2: #13131f;
    --bg3: #191927;
    --brd: #1f1f32;
    --brd2: #252538;
    --t1: #eeeef8;
    --t2: #8888aa;
    --t3: #4a4a6e;
    --blue: #3b8cff;
    --green: #22d37e;
    --cyan: #00d4ff;
    --purple: #9b6dff;
    --orange: #ff8c42;
    --yellow: #ffd166;
    --red: #ff4f5e;
  }

  html, body, #root {
    width: 100%; height: 100%;
    overflow: hidden;
    background: var(--bg0);
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
    background: var(--bg1);
    border-bottom: 1px solid var(--brd);
    padding: 0 24px;
    display: flex;
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

  .card {
    background: var(--bg2);
    border: 1px solid var(--brd);
    border-radius: 12px;
    padding: 14px;
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
    background: var(--bg3); border: 1px solid var(--brd2);
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
    width: 100%; margin-top: 10px; padding: 9px;
    background: linear-gradient(90deg, var(--blue), var(--cyan));
    border: none; border-radius: 9px;
    color: #fff; font-size: 12.5px; font-weight: 600;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 6px;
    font-family: 'Outfit', sans-serif;
  }
  .start-btn i { font-size: 14px; }
`;

const SKILLS = [
  { name: "HTML & CSS",    pct: 90, color: "#3b8cff", icon: "ti-brand-html5",    bg: "rgba(59,140,255,.2)"  },
  { name: "JavaScript",   pct: 75, color: "#ffd166", icon: "ti-brand-javascript",bg: "rgba(255,209,102,.2)" },
  { name: "React",        pct: 80, color: "#00d4ff", icon: "ti-brand-react",     bg: "rgba(0,212,255,.2)"   },
  { name: "Node.js",      pct: 70, color: "#22d37e", icon: "ti-brand-nodejs",    bg: "rgba(34,211,126,.2)"  },
  { name: "MongoDB",      pct: 65, color: "#9b6dff", icon: "ti-leaf",            bg: "rgba(155,109,255,.2)" },
  { name: "System Design",pct: 55, color: "#ff8c42", icon: "ti-layout",          bg: "rgba(255,140,66,.2)"  },
];

const INTERVIEWS = [
  { name: "Frontend Developer Interview", sub: "React Stack · Mid Level",   score: 78, scoreColor: "#22d37e", time: "32 min", ago: "2 hours ago",  icon: "ti-brand-react",      iconBg: "rgba(59,140,255,.15)",   iconColor: "#3b8cff"  },
  { name: "Backend Developer Interview",  sub: "Node.js · Junior Level",    score: 72, scoreColor: "#ffd166", time: "28 min", ago: "1 day ago",    icon: "ti-hexagon",          iconBg: "rgba(34,211,126,.15)",   iconColor: "#22d37e"  },
  { name: "JavaScript Interview",         sub: "JavaScript · Mid Level",    score: 65, scoreColor: "#ff8c42", time: "25 min", ago: "3 days ago",   icon: "ti-brand-javascript", iconBg: "rgba(255,209,102,.15)",  iconColor: "#ffd166"  },
  { name: "System Design Interview",      sub: "System Design · Senior Level",score:60, scoreColor: "#ff4f5e", time: "45 min", ago: "5 days ago",   icon: "ti-layout",           iconBg: "rgba(255,140,66,.15)",   iconColor: "#ff8c42"  },
];

const STRENGTHS = [
  { name: "HTML & CSS",   sub: "Strong fundamentals"    },
  { name: "React",        sub: "Good component handling" },
  { name: "JavaScript",  sub: "Good problem solving"    },
];

const IMPROVE = [
  { name: "System Design", sub: "Needs more practice",        color: "#ff4f5e" },
  { name: "MongoDB",       sub: "Work on queries & indexing",  color: "#9b6dff" },
  { name: "Node.js",       sub: "Improve backend logic",       color: "#ff8c42" },
];

const AI_RECS = [
  { title: "Practice more System Design", sub: "Concepts like scalability & architecture need more focus.", icon: "ti-server"     },
  { title: "Solve more MongoDB queries",  sub: "Practice aggregations and advanced queries.",              icon: "ti-database"   },
  { title: "Take more mock interviews",   sub: "Consistent practice will boost your confidence.",          icon: "ti-microphone" },
];

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
function PerfChart() {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    const loadChart = () => {
      if (!window.Chart || !canvasRef.current) return;
      if (chartRef.current) chartRef.current.destroy();

      const ctx = canvasRef.current.getContext("2d");
      const grad = ctx.createLinearGradient(0, 0, 0, 140);
      grad.addColorStop(0, "rgba(34,211,126,.18)");
      grad.addColorStop(1, "rgba(34,211,126,0)");

      chartRef.current = new window.Chart(ctx, {
        type: "line",
        data: {
          labels: ["May 10","May 17","May 24","May 31","Jun 07","Jun 14"],
          datasets: [{
            data: [45, 60, 72, 65, 78, 78],
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
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
      script.onload = loadChart;
      document.head.appendChild(script);
    }
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, []);

  return (
    <div className="chart-area">
      <canvas ref={canvasRef} role="img" aria-label="Line chart of performance over time" />
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function MyScore() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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
          <button className="view-btn">
            <i className="ti ti-calendar" /> View All History
          </button>
        </div>

        <div className="content">
          {/* ── ROW 1: STAT CARDS ── */}
          <div className="row1">
            {/* Overall Score */}
            <div className="card overall-card">
              <div className="overall-label">Overall Score</div>
              <Gauge pct={78} />
              <div className="perf-label">Good Performance</div>
              <div className="trend">
                <i className="ti ti-trending-up" /> 12% from last 7 interviews
              </div>
            </div>

            <StatCard icon="ti-message-dots" iconBg="rgba(59,140,255,.12)" iconColor="#3b8cff"
              value="20" title="Total Interviews" sub="This includes all practice sessions" />
            <StatCard icon="ti-circle-check" iconBg="rgba(34,211,126,.12)" iconColor="#22d37e"
              value="16" title="Completed" sub="80% of total interviews" />
            <StatCard icon="ti-clock" iconBg="rgba(255,209,102,.12)" iconColor="#ffd166"
              value="32m" title="Avg. Time" sub="Average time per interview" />
            <StatCard icon="ti-chart-line" iconBg="rgba(155,109,255,.12)" iconColor="#9b6dff"
              value="78%" title="Accuracy" sub="Average accuracy across interviews" />
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
              {mounted && <PerfChart />}
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
                <button className="view-all">View All</button>
              </div>
              {INTERVIEWS.map((iv) => (
                <div className="interview-row" key={iv.name}>
                  <div className="int-icon" style={{ background: iv.iconBg, color: iv.iconColor }}>
                    <i className={`ti ${iv.icon}`} />
                  </div>
                  <div className="int-info">
                    <div className="int-name">{iv.name}</div>
                    <div className="int-sub">{iv.sub}</div>
                  </div>
                  <div className="int-right">
                    <div className="int-score" style={{ color: iv.scoreColor }}>
                      {iv.score}%{" "}
                      <span style={{ color: "var(--t2)", fontWeight: 400, fontSize: 11 }}>{iv.time}</span>
                    </div>
                    <div className="int-ago">{iv.ago}</div>
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
              <button className="start-btn">
                <i className="ti ti-bolt" /> Start New Interview
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}