import { useParams } from "react-router-dom";
import fundamentals from "../api/fundamentals.json";
import html from "../api/languages/html5.json";
import css from "../api/languages/css.json";
import javascript from '../api/languages/javascript.json';
import react from '../api/languages/reactDuplicate.json';
import nodejs from '../api/languages/nodejs.json';
import expressjs from '../api/languages/express.json';
import mongodb from '../api/languages/mongodb.json';
import webProjects from '../api/projects/web-development-projects.json';
import "./ContentPage.css";

const ContentPage = () => {
  const { techSlug } = useParams();

  const data =
    techSlug === "web-fundamentals"
      ? fundamentals
      : techSlug === "html"
      ? html
      : techSlug === "css"
      ? css
      : techSlug === "javascript"
      ? javascript
      : techSlug === "react"
      ? react
      : techSlug === "nodejs"
      ? nodejs
      : techSlug === "express"
      ? expressjs
      : techSlug === "mongodb"
      ? mongodb
      : techSlug === "projects"
      ? webProjects
      : null;

  const handleBack = () => {
    window.history.back();
  };

  const formatCode = (code) => {
    return (
      <div className="code-block">
        <pre>{code}</pre>
      </div>
    );
  };

  const renderProjectStacks = (stacks) => {
    if (!stacks || !Array.isArray(stacks)) return null;

    return (
      <div className="detailed-section">
        <h5>Tech Stacks:</h5>
        <div className="stacks-container">
          {stacks.map((stack, idx) => (
            <div className="stack-card" key={idx}>
              <strong>{stack.name}</strong>
              <div className="stack-details">
                <p><span>Frontend:</span> {stack.frontend}</p>
                <p><span>Backend:</span> {stack.backend}</p>
                <p><span>Database:</span> {stack.database}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderApiEndpoints = (endpoints) => {
    if (!endpoints || !Array.isArray(endpoints)) return null;

    return (
      <div className="detailed-section">
        <h5>API Endpoints:</h5>
        <div className="api-endpoints">
          {endpoints.map((endpoint, idx) => (
            <div className="endpoint-item" key={idx}>
              <code>{endpoint}</code>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCoreFeatures = (features) => {
    if (!features || !Array.isArray(features)) return null;

    return (
      <div className="detailed-section">
        <h5>Core Features:</h5>
        <ul className="features-list">
          {features.map((feature, idx) => (
            <li key={idx}>{feature}</li>
          ))}
        </ul>
      </div>
    );
  };

  const renderLearningOutcomes = (outcomes) => {
    if (!outcomes || !Array.isArray(outcomes)) return null;

    return (
      <div className="detailed-section">
        <h5>Learning Outcomes:</h5>
        <ul className="outcomes-list">
          {outcomes.map((outcome, idx) => (
            <li key={idx}>{outcome}</li>
          ))}
        </ul>
      </div>
    );
  };

  const renderDetailedExplanation = (detailed_explanation) => {
    if (!detailed_explanation) return null;

    return (
      <div className="detailed-explanation">
        {detailed_explanation.example_code && (
          <div className="detailed-section">
            <h5>Example Code:</h5>
            {formatCode(detailed_explanation.example_code)}
          </div>
        )}

        {detailed_explanation.components && (
          <div className="detailed-section">
            <h5>Components:</h5>
            <div className="components-list">
              {detailed_explanation.components.map((component, idx) => (
                <div className="component-item" key={idx}>
                  <strong>{component.name}</strong>
                  {component.english && <p>English: {component.english}</p>}
                  {component.hinglish && <p>Hinglish: {component.hinglish}</p>}
                  {component.importance && <p>Importance: {component.importance}</p>}
                  {component.tip && <p>Tip: {component.tip}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {detailed_explanation.comparison && (
          <div className="detailed-section">
            <h5>Comparison:</h5>
            <table className="comparison-table">
              <thead>
                <tr>
                  {detailed_explanation.comparison[0] && 
                    Object.keys(detailed_explanation.comparison[0]).map((key, i) => (
                      <th key={i}>{key}</th>
                    ))
                  }
                </tr>
              </thead>
              <tbody>
                {detailed_explanation.comparison.map((row, idx) => (
                  <tr key={idx}>
                    {Object.values(row).map((value, i) => (
                      <td key={i}>{value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {detailed_explanation.comparison_table && (
          <div className="detailed-section">
            <h5>Comparison:</h5>
            <table className="comparison-table">
              <thead>
                <tr>
                  {detailed_explanation.comparison_table.headers.map((header, i) => (
                    <th key={i}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {detailed_explanation.comparison_table.rows.map((row, idx) => (
                  <tr key={idx}>
                    {row.map((cell, i) => (
                      <td key={i}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {detailed_explanation.best_practices && (
          <div className="detailed-section">
            <h5>Best Practices:</h5>
            <ul className="best-practices-list">
              {detailed_explanation.best_practices.map((practice, idx) => (
                <li key={idx}>
                  <strong>{practice.practice}</strong>
                  {practice.reason && <p>Reason: {practice.reason}</p>}
                  {practice.hinglish && <p>Hinglish: {practice.hinglish}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {detailed_explanation.common_uses && (
          <div className="detailed-section">
            <h5>Common Uses:</h5>
            <ul className="best-practices-list">
              {detailed_explanation.common_uses.map((use, idx) => (
                <li key={idx}>
                  {use}
                </li>
              ))}
            </ul>
          </div>
        )}

        {detailed_explanation.attributes && (
          <div className="detailed-section">
            <h5>Attributes:</h5>
            <div className="components-list">
              {Object.entries(detailed_explanation.attributes).map(([key, value], idx) => (
                <div className="component-item" key={idx}>
                  <strong>{key}:</strong>
                  <p>{typeof value === 'object' ? JSON.stringify(value) : value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {detailed_explanation.stacks && renderProjectStacks(detailed_explanation.stacks)}
        
        {detailed_explanation.api_endpoints && renderApiEndpoints(detailed_explanation.api_endpoints)}
        
        {detailed_explanation.core_features && renderCoreFeatures(detailed_explanation.core_features)}
        
        {detailed_explanation.learning_outcomes && renderLearningOutcomes(detailed_explanation.learning_outcomes)}
        
        {detailed_explanation.payment_gateways && (
          <div className="detailed-section">
            <h5>Payment Gateways:</h5>
            <div className="payment-gateways">
              {detailed_explanation.payment_gateways.map((gateway, idx) => (
                <span className="gateway-tag" key={idx}>{gateway}</span>
              ))}
            </div>
          </div>
        )}
        
        {detailed_explanation.technologies && (
          <div className="detailed-section">
            <h5>Technologies Used:</h5>
            <div className="technologies-list">
              {detailed_explanation.technologies.map((tech, idx) => (
                <span className="tech-tag" key={idx}>{tech}</span>
              ))}
            </div>
          </div>
        )}
        
        {detailed_explanation.difficulty && (
          <div className="detailed-section">
            <h5>Project Difficulty: <span className={`difficulty-${detailed_explanation.difficulty.toLowerCase()}`}>{detailed_explanation.difficulty}</span></h5>
          </div>
        )}
        
        {detailed_explanation.duration && (
          <div className="detailed-section">
            <h5>Estimated Duration: <span className="duration">{detailed_explanation.duration}</span></h5>
          </div>
        )}
        
        {detailed_explanation.project_type && (
          <div className="detailed-section">
            <h5>Project Type: <span className="project-type">{detailed_explanation.project_type}</span></h5>
          </div>
        )}

        {Object.entries(detailed_explanation).map(([key, value], idx) => {
          const alreadyRendered = [
            'example_code', 
            'components', 
            'comparison', 
            'best_practices',
            'comparison_table',
            'attributes',
            'common_uses',
            'common_uses_hinglish',
            'purpose',
            'purpose_hinglish',
            'levels',
            'behavior',
            'characteristics',
            'uses',
            'seo_tip',
            'seo_tip_hinglish',
            'stacks',
            'api_endpoints',
            'core_features',
            'learning_outcomes',
            'payment_gateways',
            'technologies',
            'difficulty',
            'duration',
            'project_type'
          ];
          
          if (alreadyRendered.includes(key) || typeof value !== 'object' || value === null) {
            return null;
          }

          if (typeof value === 'object' && !Array.isArray(value)) {
            return (
              <div className="detailed-section" key={idx}>
                <h5>{key.replace(/_/g, ' ').toUpperCase()}:</h5>
                <div className="components-list">
                  {Object.entries(value).map(([subKey, subValue], subIdx) => (
                    <div className="component-item" key={subIdx}>
                      <strong>{subKey}:</strong>
                      {Array.isArray(subValue) ? (
                        <ul>
                          {subValue.map((item, i) => (
                            <li key={i}>
                              {typeof item === 'object' ? JSON.stringify(item) : item}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>{typeof subValue === 'object' ? JSON.stringify(subValue) : subValue}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          if (Array.isArray(value)) {
            return (
              <div className="detailed-section" key={idx}>
                <h5>{key.replace(/_/g, ' ').toUpperCase()}:</h5>
                <ul className="best-practices-list">
                  {value.map((item, i) => (
                    <li key={i}>
                      {typeof item === 'object' ? JSON.stringify(item) : item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          }

          return null;
        })}

        {Object.keys(detailed_explanation).some(key => 
          typeof detailed_explanation[key] === 'string' && 
          !['example_code'].includes(key)
        ) && (
          <div className="detailed-section">
            <h5>Additional Information:</h5>
            <div className="components-list">
              {Object.entries(detailed_explanation).map(([key, value], idx) => {
                if (typeof value === 'string' && key !== 'example_code') {
                  return (
                    <div className="component-item" key={idx}>
                      <strong>{key.replace(/_/g, ' ')}:</strong>
                      <p>{value}</p>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!data) return <h2>Content not found</h2>;

  const isProjectsPage = techSlug === "web-development-projects";

  return (
    <div className="content-container">
      <button className="button" onClick={handleBack}>
        ← Back
      </button>

      <div className="content-header">
        <h1>{data.technology}</h1>
        <p className="content-description">{data.description}</p>
      </div>

      {isProjectsPage ? (
        <div className="projects-layout">
          <div className="level-cards">
            {data.levels.map((level) => (
              <div className="level-card" key={level.level}>
                <h3>{level.level.toUpperCase()}</h3>
                <p>{level.description}</p>
              </div>
            ))}
          </div>

          <div className="levels-container">
            {data.levels.map((level) => (
              <div className="level-section" key={level.level}>
                <h3 className="level-title">{level.level.toUpperCase()}</h3>

                <div className="project-preview">
                  {level.topics.map((project) => (
                    <div className="project-item" key={project.id}>
                      <div className="project-header">
                        <h4 className="project-title">{project.title}</h4>
                        <span className="project-id">ID: {project.id}</span>
                      </div>
                      
                      <div className="language-section">
                        <div className="language-label">English</div>
                        <div className="language-content">{project.english}</div>
                      </div>

                      <div className="language-section">
                        <div className="language-label">Hinglish</div>
                        <div className="language-content">{project.hinglish}</div>
                      </div>

                      {project.detailed_explanation && (
                        <div className="detailed-container">
                          {renderDetailedExplanation(project.detailed_explanation)}
                        </div>
                      )}

                      {project.examples?.length > 0 && (
                        <div className="examples-container">
                          <h5>Basic Examples:</h5>
                          {project.examples.map((ex, i) => (
                            <div key={i}>
                              {formatCode(ex)}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="tip-box">
                        🧠 Pehle khud koshish kare – make your mind strong
                      </div>

                      <div className="practice-container">
                        {project.practice.map((q, i) => (
                          <div className="practice-question" key={i}>
                            <details>
                              <summary>{q.question}</summary>
                              <div className="practice-answer">{q.answer}</div>
                            </details>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="levels-container">
          {data.levels.map((level) => (
            <div className="level-section" key={level.level}>
              <h3 className="level-title">{level.level.toUpperCase()}</h3>

              {level.topics.map((topic) => (
                <div className="topic-card" key={topic.id}>
                  <h4 className="topic-title">{topic.title}</h4>

                  <div className="language-section">
                    <div className="language-label">English</div>
                    <div className="language-content">{topic.english}</div>
                  </div>

                  <div className="language-section">
                    <div className="language-label">Hinglish</div>
                    <div className="language-content">{topic.hinglish}</div>
                  </div>

                  {topic.detailed_explanation && (
                    <div className="detailed-container">
                      {renderDetailedExplanation(topic.detailed_explanation)}
                    </div>
                  )}

                  {topic.examples?.length > 0 && (
                    <div className="examples-container">
                      <h5>Basic Examples:</h5>
                      {topic.examples.map((ex, i) => (
                        <div key={i}>
                          {formatCode(ex)}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="tip-box">
                    🧠 Pehle khud koshish kare – make your mind strong
                  </div>

                  <div className="practice-container">
                    {topic.practice.map((q, i) => (
                      <div className="practice-question" key={i}>
                        <details>
                          <summary>{q.question}</summary>
                          <div className="practice-answer">{q.answer}</div>
                        </details>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContentPage;