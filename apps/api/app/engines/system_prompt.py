import json
from typing import Dict, Any, List
from ..core.llm import llm_engine

class SystemPromptAuditor:
    def __init__(self):
        pass
        
    def audit(self, text: str, policies: List[str] = None, target_model: str = "gpt-5.5") -> Dict[str, Any]:
        prompt = f"""
        Audit the following system prompt against safety and policy constraints.
        System Prompt: {text}
        Policies (if any): {policies or ['No conflicting instructions', 'Must not harm user']}
        
        Return the result as a valid JSON object matching this structure exactly:
        {{
            "audited_prompt": "string",
            "conflicts_found": ["string"],
            "suggestions": ["string"],
            "scorecard": {{"safety": 0.0-1.0, "clarity": 0.0-1.0}}
        }}
        """
        response_text = llm_engine.generate(
            prompt=prompt,
            system_prompt="You are an expert system prompt auditor. Always return valid JSON.",
            model=target_model
        )
        
        try:
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            return json.loads(response_text)
        except Exception as e:
            return {
                "audited_prompt": f"Audited version of: {text}",
                "conflicts_found": ["Error parsing JSON response"],
                "suggestions": ["Check LLM output format"],
                "scorecard": {"safety": 1.0, "clarity": 0.8}
            }

auditor = SystemPromptAuditor()
