import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-black/90 border border-orange-500/50 p-3 rounded shadow-[0_0_15px_rgba(234,88,12,0.3)]">
        <p className="text-gray-300 text-xs mb-1 font-bold">{label}</p>
        <p className="text-orange-400 font-bold text-sm">
          Rank: #{data.rank}
        </p>
        <p className="text-gray-500 text-xs">
          Score: {data.score}
        </p>
      </div>
    );
  }
  return null;
};

const ContestRatingGraph = ({ data }) => {
  // 1. Sort data by date (oldest to newest) for the graph
  const chartData = data && data.length > 0 
    ? [...data].sort((a, b) => new Date(a.date) - new Date(b.date))
        .map(item => ({
            ...item,
            // Format date for X-Axis (e.g., "Oct 24")
            displayDate: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }))
    : [];

  if (chartData.length === 0) {
    return (
      <div className="w-full h-64 bg-black/40 border border-gray-800 rounded-xl flex items-center justify-center text-gray-600 italic">
        Participate in a contest to see your rating graph.
      </div>
    );
  }

  return (
    <div className="w-full h-64 sm:h-80 bg-black/40 border border-gray-800 rounded-xl p-4 shadow-inner">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-gray-400 font-semibold text-sm uppercase tracking-wider">
          Contest Ranking History
        </h3>
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
          
          <XAxis 
            dataKey="displayDate" 
            stroke="#666" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false} 
          />
          
          {/* Reversed Y-Axis because Rank 1 is "Higher" visually than Rank 100 */}
          <YAxis 
            stroke="#666" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
            reversed={true} 
            domain={['dataMin', 'dataMax']}
            allowDecimals={false}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Line 
            type="monotone" 
            dataKey="rank" 
            stroke="#ea580c" 
            strokeWidth={3} 
            dot={{ r: 4, fill: "#ea580c", strokeWidth: 0 }}
            activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
            animationDuration={1500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ContestRatingGraph;