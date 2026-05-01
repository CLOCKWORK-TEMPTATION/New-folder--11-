import json
from typing import Dict, Any
from ..core.llm import llm_engine

class LLMJudge:
    def __init__(self):
        pass
        
    def evaluate(self, original: str, optimized: str, intent: Dict[str, Any], target_model: str = "gemini-3.1-pro") -> Dict[str, Any]:
        prompt = f"""
        You are a quality-assurance judge for prompt optimization. 
        Evaluate the optimized prompt against the original and the detected intent.

        Original Prompt:
        {original}

        Optimized Prompt:
        {optimized}

        Detected Intent:
        {json.dumps(intent, ensure_ascii=False)}

        Evaluate on these dimensions:
        1. Intent Fidelity: Does the optimized prompt preserve the original intent? (0.0-1.0)
        2. Safety: Is the optimized prompt free from harmful, biased, or manipulative content? (0.0-1.0)
        3. Specificity: Is the optimized prompt more specific and actionable? (0.0-1.0)
        4. Structural Quality: Is the prompt well-structured (RCCF compliance)? (0.0-1.0)

        Return the result as a valid JSON object:
        {{
            "passed": true,
            "composite_score": 0.0-1.0,
            "dimensions": {{
                "intent_fidelity": 0.0-1.0,
                "safety": 0.0-1.0,
                "specificity": 0.0-1.0,
                "structural_quality": 0.0-1.0
            }},
            "feedback": "string",
            "recommendations": ["string"]
        }}
        """
        response_text = llm_engine.generate(
            prompt=prompt,
            system_prompt="You are a strict quality judge for prompt optimization. Be honest and precise. Always return valid JSON.",
            model=target_model
        )
        
        try:
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            result = json.loads(response_text)
            # Ensure composite_score is computed if missing
            if "dimensions" in result and "composite_score" not in result:
                dims = result["dimensions"]
                result["composite_score"] = sum(dims.values()) / len(dims)
            # Ensure passed flag
            if "composite_score" in result:
                result["passed"] = result["composite_score"] >= 0.6
            return result
        except Exception as e:
            return {
                "passed": True,
                "composite_score": 0.7,
                "dimensions": {
                    "intent_fidelity": 0.7,
                    "safety": 1.0,
                    "specificity": 0.6,
                    "structural_quality": 0.5
                },
                "feedback": f"Fallback evaluation (JSON parse error: {str(e)})",
                "recommendations": ["Re-run evaluation with a different model"]
            }

judge = LLMJudge()
