#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const api_1 = require("./api");
const program = new commander_1.Command();
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
    .action(async (text) => {
    const opts = program.opts();
    console.log(chalk_1.default.blue(`Optimizing User Prompt using ${opts.model}...`));
    try {
        const response = await (0, api_1.optimizeUserPrompt)(text, opts.model);
        const data = response.data;
        const evaluation = response.evaluation;
        console.log(chalk_1.default.green('\n✅ Optimized Prompt:'));
        console.log(chalk_1.default.white(data.optimized_prompt));
        if (evaluation) {
            console.log(chalk_1.default.yellow('\n📊 Evaluation Scorecard:'));
            console.log(`Passed: ${evaluation.passed ? chalk_1.default.green('Yes') : chalk_1.default.red('No')}`);
            console.log(`Score: ${(evaluation.composite_score * 100).toFixed(0)}%`);
            console.log(`Feedback: ${evaluation.feedback}`);
        }
    }
    catch (error) {
        console.error(chalk_1.default.red(`\n❌ Error: ${error.message}`));
    }
});
// Command: audit-system
program
    .command('audit-system <text>')
    .description('Audit a system prompt for policies and safety')
    .option('-p, --policy <policy>', 'Add a policy constraint (can be used multiple times)', (val, memo) => memo.concat(val), [])
    .action(async (text, options) => {
    const opts = program.opts();
    console.log(chalk_1.default.blue(`Auditing System Prompt using ${opts.model}...`));
    try {
        const response = await (0, api_1.auditSystemPrompt)(text, options.policy.length > 0 ? options.policy : undefined, opts.model);
        const data = response.data;
        const evaluation = response.evaluation;
        console.log(chalk_1.default.green('\n✅ Audited Prompt:'));
        console.log(chalk_1.default.white(data.audited_prompt));
        if (data.conflicts_found && data.conflicts_found.length > 0) {
            console.log(chalk_1.default.red('\n⚠️ Conflicts Found:'));
            data.conflicts_found.forEach((c) => console.log(chalk_1.default.yellow(` - ${c}`)));
        }
        if (data.suggestions && data.suggestions.length > 0) {
            console.log(chalk_1.default.cyan('\n💡 Suggestions:'));
            data.suggestions.forEach((s) => console.log(chalk_1.default.cyan(` - ${s}`)));
        }
        if (evaluation) {
            console.log(chalk_1.default.yellow('\n📊 Evaluation Scorecard:'));
            console.log(`Passed: ${evaluation.passed ? chalk_1.default.green('Yes') : chalk_1.default.red('No')}`);
            console.log(`Score: ${(evaluation.composite_score * 100).toFixed(0)}%`);
        }
    }
    catch (error) {
        console.error(chalk_1.default.red(`\n❌ Error: ${error.message}`));
    }
});
// Command: scan-code
program
    .command('scan-code <file>')
    .description('Scan a source code file for embedded prompts and refactor them')
    .action(async (file) => {
    const opts = program.opts();
    const filePath = path_1.default.resolve(process.cwd(), file);
    if (!fs_1.default.existsSync(filePath)) {
        console.error(chalk_1.default.red(`\n❌ Error: File not found at ${filePath}`));
        return;
    }
    console.log(chalk_1.default.blue(`Scanning Code File: ${filePath} using ${opts.model}...`));
    try {
        const code = fs_1.default.readFileSync(filePath, 'utf-8');
        const response = await (0, api_1.scanCodePrompt)(code, opts.model);
        const data = response.data;
        console.log(chalk_1.default.green('\n✅ Scan Complete'));
        console.log(`Changed Spans: ${chalk_1.default.cyan(data.changed_spans)}`);
        console.log(`Patch Type: ${chalk_1.default.cyan(data.patch_type)}`);
        if (data.prompt_spans && data.prompt_spans.length > 0) {
            console.log(chalk_1.default.yellow('\n🔍 Prompt Spans:'));
            data.prompt_spans.forEach((span, i) => {
                console.log(chalk_1.default.gray(`\n--- Span ${i + 1} ---`));
                console.log(chalk_1.default.red(`- ${span.original}`));
                console.log(chalk_1.default.green(`+ ${span.optimized}`));
            });
        }
    }
    catch (error) {
        console.error(chalk_1.default.red(`\n❌ Error: ${error.message}`));
    }
});
program.parse(process.argv);
