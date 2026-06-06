# Phase 2 — Domain Coverage Analysis

Based on my complete audit of all detection mechanisms (Phase 1), here is a detailed analysis of which project domains are actually supported by the current system.

---

## Detection Mechanisms Summary

The system has **3 layers** of domain detection:

### Layer 1: Deterministic File Extension Detection
`projectScanUtils.js` `detectTechnologiesFromFiles()` maps file extensions to languages:
- Language support via `LANGUAGE_BY_EXTENSION`: JavaScript (.js/.jsx/.mjs/.cjs), TypeScript (.ts/.tsx), Python (.py), Ruby (.rb), Java (.java), Go (.go), Rust (.rs), C# (.cs), PHP (.php), Swift (.swift), Kotlin (.kt), Vue (.vue), Svelte (.svelte), HTML (.html), CSS (.css/.scss/.sass/.less), SQL (.sql), GraphQL (.graphql), YAML/YML, TOML, Dockerfile, Shell (.sh), Batch (.bat), PowerShell (.ps1)

### Layer 2: Deterministic Tech Pattern Matching
50+ `TECH_EVIDENCE_PATTERNS` scan package.json dependencies, file contents, and filenames for specific technology evidence.

### Layer 3: AI-Driven Architecture Analysis
`analyzeProjectSummary()` prompt is passed to Gemini/Groq with a **heavily web-centric prompt** that biases toward web frameworks (React, Express, Next.js), web databases (MongoDB, Postgres, MySQL), and web auth patterns (JWT, OAuth).

---

## Domain-by-Domain Coverage

### 1. WEB APPLICATIONS
**Supported?** ✅ YES — Primary target

**How detected?**
- Layer 1: Any web language (JS, TS, HTML, CSS) detected via extension
- Layer 2: `TECH_EVIDENCE_PATTERNS` covers React, Vue, Angular, Svelte, Next.js, Express, Axios, Tailwind, Bootstrap, Redux, Zustand, JWT, OAuth, all major web DBs, GraphQL, WebSocket, web build tools (Vite, Webpack, Babel)
- Layer 3: AI prompt is **optimized for web apps** — references "React", "Express", "Next.js", "JWT", "state management", "REST API" directly in prompt examples

**Question generation supported?** ✅ YES
- AI generates questions about auth flow, state management, API endpoints, component architecture — all web-specific

**Evaluation supported?** ✅ YES
- The `evaluateDefenseAnswer` and default generic questions (startProjectDefense lines 1310-1316) are web-centric: "auth flow", "error responses", "DB schema", "state management"

**Gaps:** None — this is the primary supported domain

---

### 2. MOBILE APPLICATIONS
**Supported?** ❌ PARTIALLY

**How detected?**
- Layer 1: React Native (detectable via `react-native` in package.json dependencies)
- Layer 2: `TECH_EVIDENCE_PATTERNS` includes "React Native" pattern
- Layer 3: AI prompt **has no mobile-specific patterns**. No reference to Android/iOS, no mobile-specific architecture patterns, no mobile tools (Gradle, Xcode, Android Studio), no mobile package formats (APK, IPA)

**Question generation supported?** ❌ NOT EFFECTIVELY
- AI generates web-centric questions. Mobile-specific topics like: screen lifecycle, platform-specific code, native modules, push notifications, app store deployment, mobile navigation patterns are **not prompted** in the AI system prompt.

**Evaluation supported?** ❌ NOT EFFECTIVELY
- Evaluation rubric has no mobile-specific dimensions. Questions about React Native lifecycle, bridge communication, native modules, platform-specific styling not covered.

**Gaps:** 
- No mobile-specific detection patterns (Gradle, AndroidManifest, Info.plist, Podfile, build.gradle)
- AI prompt has zero mobile architecture references
- No question templates for mobile-specific topics

---

### 3. DESKTOP APPLICATIONS
**Supported?** ❌ PARTIALLY

**How detected?**
- Layer 2: `TECH_EVIDENCE_PATTERNS` includes "Electron" — the only desktop tech covered
- Outside Electron: No detection for Tauri, .NET WPF/WinForms, Java Swing/JavaFX, Qt, GTK, etc.

**Question generation supported?** ❌ NOT SUPPORTED
- No desktop-specific architecture questions in any prompt
- No IPC/process model questions
- No native OS integration questions (file system, system tray, notifications)

**Evaluation supported?** ❌ NOT SUPPORTED

**Gaps:**
- Only Electron is minimally detectable
- No Tauri, .NET desktop, Java desktop, Qt, GTK support
- No desktop-specific question generation

---

### 4. CLI TOOLS
**Supported?** ❌ NOT SUPPORTED

**How detected?**
- Layer 1: Shell (.sh), Batch (.bat), PowerShell (.ps1) are detectable as languages
- Layer 2: No CLI-specific tech patterns (commander, yargs, argparse, click, cobra)
- Layer 3: AI prompt has no CLI architecture patterns (argument parsing, stdin/stdout/stderr streams, exit codes, config files, help generation)

**Question generation supported?** ❌ NOT SUPPORTED
**Evaluation supported?** ❌ NOT SUPPORTED

**Gaps:**
- No CLI framework detection
- No CLI-specific architecture understanding in AI
- Completely unsupported domain

---

### 5. MACHINE LEARNING
**Supported?** ❌ PARTIALLY

**How detected?**
- Layer 2: `TECH_EVIDENCE_PATTERNS` includes "scikit-learn", "NumPy", "Pandas", "Joblib" — Python ML libraries detectable from requirements.txt
- Layer 1: Python (.py) is detectable

**Question generation supported?** ❌ NOT EFFECTIVELY
- AI prompt has no ML-specific architecture references
- No model training, data pipeline, feature engineering, model evaluation, overfitting/underfitting questions
- No ML-specific deployment patterns (model serving, ONNX, TensorRT, MLflow)

**Evaluation supported?** ❌ NOT SUPPORTED

**Gaps:**
- Only Python ML library detection via package patterns
- No ML-specific question generation or evaluation
- No framework detection for TensorFlow, PyTorch, JAX, Keras
- No CUDA/cuDNN detection
- No Jupyter notebook detection (`.ipynb` not in TEXT_EXTENSIONS — BROKEN)

**Critical Gap:** `.ipynb` (Jupyter Notebook) is NOT in `TEXT_EXTENSIONS` regex in `projectScanUtils.js` line 17, meaning Jupyter notebooks are filtered out and NOT analyzed.

---

### 6. DEEP LEARNING
**Supported?** ❌ NOT SUPPORTED

**How detected?**
- Layer 2: None of the TECH_EVIDENCE_PATTERNS detect PyTorch, TensorFlow, Keras, JAX, ONNX, CUDA, cuDNN, TensorRT
- Layer 1: Python (.py) is detectable but no DL-specific differentiation

**Question generation supported?** ❌ NOT SUPPORTED
**Evaluation supported?** ❌ NOT SUPPORTED

**Gaps:**
- PyTorch, TensorFlow, Keras, JAX — none detected
- No GPU/CUDA detection
- No model architecture questions (CNN, RNN, Transformer, GAN, VAE)
- No training pipeline questions
- **Complete blind spot**

---

### 7. DATA SCIENCE
**Supported?** ❌ PARTIALLY

**How detected?**
- Layer 2: Pandas, NumPy, scikit-learn are detectable
- Layer 1: Python (.py) is detectable

**Question generation supported?** ❌ NOT EFFECTIVELY
- No data analysis, data cleaning, EDA, visualization, statistics questions

**Evaluation supported?** ❌ NOT SUPPORTED

**Gaps:**
- Jupyter notebooks (.ipynb) excluded from TEXT_EXTENSIONS — MAJOR GAP for data science
- No Matplotlib, Seaborn, Plotly, Dash, Streamlit detection
- No statistical analysis questions
- No data pipeline (ETL, data warehousing) questions

---

### 8. AI/LLM PROJECTS
**Supported?** ❌ NOT SUPPORTED

**How detected?**
- Layer 2: No patterns for OpenAI API, LangChain, LlamaIndex, HuggingFace, Transformers, Anthropic, Claude, GPT, LLM, RAG, vector databases (Pinecone, Chroma, Weaviate, Qdrant)
- Layer 1: Python (.py) is detectable but no LLM differentiation

**Question generation supported?** ❌ NOT SUPPORTED
**Evaluation supported?** ❌ NOT SUPPORTED

**Gaps:**
- No LLM framework detection (LangChain, LlamaIndex, Haystack)
- No vector database detection
- No RAG (Retrieval Augmented Generation) pattern detection
- No prompt engineering questions
- No AI agent/function calling questions
- No model fine-tuning questions
- **Complete blind spot**

---

### 9. GAME DEVELOPMENT
**Supported?** ❌ NOT SUPPORTED

**How detected?**
- Layer 2: No patterns for Unity, Unreal Engine, Godot, Phaser, PixiJS, Three.js, Babylon.js, GameMaker, Cocos2d, MonoGame, libGDX
- Layer 1: Language detection possible (C# for Unity, C++ for Unreal, TypeScript/JS for web games) but no differentiation

**Question generation supported?** ❌ NOT SUPPORTED
**Evaluation supported?** ❌ NOT SUPPORTED

**Gaps:**
- **Critical**: Three.js is NOT in TECH_EVIDENCE_PATTERNS despite being popular in web-based games
- No game engine/asset file detection (.unity, .uasset, .godot, .blend, .fbx)
- No game loop/rendering pipeline questions
- No physics/collision detection questions
- **Complete blind spot**

---

### 10. CYBER SECURITY
**Supported?** ❌ NOT SUPPORTED

**How detected?**
- Layer 2: `TECH_EVIDENCE_PATTERNS` has `security` (line 666 in patterns = none in the array), auth-related patterns exist (JWT, OAuth) but these are web auth, not cybersecurity tools
- No patterns for: nmap, Wireshark, Metasploit, Burp Suite, OWASP ZAP, Snort, Suricata, Hashcat, John the Ripper, YARA, VirusTotal API

**Question generation supported?** ❌ NOT SUPPORTED
**Evaluation supported?** ❌ NOT SUPPORTED

**Gaps:**
- No security tool detection
- No vulnerability assessment questions
- No penetration testing methodology questions
- No security compliance questions (SOC2, HIPAA, PCI-DSS, GDPR)
- **Complete blind spot**

---

### 11. DEVOPS
**Supported?** ❌ PARTIALLY

**How detected?**
- Layer 2: Docker (from Dockerfile), Docker Compose (from docker-compose files), Kubernetes (from k8s patterns)
- Layer 1: YAML (.yaml/.yml) is detectable
- DevOps config files in `KEY_CONFIG_FILES`: `docker-compose.yml` only

**Question generation supported?** ❌ NOT EFFECTIVELY
- AI prompt has no CI/CD pipeline questions
- No infrastructure-as-code questions (Terraform, Pulumi, Ansible)
- No container orchestration questions beyond basic Docker

**Evaluation supported?** ❌ NOT SUPPORTED

**Gaps:**
- No Terraform/Ansible/Pulumi detection
- No CI/CD platform detection (GitHub Actions, GitLab CI, Jenkins, CircleCI)
- No Helm/Kustomize detection for Kubernetes
- No monitoring/observability detection (Prometheus, Grafana, Datadog, ELK)
- No cloud provider differentiation (AWS vs GCP vs Azure beyond `aws-sdk`)
- Docker Compose in KEY_CONFIG_FILES but NOT separately from Docker's pattern match
- `docker-compose.yml` is a filename check but `compose.yml` (newer convention) is MISSING

---

### 12. CLOUD
**Supported?** ❌ PARTIALLY

**How detected?**
- Layer 2: `AWS` pattern matches `aws-sdk`, `amazonaws`, `aws-sam` — very limited
- No patterns for: Azure SDK, GCP SDK, CloudFormation, CDK, Pulumi, serverless framework, Vercel, Netlify, Cloudflare Workers, Lambda, S3, EC2, GCS, Blob Storage

**Question generation supported?** ❌ NOT EFFECTIVELY
**Evaluation supported?** ❌ NOT SUPPORTED

**Gaps:**
- Only AWS minimally supported via SDK detection
- No GCP or Azure detection
- No serverless framework detection
- No cloud architecture questions (scalability, cost optimization, multi-region, SLA/SLO)
- **BROKEN**: `HIGH_RISK_CLAIMS` strips "AWS" from AI-generated claims if no `aws-sdk` detected — so AWS is actually REMOVED from architecture reports unless explicitly in package.json

---

### 13. SYSTEM DESIGN
**Supported?** ❌ NOT AS A PROJECT TYPE

**Note:** System design is handled through the **Interview module** (not Project Defense), where `buildInterviewerSystemPrompt()` in `interviewAiService.js` has a "System Design" domain skill tree with CAP theorem, scalability, distributed systems, microservices, caching, load balancers. This is for **interview practice**, not for architecture analysis of a codebase.

**How detected?** ❌ NOT DETECTABLE as a project type
- There's no way to detect a system design project (diagrams, architecture docs, README-based design docs)
- No detection for architectural diagram tools (Draw.io, Mermaid, PlantUML, LucidChart)

**Question generation supported?** ✅ YES (but only in interview mode, not project defense)
**Evaluation supported?** ✅ YES (but only in interview mode, not project defense)

**Gaps:**
- System design is supported as an **interview domain** but NOT as a **project type** for Project Defense
- Cannot ingest system design documents (diagrams, ADRs, RFCs) as project files
- No detection of Mermaid/PlantUML diagrams
- No architecture decision record (ADR) parsing

---

### 14. BROWSER EXTENSIONS
**Supported?** ❌ NOT SUPPORTED

**How detected?**
- Layer 2: No patterns for `manifest.json` (Chrome extension manifest), `browser_specific_settings`, `chrome.*` APIs, `browser.*` APIs, WebExtensions API
- Layer 1: JavaScript/TypeScript detectable but no differentiation

**Question generation supported?** ❌ NOT SUPPORTED
**Evaluation supported?** ❌ NOT SUPPORTED

**Gaps:**
- No manifest.json detection (though it's similar to other JSON configs)
- No extension API lifecycle questions
- No content script/background script/popup architecture questions
- No cross-browser compatibility questions

---

### 15. OPEN SOURCE LIBRARIES
**Supported?** ❌ NOT SUPPORTED

**How detected?**
- Layer 2: No patterns for library-specific patterns (npm package config, PyPI setup.py/setup.cfg, crate-type, gem specification)
- No detection for documentation tools (JSDoc, TypeDoc, Sphinx, Docusaurus, Storybook)
- No detection for CI badges, README conventions, CHANGELOG, LICENSE files

**Question generation supported?** ❌ NOT SUPPORTED
**Evaluation supported?** ❌ NOT SUPPORTED

**Gaps:**
- No package publication questions (npm publish, PyPI, crates.io, rubygems)
- No API design questions
- No backward compatibility/breaking change questions
- No semantic versioning questions
- No documentation generation questions
- LICENSE file and CHANGELOG.md are not scanned by KEY_CONFIG_FILES

---

### 16. AUTOMATION TOOLS
**Supported?** ❌ NOT SUPPORTED

**How detected?**
- Layer 2: No patterns for: Ansible, Puppet, Chef, SaltStack, Terraform, Pulumi, GitHub Actions, GitLab CI, Jenkins, CircleCI, Makefile, Grunt, Gulp, Taskfile, Just
- Layer 1: YAML (.yaml/.yml) detectable but no differentiation

**Question generation supported?** ❌ NOT SUPPORTED
**Evaluation supported?** ❌ NOT SUPPORTED

**Gaps:**
- No CI/CD file detection (`.github/workflows/*.yml`, `.gitlab-ci.yml`, `Jenkinsfile`, `Makefile`, `Taskfile.yml`, `Justfile`)
- No infrastructure automation detection
- No task runner/build tool detection beyond web build tools

---

### 17. DSA PROJECTS
**Supported?** ❌ NOT SUPPORTED

**How detected?**
- Layer 2: The `algorithms` and `data structures` entries in `topicNormalizer.js` are for learning topic normalization, NOT for project type detection
- Layer 1: General language detection (Python, JavaScript, Java, C++, Go, Rust) but no DSA differentiation

**Question generation supported?** ❌ NOT SUPPORTED
**Evaluation supported?** ❌ NOT SUPPORTED

**Gaps:**
- No DSA-specific project structure understanding
- No algorithm complexity analysis questions in project defense
- No data structure implementation questions in project defense
- DSA is only supported as a **learning topic** (via the Mentor module), not as a **project type** for defense

---

## Summary Matrix

| Domain | Supported? | How Detected | Question Gen | Evaluation |
|--------|-----------|-------------|-------------|------------|
| Web Applications | **✅ YES** | Extensions + Patterns + AI | ✅ | ✅ |
| Mobile Applications | ❌ Partial | React Native only | ❌ | ❌ |
| Desktop Applications | ❌ Partial | Electron only | ❌ | ❌ |
| CLI Tools | ❌ NO | Shell/Batch/Powershell only | ❌ | ❌ |
| Machine Learning | ❌ Partial | Python + sklearn/NumPy/Pandas | ❌ | ❌ |
| Deep Learning | ❌ NO | None | ❌ | ❌ |
| Data Science | ❌ Partial | Python + Pandas/NumPy (no .ipynb) | ❌ | ❌ |
| AI/LLM Projects | ❌ NO | None | ❌ | ❌ |
| Game Development | ❌ NO | None (not even Three.js) | ❌ | ❌ |
| Cyber Security | ❌ NO | None | ❌ | ❌ |
| DevOps | ❌ Partial | Docker/Docker Compose/K8s | ❌ | ❌ |
| Cloud | ❌ Partial | AWS SDK only (then stripped) | ❌ | ❌ |
| System Design | ❌ NO* | Interview mode only (not defense) | ❌* | ❌* |
| Browser Extensions | ❌ NO | None | ❌ | ❌ |
| Open Source Libraries | ❌ NO | None | ❌ | ❌ |
| Automation Tools | ❌ NO | None | ❌ | ❌ |
| DSA Projects | ❌ NO | Topic normalization only (not project type) | ❌ | ❌ |

\* System Design is supported as an interview practice domain, not as a project defense type

---

## Critical Infrastructure Gaps

### Gap 1: `.ipynb` Exclusion
`TEXT_EXTENSIONS` in `projectScanUtils.js` line 17 does NOT include `.ipynb` (Jupyter Notebook). This blocks ALL data science, ML, and research projects from having their code analyzed.

### Gap 2: AI Prompt is Hardcoded for Web
The `analyzeProjectSummary` system prompt (lines 302-337) explicitly references:
- `"frameworks": ["Frameworks used, e.g. React, Express, Next.js"]`
- `"stateManagement": "Zustand, Redux, Context API, Vuex, or None"`
- `"auth": "JWT, Session Cookies, OAuth2, Firebase Auth, or None"`
- `"database": "MongoDB, PostgreSQL, MySQL, Redis, SQLite, or None"`
- `"components": ["List of critical components or modules found in the source code"]`
- Questions like: `'Why did you use Redux in cart.js?'`

This means the AI is prompted to produce a **web-only architecture analysis**. For non-web projects (CLI tools, ML, game dev), the AI will either:
1. Try to force-fit the project into a web architecture mold
2. Produce empty/null fields
3. Hallucinate web technologies

### Gap 3: No Project Type Categorization
There is NO field in `LearningSession` or `projectContext` that categorizes the **type** of project being analyzed. The system doesn't ask "What kind of project is this?" and doesn't adjust its analysis strategy based on project type.

### Gap 4: Question Templates Are Web-Only
Both AI-generated questions and fallback generic questions are web-centric:
```javascript
const genericQuestions = [
  'Explain the core architecture...',
  'Walk me through your authentication flow...',
  'How do you structure error responses...',
  'What database schema decisions...',
  'How do you handle state management...'
];
```
These question templates are completely inappropriate for:
- CLI tools (no auth, no DB, no state management)
- ML projects (no "authentication flow")
- Game development (no "database schema")
- Cyber security tools

### Gap 5: Tech Evidence Patterns Miss Major Ecosystems
Technologies MISSING from `TECH_EVIDENCE_PATTERNS`:
- **PyTorch, TensorFlow, Keras, JAX** (Deep Learning)
- **LangChain, LlamaIndex, HuggingFace, Transformers** (LLM/AI)
- **Three.js, Unity, Unreal, Godot, Phaser, Babylon.js** (Game Dev)
- **Tauri** (Desktop — only Electron covered)
- **Terraform, Pulumi, Ansible** (IaC)
- **GitHub Actions, Jenkins, CircleCI, GitLab CI** (CI/CD)
- **Azure, GCP** (Cloud — only AWS SDK supported)
- **Prometheus, Grafana, Datadog, ELK** (Monitoring/Observability)
- **Streamlit, Gradio, Dash** (ML/Data Science web apps)
- **OpenCV, spaCy, NLTK, Transformers, Hugging Face** (NLP/CV)
- **Flutter/Dart** (Mobile — no Flutter or Dart detection)
- **.NET/C# ecosystem** (ASP.NET, WPF, MAUI, Blazor — no patterns)
- **Spring Boot, Quarkus, Micronaut** (Java frameworks)
- **Rails, Sinatra, Hanami** (Ruby frameworks)
- **Django Rest Framework, FastAPI** (Python web — only Flask detected)

---

## Conclusion

**The system is effectively a Web Application defense platform.** It can technically ingest any Git repository, but the architecture analysis, question generation, and evaluation are all hardcoded for web applications. For the 16 other project categories:

- **0** are fully supported
- **5** have partial support (Mobile, Desktop, ML, Data Science, DevOps, Cloud)
- **11** have NO meaningful support

To make Project Defense technology-agnostic, the system needs:
1. A project type classification step before analysis
2. Domain-specific architecture report schemas
3. Domain-specific question templates
4. Domain-specific evaluation rubrics
5. Expanded TECH_EVIDENCE_PATTERNS for missing ecosystems
6. `.ipynb` support in TEXT_EXTENSIONS
7. Project type field in the data model

---

*End of Phase 2 Analysis. Ready for Phase 3 discussion.*