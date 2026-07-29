'use client';

import React from 'react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';
import { slideUp } from '@/lib/motion';

export interface TrendPoint {
  day: string;
  repairs: number;
}

interface RepairTrendChartProps {
  data: TrendPoint[];
}

export function RepairTrendChart({ data }: RepairTrendChartProps): React.ReactElement {
  return (
    <motion.div variants={slideUp} className="card p-6">
      <h3 className="text-sm font-medium text-slate-400 mb-4">Repair Activity — Last 7 Days</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="repairGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
          <Tooltip
            contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, color: '#fff' }}
            labelStyle={{ color: '#94a3b8' }}
            cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeOpacity: 0.3 }}
          />
          <Area
            type="monotone"
            dataKey="repairs"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#repairGradient)"
            animationDuration={1200}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
