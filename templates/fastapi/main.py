"""
Coreed Agent Space - FastAPI Template

This template provides a REST API for your AI agent.
It includes:
- Health check endpoint (/health)
- Model inference endpoint (/predict)
- Chat completion endpoint (/chat)
- Automatic model loading from 0G Storage
- Sleep management integration (record_request on each inference)

Environment Variables:
- MODEL_PATH: Path to the model file (downloaded from 0G Storage)
- MODEL_NAME: Name of the model
- SPACE_ID: Coreed Space ID
- MODEL_REGISTRY_ADDRESS: ModelRegistry contract address
- COREED_SLEEP_TIMEOUT: Sleep timeout in seconds (default: 3600)
- COREED_AUTO_SLEEP: Enable auto-sleep (default: true)
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import os
import sys
import time
import uvicorn
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

# Initialize FastAPI
app = FastAPI(
    title=f"{os.getenv('MODEL_NAME', 'Coreed Agent')}",
    description="AI Agent Space powered by Coreed",
    version=os.getenv("SPACE_VERSION", "1.0.0")
)

# Health check state
SPACE_ID = os.getenv("SPACE_ID", "unknown")

_health_status = {
    "status": "starting",
    "timestamp": int(time.time()),
    "space_id": SPACE_ID,
    "model_loaded": False
}

# Sleep management
def record_request():
    """Record a request to update lastActivity timestamp on-chain"""
    try:
        from coreed_cli import record_request as coreed_record_request
        import asyncio
        
        async def _record():
            await coreed_record_request(int(SPACE_ID) if SPACE_ID.isdigit() else 0)
        
        asyncio.create_task(_record())
    except ImportError:
        print(f"📝 Request recorded for Space {SPACE_ID} (off-chain)")
    except Exception as e:
        print(f"⚠️ Failed to record request: {e}")


class HealthResponse(BaseModel):
    status: str
    timestamp: int
    space_id: str
    model_loaded: bool
    version: str


class PredictRequest(BaseModel):
    prompt: str
    max_tokens: Optional[int] = 100
    temperature: Optional[float] = 0.7
    top_p: Optional[float] = 0.9


class PredictResponse(BaseModel):
    generated_text: str
    finish_reason: str
    input_tokens: int
    output_tokens: int


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    max_tokens: Optional[int] = 100
    temperature: Optional[float] = 0.7


class ChatResponse(BaseModel):
    message: ChatMessage
    finish_reason: str
    usage: dict


@app.on_event("startup")
async def startup_event():
    """Initialize model on startup"""
    global _health_status
    
    model_path = os.getenv("MODEL_PATH")
    if not model_path or not Path(model_path).exists():
        raise ValueError(f"Model file not found at {model_path}. Please download from 0G Storage.")
    
    # TODO: Load your model here
    # Example: model = AutoModelForCausalLM.from_pretrained(model_path)
    # For now, we'll just mark it as loaded
    
    _health_status["model_loaded"] = True
    _health_status["status"] = "healthy"
    _health_status["timestamp"] = int(time.time())
    
    print(f"✅ Coreed Agent Space started - Space ID: {os.getenv('SPACE_ID')}")
    print(f"📁 Model path: {model_path}")


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint for Coreed Space Registry.
    This endpoint is called periodically to verify the agent is live.
    """
    _health_status["timestamp"] = int(time.time())
    return {
        "status": _health_status["status"],
        "timestamp": _health_status["timestamp"],
        "space_id": _health_status["space_id"],
        "model_loaded": _health_status["model_loaded"],
        "version": os.getenv("SPACE_VERSION", "1.0.0"),
        "sleep_timeout": os.getenv("COREED_SLEEP_TIMEOUT", "3600"),
        "auto_sleep": os.getenv("COREED_AUTO_SLEEP", "true").lower() == "true"
    }


@app.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest):
    """
    Generate text from a prompt.
    
    This is the main inference endpoint.
    """
    if not _health_status["model_loaded"]:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    # Record request for sleep management
    record_request()
    
    # TODO: Implement your model inference here
    # Example:
    # inputs = tokenizer(request.prompt, return_tensors="pt").to(device)
    # outputs = model.generate(**inputs, max_new_tokens=request.max_tokens)
    # generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    # For now, return a mock response
    generated_text = f"This is a mock response to: {request.prompt}"
    
    return {
        "generated_text": generated_text,
        "finish_reason": "stop",
        "input_tokens": 10,
        "output_tokens": 15
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat completion endpoint (OpenAI-compatible).
    
    Supports conversational AI interactions.
    """
    if not _health_status["model_loaded"]:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    # Record request for sleep management
    record_request()
    
    # TODO: Implement your chat logic here
    # Example:
    # messages = [{"role": m.role, "content": m.content} for m in request.messages]
    # inputs = tokenizer.apply_chat_template(messages, return_tensors="pt").to(device)
    # outputs = model.generate(**inputs, max_new_tokens=request.max_tokens)
    # response_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    # For now, return a mock response
    last_message = request.messages[-1].content if request.messages else ""
    response_text = f"This is a mock chat response to: {last_message}"
    
    return {
        "message": {
            "role": "assistant",
            "content": response_text
        },
        "finish_reason": "stop",
        "usage": {
            "prompt_tokens": 20,
            "completion_tokens": 15,
            "total_tokens": 35
        }
    }


@app.get("/info")
async def get_info():
    """Get agent space information"""
    return {
        "name": os.getenv("MODEL_NAME", "Coreed Agent"),
        "version": os.getenv("SPACE_VERSION", "1.0.0"),
        "space_id": os.getenv("SPACE_ID", "unknown"),
        "model_path": os.getenv("MODEL_PATH", ""),
        "status": _health_status["status"]
    }


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
