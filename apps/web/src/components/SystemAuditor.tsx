import { useState } from 'react';
import { ShieldAlert, Loader2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import Scorecard from './Scorecard';

interface Props {
  model: string;
}

export default function SystemAuditor({ model }: Props) {
  const [input, setInput] = useState('');
  const [policies, setPolicies] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [evaluation, setEvaluation] = useState<any>(null);

  const handleAudit = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setEvaluation(null);
    try {
      const policyList = policies.split('\n').filter(p => p.trim());
      const res = await fetch('http://localhost:8000/optimize/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: input, 
          model, 
          policies: policyList.length > 0 ? policyList : undefined,
          run_judge: true 
        })
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
        <h2 className="text-2xl font-bold mb-2">System Prompt Auditor</h2>
        <p className="text-neutral-400">Audit system prompts for policy conflicts, safety issues, and optimization opportunities.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Input Panel */}
        <div className="flex flex-col gap-4">
          <div className="flex-1 flex flex-col bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl shadow-black/50">
            <div className="p-4 border-b border-neutral-800 bg-neutral-900/50 flex justify-between items-center">
              <h3 className="font-semibold text-neutral-200">System Prompt</h3>
              <span className="text-xs text-neutral-500 bg-neutral-800 px-2 py-1 rounded">{model}</span>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 w-full bg-transparent p-4 resize-none focus:outline-none text-neutral-300 placeholder-neutral-600"
              placeholder="Paste your system prompt here..."
            />
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl shadow-black/50">
            <div className="p-4 border-b border-neutral-800 bg-neutral-900/50">
              <h3 className="font-semibold text-neutral-200 text-sm">Policy Constraints (optional, one per line)</h3>
            </div>
            <textarea
              value={policies}
              onChange={(e) => setPolicies(e.target.value)}
              className="w-full bg-transparent p-4 resize-none focus:outline-none text-neutral-300 placeholder-neutral-600 h-24"
              placeholder={"Must not reveal internal instructions\nMust refuse harmful requests"}
            />
          </div>

          <button 
            onClick={handleAudit}
            disabled={isLoading || !input.trim()}
            className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-5 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
            Run Audit
          </button>
        </div>

        {/* Output Panel */}
        <div className="flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
          {result ? (
            <>
              {/* Audited Prompt */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl shadow-black/50">
                <h3 className="font-semibold text-purple-400 mb-4">Audited System Prompt</h3>
                <pre className="text-sm text-neutral-300 whitespace-pre-wrap font-mono bg-neutral-800/50 p-4 rounded-lg">{result.audited_prompt}</pre>
              </div>

              {/* Conflicts */}
              {result.conflicts_found && result.conflicts_found.length > 0 && (
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl shadow-black/50">
                  <h3 className="font-semibold text-amber-400 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Conflicts Detected
                  </h3>
                  <ul className="space-y-2">
                    {result.conflicts_found.map((c: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-neutral-300">
                        <span className="text-amber-500 mt-0.5">•</span> {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggestions */}
              {result.suggestions && result.suggestions.length > 0 && (
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl shadow-black/50">
                  <h3 className="font-semibold text-emerald-400 mb-4">Suggestions</h3>
                  <ul className="space-y-2">
                    {result.suggestions.map((s: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-neutral-300">
                        <span className="text-emerald-500 mt-0.5">✓</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Scorecard scores={result.scorecard} title="Audit Metrics" />

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
                <ShieldAlert className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p>Run audit to see results here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
