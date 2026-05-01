import React from 'react';
import { Activity } from 'lucide-react';

interface ScorecardProps {
  scores: Record<string, number>;
  title?: string;
}

export default function Scorecard({ scores, title = "Evaluation Metrics" }: ScorecardProps) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl shadow-black/50">
      <h3 className="font-semibold text-emerald-400 mb-4 flex items-center gap-2">
        <Activity className="w-4 h-4" /> {title}
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(scores).map(([key, value]) => (
          <div key={key} className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
            <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">
              {key.replace('_', ' ')}
            </div>
            <div className="text-xl font-bold text-neutral-200">
              {(value * 100).toFixed(0)}%
            </div>
            <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className={`h-full ${value > 0.8 ? 'bg-emerald-500' : value > 0.5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${value * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
