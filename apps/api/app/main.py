from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
from .core.router import route_input
from .core.llm import llm_engine, MODEL_MAP
from .engines.user_prompt import optimizer as user_optimizer
from .engines.system_prompt import auditor as system_auditor
from .engines.code_prompt import refactorer as code_refactorer
from .evaluations.judge import judge

app = FastAPI(
    title="Universal Prompt Optimizer",
    description="Production-grade system for evaluating and optimizing AI prompts across User, System, and Code layers.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Request/Response Models ---
class OptimizeRequest(BaseModel):
    text: str
    input_type: Optional[str] = "auto"
    model: Optional[str] = "gemini-3.1-pro"
    policies: Optional[List[str]] = None
    run_judge: Optional[bool] = True

class ModelInfo(BaseModel):
    name: str
    provider: str
    litellm_id: str

# --- Health & Info Endpoints ---
@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}

@app.get("/models")
async def list_models():
    models = []
    for name, litellm_id in MODEL_MAP.items():
        provider = litellm_id.split("/")[0] if "/" in litellm_id else "unknown"
        models.append({"name": name, "provider": provider, "litellm_id": litellm_id})
    return {"models": models}

# --- Optimization Endpoints ---
@app.post("/optimize/user")
async def optimize_user_prompt(req: OptimizeRequest):
    result = user_optimizer.optimize(req.text, target_model=req.model)
    
    evaluation = None
    if req.run_judge:
        optimized_text = result.get("optimized_prompt", "")
        intent = result.get("detected_intent", {})
        evaluation = judge.evaluate(req.text, optimized_text, intent, target_model=req.model)
    
    return {
        "status": "success",
        "engine": "user_prompt_optimizer",
        "model_used": req.model,
        "data": result,
        "evaluation": evaluation
    }

@app.post("/optimize/system")
async def optimize_system_prompt(req: OptimizeRequest):
    result = system_auditor.audit(req.text, policies=req.policies, target_model=req.model)
    
    evaluation = None
    if req.run_judge:
        audited_text = result.get("audited_prompt", "")
        evaluation = judge.evaluate(req.text, audited_text, {"type": "system_prompt"}, target_model=req.model)
    
    return {
        "status": "success",
        "engine": "system_prompt_auditor",
        "model_used": req.model,
        "data": result,
        "evaluation": evaluation
    }

@app.post("/optimize/code")
async def optimize_code_prompt(req: OptimizeRequest):
    result = code_refactorer.refactor(req.text, target_model=req.model)
    
    return {
        "status": "success",
        "engine": "code_prompt_refactorer",
        "model_used": req.model,
        "data": result
    }

@app.post("/optimize/auto")
async def auto_optimize(req: OptimizeRequest):
    input_type = route_input(req.text)
    
    if input_type == "user_prompt_optimization":
        data = user_optimizer.optimize(req.text, target_model=req.model)
        optimized_text = data.get("optimized_prompt", "")
        intent = data.get("detected_intent", {})
    elif input_type == "system_prompt_refinement":
        data = system_auditor.audit(req.text, policies=req.policies, target_model=req.model)
        optimized_text = data.get("audited_prompt", "")
        intent = {"type": "system_prompt"}
    else:
        data = code_refactorer.refactor(req.text, target_model=req.model)
        optimized_text = ""
        intent = {"type": "code_prompt"}

    evaluation = None
    if req.run_judge and optimized_text:
        evaluation = judge.evaluate(req.text, optimized_text, intent, target_model=req.model)

    return {
        "status": "success",
        "routed_to": input_type,
        "model_used": req.model,
        "original_text": req.text,
        "data": data,
        "evaluation": evaluation
    }
