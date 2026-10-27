import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import {
  Search,
  Tag,
  Loader2,
  ChevronRight,
  X
} from 'lucide-react';

/**
 * Helper to highlight query words inside suggestion text without mangling words.
 */
function HighlightedText({ text, query }) {
  if (!text || !query || !query.trim()) return <span>{text || ''}</span>;

  const rawQuery = query.trim();
  const words = rawQuery.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return <span>{text}</span>;

  const patterns = words.map(w => {
    const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (w.length === 1) {
      return `\\b${escaped}`;
    }
    return escaped;
  });

  try {
    const regex = new RegExp(`(${patterns.join('|')})`, 'gi');
    const parts = text.split(regex);

    return (
      <span>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark
              key={i}
              style={{
                background: 'rgba(224, 109, 67, 0.35)',
                color: '#FFA07A',
                padding: '1px 4px',
                borderRadius: '4px',
                fontWeight: 700
              }}
            >
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  } catch (e) {
    return <span>{text}</span>;
  }
}

const ComplaintSuggestionInput = ({
  value,
  onChange,
  onSelectRecord,
  onClearRecord,
  selectedRecord,
  organizationId,
  placeholder = "Describe what is broken, leaking, or needs attention...",
  rows = 4,
  disabled = false,
  required = true
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef(null);
  const textareaRef = useRef(null);
  const debounceRef = useRef(null);

  // Debounced live suggestion fetcher (150ms)
  useEffect(() => {
    if (selectedRecord && selectedRecord.complaint === value) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const trimmed = (value || '').trim();
    if (!trimmed) {
      setSuggestions([]);
      setIsOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get('/complaints/suggestions', {
          params: {
            q: trimmed,
            orgId: organizationId,
            limit: 10
          }
        });
        const list = res.data?.suggestions || [];
        setSuggestions(list);
        setIsOpen(list.length > 0);
        setActiveIndex(-1);
      } catch (err) {
        console.error('Failed to fetch dataset suggestions:', err);
        setSuggestions([]);
        setIsOpen(false);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, organizationId, selectedRecord]);

  // Click outside to dismiss dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleTextChange = (e) => {
    const newText = e.target.value;
    onChange(newText);

    if (selectedRecord && selectedRecord.complaint !== newText) {
      onClearRecord();
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (suggestion) => {
    onSelectRecord(suggestion);
    setIsOpen(false);
    setSuggestions([]);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', marginBottom: '1.25rem' }}>
      {/* Text Input Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <label style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
          DESCRIBE YOUR PROBLEM
        </label>
        {loading && (
          <span style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
            <Loader2 size={13} className="animate-spin" />
            Searching suggestions...
          </span>
        )}
      </div>

      {/* Main Textarea */}
      <div style={{ position: 'relative' }}>
        <textarea
          ref={textareaRef}
          className="form-control"
          rows={rows}
          placeholder={placeholder}
          value={value}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0 && !selectedRecord) setIsOpen(true);
          }}
          disabled={disabled}
          required={required}
          style={{ minHeight: '100px', fontSize: '0.95rem' }}
        ></textarea>
      </div>

      {/* Floating Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && !selectedRecord && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 100,
          marginTop: '8px',
          background: 'var(--bg-card)',
          borderRadius: '14px',
          border: '1px solid rgba(224, 109, 67, 0.4)',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.75)',
          overflow: 'hidden',
          animation: 'fadeIn 0.15s ease-out'
        }}>
          {/* Dropdown Header */}
          <div style={{
            padding: '10px 16px',
            background: 'rgba(255, 255, 255, 0.04)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.8rem',
            color: 'var(--text-muted)'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--text-main)' }}>
              <Search size={14} color="var(--primary)" />
              Dataset Suggestions ({suggestions.length})
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>↑ ↓ to navigate, Enter to select</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: 'none',
                  color: 'var(--text-main)',
                  borderRadius: '6px',
                  padding: '2px 8px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <X size={12} /> Close
              </button>
            </div>
          </div>

          {/* Suggestion Items Container: Displays exactly 3 items in height (~245px) with vertical scrollbar */}
          <div style={{ maxHeight: '245px', overflowY: 'auto' }}>
            {suggestions.map((s, index) => {
              const isSelected = index === activeIndex;
              return (
                <div
                  key={s.recordId}
                  onClick={() => handleSelect(s)}
                  onMouseEnter={() => setActiveIndex(index)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: index < suggestions.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                    background: isSelected ? 'rgba(224, 109, 67, 0.18)' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '14px',
                    transition: 'background 0.15s ease'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-main)', marginBottom: '6px', lineHeight: 1.45 }}>
                      <HighlightedText text={s.displayText || s.complaint} query={value} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Tag size={12} color="var(--primary)" /> {s.category}
                      </span>
                      <span className={`badge badge-${(s.priority || 'medium').toLowerCase()}`} style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                        {s.priority} Priority
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <ChevronRight size={16} color="var(--primary)" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintSuggestionInput;
