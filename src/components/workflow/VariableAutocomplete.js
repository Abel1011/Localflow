'use client';

import { useState, useRef, useEffect } from 'react';

export default function VariableAutocomplete({ 
  value, 
  onChange, 
  placeholder, 
  rows = 3,
  availableVariables = [],
  className 
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [suggestionPosition, setSuggestionPosition] = useState({ top: 0, left: 0 });
  const textareaRef = useRef(null);

  const handleInput = (e) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    onChange(newValue);
    setCursorPosition(cursorPos);

    const textBeforeCursor = newValue.substring(0, cursorPos);
    const lastOpenBrace = textBeforeCursor.lastIndexOf('{{');
    const lastCloseBrace = textBeforeCursor.lastIndexOf('}}');

    if (lastOpenBrace > lastCloseBrace && lastOpenBrace !== -1 && availableVariables.length > 0) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const insertVariable = (variableName) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    
    const lastOpenBrace = textBeforeCursor.lastIndexOf('{{');
    
    const newText = 
      value.substring(0, lastOpenBrace) + 
      `{{${variableName}}}` + 
      textAfterCursor;
    
    onChange(newText);
    setShowSuggestions(false);
    
    setTimeout(() => {
      const newCursorPos = lastOpenBrace + variableName.length + 4;
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && showSuggestions) {
      setShowSuggestions(false);
      e.preventDefault();
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (textareaRef.current && !textareaRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        className={className}
        placeholder={placeholder}
        rows={rows}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
      />
      
      {showSuggestions && availableVariables.length > 0 && (
        <div 
          className="absolute z-50 bg-white border-2 border-slate-300 rounded-lg shadow-xl max-h-48 overflow-y-auto mt-1"
          style={{
            top: '100%',
            left: 0,
            minWidth: '200px'
          }}
        >
          <div className="p-2">
            <p className="text-xs font-semibold text-slate-500 mb-2 px-2">Available Variables</p>
            {availableVariables.map((variable, index) => (
              <button
                key={index}
                onClick={() => insertVariable(variable)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 rounded-md transition-colors flex items-center gap-2 group"
              >
                <span className="font-mono text-indigo-600 font-semibold">{'{{ }}'}</span>
                <span className="text-slate-700 group-hover:text-indigo-700 font-medium">
                  {variable}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
