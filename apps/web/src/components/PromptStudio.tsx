import { useState } from 'react';
import { Send, Sparkles, Loader2, CheckCircle, XCircle } from 'lucide-react';
import DiffViewer from './DiffViewer';
import Scorecard from './Scorecard';

interface Props {
  model: string;
}

export default function PromptStudio({ model }: Props) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [evaluation, setEvaluation] = useState<any>(null);

  const handleOptimize = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setEvaluation(null);
    try {
      const res = await fetch('http://localhost:8000/optimize/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input, model, run_judge: true })
      });
      const data = await res.json();
      setResult(data.data);
      setEvaluation(data.evaluation);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">User Prompt Studio</h2>
        <p className="text-neutral-400">Optimize and enrich raw user intents into structured, high-fidelity prompts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Input Panel */}
        <div className="flex flex-col bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl shadow-black/50">
          <div className="p-4 border-b border-neutral-800 bg-neutral-900/50 flex justify-between items-center">
            <h3 className="font-semibold text-neutral-200">Raw Input</h3>
            <span className="text-xs text-neutral-500 bg-neutral-800 px-2 py-1 rounded">{model}</span>
          </div>
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 w-full bg-transparent p-4 resize-none focus:outline-none text-neutral-300 placeholder-neutral-600"
            placeholder="Type your raw prompt here... e.g. 'Write a blog post about AI'"
          />
          <div className="p-4 bg-neutral-900 border-t border-neutral-800 flex justify-end">
            <button 
              onClick={handleOptimize}
              disabled={isLoading || !input.trim()}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Optimize
            </button>
          </div>
        </div>

        {/* Output Panel */}
        <div className="flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
          {result ? (
            <>
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl shadow-black/50">
                <h3 className="font-semibold text-blue-400 mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Optimized Output
                </h3>
                <DiffViewer original={input} modified={result.optimized_prompt} />
              </div>
              
              <Scorecard scores={result.scorecard} title="Fidelity & Safety Metrics" />

              {/* Judge Evaluation */}
              {evaluation && (
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl shadow-black/50">
                  <h3 className="font-semibold text-amber-400 mb-4 flex items-center gap-2">
                    {evaluation.passed ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                    Judge Evaluation
                    <span className={`ml-auto text-xs px-2 py-1 rounded ${evaluation.passed ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>
                      {evaluation.passed ? 'PASSED' : 'FAILED'} — {(evaluation.composite_score * 100).toFixed(0)}%
                    </span>
                  </h3>
                  {evaluation.dimensions && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {Object.entries(evaluation.dimensions).map(([key, value]: [string, any]) => (
                        <div key={key} className="bg-neutral-800/50 rounded-lg p-3">
                          <div className="text-xs text-neutral-500 mb-1">{key.replace(/_/g, ' ')}</div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-neutral-700 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full" style={{ width: `${(value as number) * 100}%` }} />
                            </div>
                            <span className="text-xs font-mono text-neutral-400">{((value as number) * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {evaluation.feedback && (
                    <p className="text-sm text-neutral-400 border-t border-neutral-800 pt-3">{evaluation.feedback}</p>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 border border-neutral-800 border-dashed rounded-xl flex items-center justify-center text-neutral-600">
              <div className="text-center">
                <Send className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p>Run optimization to see results here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
