import { useState } from 'react';
import { FileCode2, Loader2, Code } from 'lucide-react';
import Scorecard from './Scorecard';

interface Props {
  model: string;
}

export default function CodeScanner({ model }: Props) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleScan = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:8000/optimize/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input, model, run_judge: false })
      });
      const data = await res.json();
      setResult(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Code Prompt Scanner</h2>
        <p className="text-neutral-400">Detect and optimize embedded prompt strings in source code while preserving placeholder contracts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Input Panel */}
        <div className="flex flex-col bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl shadow-black/50">
          <div className="p-4 border-b border-neutral-800 bg-neutral-900/50 flex justify-between items-center">
            <h3 className="font-semibold text-neutral-200">Source Code</h3>
            <span className="text-xs text-neutral-500 bg-neutral-800 px-2 py-1 rounded">{model}</span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 w-full bg-transparent p-4 resize-none focus:outline-none text-neutral-300 placeholder-neutral-600 font-mono text-sm"
            placeholder={`# Paste your code with embedded prompts here\nprompt = f"Summarize the following text: {text}"\nresponse = llm.generate(prompt)`}
          />
          <div className="p-4 bg-neutral-900 border-t border-neutral-800 flex justify-end">
            <button
              onClick={handleScan}
              disabled={isLoading || !input.trim()}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCode2 className="w-4 h-4" />}
              Scan & Refactor
            </button>
          </div>
        </div>

        {/* Output Panel */}
        <div className="flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
          {result ? (
            <>
              {/* Patch Info */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl shadow-black/50">
                <h3 className="font-semibold text-emerald-400 mb-4 flex items-center gap-2">
                  <Code className="w-4 h-4" /> Refactoring Results
                </h3>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-neutral-800/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-emerald-400">{result.changed_spans}</div>
                    <div className="text-xs text-neutral-500">Changed Spans</div>
                  </div>
                  <div className="bg-neutral-800/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-400">{result.patch_type?.replace(/_/g, ' ')}</div>
                    <div className="text-xs text-neutral-500">Patch Type</div>
                  </div>
                  <div className="bg-neutral-800/50 rounded-lg p-3 text-center">
                    <div className={`text-2xl font-bold ${result.placeholders_preserved ? 'text-emerald-400' : 'text-red-400'}`}>
                      {result.placeholders_preserved ? '✓' : '✗'}
                    </div>
                    <div className="text-xs text-neutral-500">Placeholders Safe</div>
                  </div>
                </div>
              </div>

              {/* Prompt Spans */}
              {result.prompt_spans && result.prompt_spans.length > 0 && (
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl shadow-black/50">
                  <h3 className="font-semibold text-amber-400 mb-4">Detected Prompt Spans</h3>
                  <div className="space-y-4">
                    {result.prompt_spans.map((span: any, i: number) => (
                      <div key={i} className="border border-neutral-700 rounded-lg overflow-hidden">
                        <div className="bg-red-950/30 p-3 border-b border-neutral-700">
                          <div className="text-xs text-red-400 mb-1">Original</div>
                          <pre className="text-xs text-neutral-300 font-mono whitespace-pre-wrap">{span.original}</pre>
                        </div>
                        <div className="bg-emerald-950/30 p-3">
                          <div className="text-xs text-emerald-400 mb-1">Optimized</div>
                          <pre className="text-xs text-neutral-300 font-mono whitespace-pre-wrap">{span.optimized}</pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Diff Summary */}
              {result.diff_summary && result.diff_summary.length > 0 && (
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl shadow-black/50">
                  <h3 className="font-semibold text-neutral-300 mb-4">Diff Summary</h3>
                  <ul className="space-y-2">
                    {result.diff_summary.map((d: string, i: number) => (
                      <li key={i} className="text-sm text-neutral-400 font-mono bg-neutral-800/50 p-2 rounded">
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.scorecard && <Scorecard scores={result.scorecard} title="Code Safety Metrics" />}
            </>
          ) : (
            <div className="flex-1 border border-neutral-800 border-dashed rounded-xl flex items-center justify-center text-neutral-600">
              <div className="text-center">
                <FileCode2 className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p>Run scan to see results here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
