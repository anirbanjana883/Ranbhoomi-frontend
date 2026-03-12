import React from 'react';
import { FaRandom } from 'react-icons/fa';
import { comingSoon } from './constants';
import SearchBar from './SearchBar';
import ProgressBanner from './ProgressBanner';

export default function FilterBar({
  activeTab, setActiveTab,
  searchQuery, setSearchQuery,
  searchResults, searchFocused, setSearchFocused, onSearchSelect,
  difficultyFilter, setDifficultyFilter,
  statusFilter, setStatusFilter,
  progressStats, stats,
}) {
  return (
    <div className="shrink-0 bg-zinc-950 border-b border-zinc-800 z-20 px-4 sm:px-6 py-3.5 flex flex-col gap-3.5">
      <div className="max-w-[1400px] w-full mx-auto flex flex-col gap-3.5">

        {/* Controls row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">

          {/* Tabs */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1 w-max shrink-0 gap-1">
            {[
              { key: 'all',      label: 'All Problems' },
              { key: 'revision', label: '★  Revision'  },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                  activeTab === key
                    ? 'bg-zinc-700 text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search + filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <SearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              searchResults={searchResults}
              searchFocused={searchFocused}
              setSearchFocused={setSearchFocused}
              onSelect={onSearchSelect}
            />

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-zinc-600 appearance-none cursor-pointer hover:border-zinc-700 transition-colors"
            >
              <option value="All">All Status</option>
              <option value="Unsolved">Unsolved</option>
              <option value="Solved">Solved</option>
            </select>

            <select
              value={difficultyFilter}
              onChange={e => setDifficultyFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-zinc-600 appearance-none cursor-pointer hover:border-zinc-700 transition-colors"
            >
              <option value="All">All Difficulty</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>

            <button
              onClick={() => comingSoon('Random')}
              className="hidden sm:flex items-center gap-2 px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors text-sm font-medium shrink-0"
            >
              <FaRandom size={11} /> Random
            </button>
          </div>
        </div>

        <ProgressBanner progressStats={progressStats} stats={stats} />
      </div>
    </div>
  );
}