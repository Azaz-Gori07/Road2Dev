import { useParams } from "react-router-dom";
import projectsData from "../api/projects/web-development-projects.json";
import "./project.css";

const ProjectsContent = () => {
  const { stackSlug } = useParams();

  const handleBack = () => {
    window.history.back();
  };

  const getLevelClass = (levelName) => {
    switch (levelName) {
      case 'beginner': return 'beginner-23';
      case 'intermediate': return 'intermediate-23';
      case 'advanced': return 'advanced-23';
      default: return '';
    }
  };

  const getFilteredStacks = () => {
    const slugMapping = {
      'mern-stack': 'mernstack',
      'sern-stack': 'sernstack',
      'php-laravel': 'laravel',
      'django-react': 'django-react',
      'nextjs-stack': 'nextjs',
      'wordpress': 'wordpress'
    };

    const targetSlug = slugMapping[stackSlug];
    
    if (!targetSlug) return projectsData.stacks;
    
    return projectsData.stacks.filter(stack => stack.stackMeta.slug === targetSlug);
  };

  const filteredStacks = getFilteredStacks();

  return (
    <div className="projects-page-23">
      <div className="back-btn-23">
        <button className="button" onClick={handleBack}>
        ← Back
      </button>
      </div>

      <div className="page-header-23">
        <h1 className="page-title-23">{projectsData.category.name} Projects</h1>
        <p className="page-description-23">{projectsData.category.description}</p>
      </div>

      <div className="stacks-container-23">
        {filteredStacks.map((stack) => (
          <div className="stack-box-23" key={stack.stackMeta.slug}>
            <div className="stack-header-23">
              <h2 className="stack-name-23">{stack.stackMeta.name}</h2>
            </div>

            <p className="stack-description-23">{stack.stackMeta.description}</p>

            <div className="tech-tags-23">
              <span className="tech-tag-23 frontend-23">
                <span className="icon-23">⚡</span>
                Frontend: {stack.default_stack.frontend}
              </span>
              <span className="tech-tag-23 backend-23">
                <span className="icon-23">🔧</span>
                Backend: {stack.default_stack.backend}
              </span>
              <span className="tech-tag-23 database-23">
                <span className="icon-23">💾</span>
                Database: {stack.default_stack.database}
              </span>
            </div>

            <div className="levels-container-23">
              {Object.entries(stack.levels).map(([levelName, projects]) => (
                <div key={levelName}>
                  <h3 className={`level-title-23 ${getLevelClass(levelName)}`}>
                    {levelName.charAt(0).toUpperCase() + levelName.slice(1)} Level Projects
                  </h3>

                  <div className="projects-grid-23">
                    {projects.map((project) => (
                      <div
                        className={`project-card-23 ${getLevelClass(levelName)}-card-23`}
                        key={project.id}
                      >
                        <div className="project-header-23">
                          <div>
                            <h4 className="project-title-23">{project.title}</h4>
                            <div className="project-meta-23">
                              <span className="project-id-23">ID: {project.id}</span>
                              <span className="project-duration-23">{project.duration}</span>
                            </div>
                          </div>
                        </div>

                        <div className="language-section-23">
                          <div className="language-label-23">English</div>
                          <div className="language-content-23">{project.summary.english}</div>
                        </div>

                        <div className="language-section-23">
                          <div className="language-label-23">Hinglish</div>
                          <div className="language-content-23">{project.summary.hinglish}</div>
                        </div>

                        {project.project_type && (
                          <div className="language-section-23">
                            <div className="language-label-23">Project Type</div>
                            <div className="language-content-23">{project.project_type}</div>
                          </div>
                        )}

                        {project.core_features && project.core_features.length > 0 && (
                          <div className="features-container-23">
                            <div className="language-label-23">Core Features</div>
                            <ul className="features-list-23">
                              {project.core_features.map((feature, index) => (
                                <li key={index}>{feature}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {project.api_endpoints && project.api_endpoints.length > 0 && (
                          <div className="api-container-23">
                            <div className="language-label-23">API Endpoints</div>
                            {project.api_endpoints.map((endpoint, index) => (
                              <div className="api-endpoint-23" key={index}>
                                {endpoint}
                              </div>
                            ))}
                          </div>
                        )}

                        {project.learning_outcomes && project.learning_outcomes.length > 0 && (
                          <div className="outcomes-container-23">
                            <div className="language-label-23">Learning Outcomes</div>
                            <ul className="features-list-23">
                              {project.learning_outcomes.map((outcome, index) => (
                                <li key={index}>{outcome}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {project.interview_topics && project.interview_topics.length > 0 && (
                          <div className="interview-container-23">
                            <div className="language-label-23">Interview Topics</div>
                            <div className="topic-tags-23">
                              {project.interview_topics.map((topic, index) => (
                                <span className="topic-tag-23" key={index}>
                                  {topic}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {project.deployment && (
                          <div className="deployment-container-23">
                            <div className="language-label-23">Deployment Options</div>
                            <div className="deployment-grid-23">
                              {project.deployment.frontend && (
                                <div className="deployment-item-23 frontend-23">
                                  <strong>Frontend:</strong> {project.deployment.frontend}
                                </div>
                              )}
                              {project.deployment.backend && (
                                <div className="deployment-item-23 backend-23">
                                  <strong>Backend:</strong> {project.deployment.backend}
                                </div>
                              )}
                              {project.deployment.database && (
                                <div className="deployment-item-23 database-23">
                                  <strong>Database:</strong> {project.deployment.database}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {project.unlock_rules && (
                          <div className="unlock-container-23">
                            <div className="language-label-23">Unlock Requirements</div>
                            <div className="unlock-card-23">
                              <div className="unlock-type-23">
                                <strong>Type:</strong> {project.unlock_rules.type}
                              </div>
                              {project.unlock_rules.requires && project.unlock_rules.requires.length > 0 && (
                                <div className="required-skills-23">
                                  <strong>Requires:</strong>
                                  <div className="skill-tags-23">
                                    {project.unlock_rules.requires.map((req, index) => (
                                      <span className="skill-tag-23" key={index}>
                                        {req}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
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
  );
};

export default ProjectsContent;