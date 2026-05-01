import re

def route_input(text: str) -> str:
    """
    Classify input text to route to the appropriate optimizer engine.
    """
    # Heuristics for code prompt
    code_patterns = [
        r"import\s+", r"function\s+", r"const\s+", r"let\s+",
        r"client\.responses\.create", r"PromptTemplate",
        r"def\s+", r"class\s+"
    ]
    if any(re.search(p, text) for p in code_patterns):
        return "code_prompt_refactor"
        
    # Heuristics for system prompt
    system_patterns = [
        r"You are an? (assistant|agent|expert)",
        r"Your task is to",
        r"system_prompt",
        r"System:",
        r"Role:",
        r"Instructions:"
    ]
    if any(re.search(p, text, re.IGNORECASE) for p in system_patterns):
        return "system_prompt_refinement"
        
    return "user_prompt_optimization"
