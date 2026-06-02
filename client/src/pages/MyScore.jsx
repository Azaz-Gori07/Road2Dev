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
  --bg0: var(--background);
  --bg1: var(--surface);
  --bg2: var(--surface-alt);
  --bg3: var(--border);

  --brd: var(--border);
  --brd2: var(--border-focus);

  --t1: var(--text-primary);
  --t2: var(--text-secondary);
  --t3: var(--text-muted);

  --blue: var(--info);
  --green: var(--success);
  --cyan: var(--accent-cyan);
  --purple: var(--secondary);
  --orange: var(--accent-orange);
  --yellow: var(--warning);
  --red: var(--error);
}

  html, body, #root {
  width: 100%;
  height: 100%;
  overflow: hidden;

  background:
    radial-gradient(
      circle at top right,
      var(--primary-translucent),
      transparent 30%
    ),
    var(--background);

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
    background: var(--surface);
  border-bottom: 1px solid var(--border);
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
  background: var(--bg-card);
  border: 1px solid var(--border);
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
  border-color: var(--border-focus);
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
    background: var(--bg-input);
  border: 1px solid var(--border);
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
  .focus-title { font-size: 11.5px; font-weight: 600; color: var(--red); }
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
    var(--purple),
    var(--secondary-hover)
  );

  border: none;
  border-radius: 10px;

  color: white;
  font-weight: 600;

  box-shadow:
    0 0 25px var(--secondary-translucent);

  transition: all .25s ease;
}

.start-btn:hover {
  transform: translateY(-2px);
  box-shadow:
    0 0 35px var(--secondary-translucent);
}
  .start-btn i { font-size: 14px; }

  /* ══════════════════════════════════════════════════════
     RESPONSIVE — MOBILE & TABLET ONLY
     Desktop styles above are completely untouched.
     ══════════════════════════════════════════════════════ */

  /* ── row1-stats: transparent to desktop grid, becomes real div on mobile ── */
  .row1-stats {
    display: contents; /* grid sees through this wrapper on desktop */
  }

  /* ── Large tablet landscape (≤1180px) ─────────────── */
  @media (max-width: 1180px) {
    .row1 {
      grid-template-columns: 180px 1fr 1fr 1fr 1fr;
      gap: 8px;
    }
    .row3 {
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .gauge-wrap { width: 90px; height: 52px; }
    .gauge-val .pct { font-size: 18px; }
    .stat-val { font-size: 20px; }
  }

  /* ── Tablet portrait (≤1024px) ─────────────────────── */
  @media (max-width: 1024px) {
    html, body, #root { overflow: auto; height: auto; }

    .dash {
      height: auto;
      min-height: 100vh;
      overflow: auto;
      grid-template-rows: 56px 1fr;
    }

    .content {
      overflow: visible;
      padding: 14px 16px 24px;
      gap: 14px;
    }

    /* Row 1: overall card full-width on own row, then 2x2 stats */
    .row1 {
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    /* Make overall card span full width */
    .row1 .overall-card {
      grid-column: 1 / -1;
      flex-direction: row;
      align-items: center;
      gap: 20px;
      padding: 16px 20px;
    }
    .row1 .overall-card .overall-label {
      margin-bottom: 0;
      white-space: nowrap;
    }
    .row1 .overall-card .gauge-wrap {
      margin: 0;
      flex-shrink: 0;
    }
    .row1 .overall-card .perf-label {
      text-align: left;
    }
    /* row1-stats becomes real 2-col grid spanning both columns */
    .row1-stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-column: 1 / -1;
      gap: 10px;
    }

    /* Row 2: stack chart cards vertically */
    .row2 { grid-template-columns: 1fr; gap: 12px; }

    /* Row 3: 2-column grid */
    .row3 { grid-template-columns: 1fr 1fr; gap: 10px; }
  }

  /* ── Tablet portrait narrow / large phone (≤768px) ── */
  @media (max-width: 768px) {
    .topbar {
      padding: 0 16px;
      flex-wrap: wrap;
      gap: 8px;
      height: auto;
      min-height: 56px;
      padding-top: 8px;
      padding-bottom: 8px;
    }
    .topbar h1 { font-size: 17px; }
    .topbar p { font-size: 11px; }
    .view-btn { padding: 6px 12px; font-size: 11.5px; }

    .content { padding: 12px 12px 28px; gap: 12px; }

    /* Row 1: overall full-width + 2-col stats */
    .row1 {
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .row1 .overall-card {
      grid-column: 1 / -1;
      flex-direction: row;
      align-items: center;
      gap: 16px;
    }
    .row1-stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-column: 1 / -1;
      gap: 8px;
    }
    .stat-val { font-size: 20px; }
    .stat-icon { width: 30px; height: 30px; font-size: 15px; }

    /* Row 2: single column */
    .row2 { grid-template-columns: 1fr; gap: 10px; }
    .chart-area { height: 160px; }

    /* Row 3: single column */
    .row3 { grid-template-columns: 1fr; gap: 10px; }

    .card, .chart-card, .bottom-card { border-radius: 12px; padding: 13px; }
    .card:hover, .chart-card:hover, .bottom-card:hover { transform: none; }
  }

  /* ── Mobile (≤600px) ────────────────────────────────── */
  @media (max-width: 600px) {
    html, body, #root {
      overflow-x: hidden;
      overflow-y: auto;
      height: auto;
      min-height: 100vh;
    }

    .dash {
      height: auto;
      min-height: 100svh;
      overflow: visible;
      grid-template-rows: auto 1fr;
    }

    .topbar {
      position: sticky;
      top: 0;
      z-index: 50;
      background: var(--surface);
      backdrop-filter: blur(10px);
      padding: 10px 14px;
      gap: 6px;
      flex-wrap: nowrap;
      justify-content: space-between;
      align-items: center;
      height: auto;
      border-bottom: 1px solid var(--border);
    }
    .topbar > div { min-width: 0; }
    .topbar h1 { font-size: 15px; white-space: nowrap; }
    .topbar p { display: none; }
    .view-btn {
      flex-shrink: 0;
      padding: 6px 10px;
      font-size: 11px;
      gap: 4px;
      white-space: nowrap;
    }
    .view-btn span { display: none; }

    .content {
      padding: 10px 10px 32px;
      gap: 10px;
      overflow: visible;
    }

    /* ── Row 1 on mobile: overall card + 2x2 stat grid ── */
    .row1 {
      display: grid;
      grid-template-columns: 1fr;
      gap: 8px;
    }

    /* Overall card: horizontal compact layout */
    .row1 .overall-card {
      grid-column: unset;
      flex-direction: row;
      align-items: center;
      gap: 14px;
      padding: 14px 16px;
    }
    .row1 .overall-card .overall-label { font-size: 11px; margin-bottom: 0; white-space: nowrap; }
    .row1 .overall-card .gauge-wrap { width: 80px; height: 46px; margin: 0; flex-shrink: 0; }
    .row1 .overall-card .gauge-val .pct { font-size: 16px; }
    .row1 .overall-card .perf-label { font-size: 10px; text-align: left; }
    .row1 .overall-card .trend { font-size: 10px; margin-top: 4px; }

    /* Stat cards: 2×2 grid */
    .row1-stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .stat-card { padding: 12px 10px; gap: 3px; border-radius: 12px; }
    .stat-icon { width: 28px; height: 28px; font-size: 14px; border-radius: 8px; margin-bottom: 2px; }
    .stat-val { font-size: 18px; }
    .stat-title { font-size: 11px; }
    .stat-sub { font-size: 9.5px; }

    /* ── Row 2 ── */
    .row2 { grid-template-columns: 1fr; gap: 8px; }
    .chart-area { height: 150px; }
    .card-header { margin-bottom: 10px; }
    .card-title { font-size: 12px; }
    .dropdown { padding: 4px 8px; font-size: 10.5px; }

    /* Skill bars */
    .skill-row { gap: 6px; margin-bottom: 8px; }
    .skill-name { width: 76px; font-size: 11px; }
    .skill-pct { font-size: 11px; width: 28px; }

    /* ── Row 3 ── */
    .row3 { grid-template-columns: 1fr; gap: 8px; }
    .bottom-card { padding: 12px 13px; border-radius: 12px; }

    /* Interview rows */
    .interview-row { gap: 8px; padding: 6px 0; }
    .int-icon { width: 26px; height: 26px; font-size: 12px; border-radius: 7px; }
    .int-name { font-size: 11.5px; }
    .int-sub { font-size: 10px; }
    .int-score { font-size: 12px; }
    .int-ago { font-size: 9.5px; }

    /* Strengths / Improve rows */
    .item-row { gap: 6px; margin-bottom: 6px; }
    .item-name { font-size: 11.5px; }
    .item-sub { font-size: 10px; }
    .keep-it-up { font-size: 10px; }
    .focus-box { padding: 8px 10px; gap: 6px; }
    .focus-icon { width: 24px; height: 24px; font-size: 12px; border-radius: 7px; }
    .focus-title { font-size: 11px; }
    .focus-sub { font-size: 9.5px; }

    /* AI recs */
    .ai-rec { gap: 7px; padding: 6px 0; }
    .ai-rec-icon { width: 24px; height: 24px; border-radius: 7px; }
    .ai-rec-title { font-size: 11px; }
    .ai-rec-sub { font-size: 9.5px; }
    .start-btn { margin-top: 8px; padding: 11px 10px; font-size: 12px; font-weight: 700; border-radius: 10px; }

    /* Section headers */
    .section-header { margin-bottom: 8px; }
    .section-header i { font-size: 13px; }
    .card-title { font-size: 12px; }
    .view-all { font-size: 10.5px; }
  }

  /* ── Very small phones (≤380px) ────────────────────── */
  @media (max-width: 380px) {
    .content { padding: 8px 8px 28px; gap: 8px; }
    .topbar { padding: 8px 12px; }
    .topbar h1 { font-size: 14px; }

    .row1 .overall-card { padding: 12px; gap: 10px; }
    .row1 .overall-card .gauge-wrap { width: 70px; height: 40px; }
    .row1 .overall-card .gauge-val .pct { font-size: 14px; }

    .stat-val { font-size: 16px; }
    .stat-title { font-size: 10.5px; }
    .stat-sub { display: none; }
  }

  /* ── Landscape phones (short height) ───────────────── */
  @media (max-height: 500px) and (orientation: landscape) {
    html, body, #root { overflow: auto; height: auto; }
    .dash { height: auto; overflow: visible; }
    .content { overflow: visible; }
    .topbar { position: relative; }
    .chart-area { height: 120px; }
  }
`;

// ─── Gauge ───────────────────────────────────────────────────────────────────
function Gauge({ pct = 78 }) {
  const total = 143;
  const offset = total - (total * pct) / 100;
  return (
    <div className="gauge-wrap">
      <svg className="gauge-svg" viewBox="0 0 110 62">
        <defs>
          <linearGradient id="ggrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--accent-green)" />
          </linearGradient>
        </defs>
        <path d="M10,58 A46,46 0 0,1 100,58" fill="none" stroke="var(--border)" strokeWidth="9" strokeLinecap="round" />
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

      const style = getComputedStyle(document.documentElement);
      const accentGreen = style.getPropertyValue('--accent-green').trim() || "#22d37e";
      const greenTranslucent = style.getPropertyValue('--success-translucent').trim() || "rgba(34,211,126,.18)";
      const bg = style.getPropertyValue('--background').trim() || "#08080e";
      const surfaceAlt = style.getPropertyValue('--surface-alt').trim() || "#191927";
      const border = style.getPropertyValue('--border').trim() || "#252538";
      const textMuted = style.getPropertyValue('--text-muted').trim() || "#4a4a6e";

      const grad = ctx.createLinearGradient(0, 0, 0, 140);
      grad.addColorStop(0, greenTranslucent);
      grad.addColorStop(1, "rgba(34,211,126,0)");

      chartRef.current = new window.Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [{
            data: dataPoints,
            borderColor: accentGreen,
            borderWidth: 2,
            pointBackgroundColor: accentGreen,
            pointBorderColor: bg,
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
              backgroundColor: surfaceAlt,
              borderColor: border,
              borderWidth: 1,
              callbacks: { label: (c) => ` ${c.raw}%` },
            },
          },
          scales: {
            x: { grid: { color: border }, ticks: { color: textMuted, font: { size: 10 } } },
            y: {
              grid: { color: border },
              ticks: { color: textMuted, font: { size: 10 }, callback: (v) => v + "%" },
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
      { name: 'Accuracy', icon: 'ti-target', bg: 'var(--success-translucent)', color: 'var(--success)', pct: avg('accuracy') },
      { name: 'Technical', icon: 'ti-code', bg: 'var(--primary-translucent)', color: 'var(--primary)', pct: avg('technical') },
      { name: 'Communication', icon: 'ti-message-dots', bg: 'var(--secondary-translucent)', color: 'var(--secondary)', pct: avg('communication') },
      { name: 'Confidence', icon: 'ti-award', bg: 'var(--warning-translucent)', color: 'var(--warning)', pct: avg('confidence') },
    ];
  };

  const getStrengths = () => {
    const strengthsList = [];

    sessions.forEach((session) => {
      const summaryMsg = session.messages?.find((m) => m.type === 'summary');
      const strengths = summaryMsg?.summary?.strengths;

      if (Array.isArray(strengths) && strengths.length) {
        strengths.forEach((str) => {
          if (!strengthsList.some((item) => item.name === str)) {
            strengthsList.push({
              name: str,
              sub: `Demonstrated in ${session.title || 'interview'}`,
            });
          }
        });
      }
    });

    // No mock/fallback strengths: show empty state if none exist.
    return strengthsList.slice(0, 4);
  };

  const getImprove = () => {
    const weaknessesList = [];

    sessions.forEach((session) => {
      const summaryMsg = session.messages?.find((m) => m.type === 'summary');
      const weaknesses = summaryMsg?.summary?.weaknesses;

      if (Array.isArray(weaknesses) && weaknesses.length) {
        weaknesses.forEach((weak) => {
          if (!weaknessesList.some((item) => item.name === weak)) {
            weaknessesList.push({
              name: weak,
              sub: `Identified in ${session.title || 'interview'}`,
              color: 'var(--red)',
            });
          }
        });
      }
    });

    // No mock/fallback weaknesses: show empty state if none exist.
    return weaknessesList.slice(0, 3);
  };

  const getAiRecs = () => {
    const recsList = [];

    sessions.forEach((session) => {
      const summaryMsg = session.messages?.find((m) => m.type === 'summary');
      const recommendedTopics = summaryMsg?.summary?.recommendedTopics;

      if (Array.isArray(recommendedTopics) && recommendedTopics.length) {
        recommendedTopics.forEach((topic) => {
          if (!recsList.some((item) => item.title === topic)) {
            recsList.push({
              title: topic,
              sub: 'Study and practice questions on this topic.',
              icon: 'ti-book-open',
            });
          }
        });
      }
    });

    // No mock/fallback recommendations: show empty state if none exist.
    return recsList.slice(0, 3);
  };

  const SKILLS = computeSkills();
  const STRENGTHS = getStrengths();
  const IMPROVE = getImprove();
  const AI_RECS = getAiRecs();

  return (
    <>
      <style>{styles}</style>
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
            <i className="ti ti-calendar" /> <span>View All History</span>
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

            {/* Stat cards wrapped in a div for mobile 2×2 grid */}
            <div className="row1-stats">
              <StatCard icon="ti-message-dots" iconBg="var(--primary-translucent)" iconColor="var(--primary)"
                value={totalCompleted} title="Total Interviews" sub="Completed interviews only" />
              <StatCard icon="ti-circle-check" iconBg="var(--success-translucent)" iconColor="var(--success)"
                value={bestScore} title="Best Score" sub="Highest recorded score" />
              <StatCard icon="ti-clock" iconBg="var(--warning-translucent)" iconColor="var(--warning)"
                value="—" title="Avg. Time" sub="Unavailable" />
              <StatCard icon="ti-chart-line" iconBg="var(--secondary-translucent)" iconColor="var(--secondary)"
                value={`${avgScore}%`} title="Average Score" sub="Average across completed interviews" />
            </div>
          </div>

          {/* ── ROW 2: CHARTS ── */}
          <div className="row2">
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
                  <div className="int-icon" style={{ background: 'var(--secondary-translucent)', color: 'var(--secondary)' }}>
                    <i className={`ti ti-clipboard`} />
                  </div>
                  <div className="int-info">
                    <div className="int-name">{session.title || 'Interview Session'}</div>
                    <div className="int-sub">{(session.field || 'Unknown field') + ' · ' + (session.experience || session.type || '')}</div>
                  </div>
                  <div className="int-right">
                    <div className="int-score" style={{ color: 'var(--success)' }}>{session.score ?? 0}%</div>
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