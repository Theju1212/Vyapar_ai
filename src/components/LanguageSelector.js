import React, { useState } from "react";
import "./LanguageSelector.css";
import { FaGoogle } from "react-icons/fa";

const LanguageSelector = () => {
  const [open, setOpen] = useState(false);

  // List of supported languages (code + label)
  const languages = [
    { code: "en", label: "English" },
    { code: "hi", label: "Hindi" },
    { code: "ta", label: "Tamil" },
    { code: "te", label: "Telugu" },
    { code: "bn", label: "Bengali" },
    { code: "gu", label: "Gujarati" },
    { code: "mr", label: "Marathi" },
    { code: "kn", label: "Kannada" },
    { code: "ml", label: "Malayalam" },
    { code: "ur", label: "Urdu" },
    { code: "as", label: "Assamese" },
    { code: "ne", label: "Nepali" },
    { code: "pa", label: "Punjabi" },
    { code: "or", label: "Odia" },
  ];

  // When user clicks a language
  const handleLanguageChange = (lang) => {
    const select = document.querySelector(".goog-te-combo");
    if (select) {
      select.value = lang;
      select.dispatchEvent(new Event("change"));
    }
    setOpen(false);
  };

  return (
    <div className="lang-selector-wrapper">
      <button className="lang-btn" onClick={() => setOpen(!open)}>
        <FaGoogle className="google-icon" />
        <span>Select Language</span>
        <span className="arrow">▼</span>
      </button>

      {open && (
        <ul className="lang-dropdown">
          {languages.map((lang) => (
            <li key={lang.code} onClick={() => handleLanguageChange(lang.code)}>
              {lang.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LanguageSelector;
