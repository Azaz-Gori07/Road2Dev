import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Brain, Award, Calendar, Clock, BarChart3, TrendingUp, Flame, CheckCircle } from 'lucide-react';
import './LearningAnalytics.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5500/api';

export default function LearningAnalytics() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Canvas Refs
  const masteryCanvasRef = useRef(null);
  const weeklyCanvasRef = useRef(null);
  const rateCanvasRef = useRef(null);

  // Chart instances to destroy on redraw/unmount
  const chartsRef = useRef({ mastery: null, weekly: null, rate: null });

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Authentication required. Please login.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/learning-lab/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const resData = await res.json();
      if (resData.success) {
        setData(resData.data);
      } else {
        setError(resData.message || 'Failed to fetch analytics.');
      }
    } catch (err) {
      setError('Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (!data) return;

    const loadCharts = () => {
      if (!window.Chart) return;

      // 1. Mastery Growth Chart (Line Chart)
      if (masteryCanvasRef.current) {
        if (chartsRef.current.mastery) chartsRef.current.mastery.destroy();
        const ctx = masteryCanvasRef.current.getContext('2d');
        const mData = data.charts?.masteryGrowth || [];
        const labels = mData.map(d => d.topic.startsWith('Project Defense:') ? d.topic.replace('Project Defense: ', '') : d.topic);
        const scores = mData.map(d => d.mastery);

        chartsRef.current.mastery = new window.Chart(ctx, {
          type: 'line',
          data: {
            labels: labels.length > 0 ? labels : ['No Data'],
            datasets: [{
              label: 'Topic Mastery %',
              data: scores.length > 0 ? scores : [0],
              borderColor: '#8b5cf6',
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              tension: 0.4,
              fill: true,
              borderWidth: 2,
              pointBackgroundColor: '#8b5cf6',
              pointRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { min: 0, max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#71717a' } },
              x: { grid: { display: false }, ticks: { color: '#71717a', font: { size: 10 } } }
            }
          }
        });
      }

      // 2. Weekly Progress Chart (Bar Chart)
      if (weeklyCanvasRef.current) {
        if (chartsRef.current.weekly) chartsRef.current.weekly.destroy();
        const ctx = weeklyCanvasRef.current.getContext('2d');
        const wData = data.charts?.weeklyProgress || [];
        const labels = wData.map(d => d.day);
        const counts = wData.map(d => d.count);

        chartsRef.current.weekly = new window.Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels.length > 0 ? labels : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
              label: 'Actions Logged',
              data: counts.length > 0 ? counts : [0, 0, 0, 0, 0, 0, 0],
              backgroundColor: '#3b82f6',
              borderRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#71717a', precision: 0 } },
              x: { grid: { display: false }, ticks: { color: '#71717a' } }
            }
          }
        });
      }

      // 3. Challenge Success Rate (Doughnut Chart)
      if (rateCanvasRef.current) {
        if (chartsRef.current.rate) chartsRef.current.rate.destroy();
        const ctx = rateCanvasRef.current.getContext('2d');
        const success = data.charts?.successRate || { passed: 0, failed: 0 };

        chartsRef.current.rate = new window.Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Passed', 'Failed'],
            datasets: [{
              data: [success.passed, success.failed],
              backgroundColor: ['#10b981', '#ef4444'],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { color: '#e4e4e7', boxWidth: 12 } } }
          }
        });
      }
    };

    if (window.Chart) {
      loadCharts();
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js';
      script.onload = loadCharts;
      document.head.appendChild(script);
    }

    return () => {
      Object.values(chartsRef.current).forEach(c => c?.destroy());
    };
  }, [data]);

  const stats = data?.overview || {
    topicsLearned: 0,
    challengesSolved: 0,
    assessmentsPassed: 0,
    masteryAvg: 0,
    interviewReadiness: 0,
    projectReadiness: 0,
    learningStreak: 0,
    hoursPracticed: 0
  };

  const hasTimelineData = data?.charts?.masteryGrowth?.length > 0;

  return (
    <div className="analytics-container">
      <header className="an-header">
        <button onClick={() => navigate('/learning-lab')} className="an-back-btn">
          <ArrowLeft size={16} /> Back to Lab
        </button>
        <h1>Learning Analytics &amp; Readiness</h1>
        <p className="an-subtitle">Monitor live readiness card indicators, track skill progression, and view streaks</p>
      </header>

      {loading ? (
        <div className="an-loading">Compiling database scorecards...</div>
      ) : error ? (
        <div className="an-error">{error}</div>
      ) : (
        <>
          {/* Stats Overview Grid */}
          <div className="an-stats-grid">
            <div className="an-stat-card">
              <div className="an-stat-icon-wrap icon-purple">
                <Brain size={20} />
              </div>
              <div className="an-stat-info">
                <span>Topics Mastered</span>
                <h3>{stats.topicsLearned}</h3>
              </div>
            </div>

            <div className="an-stat-card">
              <div className="an-stat-icon-wrap icon-green">
                <CheckCircle size={20} />
              </div>
              <div className="an-stat-info">
                <span>Challenges Solved</span>
                <h3>{stats.challengesSolved}</h3>
              </div>
            </div>

            <div className="an-stat-card">
              <div className="an-stat-icon-wrap icon-blue">
                <Award size={20} />
              </div>
              <div className="an-stat-info">
                <span>Assessments Passed</span>
                <h3>{stats.assessmentsPassed}</h3>
              </div>
            </div>

            <div className="an-stat-card">
              <div className="an-stat-icon-wrap icon-orange">
                <Flame size={20} />
              </div>
              <div className="an-stat-info">
                <span>Learning Streak</span>
                <h3>{stats.learningStreak} Day{stats.learningStreak === 1 ? '' : 's'}</h3>
              </div>
            </div>

            <div className="an-stat-card">
              <div className="an-stat-icon-wrap icon-cyan">
                <Clock size={20} />
              </div>
              <div className="an-stat-info">
                <span>Hours Practiced</span>
                <h3>{stats.hoursPracticed} hr</h3>
              </div>
            </div>
          </div>

          {/* Readiness Indicators */}
          <div className="an-readiness-panel">
            <h2 className="an-section-title">Verified Competency Grades</h2>
            <div className="an-readiness-grid">
              <div className="an-readiness-card">
                <span>Mastery Average</span>
                <strong className="text-purple">{stats.masteryAvg}%</strong>
                <div className="an-bar-track"><div className="an-bar-fill fill-purple" style={{ width: `${stats.masteryAvg}%` }} /></div>
              </div>
              <div className="an-readiness-card">
                <span>Interview Readiness</span>
                <strong className="text-cyan">{stats.interviewReadiness}%</strong>
                <div className="an-bar-track"><div className="an-bar-fill fill-cyan" style={{ width: `${stats.interviewReadiness}%` }} /></div>
              </div>
              <div className="an-readiness-card">
                <span>Project Readiness</span>
                <strong className="text-green">{stats.projectReadiness}%</strong>
                <div className="an-bar-track"><div className="an-bar-fill fill-green" style={{ width: `${stats.projectReadiness}%` }} /></div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          {!hasTimelineData ? (
            <div className="an-empty-charts">
              <BarChart3 size={36} className="lh-empty-icon" />
              <h3>Insufficient data to plot trends.</h3>
              <p>Solve sandbox challenges or complete checklist tasks to populate growth and activity feeds analytics.</p>
            </div>
          ) : (
            <div className="an-charts-row">
              <div className="an-chart-card mastery-chart-card">
                <h3>Mastery Growth Trend</h3>
                <div className="an-canvas-wrap">
                  <canvas ref={masteryCanvasRef} />
                </div>
              </div>

              <div className="an-chart-card">
                <h3>Weekly Activity Feed</h3>
                <div className="an-canvas-wrap">
                  <canvas ref={weeklyCanvasRef} />
                </div>
              </div>

              <div className="an-chart-card rate-chart-card">
                <h3>Sandbox Success Rate</h3>
                <div className="an-canvas-wrap">
                  <canvas ref={rateCanvasRef} />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
