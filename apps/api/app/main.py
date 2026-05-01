from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
import json

from .core.router import route_input
from .core.llm import llm_engine, MODEL_MAP
from .core.cache import generate_cache_key, get_cached_result, set_cached_result
from .engines.user_prompt import optimizer as user_optimizer
from .engines.system_prompt import auditor as system_auditor
from .engines.code_prompt import refactorer as code_refactorer
from .evaluations.judge import judge

from .db.session import init_db, get_db
from .db.models import PromptOptimizationLog, EvaluationResult

app = FastAPI(
    title="Universal Prompt Optimizer",
    description="Production-grade system for evaluating and optimizing AI prompts across User, System, and Code layers with Persistence and Caching.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    await init_db()
    print("Database tables initialized.")

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

# --- Helper to Save to DB ---
async def save_to_db(db: AsyncSession, req: OptimizeRequest, engine: str, data: dict, evaluation: dict = None):
    log = PromptOptimizationLog(
        original_text=req.text,
        optimized_text=data.get("optimized_prompt") or data.get("audited_prompt") or "",
        engine_used=engine,
        model_used=req.model,
        input_type=req.input_type or "auto",
        policies_applied=req.policies if req.policies else []
    )
    db.add(log)
    await db.flush()

    if evaluation:
        eval_result = EvaluationResult(
            log_id=log.id,
            intent_score=evaluation.get("dimensions", {}).get("intent_fidelity", 0.0),
            safety_score=evaluation.get("dimensions", {}).get("safety", 0.0),
            specificity_score=evaluation.get("dimensions", {}).get("specificity", 0.0),
            quality_score=evaluation.get("dimensions", {}).get("structural_quality", 0.0),
            composite_score=evaluation.get("composite_score", 0.0),
            passed=evaluation.get("passed", False),
            feedback=evaluation.get("feedback", "")
        )
        db.add(eval_result)
    
    await db.commit()

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
async def optimize_user_prompt(req: OptimizeRequest, db: AsyncSession = Depends(get_db)):
    cache_key = generate_cache_key(req.text, req.model, "user_prompt", str(req.run_judge))
    cached = await get_cached_result(cache_key)
    if cached:
        return cached

    result = user_optimizer.optimize(req.text, target_model=req.model)
    
    evaluation = None
    if req.run_judge:
        optimized_text = result.get("optimized_prompt", "")
        intent = result.get("detected_intent", {})
        evaluation = judge.evaluate(req.text, optimized_text, intent, target_model=req.model)
    
    await save_to_db(db, req, "user_prompt", result, evaluation)

    response_data = {
        "status": "success",
        "engine": "user_prompt_optimizer",
        "model_used": req.model,
        "data": result,
        "evaluation": evaluation,
        "cached": False
    }
    await set_cached_result(cache_key, {**response_data, "cached": True})
    return response_data

@app.post("/optimize/system")
async def optimize_system_prompt(req: OptimizeRequest, db: AsyncSession = Depends(get_db)):
    policies_str = json.dumps(req.policies) if req.policies else ""
    cache_key = generate_cache_key(req.text, req.model, "system_prompt", policies_str + str(req.run_judge))
    cached = await get_cached_result(cache_key)
    if cached:
        return cached

    result = system_auditor.audit(req.text, policies=req.policies, target_model=req.model)
    
    evaluation = None
    if req.run_judge:
        audited_text = result.get("audited_prompt", "")
        evaluation = judge.evaluate(req.text, audited_text, {"type": "system_prompt"}, target_model=req.model)
    
    await save_to_db(db, req, "system_prompt", result, evaluation)

    response_data = {
        "status": "success",
        "engine": "system_prompt_auditor",
        "model_used": req.model,
        "data": result,
        "evaluation": evaluation,
        "cached": False
    }
    await set_cached_result(cache_key, {**response_data, "cached": True})
    return response_data

@app.post("/optimize/code")
async def optimize_code_prompt(req: OptimizeRequest, db: AsyncSession = Depends(get_db)):
    cache_key = generate_cache_key(req.text, req.model, "code_prompt")
    cached = await get_cached_result(cache_key)
    if cached:
        return cached

    result = code_refactorer.refactor(req.text, target_model=req.model)
    
    await save_to_db(db, req, "code_prompt", result, None)

    response_data = {
        "status": "success",
        "engine": "code_prompt_refactorer",
        "model_used": req.model,
        "data": result,
        "cached": False
    }
    await set_cached_result(cache_key, {**response_data, "cached": True})
    return response_data

@app.post("/optimize/auto")
async def auto_optimize(req: OptimizeRequest, db: AsyncSession = Depends(get_db)):
    cache_key = generate_cache_key(req.text, req.model, "auto_prompt", str(req.run_judge))
    cached = await get_cached_result(cache_key)
    if cached:
        return cached

    input_type = route_input(req.text)
    
    if input_type == "user_prompt_optimization":
        data = user_optimizer.optimize(req.text, target_model=req.model)
        optimized_text = data.get("optimized_prompt", "")
        intent = data.get("detected_intent", {})
        engine = "user_prompt"
    elif input_type == "system_prompt_refinement":
        data = system_auditor.audit(req.text, policies=req.policies, target_model=req.model)
        optimized_text = data.get("audited_prompt", "")
        intent = {"type": "system_prompt"}
        engine = "system_prompt"
    else:
        data = code_refactorer.refactor(req.text, target_model=req.model)
        optimized_text = ""
        intent = {"type": "code_prompt"}
        engine = "code_prompt"

    evaluation = None
    if req.run_judge and optimized_text:
        evaluation = judge.evaluate(req.text, optimized_text, intent, target_model=req.model)

    await save_to_db(db, req, engine, data, evaluation)

    response_data = {
        "status": "success",
        "routed_to": input_type,
        "model_used": req.model,
        "original_text": req.text,
        "data": data,
        "evaluation": evaluation,
        "cached": False
    }
    await set_cached_result(cache_key, {**response_data, "cached": True})
    return response_data
