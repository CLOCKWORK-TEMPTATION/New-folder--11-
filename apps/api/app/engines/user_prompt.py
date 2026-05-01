import json
from typing import Dict, Any
from ..core.llm import llm_engine

class UserPromptOptimizer:
    def __init__(self):
        pass
        
    def optimize(self, text: str, target_model: str = "gemini-3.1-pro") -> Dict[str, Any]:
        prompt = f"""
        Analyze the following raw user prompt and optimize it using the RCCF (Role-Context-Constraint-Format) framework.
        Raw Prompt: {text}
        
        Return the result as a valid JSON object matching this structure exactly:
        {{
            "optimized_prompt": "string",
            "detected_intent": {{"task": "string", "audience": "string", "output_format": "string"}},
            "assumptions": ["string"],
            "scorecard": {{"intent_fidelity": 0.9, "specificity": 0.8}}
        }}
        """
        response_text = llm_engine.generate(
            prompt=prompt,
            system_prompt="You are an expert prompt optimizer. Always return valid JSON.",
            model=target_model
        )
        
        try:
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            return json.loads(response_text)
        except Exception as e:
            return {
                "optimized_prompt": f"Enhanced version of: {text}\n\n(Fallback: Error parsing JSON)",
                "detected_intent": {"task": "Unknown", "audience": "General", "output_format": "Markdown"},
                "assumptions": ["Assumed general audience."],
                "scorecard": {"intent_fidelity": 0.5, "specificity": 0.5}
            }

optimizer = UserPromptOptimizer()
