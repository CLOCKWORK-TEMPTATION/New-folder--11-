import uuid
from sqlalchemy import Column, String, Text, Float, Boolean, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from .session import Base

class PromptOptimizationLog(Base):
    __tablename__ = "prompt_optimization_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    original_text = Column(Text, nullable=False)
    optimized_text = Column(Text, nullable=True)
    engine_used = Column(String, nullable=False) # user_prompt, system_prompt, code_prompt
    model_used = Column(String, nullable=False)
    input_type = Column(String, nullable=False)
    policies_applied = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    evaluation = relationship("EvaluationResult", back_populates="log", uselist=False, cascade="all, delete-orphan")

class EvaluationResult(Base):
    __tablename__ = "evaluation_results"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    log_id = Column(String, ForeignKey("prompt_optimization_logs.id"), nullable=False)
    intent_score = Column(Float, nullable=False)
    safety_score = Column(Float, nullable=False)
    specificity_score = Column(Float, nullable=False)
    quality_score = Column(Float, nullable=False)
    composite_score = Column(Float, nullable=False)
    passed = Column(Boolean, nullable=False)
    feedback = Column(Text, nullable=True)

    log = relationship("PromptOptimizationLog", back_populates="evaluation")
