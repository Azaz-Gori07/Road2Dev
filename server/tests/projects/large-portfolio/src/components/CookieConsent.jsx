import React from "react";
import "./CookieConsent.css";

export default function CookieConsent({ children, className = "", ...props }) {
  return (
    <div className={`cookieconsent ${className}`} {...props}>
      <h2>CookieConsent</h2>
      <p>CookieConsent component content goes here. This component handles specific UI rendering.</p>
      {children}
    </div>
  );
}
