import React from "react";
import "./AboutSection.css";

export default function AboutSection({ children, className = "", ...props }) {
  return (
    <div className={`aboutsection ${className}`} {...props}>
      <h2>AboutSection</h2>
      <p>AboutSection component content goes here. This component handles specific UI rendering.</p>
      {children}
    </div>
  );
}
