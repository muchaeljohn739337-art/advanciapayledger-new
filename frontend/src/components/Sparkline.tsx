"use client";

import React from "react";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number | string;
  showDot?: boolean;
}

export default function Sparkline({
  data,
  color,
  height = 40,
  width = "100%",
  showDot = false,
}: SparklineProps) {
  // Determine color based on trend if not provided
  const isPositive = data.length > 1 && data[data.length - 1] >= data[0];
  const chartColor = color || (isPositive ? "#22c55e" : "#ef4444");

  // Transform data for recharts
  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <YAxis domain={["dataMin", "dataMax"]} hide />
          <Line
            type="monotone"
            dataKey="value"
            stroke={chartColor}
            strokeWidth={1.5}
            dot={showDot ? { r: 2, fill: chartColor } : false}
            activeDot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
