
import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isUp: boolean;
  };
  colorClass: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, unit, icon, trend, colorClass }) => {
  return (
    <div className="glass-effect p-6 rounded-xl hover:border-emerald-500/30 transition-all group overflow-hidden relative">
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${colorClass}`}>
        {icon}
      </div>
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg bg-zinc-900 ${colorClass}`}>
          {icon}
        </div>
        <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-wider">{title}</h3>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight">{value}</span>
        {unit && <span className="text-zinc-500 text-sm font-medium">{unit}</span>}
      </div>
      {trend && (
        <div className={`mt-3 flex items-center gap-1 text-xs font-semibold ${trend.isUp ? 'text-red-400' : 'text-emerald-400'}`}>
          <span>{trend.isUp ? '↑' : '↓'}</span>
          <span>{trend.value}% vs mês passado</span>
        </div>
      )}
    </div>
  );
};

export default StatsCard;
