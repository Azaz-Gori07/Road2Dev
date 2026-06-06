import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const COMPONENTS = [
  'Navbar', 'Footer', 'Hero', 'AboutSection', 'SkillsSection',
  'ExperienceSection', 'EducationSection', 'ProjectsSection', 'ProjectCard',
  'ContactForm', 'TestimonialsSection', 'BlogSection', 'BlogCard',
  'ServicesSection', 'ServiceCard', 'TeamSection', 'TeamCard',
  'PricingSection', 'PricingCard', 'FAQSection', 'FAQItem',
  'StatisticsSection', 'StatsCard', 'GallerySection', 'GalleryItem',
  'TimelineSection', 'TimelineItem', 'NewsletterSection',
  'SocialLinks', 'ScrollToTop', 'ThemeToggle', 'LanguageSwitcher',
  'SearchBar', 'Breadcrumbs', 'Pagination', 'Modal', 'Tooltip',
  'ProgressBar', 'LoadingSpinner', 'ErrorBoundary',
  'EmptyState', 'NotificationToast', 'CookieConsent',
  'BackToTop', 'SideNavigation', 'MobileMenu',
];

const PAGES = [
  'Home', 'About', 'Projects', 'ProjectDetail',
  'Blog', 'BlogPost', 'Contact', 'Services',
  'Team', 'Pricing', 'FAQ', 'Gallery',
  'Privacy', 'Terms', 'Sitemap',
];

const HOOKS = [
  'useAuth', 'useTheme', 'useMediaQuery', 'useLocalStorage',
  'useDebounce', 'useIntersectionObserver', 'useScrollPosition',
  'useFetch', 'useForm', 'usePagination',
  'useClickOutside', 'useKeyboard', 'useOnlineStatus',
  'useCounter', 'useTimer', 'useGeolocation',
  'useClipboard', 'useNetworkStatus', 'usePrevious',
  'useToggle', 'useTimeout', 'useInterval',
];

const UTILS = [
  'helpers', 'validators', 'formatters', 'constants',
  'api', 'config', 'analytics', 'seo',
];

const compJsx = (n) => 'import React from "react";\nimport "./' + n + '.css";\n\nexport default function ' + n + '({ children, className = "", ...props }) {\n  return (\n    <div className={' + "`" + n.toLowerCase() + ' ${className}`' + '} {...props}>\n      <h2>' + n + '</h2>\n      <p>' + n + ' component content goes here. This component handles specific UI rendering.</p>\n      {children}\n    </div>\n  );\n}\n';

const compCss = (n) => '.' + n.toLowerCase() + ' { margin: 1rem 0; padding: 1rem; border-radius: 8px; background: var(--bg); box-shadow: var(--shadow); }\n';

const pageJsx = (n) => {
  const title = n.replace(/([A-Z])/g, ' $1').trim();
  return 'import React from "react";\n\nexport default function ' + n + '() {\n  return (\n    <div className="' + n.toLowerCase() + '-page">\n      <div className="container">\n        <h1>' + title + '</h1>\n        <section className="section">\n          <p>Welcome to the ' + title + ' page. This page contains detailed information and interactive components for the portfolio website.</p>\n          <div className="grid grid-2">\n            <div className="card"><h3>Section 1</h3><p>Content for section 1 of the ' + title.toLowerCase() + ' page.</p></div>\n            <div className="card"><h3>Section 2</h3><p>Content for section 2 of the ' + title.toLowerCase() + ' page.</p></div>\n          </div>\n        </section>\n      </div>\n    </div>\n  );\n}\n';
};

const hookJs = (n) => {
  const hookBody = n === 'useFetch' ? 'fetch' : n === 'useForm' ? 'form' : 'state';
  return 'import { useState, useEffect, useCallback } from "react";\n\nexport default function ' + n + '(initialValue = null) {\n  const [value, setValue] = useState(initialValue);\n  const [error, setError] = useState(null);\n  const [loading, setLoading] = useState(false);\n\n  useEffect(() => {\n    // ' + n + ' hook implementation\n    // Manages ' + hookBody + ' lifecycle\n  }, []);\n\n  const reset = useCallback(() => {\n    setValue(initialValue);\n    setError(null);\n    setLoading(false);\n  }, [initialValue]);\n\n  return { value, error, loading, setValue, reset };\n}\n';
};

// Create directories
const dirs = [
  'src/components', 'src/pages', 'src/hooks',
  'src/utils', 'src/styles', 'src/assets',
  'src/layouts', 'src/context', 'src/store',
  'public', 'config',
];
dirs.forEach(d => fs.mkdirSync(path.join(__dirname, d), { recursive: true }));

// Generate component files (JSX + CSS)
COMPONENTS.forEach(n => {
  fs.writeFileSync(path.join(__dirname, 'src/components/' + n + '.jsx'), compJsx(n));
  fs.writeFileSync(path.join(__dirname, 'src/components/' + n + '.css'), compCss(n));
});

// Generate page files
PAGES.forEach(n => {
  fs.writeFileSync(path.join(__dirname, 'src/pages/' + n + '.jsx'), pageJsx(n));
});

// Generate hook files
HOOKS.forEach(n => {
  fs.writeFileSync(path.join(__dirname, 'src/hooks/' + n + '.js'), hookJs(n));
});

// Generate utility files
UTILS.forEach(n => {
  fs.writeFileSync(path.join(__dirname, 'src/utils/' + n + '.js'),
    'export const ' + n + ' = {\n  version: "1.0.0",\n  description: "' + n + ' utility module",\n  data: {},\n};\n');
});

// Generate README
fs.writeFileSync(path.join(__dirname, 'README.md'),
'# Large Portfolio Project\n\nA comprehensive portfolio website built with React.\n\n## Features\n- 40+ reusable components\n- 15+ pages with routing\n- 20+ custom hooks\n- 8 utility modules\n- Responsive design\n- Dark/light theme\n- i18n support\n- SEO optimized\n- Analytics integration\n- Cookie consent\n- Accessibility features\n\n## Tech Stack\n- React 18\n- React Router v6\n- Zustand for state\n- Axios for HTTP\n- Framer Motion for animations\n- Tailwind CSS for styling\n- Express backend\n- MongoDB database\n- JWT authentication\n- Socket.io for real-time\n');

// Generate App.js
fs.writeFileSync(path.join(__dirname, 'src/App.js'),
'import React, { Suspense, lazy } from "react";\nimport { BrowserRouter, Routes, Route } from "react-router-dom";\nimport Navbar from "./components/Navbar";\nimport Footer from "./components/Footer";\nimport ScrollToTop from "./components/ScrollToTop";\nimport LoadingSpinner from "./components/LoadingSpinner";\nimport ErrorBoundary from "./components/ErrorBoundary";\nimport CookieConsent from "./components/CookieConsent";\nimport "./styles/global.css";\n\nconst Home = lazy(() => import("./pages/Home"));\nconst About = lazy(() => import("./pages/About"));\nconst Projects = lazy(() => import("./pages/Projects"));\nconst Blog = lazy(() => import("./pages/Blog"));\nconst Contact = lazy(() => import("./pages/Contact"));\nconst Services = lazy(() => import("./pages/Services"));\nconst Team = lazy(() => import("./pages/Team"));\nconst Pricing = lazy(() => import("./pages/Pricing"));\nconst FAQ = lazy(() => import("./pages/FAQ"));\n\nexport default function App() {\n  return (\n    <ErrorBoundary>\n      <BrowserRouter>\n        <ScrollToTop />\n        <Navbar />\n        <main>\n          <Suspense fallback={<LoadingSpinner />}>\n            <Routes>\n              <Route path="/" element={<Home />} />\n              <Route path="/about" element={<About />} />\n              <Route path="/projects" element={<Projects />} />\n              <Route path="/blog" element={<Blog />} />\n              <Route path="/contact" element={<Contact />} />\n              <Route path="/services" element={<Services />} />\n              <Route path="/team" element={<Team />} />\n              <Route path="/pricing" element={<Pricing />} />\n              <Route path="/faq" element={<FAQ />} />\n            </Routes>\n          </Suspense>\n        </main>\n        <Footer />\n        <CookieConsent />\n      </BrowserRouter>\n    </ErrorBoundary>\n  );\n}\n');

// Generate global CSS
fs.writeFileSync(path.join(__dirname, 'src/styles/global.css'),
':root {\n  --primary: #0066cc;\n  --secondary: #6c63ff;\n  --accent: #e94560;\n  --bg: #ffffff;\n  --bg-alt: #f8f9fa;\n  --text: #333333;\n  --text-light: #666666;\n  --border: #e0e0e0;\n  --shadow: 0 2px 8px rgba(0,0,0,0.1);\n  --radius: 8px;\n  --transition: 0.3s ease;\n}\n[data-theme="dark"] {\n  --bg: #1a1a2e;\n  --bg-alt: #16213e;\n  --text: #e0e0e0;\n  --text-light: #a0a0a0;\n  --border: #333;\n  --shadow: 0 2px 8px rgba(0,0,0,0.3);\n}\n* { box-sizing: border-box; margin: 0; padding: 0; }\nhtml { scroll-behavior: smooth; }\nbody { font-family: "Inter", -apple-system, sans-serif; background: var(--bg); color: var(--text); line-height: 1.6; }\na { color: var(--primary); text-decoration: none; }\na:hover { text-decoration: underline; }\n.container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }\n.section { padding: 4rem 0; }\n.grid { display: grid; gap: 1.5rem; }\n.grid-2 { grid-template-columns: repeat(2, 1fr); }\n.grid-3 { grid-template-columns: repeat(3, 1fr); }\n.grid-4 { grid-template-columns: repeat(4, 1fr); }\n@media (max-width: 768px) { .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; } }\n.btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; border: none; border-radius: var(--radius); cursor: pointer; font-size: 1rem; transition: var(--transition); }\n.btn-primary { background: var(--primary); color: white; }\n.btn-primary:hover { opacity: 0.9; }\n.card { background: var(--bg); border-radius: var(--radius); box-shadow: var(--shadow); padding: 1.5rem; transition: var(--transition); }\n');

// Generate index.js
fs.writeFileSync(path.join(__dirname, 'src/index.js'),
'import React from "react";\nimport ReactDOM from "react-dom/client";\nimport App from "./App";\n\nconst root = ReactDOM.createRoot(document.getElementById("root"));\nroot.render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);\n');

console.log('Large portfolio project generated successfully!');
console.log('Components:', COMPONENTS.length);
console.log('Pages:', PAGES.length);
console.log('Hooks:', HOOKS.length);
console.log('Utils:', UTILS.length);
