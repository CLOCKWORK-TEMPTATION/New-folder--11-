import React from 'react';

interface DiffViewerProps {
  original: string;
  modified: string;
}

export default function DiffViewer({ original, modified }: DiffViewerProps) {
  // Simplified Diff Viewer for MVP
  // In a real implementation, we would use a library like 'react-diff-viewer' or similar
  
  return (
    <div className="font-mono text-sm bg-neutral-950 p-4 rounded-lg overflow-x-auto text-neutral-300 whitespace-pre-wrap">
      {modified}
    </div>
  );
}
