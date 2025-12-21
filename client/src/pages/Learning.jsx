import React from 'react';
import fields from '../api/fields.json';
import './Learning.css';
import iconMap from '../utils/iconMap';
import { useNavigate } from "react-router-dom";
import { 
  TrendingUp,
 } from "lucide-react";


function Learning() {
  const navigate = useNavigate();

  const handleFieldClick = (slug) => {
    navigate(`/learning/${slug}`);
  };

  return (
    <section className="learning-page">
      <header className="learning-header">
        <h1 className='heading'><TrendingUp size={32} /> Learning Paths</h1>
        <p className='sub-title'>Explore curated learning paths to enhance your skills and knowledge.</p>
      </header>

      <div className="fields-container">
        {fields.map((field) => {
          const Icon = iconMap[field.icon];
          return (
          <div 
          key={field.id}
          className="field-card" 
          onClick={() => handleFieldClick(field.slug)}>
            <h2 className="field-name">{field.name}
              <Icon className="field-icon" size={30} />
            </h2>
            <p className="field-description">{field.description}</p>
          </div>
        )})}
      </div>
    </section>
  )
}

export default Learning
