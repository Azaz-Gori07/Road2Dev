import React from "react";
import "./ProjectCard.css";

export default function ProjectCard({ children, className = "", ...props }) {
  return (
    <div className={`projectcard ${className}`} {...props}>
      <h2>ProjectCard</h2>
      <p>ProjectCard component content goes here. This component handles specific UI rendering.</p>
      {children}
    </div>
  );
}
