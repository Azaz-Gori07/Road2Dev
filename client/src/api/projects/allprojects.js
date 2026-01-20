import webProject from './web-development-projects.json';
import softwareProject from './softwareProject.json';


const allApi = {
  category: {
    name: "All Development Projects",
    description: "Combined web and software development projects"
  },
  stacks: [
    ...webProject.stacks,
    ...softwareProject.stacks
  ]
};

export default allApi;