import React, { useRef, useEffect } from 'react';
import {
  FaSearch, FaTimes, FaFolder, FaTag, FaListUl, FaCheckSquare, FaRegSquare
} from 'react-icons/fa';
import { DIFFICULTY_STYLES, SEARCH_TYPE } from './constants';

function SearchResultGroup({ type, results, onSelect }) {
  const labels = {
    [SEARCH_TYPE.TOPIC]:    { text: 'Topics',      Icon: FaFolder  },
    [SEARCH_TYPE.SUBTOPIC]: { text: 'Sub-Topics',  Icon: FaTag     },
    [SEARCH_TYPE.QUESTION]: { text: 'Problems',    Icon: FaListUl  },
  };
  const { text, Icon } = labels[type];

  return (
    <div>
      <div className="px-4 pt-3 pb-1.5 flex items-center gap-2">
        <Icon size={10} className="text-zinc-600" />
        <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-600">{text}</span>
      </div>
      {results.map(result => (
        <button
          key={result.id}
          onMouseDown={() => onSelect(result)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/70 transition-colors text-left gap-3"
        >
          <div className="min-w-0">
            <p className="text-sm text-zinc-200 font-medium truncate">{result.title}</p>
            {result.subtitle && (
              <p className="text-xs text-zinc-600 truncate mt-0.5">{result.subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {result.difficulty && (
              <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded border ${DIFFICULTY_STYLES[result.difficulty] || ''}`}>
                {result.difficulty}
              </span>
            )}
            {result.isSolved !== undefined && (
              result.isSolved
                ? <FaCheckSquare size={12} className="text-emerald-500" />
                : <FaRegSquare   size={12} className="text-zinc-700" />
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

export default function SearchBar({ searchQuery, setSearchQuery, searchResults, searchFocused, setSearchFocused, onSelect }) {
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [setSearchFocused]);

  const showDropdown = searchFocused && searchQuery.length >= 2;

  return (
    <div className="relative" ref={wrapperRef}>
      <div className={`flex items-center bg-zinc-900 border rounded-lg transition-all duration-200 ${
        searchFocused ? 'border-orange-600 ring-1 ring-zinc-700' : 'border-zinc-800'
      }`}>
        <FaSearch className="ml-3 text-zinc-500 shrink-0" size={12} />
        <input
          type="text"
          placeholder="Search topics, sub-topics, problems…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          className="bg-transparent text-sm text-zinc-200 px-3 py-2.5 w-56 sm:w-80 focus:outline-none placeholder:text-zinc-600"
        />
        {searchQuery && (
          <button
            onClick={() => { setSearchQuery(''); setSearchFocused(false); }}
            className="mr-2.5 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <FaTimes size={11} />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 mt-2 w-full sm:w-[460px] bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden">
          {searchResults.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-zinc-600">
                No results for "<span className="text-zinc-400">{searchQuery}</span>"
              </p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto custom-scrollbar divide-y divide-zinc-800/50">
              {[SEARCH_TYPE.TOPIC, SEARCH_TYPE.SUBTOPIC, SEARCH_TYPE.QUESTION].map(type => {
                const group = searchResults.filter(r => r.type === type);
                if (group.length === 0) return null;
                return <SearchResultGroup key={type} type={type} results={group} onSelect={onSelect} />;
              })}
            </div>
          )}
          <div className="px-4 py-2.5 border-t border-zinc-800 bg-zinc-950/60">
            <p className="text-xs text-zinc-700 font-mono">
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}