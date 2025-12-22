import { useParams, useNavigate } from "react-router-dom";
import stackFlow from "../api/stacksFlow.json";
import "./Roadmap.css";

const Roadmap = () => {
  const { fieldSlug, stackSlug } = useParams();
  const navigate = useNavigate();

  const roadmapKey = stackSlug || fieldSlug;
  const roadmap = stackFlow[roadmapKey];

  const completed = []; 

  const handleClick = (slug, index) => {
    const isUnlocked = index === 0 || completed.includes(slug);
    if (isUnlocked) {
      navigate(`/learning/${fieldSlug}/${stackSlug}/${slug}`);
    } else {
      alert("Complete previous module to unlock this one");
    }
  };

  const getModuleTitle = (slug) => {
    const titles = {
      "web-fundamentals": "Web Fundamentals",
      "html": "HTML Mastery",
      "css": "CSS Styling",
      "javascript": "JavaScript Programming",
      "react": "React Framework",
      "nodejs": "Node.js Backend",
      "mongodb": "MongoDB Database",
      "express": "Express.js",
      "git": "Version Control with Git",
      "responsive": "Responsive Design",
      "apis": "Working with APIs",
      "deployment": "Deployment & Hosting"
    };
    return titles[slug] || slug.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getModuleDescription = (slug) => {
    const descriptions = {
      "web-fundamentals": "Learn how the web works, HTTP, browsers, and basic concepts",
      "html": "Master the structure and semantics of web pages",
      "css": "Learn styling, layout, animations and responsive techniques",
      "javascript": "Add interactivity and dynamic functionality to websites",
      "react": "Build modern user interfaces with component-based architecture",
      "nodejs": "Create server-side applications using JavaScript",
      "mongodb": "Work with NoSQL databases and data modeling",
      "express": "Build robust web applications and RESTful APIs",
      "git": "Collaborate and manage code with version control",
      "responsive": "Create websites that work on all devices",
      "apis": "Connect your applications with external services",
      "deployment": "Launch your projects to the world"
    };
    return descriptions[slug] || "Complete this module to advance your skills";
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="roadmap-container">
      <div className="roadmap-header">
        <h1 className="heading">ROADMAP</h1>
        <p className="roadmap-subtitle">
          Follow the path to mastery. Complete each module in sequence.
        </p>
      </div>

      <div className="roadmap-progress">
        <p className="progress-text">
          Progress: {completed.length} of {roadmap.length} modules completed
        </p>
      </div>

      <div className="roadmap-list">
        {roadmap.map((slug, index) => {
          const isUnlocked = index === 0 || completed.includes(slug);
          const isCompleted = completed.includes(slug);

          return (
            <div
              key={slug}
              onClick={() => handleClick(slug, index)}
              className={`roadmap-item ${isUnlocked ? 'unlocked' : 'locked'} ${isCompleted ? 'completed' : ''}`}
            >
              <div className="progress-line"></div>
              <div className="item-index">{index + 1}</div>
              <div className="roadmap-content">
                <div className="module-info">
                  <h3 className="module-title">{getModuleTitle(slug)}</h3>
                  <p className="module-desc">{getModuleDescription(slug)}</p>
                </div>
                <div className="module-status">
                  {isCompleted ? (
                    <>
                      <span className="status-badge badge-completed">Completed</span>
                      <span className="status-icon">✅</span>
                    </>
                  ) : isUnlocked ? (
                    <>
                      <span className="status-badge badge-unlocked">Start Learning</span>
                      <span className="status-icon">🔓</span>
                    </>
                  ) : (
                    <>
                      <span className="status-badge badge-locked">Locked</span>
                      <span className="status-icon">🔒</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="roadmap-navigation">
        <button className="nav-button" onClick={handleBack}>
          ← Go Back
        </button>
      </div>
    </div>
  );
};

export default Roadmap;