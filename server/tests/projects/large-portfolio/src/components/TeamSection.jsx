import React from "react";
import "./TeamSection.css";

export default function TeamSection({ children, className = "", ...props }) {
  return (
    <div className={`teamsection ${className}`} {...props}>
      <h2>TeamSection</h2>
      <p>TeamSection component content goes here. This component handles specific UI rendering.</p>
      {children}
    </div>
  );
}
