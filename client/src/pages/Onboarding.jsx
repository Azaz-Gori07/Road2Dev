import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { detectLocation } from "../utils/geoLocation";

const EXP_LEVELS = ["Beginner", "Mid Level", "Senior", "Expert"];
const FOCUS_AREAS = [
  "Full Stack Development",
  "Frontend",
  "Backend",
  "Data Science",
  "DevOps",
  "Mobile",
];
const TECH_SUGGESTIONS = [
  "JavaScript", "React", "Node.js", "Python", "MongoDB", "TypeScript",
  "Next.js", "Vue.js", "Angular", "Django", "Flask", "Express.js",
  "PostgreSQL", "MySQL", "Redis", "Docker", "Kubernetes", "AWS",
  "GCP", "Azure", "GraphQL", "REST API", "Tailwind CSS", "Sass",
  "Git", "Linux", "Java", "C#", "Go", "Rust",
];

function Onboarding() {
  const navigate = useNavigate();
  const { isAuthenticated, user, updateProfile, loading } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(true);
  const [stackInput, setStackInput] = useState("");
  const [showStackSuggestions, setShowStackSuggestions] = useState(false);

  const [form, setForm] = useState({
    headline: "",
    location: "",
    bio: "",
    expLevel: "Beginner",
    focus: "Full Stack Development",
    stack: [],
  });

  // Use user defaults if available
  useEffect(() => {
    if (!loading && user) {
      setForm(prev => ({
        headline: user.headline || prev.headline,
        bio: user.bio || prev.bio,
        expLevel: user.expLevel || prev.expLevel,
        focus: user.focus || prev.focus,
        location: user.location || prev.location,
        stack: Array.isArray(user.stack) && user.stack.length > 0 ? user.stack : prev.stack,
      }));
    }
  }, [loading, user]);

  // Detect location on mount
  useEffect(() => {
    (async () => {
      const loc = await detectLocation();
      if (loc) {
        const parts = [loc.city, loc.region, loc.country].filter(Boolean);
        setForm(prev => ({
          ...prev,
          location: prev.location || parts.join(", "),
        }));
      }
      setLocating(false);
    })();
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/auth", { replace: true });
    }
  }, [loading, isAuthenticated, navigate]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const toggleStack = (tech) => {
    setForm(f => ({
      ...f,
      stack: f.stack.includes(tech)
        ? f.stack.filter(t => t !== tech)
        : [...f.stack, tech],
    }));
  };

  const addCustomStack = () => {
    const tech = stackInput.trim();
    if (tech && !form.stack.includes(tech)) {
      setForm(f => ({ ...f, stack: [...f.stack, tech] }));
    }
    setStackInput("");
    setShowStackSuggestions(false);
  };

  const filteredSuggestions = TECH_SUGGESTIONS.filter(
    t => t.toLowerCase().includes(stackInput.toLowerCase()) && !form.stack.includes(t)
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(form);
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    navigate("/", { replace: true });
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#0c0c0c", color: "#888", fontFamily: "'DM Sans', sans-serif" }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0c0c0c",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 560,
        background: "#141414",
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.07)",
        padding: 40,
        boxShadow: "0 30px 80px rgba(0,0,0,0.7)",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: "linear-gradient(135deg, #1e8a4a, #1a6fc4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
          }}>
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <path d="M15 3L6 14.5H13L11 23L20 11.5H13L15 3Z" fill="white" opacity="0.95"/>
            </svg>
          </div>
          <h1 style={{ color: "#f0f0f0", fontSize: 22, fontFamily: "'Syne', sans-serif", fontWeight: 700, margin: "0 0 6px" }}>
            Set Up Your Profile
          </h1>
          <p style={{ color: "#888", fontSize: 13, margin: 0 }}>
            Help us personalize your experience
          </p>
        </div>

        {/* Step Indicator */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 32 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: i <= step ? 32 : 8, height: 8, borderRadius: 4,
              background: i <= step ? "#40c8e0" : "rgba(255,255,255,0.1)",
              transition: "all 0.3s",
            }} />
          ))}
        </div>

        {/* Step 0: Headline + Bio */}
        {step === 0 && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", color: "#f0f0f0", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Headline
              </label>
              <input
                value={form.headline}
                onChange={e => set("headline", e.target.value)}
                placeholder="e.g., Full Stack Developer, React Enthusiast"
                style={{
                  width: "100%", padding: "12px 16px", background: "#1f1f1f",
                  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
                  color: "#f0f0f0", fontSize: 14, outline: "none",
                  fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
                }}
                onFocus={e => e.target.style.borderColor = "rgba(64,200,224,0.45)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              />
              <p style={{ color: "#666", fontSize: 11, margin: "6px 0 0" }}>
                Tell others what you do in a few words
              </p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", color: "#f0f0f0", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Bio
              </label>
              <textarea
                value={form.bio}
                onChange={e => set("bio", e.target.value)}
                placeholder="Write a short bio about yourself..."
                rows={4}
                style={{
                  width: "100%", padding: "12px 16px", background: "#1f1f1f",
                  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
                  color: "#f0f0f0", fontSize: 14, outline: "none", resize: "vertical",
                  fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
                }}
                onFocus={e => e.target.style.borderColor = "rgba(64,200,224,0.45)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              />
            </div>

            <button
              onClick={() => setStep(1)}
              style={{
                width: "100%", padding: 14, marginTop: 8,
                background: "linear-gradient(90deg, #5b8dee, #3de8a0)",
                border: "none", borderRadius: 10, color: "#fff",
                fontSize: 13, fontWeight: 700, fontFamily: "'Syne', sans-serif",
                letterSpacing: "0.12em", cursor: "pointer",
              }}
              onMouseEnter={e => e.target.style.transform = "translateY(-1px)"}
              onMouseLeave={e => e.target.style.transform = "translateY(0)"}
            >
              CONTINUE
            </button>
          </div>
        )}

        {/* Step 1: Experience + Focus + Location */}
        {step === 1 && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", color: "#f0f0f0", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Experience Level
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {EXP_LEVELS.map(level => (
                  <button
                    key={level}
                    onClick={() => set("expLevel", level)}
                    style={{
                      padding: "8px 16px", borderRadius: 8,
                      background: form.expLevel === level ? "rgba(64,200,224,0.15)" : "#1f1f1f",
                      border: form.expLevel === level ? "1px solid rgba(64,200,224,0.4)" : "1px solid rgba(255,255,255,0.07)",
                      color: form.expLevel === level ? "#40c8e0" : "#888",
                      fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                      transition: "all 0.2s",
                    }}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", color: "#f0f0f0", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Primary Focus
              </label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {FOCUS_AREAS.map(area => (
                  <button
                    key={area}
                    onClick={() => set("focus", area)}
                    style={{
                      padding: "8px 16px", borderRadius: 8,
                      background: form.focus === area ? "rgba(64,200,224,0.15)" : "#1f1f1f",
                      border: form.focus === area ? "1px solid rgba(64,200,224,0.4)" : "1px solid rgba(255,255,255,0.07)",
                      color: form.focus === area ? "#40c8e0" : "#888",
                      fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                      transition: "all 0.2s",
                    }}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", color: "#f0f0f0", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Location
              </label>
              <div style={{ position: "relative" }}>
                <input
                  value={form.location}
                  onChange={e => set("location", e.target.value)}
                  placeholder="City, Region, Country"
                  style={{
                    width: "100%", padding: "12px 16px 12px 40px", background: "#1f1f1f",
                    border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
                    color: "#f0f0f0", fontSize: 14, outline: "none",
                    fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
                  }}
                  onFocus={e => e.target.style.borderColor = "rgba(64,200,224,0.45)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                />
                <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
                  {locating ? (
                    <div style={{ width: 16, height: 16, border: "2px solid #444", borderTop: "2px solid #40c8e0", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  )}
                </div>
              </div>
              <p style={{ color: "#666", fontSize: 11, margin: "6px 0 0" }}>
                {locating ? "Detecting your location..." : "Auto-detected from your IP. You can edit manually."}
              </p>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button
                onClick={() => setStep(0)}
                style={{
                  flex: 1, padding: 14,
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
                  color: "#888", fontSize: 13, fontWeight: 600,
                  fontFamily: "'Syne', sans-serif", cursor: "pointer",
                }}
              >
                BACK
              </button>
              <button
                onClick={() => setStep(2)}
                style={{
                  flex: 1, padding: 14,
                  background: "linear-gradient(90deg, #5b8dee, #3de8a0)",
                  border: "none", borderRadius: 10, color: "#fff",
                  fontSize: 13, fontWeight: 700, fontFamily: "'Syne', sans-serif",
                  letterSpacing: "0.12em", cursor: "pointer",
                }}
              >
                CONTINUE
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Tech Stack */}
        {step === 2 && (
          <div>
            <label style={{ display: "block", color: "#f0f0f0", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Tech Stack
            </label>
            <p style={{ color: "#888", fontSize: 12, margin: "0 0 16px" }}>
              Select the technologies you work with
            </p>

            {/* Search / Add */}
            <div style={{ position: "relative", marginBottom: 16 }}>
              <input
                value={stackInput}
                onChange={e => { setStackInput(e.target.value); setShowStackSuggestions(true); }}
                onFocus={() => setShowStackSuggestions(true)}
                onBlur={() => setTimeout(() => setShowStackSuggestions(false), 200)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomStack(); } }}
                placeholder="Search or type a technology..."
                style={{
                  width: "100%", padding: "12px 16px", background: "#1f1f1f",
                  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
                  color: "#f0f0f0", fontSize: 14, outline: "none",
                  fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
                }}
                onFocus={e => e.target.style.borderColor = "rgba(64,200,224,0.45)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              />

              {/* Suggestions dropdown */}
              {showStackSuggestions && stackInput && filteredSuggestions.length > 0 && (
                <div style={{
                  position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10,
                  background: "#1f1f1f", border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 10, marginTop: 4, maxHeight: 200, overflowY: "auto",
                }}>
                  {filteredSuggestions.slice(0, 8).map(tech => (
                    <div
                      key={tech}
                      onMouseDown={() => { toggleStack(tech); setStackInput(""); setShowStackSuggestions(false); }}
                      style={{
                        padding: "10px 16px", color: "#ccc", fontSize: 13,
                        cursor: "pointer", transition: "background 0.1s",
                      }}
                      onMouseEnter={e => e.target.style.background = "rgba(64,200,224,0.08)"}
                      onMouseLeave={e => e.target.style.background = "transparent"}
                    >
                      {tech}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Stack */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24, minHeight: 40 }}>
              {form.stack.map(tech => (
                <span
                  key={tech}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "6px 12px", borderRadius: 8,
                    background: "rgba(64,200,224,0.1)",
                    border: "1px solid rgba(64,200,224,0.2)",
                    color: "#40c8e0", fontSize: 12, fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {tech}
                  <span
                    onClick={() => toggleStack(tech)}
                    style={{ cursor: "pointer", fontSize: 14, lineHeight: 1, opacity: 0.6 }}
                  >
                    ×
                  </span>
                </span>
              ))}
              {form.stack.length === 0 && (
                <span style={{ color: "#555", fontSize: 12 }}>No technologies selected yet</span>
              )}
            </div>

            {/* Tech suggestion chips */}
            <div style={{ marginBottom: 24 }}>
              <p style={{ color: "#666", fontSize: 11, margin: "0 0 8px" }}>Suggestions:</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {TECH_SUGGESTIONS.filter(t => !form.stack.includes(t)).slice(0, 12).map(tech => (
                  <span
                    key={tech}
                    onClick={() => toggleStack(tech)}
                    style={{
                      padding: "5px 10px", borderRadius: 6,
                      background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.05)",
                      color: "#777", fontSize: 11, cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={e => { e.target.style.background = "#252525"; e.target.style.color = "#ccc"; }}
                    onMouseLeave={e => { e.target.style.background = "#1c1c1c"; e.target.style.color = "#777"; }}
                  >
                    + {tech}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  flex: 1, padding: 14,
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
                  color: "#888", fontSize: 13, fontWeight: 600,
                  fontFamily: "'Syne', sans-serif", cursor: "pointer",
                }}
              >
                BACK
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  flex: 1, padding: 14,
                  background: saving ? "rgba(255,255,255,0.1)" : "linear-gradient(90deg, #5b8dee, #3de8a0)",
                  border: "none", borderRadius: 10,
                  color: saving ? "#888" : "#fff",
                  fontSize: 13, fontWeight: 700, fontFamily: "'Syne', sans-serif",
                  letterSpacing: "0.12em", cursor: saving ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                }}
              >
                {saving ? "SAVING..." : "SAVE & GET STARTED"}
              </button>
            </div>
          </div>
        )}

        {/* Skip link */}
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button
            onClick={handleSkip}
            style={{
              background: "none", border: "none",
              color: "#555", fontSize: 12, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", padding: 0,
            }}
            onMouseEnter={e => e.target.style.color = "#888"}
            onMouseLeave={e => e.target.style.color = "#555"}
          >
            Skip for now
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default Onboarding;