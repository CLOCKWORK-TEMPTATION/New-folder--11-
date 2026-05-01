import * as vscode from 'vscode';
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

async function checkServer() {
  try {
    await axios.get(`${API_BASE_URL}/health`, { timeout: 2000 });
    return true;
  } catch (error) {
    vscode.window.showErrorMessage('PromptOptima: FastAPI backend is not running. Please start it on port 8000.');
    return false;
  }
}

export function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel('PromptOptima');

  // Command: Optimize User Prompt
  let optimizeUserCmd = vscode.commands.registerCommand('promptoptima.optimizeUserPrompt', async () => {
    if (!(await checkServer())) return;

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage('No active editor found.');
      return;
    }

    const selection = editor.selection;
    const text = editor.document.getText(selection);

    if (!text) {
      vscode.window.showInformationMessage('Please select a user prompt to optimize.');
      return;
    }

    vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Optimizing User Prompt...',
      cancellable: false
    }, async (progress) => {
      try {
        const response = await axios.post(`${API_BASE_URL}/optimize/user`, {
          text,
          run_judge: true
        });

        const data = response.data;
        const optimizedText = data.data.optimized_prompt;
        
        // Show diff or output
        outputChannel.clear();
        outputChannel.appendLine('=== OPTIMIZED PROMPT ===\n');
        outputChannel.appendLine(optimizedText);
        
        if (data.evaluation) {
          outputChannel.appendLine('\n\n=== EVALUATION ===');
          outputChannel.appendLine(`Passed: ${data.evaluation.passed ? 'Yes' : 'No'}`);
          outputChannel.appendLine(`Score: ${(data.evaluation.composite_score * 100).toFixed(0)}%`);
          outputChannel.appendLine(`Feedback: ${data.evaluation.feedback}`);
        }
        
        outputChannel.show();

        const action = await vscode.window.showInformationMessage(
          'Prompt optimized successfully. See output channel.',
          'Replace Selection'
        );

        if (action === 'Replace Selection') {
          editor.edit(editBuilder => {
            editBuilder.replace(selection, optimizedText);
          });
        }
      } catch (error: any) {
        vscode.window.showErrorMessage(`Optimization failed: ${error.message}`);
      }
    });
  });

  // Command: Audit System Prompt
  let auditSystemCmd = vscode.commands.registerCommand('promptoptima.auditSystemPrompt', async () => {
    if (!(await checkServer())) return;

    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const selection = editor.selection;
    const text = editor.document.getText(selection);

    if (!text) {
      vscode.window.showInformationMessage('Please select a system prompt to audit.');
      return;
    }

    vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Auditing System Prompt...',
      cancellable: false
    }, async (progress) => {
      try {
        const response = await axios.post(`${API_BASE_URL}/optimize/system`, {
          text,
          run_judge: true
        });

        const data = response.data;
        
        outputChannel.clear();
        outputChannel.appendLine('=== AUDITED SYSTEM PROMPT ===\n');
        outputChannel.appendLine(data.data.audited_prompt);
        
        if (data.data.conflicts_found?.length > 0) {
          outputChannel.appendLine('\n\n=== CONFLICTS FOUND ===');
          data.data.conflicts_found.forEach((c: string) => outputChannel.appendLine(`- ${c}`));
        }
        
        if (data.data.suggestions?.length > 0) {
          outputChannel.appendLine('\n\n=== SUGGESTIONS ===');
          data.data.suggestions.forEach((s: string) => outputChannel.appendLine(`- ${s}`));
        }
        
        outputChannel.show();
      } catch (error: any) {
        vscode.window.showErrorMessage(`Audit failed: ${error.message}`);
      }
    });
  });

  // Command: Scan Code
  let scanCodeCmd = vscode.commands.registerCommand('promptoptima.scanCode', async () => {
    if (!(await checkServer())) return;

    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const text = editor.document.getText();

    vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'Scanning code for prompts...',
      cancellable: false
    }, async (progress) => {
      try {
        const response = await axios.post(`${API_BASE_URL}/optimize/code`, {
          text,
          run_judge: false
        });

        const data = response.data.data;
        
        outputChannel.clear();
        outputChannel.appendLine('=== CODE SCAN RESULTS ===\n');
        outputChannel.appendLine(`Changed Spans: ${data.changed_spans}`);
        outputChannel.appendLine(`Placeholders Preserved: ${data.placeholders_preserved ? 'Yes' : 'No'}\n`);
        
        if (data.prompt_spans?.length > 0) {
          data.prompt_spans.forEach((span: any, i: number) => {
            outputChannel.appendLine(`\n--- Span ${i + 1} ---`);
            outputChannel.appendLine(`[Original]:\n${span.original}`);
            outputChannel.appendLine(`\n[Optimized]:\n${span.optimized}`);
          });
        }
        
        outputChannel.show();
      } catch (error: any) {
        vscode.window.showErrorMessage(`Scan failed: ${error.message}`);
      }
    });
  });

  context.subscriptions.push(optimizeUserCmd, auditSystemCmd, scanCodeCmd);
}

export function deactivate() {}
