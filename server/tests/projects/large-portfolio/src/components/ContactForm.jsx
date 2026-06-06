import React from "react";
import "./ContactForm.css";

export default function ContactForm({ children, className = "", ...props }) {
  return (
    <div className={`contactform ${className}`} {...props}>
      <h2>ContactForm</h2>
      <p>ContactForm component content goes here. This component handles specific UI rendering.</p>
      {children}
    </div>
  );
}
