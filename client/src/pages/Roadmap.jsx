import React from 'react'
import {useParams, useNavigate} from 'react-router-dom';
import stackFlow from '../api/stacks.json';

function Roadmap() {

  const {fieldSlug, stackSlug} = useParams();
  const navigate = useNavigate();

  const roadmapKey = stackSlug || fieldSlug;
  const roadmap = stackFlow[roadmapKey];

  const complete = [];

  const handleClick = (slug, index) => {
    if (index === 0) {
        navigate(`/learning/${fieldSlug}/${stackSlug}/${slug}`);
    } else  {
        alert ('Please complete previous steps first!');
    }
  };


  return (
    <main className='mainy'>
      <div className='roadmap-container'>
        <h1>{roadmap?.title}</h1>
        <div className='roadmap-steps'>
          {roadmap?.steps.map((step, index) => (
            <button
              key={index}
              onClick={() => handleClick(step.slug, index)}
              disabled={index !== 0 && !complete.includes(index - 1)}
            >
              {step.title}
            </button>
          ))}
        </div>
      </div>
    </main>
  )
}

export default Roadmap
