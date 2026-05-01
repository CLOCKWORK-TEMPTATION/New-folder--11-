import axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const optimizeUserPrompt = async (text: string, model: string = 'gemini-3.1-pro') => {
  try {
    const response = await client.post('/optimize/user', { text, model, run_judge: true });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || error.message);
  }
};

export const auditSystemPrompt = async (text: string, policies?: string[], model: string = 'gemini-3.1-pro') => {
  try {
    const response = await client.post('/optimize/system', { text, policies, model, run_judge: true });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || error.message);
  }
};

export const scanCodePrompt = async (text: string, model: string = 'gemini-3.1-pro') => {
  try {
    const response = await client.post('/optimize/code', { text, model, run_judge: false });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || error.message);
  }
};
