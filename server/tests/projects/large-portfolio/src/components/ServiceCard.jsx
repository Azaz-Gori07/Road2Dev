import React from "react";
import "./ServiceCard.css";

export default function ServiceCard({ children, className = "", ...props }) {
  return (
    <div className={`servicecard ${className}`} {...props}>
      <h2>ServiceCard</h2>
      <p>ServiceCard component content goes here. This component handles specific UI rendering.</p>
      {children}
    </div>
  );
}
