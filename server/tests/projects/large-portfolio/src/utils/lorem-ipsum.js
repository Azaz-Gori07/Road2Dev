export const paragraphs = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.",
  "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio.",
  "Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae.",
  "Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
];

export const generatePageContent = (topic, count = 3) => {
  const content = [];
  for (let i = 0; i < count; i++) {
    content.push({
      title: `${topic} Section ${i + 1}`,
      body: paragraphs[i % paragraphs.length],
      highlights: [
        `Key point about ${topic} number ${i * 2 + 1}`,
        `Important consideration for ${topic} number ${i * 2 + 2}`,
        `Best practice recommendation for ${topic}`,
        `Common pitfall to avoid with ${topic}`,
        `Expert tip for mastering ${topic}`
      ]
    });
  }
  return content;
};

export const generateMetadata = (title, description, keywords) => ({
  title,
  description,
  keywords: keywords.join(', '),
  ogTitle: title,
  ogDescription: description,
  ogType: 'website',
  twitterCard: 'summary_large_image',
  canonical: `https://portfolio.example.com/${title.toLowerCase().replace(/\s+/g, '-')}`
});

export const projectCategories = [
  'Full Stack Applications',
  'Frontend Projects',
  'Backend Services',
  'Mobile Apps',
  'DevOps Infrastructure',
  'AI/ML Integrations',
  'Open Source Contributions',
  'Design Systems',
  'API Integrations',
  'Real-time Applications'
];

export const skillCategories = [
  'Frontend Development',
  'Backend Development',
  'Database Management',
  'Cloud Services',
  'DevOps & CI/CD',
  'Mobile Development',
  'UI/UX Design',
  'Testing & QA',
  'Performance Optimization',
  'Security Best Practices',
  'System Architecture',
  'Project Management'
];
