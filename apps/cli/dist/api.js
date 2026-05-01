"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanCodePrompt = exports.auditSystemPrompt = exports.optimizeUserPrompt = void 0;
const axios_1 = __importDefault(require("axios"));
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';
const client = axios_1.default.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});
const optimizeUserPrompt = async (text, model = 'gemini-3.1-pro') => {
    try {
        const response = await client.post('/optimize/user', { text, model, run_judge: true });
        return response.data;
    }
    catch (error) {
        throw new Error(error.response?.data?.detail || error.message);
    }
};
exports.optimizeUserPrompt = optimizeUserPrompt;
const auditSystemPrompt = async (text, policies, model = 'gemini-3.1-pro') => {
    try {
        const response = await client.post('/optimize/system', { text, policies, model, run_judge: true });
        return response.data;
    }
    catch (error) {
        throw new Error(error.response?.data?.detail || error.message);
    }
};
exports.auditSystemPrompt = auditSystemPrompt;
const scanCodePrompt = async (text, model = 'gemini-3.1-pro') => {
    try {
        const response = await client.post('/optimize/code', { text, model, run_judge: false });
        return response.data;
    }
    catch (error) {
        throw new Error(error.response?.data?.detail || error.message);
    }
};
exports.scanCodePrompt = scanCodePrompt;
