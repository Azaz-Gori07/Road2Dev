import React from "react";
import "./EducationSection.css";

export default function EducationSection({ children, className = "", ...props }) {
  return (
    <div className={`educationsection ${className}`} {...props}>
      <h2>EducationSection</h2>
      <p>EducationSection component content goes here. This component handles specific UI rendering.</p>
      {children}
    </div>
  );
}
