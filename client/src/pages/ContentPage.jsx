import { useParams } from "react-router-dom";
import fundamentals from "../api/fundamentals.json";
import html from "../api/languages/html.json";
import "./ContentPage.css";

const ContentPage = () => {
  const { techSlug } = useParams();

  const data =
    techSlug === "web-fundamentals"
      ? fundamentals
      : techSlug === "html"
      ? html
      : null;

  const handleBack = () => {
    window.history.back();
  };

  if (!data) return <h2>Content not found</h2>;

  return (
    <div className="content-container">
      <button className="back-button" onClick={handleBack}>
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

                {topic.examples?.length > 0 && (
                  <div className="examples-container">
                    {topic.examples.map((ex, i) => (
                      <div className="example-box" key={i}>
                        <pre>{ex}</pre>
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