const TOPIC_ALIASES = {
  'javascript': ['js', 'ecmascript', 'es6', 'es2015', 'es2016', 'es2017', 'es2018', 'es2019', 'es2020', 'es2021', 'es2022'],
  'react': ['reactjs', 'react.js', 'react js'],
  'node.js': ['nodejs', 'node', 'node js', 'express.js', 'expressjs'],
  'python': ['py', 'python3'],
  'typescript': ['ts', 'type script'],
  'html': ['html5'],
  'css': ['css3', 'stylesheets'],
  'mongodb': ['mongo', 'mongo db'],
  'sql': ['mysql', 'postgresql', 'postgres', 'sqlite', 'relational database'],
  'git': ['github', 'version control'],
  'rest api': ['rest', 'restful', 'restful api', 'api design'],
  'graphql': ['gql'],
  'docker': ['container', 'containers', 'docker compose'],
  'aws': ['amazon web services', 'cloud'],
  'closures': ['closure', 'javascript closures', 'js closures', 'closure scope', 'closures deep dive', 'closures practice', 'closures challenge'],
  'promises': ['promise', 'javascript promises', 'js promises', 'promise chaining', 'async promises', 'promises practice'],
  'async/await': ['async await', 'async', 'asynchronous javascript', 'async programming'],
  'event loop': ['javascript event loop', 'js event loop', 'event loop js', 'event loop javascript'],
  'authentication': ['auth', 'authn', 'jwt', 'oauth', 'login', 'user authentication'],
  'authorization': ['authz', 'rbac', 'access control', 'user authorization'],
  'algorithms': ['data structures', 'dsa', 'algorithm design', 'algorithms and data structures'],
  'data structures': ['arrays', 'linked lists', 'stacks', 'queues', 'trees', 'graphs', 'hash tables'],
  'system design': ['distributed systems', 'architecture', 'scalability', 'microservices', 'system architecture'],
  'testing': ['unit testing', 'integration testing', 'e2e testing', 'jest', 'mocha', 'chai', 'test driven development'],
  'debugging': ['error handling', 'troubleshooting', 'debug'],
  'security': ['cybersecurity', 'appsec', 'web security', 'owasp', 'application security'],
  'performance': ['optimization', 'performance tuning', 'profiling', 'performance optimization'],
  'oop': ['object oriented programming', 'object-oriented', 'object oriented'],
  'functional programming': ['fp', 'functional js', 'functional programming concepts']
};

const capitalize = (s) => s[0].toUpperCase() + s.slice(1);

const canonicalize = (topic) => {
  if (!topic || typeof topic !== 'string') return topic;

  const lower = topic.trim().toLowerCase();

  const entries = [];
  for (const [canonical, aliases] of Object.entries(TOPIC_ALIASES)) {
    const cLower = canonical.toLowerCase();
    entries.push({ term: cLower, canonical });
    for (const alias of aliases) {
      entries.push({ term: alias.toLowerCase(), canonical });
    }
  }

  entries.sort((a, b) => b.term.length - a.term.length);

  for (const { term, canonical } of entries) {
    if (lower === term) return capitalize(canonical);
    if (lower.includes(term)) return capitalize(canonical);
    if (term.includes(lower)) return capitalize(canonical);
  }

  return topic.trim();
};

export { canonicalize, TOPIC_ALIASES };
