import React from "react";
import "./ExperienceSection.css";

export default function ExperienceSection({ children, className = "", ...props }) {
  return (
    <div className={`experiencesection ${className}`} {...props}>
      <h2>ExperienceSection</h2>
      <p>ExperienceSection component content goes here. This component handles specific UI rendering.</p>
      {children}
    </div>
  );
}
