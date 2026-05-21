import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";
import useZenuxAuth from "../hooks/useZenuxAuth";
import useAuth from "../hooks/useAuth";

/* ─── TINY HOOKS ─────────────────────────────────── */
function useHover() {
  const [h, set] = useState(false);
  return [h, { onMouseEnter: () => set(true), onMouseLeave: () => set(false) }];
}

/* ─── SHARED INPUT ───────────────────────────────── */
function Input({ label, value, onChange, multiline, rows = 4 }) {
  const [foc, setFoc] = useState(false);
  
  return (
    <div className="input-group">
      {label && <label className="input-label">{label}</label>}
      <div className="input-wrapper">
        {multiline
          ? <textarea 
              className={`input-field ${foc ? "input-focused" : ""}`}
              rows={rows}
              value={value}
              onChange={onChange}
              onFocus={() => setFoc(true)}
              onBlur={() => setFoc(false)}
            />
          : <input 
              type="text"
              className={`input-field ${foc ? "input-focused" : ""}`}
              value={value}
              onChange={onChange}
              onFocus={() => setFoc(true)}
              onBlur={() => setFoc(false)}
            />
        }
      </div>
    </div>
  );
}

/* ─── SELECT ─────────────────────────────────────── */
function Select({ label, value, onChange, options }) {
  const [foc, setFoc] = useState(false);
  
  return (
    <div className="select-group">
      <label className="select-label">{label}</label>
      <div className="select-wrapper">
        <select
          className={`select-field ${foc ? "select-focused" : ""}`}
          value={value}
          onChange={onChange}
          onFocus={() => setFoc(true)}
          onBlur={() => setFoc(false)}
        >
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <svg className="select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
    </div>
  );
}

/* ─── TOGGLE ─────────────────────────────────────── */
function Toggle({ on, onChange }) {
  return (
    <div className={`toggle ${on ? "toggle-on" : "toggle-off"}`} onClick={onChange}>
      <div className={`toggle-knob ${on ? "toggle-knob-on" : "toggle-knob-off"}`} />
    </div>
  );
}

/* ─── STAT CARD ──────────────────────────────────── */
function StatCard({ value, label, color }) {
  const [h, hP] = useHover();
  
  return (
    <div {...hP} className={`stat-card ${h ? "stat-card-hover" : ""}`} style={{ borderColor: h ? `${color}44` : undefined }}>
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

/* ─── TECH BADGE ─────────────────────────────────── */
const TECH_COLORS = {
  JavaScript: { border: "#f5c542", color: "#f5c542" },
  React:      { border: "#40c8e0", color: "#40c8e0" },
  "Node.js":  { border: "#3de8a0", color: "#3de8a0" },
  Python:     { border: "#4b8bbe", color: "#4b8bbe" },
  MongoDB:    { border: "#3de8a0", color: "#3de8a0" },
  TypeScript: { border: "#5b8dee", color: "#5b8dee" },
};

function TechBadge({ label }) {
  const [h, hP] = useHover();
  const c = TECH_COLORS[label] || { border: "rgba(255,255,255,0.07)", color: "#888" };
  
  return (
    <span {...hP} className={`tech-badge ${h ? "tech-badge-hover" : ""}`} style={{ borderColor: `${c.border}44`, background: h ? `${c.border}18` : `${c.border}0a`, color: c.color }}>
      {label}
    </span>
  );
}

/* ─── ACTIVITY ITEM ──────────────────────────────── */
const ACT_ICONS = {
  roadmap:   { bg: "#251a3a", color: "#9b6dff", icon: <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM17.5 14v7M14 17.5h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"/> },
  quiz:      { bg: "#2a2200", color: "#f5c542", icon: <><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" fill="none"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></> },
  interview: { bg: "#1a3a2a", color: "#3de8a0", icon: <><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" fill="none"/><line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="1.5"/><line x1="9" y1="21" x2="9" y2="9" stroke="currentColor" strokeWidth="1.5"/></> },
  course:    { bg: "#1a2a3a", color: "#40c8e0", icon: <><rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" fill="none"/><path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"/></> },
};

function ActivityItem({ type, title, time, last }) {
  const ic = ACT_ICONS[type];
  
  return (
    <div className={`activity-item ${last ? "activity-item-last" : ""}`}>
      <div className="activity-icon-wrapper">
        <div className="activity-icon" style={{ background: ic.bg, color: ic.color }}>
          <svg width="16" height="16" viewBox="0 0 24 24">{ic.icon}</svg>
        </div>
        {!last && <div className="activity-line" />}
      </div>
      <div className="activity-content">
        <div className="activity-title">{title}</div>
        <div className="activity-time">{time}</div>
      </div>
    </div>
  );
}

/* ─── AVATAR SVG ─────────────────────────────────── */
function AvatarSVG({ size = 80 }) {
  return (
    <div className="avatar-container" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="45" cy="45" r="45" fill="#ddd5c8"/>
        <ellipse cx="45" cy="78" rx="26" ry="20" fill="#2d2d3a"/>
        <rect x="38" y="56" width="14" height="12" rx="4" fill="#c8956a"/>
        <ellipse cx="45" cy="44" rx="18" ry="20" fill="#c8956a"/>
        <path d="M27 36 Q28 20 45 18 Q62 20 63 36 Q60 24 45 23 Q30 24 27 36Z" fill="#2a1f14"/>
        <path d="M27 38 Q25 30 28 25" stroke="#2a1f14" strokeWidth="5" strokeLinecap="round" fill="none"/>
        <path d="M63 38 Q65 30 62 25" stroke="#2a1f14" strokeWidth="5" strokeLinecap="round" fill="none"/>
        <path d="M33 54 Q45 64 57 54 Q55 62 45 64 Q35 62 33 54Z" fill="#2a1f14" opacity="0.7"/>
        <path d="M38 51 Q42 54 45 52 Q48 54 52 51" stroke="#2a1f14" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <ellipse cx="38" cy="42" rx="3.5" ry="3.5" fill="#1a1a1a"/>
        <ellipse cx="52" cy="42" rx="3.5" ry="3.5" fill="#1a1a1a"/>
        <ellipse cx="39" cy="41" rx="1" ry="1" fill="white" opacity="0.6"/>
        <ellipse cx="53" cy="41" rx="1" ry="1" fill="white" opacity="0.6"/>
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PROFILE VIEW
   ═══════════════════════════════════════════════════ */
function ProfileView({ data, onEdit }) {
  const [hBtn, hBtnP] = useHover();
  
  return (
    <div className="profile-view">
      {/* Hero card */}
      <div className="hero-card">
        <div className="hero-glow" />
        
        <div className="hero-avatar">
          <div className="avatar-gradient">
            <div className="avatar-border">
              <AvatarSVG size={72} />
            </div>
          </div>
        </div>

        <div className="hero-info">
          <div className="hero-name-section">
            <h1 className="hero-name">{data.name}</h1>
            <div className="verified-badge">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="#40c8e0">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
              <span>Verified</span>
            </div>
          </div>
          <p className="hero-headline">{data.headline}</p>
          <div className="hero-details">
            <div className="hero-detail">
              <svg width="12" height="12" viewBox="0 0 24 24" color="#444">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              </svg>
              <span>{data.location}</span>
            </div>
            <div className="hero-detail">
              <svg width="12" height="12" viewBox="0 0 24 24" color="#444">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
              </svg>
              <span>{data.email}</span>
            </div>
            <div className="hero-detail">
              <svg width="12" height="12" viewBox="0 0 24 24" color="#444">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <span>{data.joined}</span>
            </div>
          </div>
        </div>

        <button {...hBtnP} onClick={onEdit} className={`edit-btn ${hBtn ? "edit-btn-hover" : ""}`}>
          EDIT PROFILE
        </button>
      </div>

      {/* Stats row */}
      <div className="stats-row">
        <StatCard value="12" label="Roadmaps Completed" color="#40c8e0" />
        <StatCard value="45" label="Quizzes Taken" color="#3de8a0" />
        <StatCard value="78%" label="Average Score" color="#3de8a0" />
        <StatCard value="15" label="Mock Interviews" color="#9b6dff" />
      </div>

      {/* Bottom row */}
      <div className="bottom-row">
        {/* About Me + Tech Stack */}
        <div className="about-section">
          <h3 className="section-title">About Me</h3>
          <p className="about-bio">{data.bio}</p>
          <h3 className="section-title">Tech Stack</h3>
          <div className="tech-stack">
            {data.stack.map(t => <TechBadge key={t} label={t} />)}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="activity-section">
          <h3 className="section-title">Recent Activity</h3>
          <div className="activity-list">
            <ActivityItem type="roadmap" title="Completed React Roadmap" time="2 days ago" />
            <ActivityItem type="quiz" title="Scored 85% in JavaScript Quiz" time="3 days ago" />
            <ActivityItem type="interview" title="Completed Mock Interview" time="1 week ago" />
            <ActivityItem type="course" title="Started System Design Course" time="1 week ago" last />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   EDIT PROFILE VIEW
   ═══════════════════════════════════════════════════ */
function EditProfile({ data, onSave, onCancel, onLogout }) {
  const [form, setForm] = useState({ ...data });
  const [emailNotif, setEmailNotif] = useState(true);
  const [publicProf, setPublicProf] = useState(true);
  const fileRef = useRef();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const [hSave, hSaveP] = useHover();
  const [hCancel, hCancelP] = useHover();

  return (
    <div className="edit-profile-view">
      <div className="edit-header">
        <h1 className="edit-title">Edit Profile</h1>
        <p className="edit-subtitle">Update your personal information and preferences.</p>
      </div>

      <div className="edit-content">
        {/* Left: Profile Info */}
        <div className="profile-info-section">
          <h3 className="section-title-small">Profile Information</h3>

          {/* Avatar */}
          <div className="avatar-edit-section">
            <div className="avatar-edit-wrapper">
              <div className="avatar-gradient">
                <div className="avatar-border">
                  <AvatarSVG size={80} />
                </div>
              </div>
              <button onClick={() => fileRef.current?.click()} className="camera-btn">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0c0c0c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} />
            </div>
            <button onClick={() => fileRef.current?.click()} className="change-photo-btn">
              Change Photo
            </button>
          </div>

          <Input label="Full Name" value={form.name} onChange={e => set("name", e.target.value)} />
          <Input label="Email" value={form.email} onChange={e => set("email", e.target.value)} />
          <Input label="Headline" value={form.headline} onChange={e => set("headline", e.target.value)} />
          <Input label="Location" value={form.location} onChange={e => set("location", e.target.value)} />
          <Input label="Bio" value={form.bio} onChange={e => set("bio", e.target.value)} multiline rows={3} />
        </div>

        {/* Right: Preferences */}
        <div className="preferences-section">
          <div className="preferences-card">
            <h3 className="section-title-small">Preferences</h3>
            <Select label="Experience Level" value={form.expLevel} onChange={e => set("expLevel", e.target.value)} options={["Beginner", "Mid Level", "Senior", "Expert"]} />
            <Select label="Primary Focus" value={form.focus} onChange={e => set("focus", e.target.value)} options={["Full Stack Development", "Frontend", "Backend", "Data Science", "DevOps", "Mobile"]} />
            <Select label="Preferred Language" value={form.language} onChange={e => set("language", e.target.value)} options={["English", "Hindi", "Spanish", "French", "German", "Japanese"]} />
          </div>

          {/* Toggles */}
          <div className="toggles-card">
            <div className="toggle-item">
              <div className="toggle-header">
                <div className="toggle-label">
                  <span>Email Notifications</span>
                </div>
                <Toggle on={emailNotif} onChange={() => setEmailNotif(v => !v)} />
              </div>
              <div className="toggle-description">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={emailNotif ? "#40c8e0" : "#444"} strokeWidth="1.8">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <span>Enable email notifications</span>
              </div>
            </div>

            <div className="toggle-item">
              <div className="toggle-header">
                <div className="toggle-label">
                  <span>Public Profile</span>
                </div>
                <Toggle on={publicProf} onChange={() => setPublicProf(v => !v)} />
              </div>
              <div className="toggle-description">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={publicProf ? "#40c8e0" : "#444"} strokeWidth="1.8">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <span>Make profile public</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="action-buttons">
            <button {...hCancelP} onClick={onCancel} className={`cancel-btn ${hCancel ? "cancel-btn-hover" : ""}`}>
              CANCEL
            </button>
            <button {...hSaveP} onClick={() => onSave(form)} className={`save-btn ${hSave ? "save-btn-hover" : ""}`}>
              SAVE CHANGES
            </button>
          </div>
          
          {/* Log Out button */}
          <button onClick={onLogout} className="logout-btn">
            LOG OUT
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ROOT EXPORT
   ═══════════════════════════════════════════════════ */
export default function ProfilePage() {
  const navigate = useNavigate();
  const zenuxAuth = useZenuxAuth();
  const customAuth = useAuth();
  const isAuthenticated = zenuxAuth.isAuthenticated || customAuth.isAuthenticated;
  const loading = zenuxAuth.loading || customAuth.loading;
  const user = zenuxAuth.user || customAuth.user;
  const [view, setView] = useState("profile");
  const [data, setData] = useState({
    name:     "Alex Developer",
    headline: "Full Stack Developer",
    location: "Bangalore, India",
    email:    "alex@example.com",
    joined:   "Joined May 2024",
    bio:      "Passionate full stack developer with a love for building scalable web applications and solving complex problems.",
    stack:    ["JavaScript", "React", "Node.js", "Python", "MongoDB", "TypeScript"],
    expLevel: "Mid Level",
    focus:    "Full Stack Development",
    language: "English",
  });

  // Update profile data from OAuth user info
  useEffect(() => {
    if (user) {
      setData(prev => ({
        ...prev,
        name: user.name || user.preferred_username || prev.name,
        email: user.email || prev.email,
        headline: user.headline || prev.headline,
      }));
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/auth", { replace: true });
  };

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/auth', { replace: true });
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="profile-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ color: '#888', fontSize: 14, fontFamily: 'DM Sans, sans-serif' }}>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="profile-page">
      {view === "profile"
        ? <ProfileView data={data} onEdit={() => setView("edit")} />
        : <EditProfile data={data}
            onSave={updated => { setData(updated); setView("profile"); }}
            onCancel={() => setView("profile")}
            onLogout={handleLogout}
          />
      }
      {isAuthenticated && view === "profile" && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(255,60,60,0.1)',
              border: '1px solid rgba(255,60,60,0.2)',
              borderRadius: 10,
              padding: '10px 28px',
              color: '#ff6b6b',
              fontFamily: 'Syne, sans-serif',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.12em',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.target.style.background = 'rgba(255,60,60,0.2)'; }}
            onMouseLeave={e => { e.target.style.background = 'rgba(255,60,60,0.1)'; }}
          >
            LOG OUT
          </button>
        </div>
      )}
    </div>
  );
}