import { useParams } from "react-router-dom";
import fundamentals from "../api/fundamentals.json";
import html from "../api/languages/html5.json";
import css from "../api/languages/css.json";
import javascript from '../api/languages/javascript.json';
import react from '../api/languages/reactDuplicate.json';
import nodejs from '../api/languages/nodejs.json';
import expressjs from '../api/languages/express.json';
import mongodb from '../api/languages/mongodb.json';
import ProjectsContent from '../pages/projects.jsx'
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

  if (techSlug === "projects") {
    return <ProjectsContent />;
  }
  

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
            'seo_tip_hinglish'
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

  return (
    <div className="content-container">
      <button className="button" onClick={handleBack}>
        ← Back
      </button>

      <div className="content-header">
        <h1>{data.technology}</h1>
        <p className="content-description">{data.description}</p>
      </div>

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
    </div>
  );
};

export default ContentPage;