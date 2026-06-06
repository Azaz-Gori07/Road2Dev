import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  FolderGit2,
  FolderOpen,
  Github,
  ScanSearch,
  Layers,
  Cpu,
  Sparkles,
  AlertTriangle,
  Shield,
  ArrowRight,
  CheckCircle2,
  FileCode2,
  GitBranch,
  Gauge,
  Link2Off,
  Info,
  RefreshCw
} from 'lucide-react';
import { pickLocalProjectFolder, supportsDirectoryPicker } from '../utils/projectFolderScanner';
import { cleanQuestionText } from '../utils/projectDefenseWordingCleaner';
import {
  DEFAULT_SCAN_LINES,
  buildScanLinesFromPaths,
  pathToScanLine,
  isProjectScanned
} from '../utils/projectScanProgress';
import TypingIndicator from './TypingIndicator';

const CONNECT_REQUIRED_MSG =
  'Please connect a GitHub repository or local project folder before starting Project Defense.';

function ScanProgressPanel({ lines, activeIndex }) {
  return (
    <div className="pd-scan-progress">
      <div className="pd-scan-progress__header">
        <ScanSearch size={20} className="pd-scan-progress__icon" />
        <div>
          <strong>Scanning project</strong>
          <span>Reading structure and building analysis</span>
        </div>
      </div>
      <ul className="pd-scan-steps">
        {lines.map((line, idx) => (
          <li
            key={`${line}-${idx}`}
            className={idx < activeIndex ? 'done' : idx === activeIndex ? 'active' : ''}
          >
            <span className="pd-scan-step-dot" />
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FallbackModeBanner({ fallbackMode }) {
  if (!fallbackMode?.active) return null;
  return (
    <div className="pd-fallback-banner">
      <AlertTriangle size={16} />
      <div>
        <strong>Fallback Mode Active</strong>
        <span>Project analysis unavailable. Questions may be generic. Reason: {fallbackMode.reason || 'AI analysis failed'}</span>
      </div>
    </div>
  );
}

function ProgressiveMapReport({ context }) {
  const blueprint = context.masterBlueprint;
  const graph = context.knowledgeGraph || { nodes: [], edges: [] };
  const modules = context.modules || [];

  return (
    <div className="pd-prog-layout">
      {/* 1. Master Project Blueprint Card */}
      {blueprint && blueprint.summary && (
        <div className="pd-blueprint-card">
          <h4><Layers size={14} /> Master Project Blueprint</h4>
          <div className="pd-blueprint-grid">
            <div className="pd-blueprint-item">
              <span>Frameworks</span>
              <strong>{blueprint.frameworks?.join(', ') || 'N/A'}</strong>
            </div>
            <div className="pd-blueprint-item">
              <span>Database</span>
              <strong>{blueprint.database || 'N/A'}</strong>
            </div>
            <div className="pd-blueprint-item">
              <span>Auth Strategy</span>
              <strong>{blueprint.authStrategy || 'N/A'}</strong>
            </div>
          </div>
          {blueprint.summary && <p className="pd-blueprint-summary">{blueprint.summary}</p>}
        </div>
      )}

      {/* 2. Knowledge Graph Connections */}
      {graph.edges && graph.edges.length > 0 && (
        <div className="pd-graph-card">
          <h4><GitBranch size={14} /> Project Knowledge Graph</h4>
          <div className="pd-graph-edges-list">
            {graph.edges.map((edge, idx) => (
              <div key={idx} className="pd-graph-edge-item">
                <span className="pd-graph-node-badge">{edge.from}</span>
                <span className="pd-graph-arrow">→</span>
                <span className="pd-graph-node-badge">{edge.to}</span>
                <span className="pd-graph-edge-type">{edge.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Progressive Modules & Subchunks Tree */}
      {modules.length > 0 && (
        <div className="pd-prog-tree">
          <h4 className="pd-prog-tree__title"><FolderGit2 size={14} /> Project Modules Map</h4>
          <div className="pd-module-list">
            {modules.map((mod, mIdx) => (
              <div key={mIdx} className="pd-module-node">
                <div className="pd-module-node__name">{mod.moduleName}</div>
                <div className="pd-subchunk-list">
                  {mod.subchunks.map((sc, sIdx) => {
                    const isActive = context.defenseStarted && 
                                     context.currentModuleIndex === mIdx && 
                                     context.currentSubchunkIndex === sIdx;
                    const isCompleted = sc.status === 'completed';
                    const nodeClass = isActive ? 'active' : isCompleted ? 'completed' : 'pending';
                    const dotClass = isActive ? 'active' : isCompleted ? 'completed' : 'pending';
                    return (
                      <div key={sIdx} className={`pd-subchunk-node ${nodeClass}`}>
                        <span className={`pd-status-dot ${dotClass}`} />
                        <span>{sc.subchunkName} ({sc.files.length} files)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TechBadge({ label, evidence }) {
  const [showTooltip, setShowTooltip] = useState(false);
  return (
    <span
      className="pd-tech-badge"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      style={{ position: 'relative', cursor: evidence ? 'help' : 'default' }}
    >
      {label}
      {evidence && showTooltip && (
        <span className="pd-tech-badge__tooltip">
          {evidence.map((e, i) => <div key={i}>{e}</div>)}
        </span>
      )}
    </span>
  );
}

function ConnectionStatus({ connected, projectName, ingestionMethod }) {
  return (
    <div className={`pd-connection-status ${connected ? 'pd-connection-status--connected' : ''}`}>
      {connected ? (
        <>
          <CheckCircle2 size={18} />
          <div>
            <strong>Project connected</strong>
            <span>
              {projectName}
              {ingestionMethod === 'github' ? ' · GitHub' : ingestionMethod === 'local' ? ' · Local folder' : ''}
            </span>
          </div>
        </>
      ) : (
        <>
          <Link2Off size={18} />
          <div>
            <strong>No project connected.</strong>
            <span>Scan a GitHub repository or select a local folder to continue.</span>
          </div>
        </>
      )}
    </div>
  );
}

function ProjectConnectPanel({
  githubUrl,
  setGithubUrl,
  onGitHubScan,
  onLocalFolderScan,
  isScanning,
  ingestError
}) {
  return (
    <section className="pd-connect-panel" aria-label="Connect project">
      <h3 className="pd-connect-panel__title">Connect your project</h3>

      {ingestError && <div className="pd-error">{ingestError}</div>}

      <form className="pd-github-form" onSubmit={onGitHubScan}>
        <label htmlFor="pd-github-url">Repository URL</label>
        <input
          id="pd-github-url"
          type="url"
          value={githubUrl}
          onChange={(e) => setGithubUrl(e.target.value)}
          placeholder="https://github.com/user/project"
          disabled={isScanning}
          autoComplete="off"
        />
        <button type="submit" className="pd-primary-btn" disabled={isScanning}>
          <ScanSearch size={16} />
          Scan Repository
        </button>
      </form>

      <div className="pd-connect-divider">
        <span>or</span>
      </div>

      <button
        type="button"
        className="pd-secondary-btn"
        onClick={onLocalFolderScan}
        disabled={isScanning}
      >
        <FolderOpen size={16} />
        Select Local Folder
      </button>
      <p className="pd-connect-hint">
        {supportsDirectoryPicker()
          ? 'Uses the system folder picker (File System Access API). No ZIP upload.'
          : 'Uses your browser folder picker. Only relevant source files are read locally.'}
      </p>
    </section>
  );
}

function ProjectAnalysisReport({ context }) {
  const analysisFailed = context.scanStatus === 'failed';
  const report = context.architectureReport;
  const technologies = context.detectedTechnologies || [];
  const features = context.detectedFeatures || [];
  const weakAreas = context.potentialWeakAreas || [];
  const complexity = context.projectComplexity;
  const techEvidence = context.detectedTechnologiesEvidence || [];

  // Build evidence map for tech badges
  const evidenceMap = {};
  for (const te of techEvidence) {
    evidenceMap[te.name] = te.evidence;
  }

  if (analysisFailed) {
    return (
      <div className="pd-report pd-report--failed">
        <header className="pd-report__hero">
          <div className="pd-report__hero-icon">
            {context.ingestionMethod === 'github' ? <Github size={22} /> : <FolderOpen size={22} />}
          </div>
          <div>
            <span className="pd-report__eyebrow">Project Analysis Report</span>
            <h2>{context.projectName}</h2>
            {context.repoUrl && (
              <a href={context.repoUrl} target="_blank" rel="noopener noreferrer" className="pd-report__repo-link">
                <GitBranch size={12} /> {context.repoUrl}
              </a>
            )}
          </div>
          <div className="pd-report__stats">
            <span><FileCode2 size={14} /> {context.scanStats?.filesScanned ?? 0} files scanned</span>
          </div>
        </header>

        <div className="pd-report__unavailable">
          <AlertTriangle size={24} />
          <h3>Analysis unavailable</h3>
          <p>We successfully scanned your project but could not generate an AI architecture review.</p>
          <p className="pd-report__reason">Reason: {context.fallbackMode?.reason || 'AI service unavailable'}</p>
          <div className="pd-report__unavailable-actions">
            <button type="button" className="pd-secondary-btn" onClick={() => window.location.reload()}>
              <RefreshCw size={14} /> Retry Analysis
            </button>
          </div>
        </div>

        {/* Show deterministic tech detections even when analysis fails */}
        {techEvidence.length > 0 && (
          <section className="pd-report__section">
            <h3><Cpu size={16} /> Detected Technologies (from files)</h3>
            <div className="pd-tech-badges">
              {techEvidence.map((t) => <TechBadge key={t.name} label={t.name} evidence={t.evidence} />)}
            </div>
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="pd-report">
      <header className="pd-report__hero">
        <div className="pd-report__hero-icon">
          {context.ingestionMethod === 'github' ? <Github size={22} /> : <FolderOpen size={22} />}
        </div>
        <div>
          <span className="pd-report__eyebrow">Project Analysis Report</span>
          <h2>{context.projectName}</h2>
          {context.repoUrl && (
            <a
              href={context.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="pd-report__repo-link"
            >
              <GitBranch size={12} /> {context.repoUrl}
            </a>
          )}
        </div>
        <div className="pd-report__stats">
          <span>
            <FileCode2 size={14} />
            {context.scanStats?.filesScanned ?? 0} files scanned
          </span>
        </div>
      </header>

      <section className="pd-report__section">
        <h3>
          <Cpu size={16} /> Detected Technologies
        </h3>
        <div className="pd-tech-badges">
          {technologies.length ? (
            technologies.map((t) => <TechBadge key={t} label={t} evidence={evidenceMap[t]} />)
          ) : (
            <span className="pd-muted">None detected</span>
          )}
        </div>
        {techEvidence.length > 0 && (
          <details className="pd-evidence-details">
            <summary>View detection evidence ({techEvidence.length} sources)</summary>
            <ul className="pd-evidence-list">
              {techEvidence.map((t) => (
                <li key={t.name}>
                  <strong>{t.name}</strong>: {t.evidence.join(', ')}
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <section className="pd-report__section">
        <h3>
          <Sparkles size={16} /> Detected Features
        </h3>
        {features.length ? (
          <ul className="pd-feature-list">
            {features.map((f) => (
              <li key={f}>
                <CheckCircle2 size={14} /> {f}
              </li>
            ))}
          </ul>
        ) : (
          <p className="pd-muted">No features listed.</p>
        )}
      </section>

      <section className="pd-report__section">
        <h3>
          <Layers size={16} /> Architecture Summary
        </h3>
        {report ? (
          <>
            <div className="pd-arch-grid">
              <div className="pd-arch-card">
                <span>State</span>
                <strong>{report.stateManagement || 'None'}</strong>
              </div>
              <div className="pd-arch-card">
                <span>Auth</span>
                <strong>{report.auth || 'None'}</strong>
              </div>
              <div className="pd-arch-card">
                <span>Database</span>
                <strong>{report.database || 'None'}</strong>
              </div>
            </div>
            <div className="pd-arch-summary">
              <p>{report.summary || 'Summary unavailable.'}</p>
            </div>
            {report.structure && <pre className="pd-structure-block">{report.structure}</pre>}
          </>
        ) : (
          <p className="pd-muted">Architecture report unavailable.</p>
        )}
      </section>

      <section className="pd-report__section pd-report__section--warn">
        <h3>
          <AlertTriangle size={16} /> Potential Weak Areas
        </h3>
        {weakAreas.length ? (
          <ul className="pd-weak-list">
            {weakAreas.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        ) : (
          <p className="pd-muted">None flagged.</p>
        )}
      </section>

      <section className="pd-report__section">
        <h3>
          <Gauge size={16} /> Project Complexity
        </h3>
        {complexity ? (
          <div className="pd-complexity">
            <div className="pd-complexity__level">
              <span>Level</span>
              <strong>{complexity.level || 'Moderate'}</strong>
              {typeof complexity.score === 'number' && (
                <span className="pd-complexity__score">{complexity.score}/100</span>
              )}
            </div>
            <p>{complexity.rationale || 'Complexity assessment based on codebase structure.'}</p>
          </div>
        ) : (
          <p className="pd-muted">Complexity not assessed.</p>
        )}
      </section>
    </div>
  );
}

export default function ProjectDefenseWorkspace({
  activeSession,
  projectContext,
  apiBase,
  getHeaders,
  makeTraceableRequest,
  onSessionUpdated,
  defenseAnswer,
  setDefenseAnswer,
  onSubmitDefenseAnswer,
  isSubmittingDefense,
  setIsAiTyping = () => {},
  top25Expanded,
  setTop25Expanded
}) {
  const [githubUrl, setGithubUrl] = useState('');
  const [ingestError, setIngestError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanLines, setScanLines] = useState(DEFAULT_SCAN_LINES);
  const [scanLineIndex, setScanLineIndex] = useState(0);
  const [isStartingDefense, setIsStartingDefense] = useState(false);
  const scanTimerRef = useRef(null);

  const projectScanned = isProjectScanned(projectContext);
  /** Interview UI only when scan succeeded and user explicitly started defense */
  const defenseStarted =
    projectScanned && projectContext?.defenseStarted === true;

  const derivedProjectName = useMemo(() => {
    if (githubUrl.trim()) {
      const m = githubUrl.match(/github\.com\/[^/]+\/([^/.\s]+)/i);
      if (m) return m[1];
    }
    return projectContext?.projectName || 'My Project';
  }, [githubUrl, projectContext?.projectName]);

  const stopScanAnimation = () => {
    if (scanTimerRef.current) {
      clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
  };

  const startScanAnimation = (lines) => {
    stopScanAnimation();
    const list = lines.length ? lines : DEFAULT_SCAN_LINES;
    setScanLines(list);
    setScanLineIndex(0);
    scanTimerRef.current = setInterval(() => {
      setScanLineIndex((i) => (i < list.length - 1 ? i + 1 : i));
    }, 750);
  };

  useEffect(() => () => stopScanAnimation(), []);

  const pushScanPath = (path) => {
    if (!path) return;
    const line = pathToScanLine(path);
    setScanLines((prev) => {
      if (prev.includes(line)) return prev;
      const next = [...prev];
      next.splice(Math.max(next.length - 1, 0), 0, line);
      return next.slice(0, 14);
    });
  };

  const ingestPayload = async (body, pathsForDisplay = []) => {
    setIsScanning(true);
    setIngestError('');
    startScanAnimation(
      pathsForDisplay.length ? buildScanLinesFromPaths(pathsForDisplay) : DEFAULT_SCAN_LINES
    );

    try {
      const res = await makeTraceableRequest(
        'ingest_project',
        `${apiBase}/learning-lab/project/ingest`,
        {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(body)
        },
        'project_ingest'
      );
      const data = await res.json();
      if (data.success) {
        if (typeof window !== 'undefined' && window.__mentorMetrics) {
          window.__mentorMetrics.projectIngests += 1;
        }
        setScanLineIndex(scanLines.length - 1);
        onSessionUpdated(data.data);
        setGithubUrl('');
      } else {
        setIngestError(data.message || 'Scan failed.');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setIngestError('Project scan timed out or failed. Try again.');
      }
    } finally {
      stopScanAnimation();
      setIsScanning(false);
      setScanLineIndex(0);
    }
  };

  const handleGitHubScan = async (e) => {
    e.preventDefault();
    if (!githubUrl.trim()) {
      setIngestError('Enter a GitHub repository URL.');
      return;
    }
    await ingestPayload({
      githubUrl: githubUrl.trim(),
      projectName: derivedProjectName,
      sessionId: activeSession?._id,
      ingestionMethod: 'github'
    });
  };

  const handleLocalFolderScan = async () => {
    try {
      const paths = [];
      const { files, projectName: folderName } = await pickLocalProjectFolder({
        onProgress: ({ path }) => {
          if (path) {
            paths.push(path);
            pushScanPath(path);
          }
        }
      });
      if (!files.length) {
        setIngestError('No scannable files found in the selected folder.');
        return;
      }
      await ingestPayload(
        {
          files,
          projectName: folderName,
          sessionId: activeSession?._id,
          ingestionMethod: 'local'
        },
        files.map((f) => f.path)
      );
    } catch (err) {
      if (err.message !== 'Folder selection cancelled') {
        setIngestError(err.message || 'Could not read local folder.');
      }
    }
  };

  const handleStartDefense = async () => {
    if (!projectScanned) {
      setIngestError(CONNECT_REQUIRED_MSG);
      return;
    }
    if (!activeSession?._id || isStartingDefense || defenseStarted) return;

    setIsStartingDefense(true);
    setIsAiTyping(true);
    setIngestError('');
    try {
      const res = await makeTraceableRequest(
        'start_defense',
        `${apiBase}/learning-lab/session/${activeSession._id}/project/start-defense`,
        { method: 'POST', headers: getHeaders() },
        'project_start_defense'
      );
      const data = await res.json();
      if (data.success) {
        onSessionUpdated(data.data);
      } else {
        setIngestError(data.message || CONNECT_REQUIRED_MSG);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setIngestError(CONNECT_REQUIRED_MSG);
      }
    } finally {
      setIsAiTyping(false);
      setIsStartingDefense(false);
    }
  };

  if (defenseStarted && projectScanned) {
    const progress = projectContext.defenseProgress;
    const isFallback = projectContext?.fallbackMode?.active === true;

    // Render a question text from either string or object format
    const renderQuestionText = (q) => (typeof q === 'object' ? q.text : q);
    const renderQuestionSource = (q) => (typeof q === 'object' && q.source ? q.source : null);

    const isProgressive = Array.isArray(projectContext.modules) && projectContext.modules.length > 0;

    const currentModule = isProgressive ? projectContext.modules[projectContext.currentModuleIndex || 0] : null;
    const currentSubchunk = currentModule?.subchunks?.[projectContext.currentSubchunkIndex || 0];
    const activeQuestionObj = currentSubchunk?.activeQuestions?.[currentSubchunk?.activeQuestions?.length - 1];
    const activeDifficulty = activeQuestionObj?.difficulty;

    const renderMainContent = () => (
      <>
        {activeSession?.status === 'active' && (
          <form className="pd-defense-form" onSubmit={onSubmitDefenseAnswer}>
            <label>Your defense answer</label>
            <textarea
              value={defenseAnswer}
              onChange={(e) => setDefenseAnswer(e.target.value)}
              placeholder="Defend your architectural choices, data flow, and tradeoffs…"
              required
              disabled={isSubmittingDefense}
            />
            {isSubmittingDefense ? (
              <div style={{ marginTop: '12px' }}>
                <TypingIndicator context="project-defense" />
              </div>
            ) : (
              <button type="submit" disabled={isSubmittingDefense}>
                Submit answer
                <ArrowRight size={14} />
              </button>
            )}
          </form>
        )}

        {(progress?.evaluations?.length ?? 0) > 0 && (
          <div className="pd-eval-feedback">
            <h4>Answer evaluations</h4>
            {progress.evaluations
              .slice()
              .reverse()
              .map((ev, idx) => {
                const passed = ev.authorshipScore >= 40;
                return (
                  <div
                    key={idx}
                    className={`pd-eval-card ${passed ? 'pd-eval-card--passed' : 'pd-eval-card--failed'}`}
                  >
                    <div className="pd-eval-card__header">
                      <span className="pd-eval-card__icon">
                        {passed ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                      </span>
                      <span className="pd-eval-card__score" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        Authorship: {ev.authorshipScore ?? '?'}/100
                        {passed ? ' — Passed' : ' — Below threshold'}
                        {ev.difficulty && (
                          <span className={`pd-diff-badge ${ev.difficulty.toLowerCase()}`}>
                            {ev.difficulty}
                          </span>
                        )}
                        {ev.subchunkName && (
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            [{ev.subchunkName}]
                          </span>
                        )}
                      </span>
                    </div>
                    <p className="pd-eval-card__question">{cleanQuestionText(ev.question, ev.subchunkName)}</p>
                    {ev.feedback && <p className="pd-eval-card__feedback">{ev.feedback}</p>}
                  </div>
                );
              })}
          </div>
        )}

        {projectContext.topQuestions?.length > 0 && (
          <div className="pd-top25">
            <button
              type="button"
              className="pd-top25__toggle"
              onClick={() => setTop25Expanded(!top25Expanded)}
            >
              Practice bank — {projectContext.topQuestions.length} questions
              <span>{top25Expanded ? '▼' : '▶'}</span>
            </button>
            {top25Expanded && (
              <ol className="pd-top25__list">
                {projectContext.topQuestions.map((q, idx) => (
                  <li key={idx}>
                    {cleanQuestionText(renderQuestionText(q), renderQuestionSource(q))}
                    {renderQuestionSource(q) && (
                      <span className="pd-question-source">
                        <Info size={10} /> Source: {renderQuestionSource(q)}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </>
    );

    return (
      <div className="pd-workspace pd-interview">
        <FallbackModeBanner fallbackMode={projectContext.fallbackMode} />
        <ConnectionStatus
          connected
          projectName={projectContext.projectName}
          ingestionMethod={projectContext.ingestionMethod}
        />

        <div className="pd-interview__banner">
          <Shield size={18} />
          <div>
            <strong>Defense in progress — {projectContext.projectName}</strong>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              Question {(progress?.currentQuestionIndex ?? 0) + 1} of{' '}
              {progress?.totalQuestions ?? 5}
              {isFallback && <span className="pd-generic-badge">Generic</span>}
              {activeDifficulty && (
                <span className={`pd-diff-badge ${activeDifficulty.toLowerCase()}`}>
                  {activeDifficulty}
                </span>
              )}
            </span>
          </div>
        </div>

        {isProgressive ? (
          <div className="pd-interview-split">
            <div className="pd-interview-sidebar">
              <ProgressiveMapReport context={projectContext} />
            </div>
            <div className="pd-interview-main">
              {renderMainContent()}
            </div>
          </div>
        ) : (
          renderMainContent()
        )}
      </div>
    );
  }

  return (
    <div className="pd-workspace">
      <FallbackModeBanner fallbackMode={projectContext?.fallbackMode} />
      <header className="pd-landing__header pd-landing__header--compact">
        <FolderGit2 size={28} className="pd-landing__logo" />
        <h2>Project Defense</h2>
      </header>

      <ConnectionStatus
        connected={projectScanned}
        projectName={projectContext?.projectName}
        ingestionMethod={projectContext?.ingestionMethod}
      />

      {isScanning && (
        <ScanProgressPanel lines={scanLines} activeIndex={scanLineIndex} />
      )}

      {!isScanning && (
        <ProjectConnectPanel
          githubUrl={githubUrl}
          setGithubUrl={setGithubUrl}
          onGitHubScan={handleGitHubScan}
          onLocalFolderScan={handleLocalFolderScan}
          isScanning={isScanning}
          ingestError={ingestError}
        />
      )}

      {projectScanned && !isScanning && (
        <>
          <p className="pd-review-note">
            Review the analysis below. The defense interview starts only when you click{' '}
            <strong>Start Defense</strong>.
            {projectContext?.fallbackMode?.active && (
              <span className="pd-generic-note"> (Generic mode — questions will not be project-specific)</span>
            )}
          </p>
          {projectContext?.modules && projectContext.modules.length > 0 ? (
            <ProgressiveMapReport context={projectContext} />
          ) : (
            <ProjectAnalysisReport context={projectContext} />
          )}
        </>
      )}

      <footer className="pd-report__cta pd-report__cta--sticky">
        {!projectScanned && !isScanning && (
          <p className="pd-connect-required">{CONNECT_REQUIRED_MSG}</p>
        )}
        <button
          type="button"
          className="pd-start-defense-btn"
          onClick={handleStartDefense}
          disabled={!projectScanned || isStartingDefense || isScanning || defenseStarted}
          title={!projectScanned ? CONNECT_REQUIRED_MSG : undefined}
        >
          <Shield size={16} />
          {isStartingDefense
            ? 'Starting interview…'
            : projectContext?.fallbackMode?.active
              ? 'Start Defense (Generic)'
              : 'Start Defense'}
          <ArrowRight size={14} />
        </button>
      </footer>
    </div>
  );
}
