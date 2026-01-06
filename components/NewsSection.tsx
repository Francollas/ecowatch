
import React from 'react';
import { EnvironmentalNews } from '../types';

interface NewsSectionProps {
  news: EnvironmentalNews[];
  loading: boolean;
}

const NewsSection: React.FC<NewsSectionProps> = ({ news, loading }) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-zinc-900/50 animate-pulse rounded-xl"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
        Notícias Ambientais
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {news.map((item) => (
          <div key={item.id} className="glass-effect p-5 rounded-xl border border-zinc-800 hover:border-emerald-500/30 transition-all cursor-pointer">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold uppercase tracking-widest">
                {item.category}
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">{item.date}</span>
            </div>
            <h3 className="font-bold text-lg mb-2 leading-tight group-hover:text-emerald-400 transition-colors">
              {item.title}
            </h3>
            <p className="text-sm text-zinc-400 line-clamp-3 mb-4">
              {item.summary}
            </p>
            <div className="flex items-center justify-between text-[11px] text-zinc-500 border-t border-zinc-800 pt-3">
              <span>Fonte: {item.source}</span>
              <button className="text-emerald-500 hover:underline">Ler mais →</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewsSection;
