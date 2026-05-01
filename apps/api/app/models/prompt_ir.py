from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class Intent(BaseModel):
    task: str = ""
    domain: str = ""
    audience: str = ""
    output_goal: str = ""

class Constraint(BaseModel):
    type: str = Field(description="format | tone | safety | tool | factuality | length | code_integrity")
    text: str
    authority: str = Field(description="user | developer | system | platform")
    must_preserve: bool

class Context(BaseModel):
    provided: List[str] = []
    missing: List[str] = []
    assumptions: List[str] = []

class Variable(BaseModel):
    name: str
    placeholder: str
    source_expression: str
    must_keep: bool

class PromptIR(BaseModel):
    id: str
    source_type: str = Field(description="user_prompt | system_prompt | code_prompt")
    language: str = "mixed"
    raw_text: str
    detected_intent: Optional[Intent] = None
    constraints: List[Constraint] = []
    context: Optional[Context] = None
    variables: List[Variable] = []
    risk_flags: List[str] = []
    optimized_candidates: List[str] = []
    eval_scorecard: Dict[str, Any] = {}
