import os
from litellm import completion
from typing import Dict, Any, List

# Map user-requested models to available API identifiers
# In the future, these can be direct litellm supported strings
MODEL_MAP = {
    "gemini-3.1-pro": "gemini/gemini-1.5-pro-latest", # Fallback mapping
    "gpt-5.5": "openai/gpt-4o", # Fallback mapping
    "opus-4.7": "anthropic/claude-3-opus-20240229" # Fallback mapping
}

class LLMEngine:
    def __init__(self, default_model: str = "gemini-3.1-pro"):
        self.default_model = default_model

    def _get_litellm_model(self, model_name: str) -> str:
        return MODEL_MAP.get(model_name, model_name)

    def generate(self, prompt: str, system_prompt: str = "", model: str = None, response_format: Any = None) -> str:
        model_name = self._get_litellm_model(model or self.default_model)
        
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        kwargs = {
            "model": model_name,
            "messages": messages,
            "temperature": 0.2
        }
        
        if response_format:
            kwargs["response_format"] = response_format

        try:
            response = completion(**kwargs)
            return response.choices[0].message.content
        except Exception as e:
            print(f"LLM Error ({model_name}): {str(e)}")
            return f"Error: Failed to generate response from {model_name}"

# Shared instance
llm_engine = LLMEngine()
