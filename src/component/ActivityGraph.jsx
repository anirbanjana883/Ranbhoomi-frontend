import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Custom Tooltip for the chart
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/90 border border-orange-500/50 p-3 rounded shadow-[0_0_15px_rgba(234,88,12,0.3)]">
        <p className="text-gray-400 text-xs mb-1">{label}</p>
        <p className="text-orange-400 font-bold text-sm">
          Submissions: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

const ActivityGraph = ({ data }) => {
  // If data is empty, provide a placeholder so the chart doesn't crash
  const chartData = data && data.length > 0 ? data : [{ date: "No Data", count: 0 }];

  return (
    <div className="w-full h-64 sm:h-80 bg-black/40 border border-gray-800 rounded-xl p-4 shadow-inner">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-gray-400 font-semibold text-sm uppercase tracking-wider">
          Battle Frequency
        </h3>
        <span className="text-xs text-gray-500">Last 30 Days</span>
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            {/* Gradient Fill Definition */}
            <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ea580c" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
          
          <XAxis 
            dataKey="date" 
            stroke="#666" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false} 
            minTickGap={30}
          />
          <YAxis 
            stroke="#666" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
            allowDecimals={false}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Area
            type="monotone"
            dataKey="count"
            stroke="#ea580c" // Orange line
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorActivity)" // Link to gradient
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ActivityGraph;