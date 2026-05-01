#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { optimizeUserPrompt, auditSystemPrompt, scanCodePrompt } from './api';

const program = new Command();

program
  .name('promptoptima')
  .description('CLI tool for Universal Prompt Optimizer')
  .version('1.0.0');

// Global Options
program.option('-m, --model <name>', 'Target model to use (gemini-3.1-pro, gpt-5.5, opus-4.7)', 'gemini-3.1-pro');

// Command: optimize-user
program
  .command('optimize-user <text>')
  .description('Optimize a user prompt')
  .action(async (text: string) => {
    const opts = program.opts();
    console.log(chalk.blue(`Optimizing User Prompt using ${opts.model}...`));
    
    try {
      const response = await optimizeUserPrompt(text, opts.model);
      const data = response.data;
      const evaluation = response.evaluation;
      
      console.log(chalk.green('\n✅ Optimized Prompt:'));
      console.log(chalk.white(data.optimized_prompt));
      
      if (evaluation) {
        console.log(chalk.yellow('\n📊 Evaluation Scorecard:'));
        console.log(`Passed: ${evaluation.passed ? chalk.green('Yes') : chalk.red('No')}`);
        console.log(`Score: ${(evaluation.composite_score * 100).toFixed(0)}%`);
        console.log(`Feedback: ${evaluation.feedback}`);
      }
    } catch (error: any) {
      console.error(chalk.red(`\n❌ Error: ${error.message}`));
    }
  });

// Command: audit-system
program
  .command('audit-system <text>')
  .description('Audit a system prompt for policies and safety')
  .option('-p, --policy <policy>', 'Add a policy constraint (can be used multiple times)', (val, memo: string[]) => memo.concat(val), [])
  .action(async (text: string, options: { policy: string[] }) => {
    const opts = program.opts();
    console.log(chalk.blue(`Auditing System Prompt using ${opts.model}...`));
    
    try {
      const response = await auditSystemPrompt(text, options.policy.length > 0 ? options.policy : undefined, opts.model);
      const data = response.data;
      const evaluation = response.evaluation;
      
      console.log(chalk.green('\n✅ Audited Prompt:'));
      console.log(chalk.white(data.audited_prompt));
      
      if (data.conflicts_found && data.conflicts_found.length > 0) {
        console.log(chalk.red('\n⚠️ Conflicts Found:'));
        data.conflicts_found.forEach((c: string) => console.log(chalk.yellow(` - ${c}`)));
      }
      
      if (data.suggestions && data.suggestions.length > 0) {
        console.log(chalk.cyan('\n💡 Suggestions:'));
        data.suggestions.forEach((s: string) => console.log(chalk.cyan(` - ${s}`)));
      }
      
      if (evaluation) {
        console.log(chalk.yellow('\n📊 Evaluation Scorecard:'));
        console.log(`Passed: ${evaluation.passed ? chalk.green('Yes') : chalk.red('No')}`);
        console.log(`Score: ${(evaluation.composite_score * 100).toFixed(0)}%`);
      }
    } catch (error: any) {
      console.error(chalk.red(`\n❌ Error: ${error.message}`));
    }
  });

// Command: scan-code
program
  .command('scan-code <file>')
  .description('Scan a source code file for embedded prompts and refactor them')
  .action(async (file: string) => {
    const opts = program.opts();
    const filePath = path.resolve(process.cwd(), file);
    
    if (!fs.existsSync(filePath)) {
      console.error(chalk.red(`\n❌ Error: File not found at ${filePath}`));
      return;
    }
    
    console.log(chalk.blue(`Scanning Code File: ${filePath} using ${opts.model}...`));
    
    try {
      const code = fs.readFileSync(filePath, 'utf-8');
      const response = await scanCodePrompt(code, opts.model);
      const data = response.data;
      
      console.log(chalk.green('\n✅ Scan Complete'));
      console.log(`Changed Spans: ${chalk.cyan(data.changed_spans)}`);
      console.log(`Patch Type: ${chalk.cyan(data.patch_type)}`);
      
      if (data.prompt_spans && data.prompt_spans.length > 0) {
        console.log(chalk.yellow('\n🔍 Prompt Spans:'));
        data.prompt_spans.forEach((span: any, i: number) => {
          console.log(chalk.gray(`\n--- Span ${i + 1} ---`));
          console.log(chalk.red(`- ${span.original}`));
          console.log(chalk.green(`+ ${span.optimized}`));
        });
      }
    } catch (error: any) {
      console.error(chalk.red(`\n❌ Error: ${error.message}`));
    }
  });

program.parse(process.argv);
