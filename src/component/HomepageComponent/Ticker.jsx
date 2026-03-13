import React from 'react';
import { FaFireAlt, FaBolt } from 'react-icons/fa';

const ITEMS = [
  '↑ RANBHOOMI V2.0',
  'Two Sum', 'LRU Cache', 'Median of Two Arrays',
  'Segment Tree', "Dijkstra's", 'DP on Trees',
  'Trie', 'Sliding Window', 'Binary Search',
  'Graph BFS/DFS', 'Knapsack', 'Convex Hull',
  'Heavy-Light Decomp', 'Fenwick Tree',
  '↑ ARENA MODE LIVE', 'Suffix Array', 'Merge Sort Tree',
];

export default function Ticker() {
  const doubled = [...ITEMS, ...ITEMS];
  return (
    <div className="ticker-wrap border-y border-zinc-800/80 bg-zinc-900/60 backdrop-blur-sm py-3.5 shadow-inner relative z-10">
      <div className="ticker-inner flex items-center">
        {doubled.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-3 mr-12 ff-mono text-[11px] sm:text-xs text-zinc-400 font-semibold uppercase tracking-[0.2em] whitespace-nowrap">
            {item.startsWith('↑')
              ? (
                <>
                  <FaBolt size={12} className="text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                  <span className="text-red-400 font-bold tracking-[0.25em] drop-shadow-sm">{item.slice(2)}</span>
                </>
              ) : (
                <>
                  <FaFireAlt size={12} className="text-zinc-600" />
                  <span className="hover:text-zinc-200 transition-colors cursor-default">{item}</span>
                </>
              )
            }
          </span>
        ))}
      </div>
    </div>
  );
}