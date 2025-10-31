'use client';

import { useState, useRef, useEffect, useLayoutEffect } from 'react';

export default function VariableAutocomplete({ 
  value, 
  onChange, 
  placeholder, 
  rows = 3,
  availableVariables = [],
  className 
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const textareaRef = useRef(null);
  const selectionRef = useRef({ start: 0, end: 0 });
  const shouldRestoreSelectionRef = useRef(false);
  const pendingScrollRef = useRef(null);

  const handleInput = (e) => {
    const newValue = e.target.value;
    const selectionStart = e.target.selectionStart ?? 0;
    const selectionEnd = e.target.selectionEnd ?? selectionStart;

    selectionRef.current = { start: selectionStart, end: selectionEnd };
    shouldRestoreSelectionRef.current = true;
    pendingScrollRef.current = e.target.scrollTop;
    onChange(newValue);

    const textBeforeCursor = newValue.substring(0, selectionStart);
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
    if (!textarea) {
      return;
    }

    const sourceValue = typeof value === 'string' ? value : '';
    const { start, end } = selectionRef.current;
    const textBeforeCursor = sourceValue.substring(0, start);
    const lastOpenBrace = textBeforeCursor.lastIndexOf('{{');

    if (lastOpenBrace === -1) {
      setShowSuggestions(false);
      return;
    }

    const newText = 
      sourceValue.substring(0, lastOpenBrace) + 
      `{{${variableName}}}` + 
      sourceValue.substring(end);

    const newCursorPos = lastOpenBrace + variableName.length + 4;

    onChange(newText);
    selectionRef.current = { start: newCursorPos, end: newCursorPos };
    shouldRestoreSelectionRef.current = true;
    pendingScrollRef.current = textarea.scrollTop;
    setShowSuggestions(false);

    requestAnimationFrame(() => {
      const node = textareaRef.current;
      if (!node) {
        return;
      }
      node.focus();
      node.setSelectionRange(newCursorPos, newCursorPos);
      if (pendingScrollRef.current !== null) {
        node.scrollTop = pendingScrollRef.current;
      }
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && showSuggestions) {
      setShowSuggestions(false);
      e.preventDefault();
    }
  };

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || !shouldRestoreSelectionRef.current) {
      return;
    }
    if (document.activeElement !== textarea) {
      return;
    }

    shouldRestoreSelectionRef.current = false;

    const length = textarea.value.length;
    const { start, end } = selectionRef.current;
    const clampedStart = Math.min(start, length);
    const clampedEnd = Math.min(end, length);

    selectionRef.current = { start: clampedStart, end: clampedEnd };
    textarea.setSelectionRange(clampedStart, clampedEnd);
    if (pendingScrollRef.current !== null) {
      textarea.scrollTop = pendingScrollRef.current;
      pendingScrollRef.current = null;
    }
  }, [value]);

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
        className={[className, 'nodrag', 'nopan'].filter(Boolean).join(' ')}
        placeholder={placeholder}
        rows={rows}
        value={typeof value === 'string' ? value : ''}
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
