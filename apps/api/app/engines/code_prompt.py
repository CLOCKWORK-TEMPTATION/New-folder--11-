import json
from typing import Dict, Any, List
from ..core.llm import llm_engine

class CodePromptRefactorer:
    def __init__(self):
        pass
        
    def refactor(self, text: str, target_model: str = "opus-4.7") -> Dict[str, Any]:
        prompt = f"""
        Analyze the following code snippet that contains embedded prompt strings (PromptSpans).
        Identify each prompt span, evaluate its quality, and suggest a safer rewrite 
        that preserves all placeholders (e.g. {{variable_name}}) and maintains the original intent.
        
        Code Snippet:
        {text}
        
        Return the result as a valid JSON object matching this structure exactly:
        {{
            "patch_type": "safe_static_text_rewrite",
            "prompt_spans": [
                {{
                    "original": "string",
                    "optimized": "string",
                    "line_range": [1, 5]
                }}
            ],
            "changed_spans": 0,
            "placeholders_preserved": true,
            "diff_summary": ["string"],
            "scorecard": {{"ast_integrity": 0.0-1.0, "prompt_quality": 0.0-1.0}}
        }}
        """
        response_text = llm_engine.generate(
            prompt=prompt,
            system_prompt="You are an expert code analyst specializing in prompt engineering within source code. Always return valid JSON. Never break placeholder contracts.",
            model=target_model
        )
        
        try:
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            return json.loads(response_text)
        except Exception as e:
            return {
                "patch_type": "safe_static_text_rewrite",
                "prompt_spans": [],
                "changed_spans": 0,
                "placeholders_preserved": True,
                "diff_summary": [f"Fallback: Could not parse LLM response - {str(e)}"],
                "scorecard": {"ast_integrity": 1.0, "prompt_quality": 0.5}
            }

refactorer = CodePromptRefactorer()
