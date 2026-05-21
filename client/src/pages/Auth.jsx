import { useState, useRef } from "react";
import styles from "./Auth.module.css"; 

// ── Input component ──
function Field({ label, id, type = "text", placeholder, value, onChange }) {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);
  const isPass = type === "password";

  return (
    <div className={styles.fieldGroup}>
      <label htmlFor={id} className={styles.fieldLabel}>{label}</label>
      <div className={styles.fieldWrap}>
        <input
          id={id}
          value={value}
          onChange={onChange}
          type={isPass && show ? "text" : type}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`${styles.fieldInput} ${focused ? styles.fieldInputFocused : ""}`}
        />
        {isPass && (
          <button
            onClick={() => setShow(s => !s)}
            type="button"
            className={styles.passwordToggle}
          >
            {show ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Gradient button ──
function GradBtn({ children, onClick }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  
  return (
    <button
      onClick={onClick}
      type="button"
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`${styles.gradBtn} ${hovered ? styles.gradBtnHover : ""} ${pressed ? styles.gradBtnPressed : ""}`}
    >
      {children}
    </button>
  );
}

// ── Social button ──
function SocialBtn({ children, label }) {
  const [hovered, setHovered] = useState(false);
  
  return (
    <button
      type="button"
      aria-label={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`${styles.socialBtn} ${hovered ? styles.socialBtnHover : ""}`}
    >
      {children}
    </button>
  );
}

// ── Divider ──
function Divider() {
  return (
    <div className={styles.divider}>
      <div className={styles.dividerLine} />
      <span className={styles.dividerText}>Or continue with</span>
      <div className={styles.dividerLine} />
    </div>
  );
}

// ── Social row ──
function Socials() {
  return (
    <div className={styles.socialRow}>
      <SocialBtn label="Google">
        <svg width="22" height="22" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
      </SocialBtn>
      <SocialBtn label="GitHub">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" fill="#fff"/>
        </svg>
      </SocialBtn>
      <SocialBtn label="LinkedIn">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" fill="#0A66C2"/>
        </svg>
      </SocialBtn>
    </div>
  );
}

// ── Logo ──
function Logo() {
  return (
    <div className={styles.logoWrap}>
      <div className={styles.logoIcon}>
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
          <path d="M15 3L6 14.5H13L11 23L20 11.5H13L15 3Z" fill="white" opacity="0.95"/>
          <path d="M5 20 Q8 18 13 19 Q18 20 21 18" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
        </svg>
      </div>
      <span className={styles.logoName}>Road2Dev</span>
    </div>
  );
}

// ── Feature item ──
function Feature({ type, label, icon }) {
  const featureColors = {
    roadmap:   { bg: "#251a3a", stroke: "#9b6dff" },
    interview: { bg: "#1a2a3a", stroke: "#40c8e0" },
    track:     { bg: "#1a3a2a", stroke: "#3de8a0" },
    goal:      { bg: "#2a1a2a", stroke: "#ff6db0" },
  };
  
  const c = featureColors[type];
  
  return (
    <div className={styles.featureItem}>
      <div className={styles.featureIcon} style={{ background: c.bg }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c.stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          {icon}
        </svg>
      </div>
      <span className={styles.featureLabel}>{label}</span>
    </div>
  );
}

// ── Left panel shared shell ──
function LeftPanel({ headline, sub, features, bottomText, bottomLink, onBottomClick }) {
  return (
    <div className={styles.authLeft}>
      <Logo />
      <h1 className={styles.authHeadline}>{headline}</h1>
      <p className={styles.authSubheadline}>{sub}</p>
      <div className={styles.features}>{features}</div>
      <div className={styles.authSignup}>
        <p>{bottomText}{" "}
          <button onClick={onBottomClick} type="button" className={styles.signupLink}>
            {bottomLink}
          </button>
        </p>
      </div>
    </div>
  );
}

// ── Envelope SVG for Forgot page ──
function EnvelopeSVG() {
  return (
    <div className={styles.envelopeContainer}>
      <svg width="260" height="200" viewBox="0 0 260 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="glowBlue" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#40c8e0" stopOpacity="0.25"/>
            <stop offset="100%" stopColor="#40c8e0" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="envGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1a1a3a"/>
            <stop offset="100%" stopColor="#0a0a1a"/>
          </radialGradient>
          <linearGradient id="lockGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9b6dff"/>
            <stop offset="100%" stopColor="#5b8dee"/>
          </linearGradient>
          <linearGradient id="flapGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9b6dff"/>
            <stop offset="100%" stopColor="#5b8dee"/>
          </linearGradient>
        </defs>

        <ellipse cx="130" cy="130" rx="100" ry="60" fill="url(#glowBlue)"/>

        <circle cx="42" cy="80" r="3.5" fill="#40c8e0" opacity="0.7">
          <animate attributeName="cy" values="80;72;80" dur="3s" repeatCount="indefinite"/>
        </circle>
        <circle cx="220" cy="70" r="2.5" fill="#9b6dff" opacity="0.6">
          <animate attributeName="cy" values="70;62;70" dur="2.5s" repeatCount="indefinite"/>
        </circle>
        <circle cx="55" cy="150" r="2" fill="#3de8a0" opacity="0.5">
          <animate attributeName="cy" values="150;144;150" dur="3.5s" repeatCount="indefinite"/>
        </circle>

        <path d="M30 110 Q40 100 50 110 Q60 120 70 110" stroke="#40c8e0" strokeWidth="1.5" fill="none" opacity="0.5" strokeLinecap="round">
          <animate attributeName="opacity" values="0.5;0.9;0.5" dur="2s" repeatCount="indefinite"/>
        </path>
        <path d="M190 145 Q200 135 210 145 Q220 155 230 145" stroke="#9b6dff" strokeWidth="1.5" fill="none" opacity="0.4" strokeLinecap="round">
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2.5s" repeatCount="indefinite"/>
        </path>

        <rect x="55" y="95" width="150" height="100" rx="6" fill="url(#envGrad)" stroke="rgba(91,141,238,0.5)" strokeWidth="1.5"/>
        <path d="M55 195 L130 140 L205 195" stroke="rgba(91,141,238,0.35)" strokeWidth="1" fill="none"/>
        <path d="M55 95 L130 148" stroke="rgba(91,141,238,0.25)" strokeWidth="1" fill="none"/>
        <path d="M205 95 L130 148" stroke="rgba(91,141,238,0.25)" strokeWidth="1" fill="none"/>

        <rect x="100" y="55" width="60" height="75" rx="5" fill="#1e1e4a" stroke="rgba(155,109,255,0.5)" strokeWidth="1.2">
          <animate attributeName="y" values="55;50;55" dur="3s" repeatCount="indefinite"/>
        </rect>
        <path d="M148 55 L160 67 L148 67 Z" fill="#2a2a5a">
          <animate attributeName="transform" attributeType="XML" type="translate" values="0,0;0,-5;0,0" dur="3s" repeatCount="indefinite"/>
        </path>

        <g>
          <animate attributeName="transform" attributeType="XML" type="translate" values="0,0;0,-5;0,0" dur="3s" repeatCount="indefinite"/>
          <rect x="118" y="88" width="24" height="20" rx="4" fill="url(#lockGrad)">
            <animate attributeName="y" values="88;83;88" dur="3s" repeatCount="indefinite"/>
          </rect>
          <path d="M122 88 Q122 78 130 78 Q138 78 138 88" stroke="url(#lockGrad)" strokeWidth="3.5" fill="none" strokeLinecap="round">
            <animate attributeName="d" values="M122 88 Q122 78 130 78 Q138 78 138 88;M122 83 Q122 73 130 73 Q138 73 138 83;M122 88 Q122 78 130 78 Q138 78 138 88" dur="3s" repeatCount="indefinite"/>
          </path>
          <circle cx="130" cy="97" r="3" fill="rgba(0,0,0,0.5)">
            <animate attributeName="cy" values="97;92;97" dur="3s" repeatCount="indefinite"/>
          </circle>
          <rect x="129" y="97" width="2" height="5" rx="1" fill="rgba(0,0,0,0.5)">
            <animate attributeName="y" values="97;92;97" dur="3s" repeatCount="indefinite"/>
          </rect>
        </g>
        <path d="M55 95 Q130 158 205 95" fill="url(#flapGrad)" opacity="0.85" stroke="rgba(155,109,255,0.4)" strokeWidth="1"/>
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PAGE PANELS
   ═══════════════════════════════════════════════ */

function LoginPanel({ go }) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  return (
    <div className={styles.panelContainer}>
      <LeftPanel
        headline="Welcome Back!"
        sub="Login to continue your journey"
        features={
          <>
            <Feature type="track" label="Track your learning progress" icon={<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>}/>
            <Feature type="interview" label="Take interview practice tests" icon={<><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></>}/>
            <Feature type="roadmap" label="Get personalized roadmaps" icon={<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><path d="M17.5 14v3M17.5 17h-3.5M17.5 17h3.5"/></>}/>
            <Feature type="goal" label="Achieve your developer goals" icon={<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>}/>
          </>
        }
        bottomText="New here?" bottomLink="Create an account" onBottomClick={() => go("signup")}
      />
      <div className={styles.authRight}>
        <h2 className={styles.formTitle}>Login to Road2Dev</h2>
        <p className={styles.formSubtitle}>Welcome back! Please enter your details.</p>
        <Field label="Email" id="l-email" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)}/>
        <Field label="Password" id="l-pass" type="password" placeholder="Enter your password" value={pass} onChange={e => setPass(e.target.value)}/>
        <div className={styles.forgotRow}>
          <button onClick={() => go("forgot")} type="button" className={styles.forgotLink}>
            Forgot Password?
          </button>
        </div>
        <GradBtn onClick={() => console.log("Login clicked")}>LOGIN</GradBtn>
        <Divider/>
        <Socials/>
      </div>
    </div>
  );
}

function SignupPanel({ go }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [conf, setConf] = useState("");
  const [agreed, setAgreed] = useState(false);

  return (
    <div className={styles.panelContainer}>
      <LeftPanel
        headline="Join Road2Dev"
        sub="Start your journey to become a better developer"
        features={
          <>
            <Feature type="roadmap" label="Personalized learning roadmaps" icon={<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><path d="M17.5 14v3M17.5 17h-3.5M17.5 17h3.5"/></>}/>
            <Feature type="interview" label="Interview preparation tools" icon={<><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></>}/>
            <Feature type="track" label="Track your progress" icon={<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>}/>
            <Feature type="goal" label="Community support" icon={<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>}/>
          </>
        }
        bottomText="Already have an account?" bottomLink="Login here" onBottomClick={() => go("login")}
      />
      <div className={styles.authRight}>
        <h2 className={styles.formTitle}>Create Your Account</h2>
        <p className={styles.formSubtitle}>Fill in your details to get started.</p>
        <Field label="Full Name" id="s-name" type="text" placeholder="Enter your full name" value={name} onChange={e => setName(e.target.value)}/>
        <Field label="Email" id="s-email" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)}/>
        <Field label="Password" id="s-pass" type="password" placeholder="Create a password" value={pass} onChange={e => setPass(e.target.value)}/>
        <Field label="Confirm Password" id="s-conf" type="password" placeholder="Confirm your password" value={conf} onChange={e => setConf(e.target.value)}/>
        
        <label className={styles.termsLabel}>
          <div onClick={() => setAgreed(a => !a)} className={`${styles.checkbox} ${agreed ? styles.checkboxChecked : ""}`}>
            {agreed && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><polyline points="1.5 5 4 7.5 8.5 2" stroke="#0c0c0c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </div>
          <span className={styles.termsText}>
            I agree to the{" "}
            <span className={styles.termsLink}>Terms of Service</span>
            {" "}and{" "}
            <span className={styles.termsLink}>Privacy Policy</span>
          </span>
        </label>
        
        <GradBtn onClick={() => console.log("Signup clicked")}>SIGN UP</GradBtn>
        <Divider/>
        <Socials/>
      </div>
    </div>
  );
}

function ForgotPanel({ go }) {
  const [email, setEmail] = useState("");

  return (
    <div className={styles.panelContainer}>
      <div className={styles.authLeftReset}>
        <Logo />
        <h1 className={styles.authHeadline}>Reset Password</h1>
        <p className={styles.authSubheadlineReset}>
          Enter your email and we'll send you instructions to reset your password.
        </p>
        <EnvelopeSVG />
      </div>
      <div className={styles.authRight}>
        <h2 className={styles.formTitle}>Forgot Password</h2>
        <p className={styles.formSubtitleForgot}>
          Enter your registered email address and we'll send you a link to reset your password.
        </p>
        <Field label="Email" id="f-email" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)}/>
        <div style={{ marginBottom: 20 }} />
        <GradBtn onClick={() => console.log("Reset link sent")}>SEND RESET LINK</GradBtn>
        <div className={styles.backToLogin}>
          <p>Remember your password?</p>
          <button onClick={() => go("login")} type="button" className={styles.backLink}>
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   3D TRANSITION ENGINE
   ═══════════════════════════════════════════════ */

const TRANSITIONS = {
  "login→signup":  { exitY: 90,  enterY: -90,  exitX: 0,   enterX: 0   },
  "signup→login":  { exitY: -90, enterY: 90,   exitX: 0,   enterX: 0   },
  "login→forgot":  { exitY: 0,   enterY: 0,    exitX: -90, enterX: 90  },
  "forgot→login":  { exitY: 0,   enterY: 0,    exitX: 90,  enterX: -90 },
  "signup→forgot": { exitY: 0,   enterY: 0,    exitX: -90, enterX: 90  },
  "forgot→signup": { exitY: 0,   enterY: 0,    exitX: 90,  enterX: -90 },
};

const PAGES = { login: LoginPanel, signup: SignupPanel, forgot: ForgotPanel };

export default function Auth() {
  const [current, setCurrent] = useState("login");
  const [next, setNext] = useState(null);
  const [phase, setPhase] = useState("idle");
  const [tKey, setTKey] = useState(null);
  const timerRef = useRef(null);

  const go = (target) => {
    if (phase !== "idle" || target === current) return;
    const key = `${current}→${target}`;
    setNext(target);
    setTKey(key);
    setPhase("animating");

    timerRef.current = setTimeout(() => {
      setCurrent(target);
      setNext(null);
      setTKey(null);
      setPhase("idle");
    }, 680);
  };

  const t = tKey ? TRANSITIONS[tKey] : null;
  const CurrentPage = PAGES[current];
  const NextPage = next ? PAGES[next] : null;

  return (
    <div className={styles.globalContainer}>
      {/* Google Fonts - only loaded once */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
      `}</style>

      <div className={styles.outerStage}>
        <div className={styles.cardWrapper}>
          {/* CURRENT page (exits) */}
          <div
            className={`${styles.card} ${phase === "animating" && t ? styles.cardExit : ""}`}
            style={{
              ...(phase === "animating" && t ? {
                "--exitY": `${t.exitY}deg`,
                "--exitX": `${t.exitX}deg`,
                animationName: t.exitY !== 0 ? styles.slideExitY : styles.slideExitX,
              } : {}),
            }}
          >
            <CurrentPage go={go} />
          </div>

          {/* NEXT page (enters) */}
          {phase === "animating" && NextPage && t && (
            <div
              className={`${styles.card} ${styles.cardEnter}`}
              style={{
                "--enterY": `${t.enterY}deg`,
                "--enterX": `${t.enterX}deg`,
                animationName: t.enterY !== 0 ? styles.slideEnterY : styles.slideEnterX,
              }}
            >
              <NextPage go={go} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}