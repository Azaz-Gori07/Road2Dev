
import { useParams } from "react-router-dom";
import projectsData from "../api/projects/allprojects";
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
      case 'expert': return 'expert-23';
      default: return '';
    }
  };

  const getLevelTitle = (levelName) => {
    const titles = {
      'beginner': 'Beginner Level Projects',
      'intermediate': 'Intermediate Level Projects',
      'advanced': 'Advanced Level Projects',
      'expert': 'Expert Level Projects'
    };
    return titles[levelName] || `${levelName.charAt(0).toUpperCase() + levelName.slice(1)} Level Projects`;
  };


  const getFilteredStacks = () => {
    const slugMapping = {
      'mern-stack': 'mernstack',
      'sern-stack': 'sernstack',
      'php-laravel': 'laravel',
      'django-react': 'django-react',
      'nextjs-stack': 'nextjs',
      'wordpress': 'wordpress',
      'c-programming': 'c-programming',
      'cpp-dsa': 'cpp-dsa',
      'java-development': 'java-development',
      'python-development': 'python-development',
      'java-spring-boot': 'java-spring-boot',
      'csharp-dotnet': 'csharp-dotnet'
    };

    const targetSlug = slugMapping[stackSlug] || stackSlug;
    
    if (!targetSlug) return projectsData.stacks;
    
    return projectsData.stacks.filter(stack => 
      stack.stackMeta.slug === targetSlug
    );
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
        <h1 className="heading">
          {filteredStacks.length > 0 
            ? `${filteredStacks[0].stackMeta.name} Projects` 
            : `${projectsData.category.name} Projects`
          }
        </h1>
        <p className="page-description-23">
          {filteredStacks.length > 0 
            ? filteredStacks[0].stackMeta.description 
            : projectsData.category.description
          }
        </p>
      </div>

      <div className="stacks-container-23">
        {filteredStacks.map((stack) => (
          <div className="stack-box-23" key={stack.stackMeta.slug}>
            <div className="stack-header-23">
              <h2 className="stack-name-23">{stack.stackMeta.name}</h2>
              <span className="stack-slug-23">({stack.stackMeta.slug})</span>
            </div>

            <p className="stack-description-23">{stack.stackMeta.description}</p>

            <div className="tech-tags-23">
              {stack.default_stack.frontend && (
                <span className="tech-tag-23 frontend-23">
                  <span className="icon-23">⚡</span>
                  Frontend: {stack.default_stack.frontend}
                </span>
              )}
              {stack.default_stack.backend && (
                <span className="tech-tag-23 backend-23">
                  <span className="icon-23">🔧</span>
                  Backend: {stack.default_stack.backend}
                </span>
              )}
              {stack.default_stack.database && (
                <span className="tech-tag-23 database-23">
                  <span className="icon-23">💾</span>
                  Database: {stack.default_stack.database}
                </span>
              )}
              {stack.default_stack.language && (
                <span className="tech-tag-23 language-23">
                  <span className="icon-23">💻</span>
                  Language: {stack.default_stack.language}
                </span>
              )}
              {stack.default_stack.framework && (
                <span className="tech-tag-23 framework-23">
                  <span className="icon-23">🚀</span>
                  Framework: {stack.default_stack.framework}
                </span>
              )}
              {stack.default_stack.compiler && (
                <span className="tech-tag-23 compiler-23">
                  <span className="icon-23">⚙️</span>
                  Compiler: {stack.default_stack.compiler}
                </span>
              )}
            </div>

            <div className="levels-container-23">
              {Object.entries(stack.levels).map(([levelName, projects]) => (
                projects.length > 0 && (
                  <div key={levelName}>
                    <h3 className={`level-title-23 ${getLevelClass(levelName)}`}>
                      {getLevelTitle(levelName)}
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

                          {project.slug && (
                            <div className="slug-section-23">
                              <div className="language-label-23">Slug</div>
                              <div className="language-content-23">{project.slug}</div>
                            </div>
                          )}

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

                          {project.files && project.files.length > 0 && (
                            <div className="files-container-23">
                              <div className="language-label-23">Files</div>
                              <div className="file-tags-23">
                                {project.files.map((file, index) => (
                                  <span className="file-tag-23" key={index}>
                                    {file}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {project.classes && project.classes.length > 0 && (
                            <div className="classes-container-23">
                              <div className="language-label-23">Classes</div>
                              <div className="class-tags-23">
                                {project.classes.map((className, index) => (
                                  <span className="class-tag-23" key={index}>
                                    {className}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {project.technologies && project.technologies.length > 0 && (
                            <div className="technologies-container-23">
                              <div className="language-label-23">Technologies</div>
                              <div className="tech-tags-small-23">
                                {project.technologies.map((tech, index) => (
                                  <span className="tech-tag-small-23" key={index}>
                                    {tech}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {project.template_files && project.template_files.length > 0 && (
                            <div className="template-container-23">
                              <div className="language-label-23">Template Files</div>
                              <div className="template-tags-23">
                                {project.template_files.map((file, index) => (
                                  <span className="template-tag-23" key={index}>
                                    {file}
                                  </span>
                                ))}
                              </div>
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
                                {project.deployment.compilation && (
                                  <div className="deployment-item-23 compilation-23">
                                    <strong>Compilation:</strong> {project.deployment.compilation}
                                  </div>
                                )}
                                {project.deployment.build && (
                                  <div className="deployment-item-23 build-23">
                                    <strong>Build:</strong> {project.deployment.build}
                                  </div>
                                )}
                                {project.deployment.testing && (
                                  <div className="deployment-item-23 testing-23">
                                    <strong>Testing:</strong> {project.deployment.testing}
                                  </div>
                                )}
                                {project.deployment.cloud && (
                                  <div className="deployment-item-23 cloud-23">
                                    <strong>Cloud:</strong> {project.deployment.cloud}
                                  </div>
                                )}
                                {project.deployment.packaging && (
                                  <div className="deployment-item-23 packaging-23">
                                    <strong>Packaging:</strong> {project.deployment.packaging}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectsContent;