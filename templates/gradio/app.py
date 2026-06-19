"""
Coreed Agent Space - Gradio Template

This template creates a Gradio interface for your AI model, similar to Hugging Face Spaces.
It includes:
- Health check endpoint (/health) for Coreed Space Registry
- Gradio web UI at the root path
- Model loading from 0G Storage
- Auto-generated Dockerfile for deployment
- Sleep management integration (record_request on each interaction)

Environment Variables:
- MODEL_PATH: Path to the model file (downloaded from 0G Storage)
- MODEL_NAME: Name of the model
- SPACE_ID: Coreed Space ID
- SPACE_VERSION: Version of the agent (default: 1.0.0)
- SERVER_PORT: Server port (default: 7860)
- GRADIO_SERVER_NAME: Server name for Gradio (default: 0.0.0.0)
- COREED_SLEEP_TIMEOUT: Sleep timeout in seconds (default: 3600)
"""

import os
import sys
import time
from pathlib import Path
import gradio as gr
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

# Initialize FastAPI app for health endpoint
app = FastAPI(title=os.getenv("MODEL_NAME", "Coreed Agent"))

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check state
SPACE_ID = os.getenv("SPACE_ID", "unknown")

_health_status = {
    "status": "starting",
    "timestamp": int(time.time()),
    "space_id": SPACE_ID,
    "model_loaded": False,
    "version": os.getenv("SPACE_VERSION", "1.0.0")
}

# Sleep management
def record_request():
    """Record a request to update lastActivity timestamp on-chain"""
    try:
        # Try to import and call record_request from coreed_cli
        from coreed_cli import record_request as coreed_record_request
        import asyncio
        
        # Run async function in sync context
        async def _record():
            await coreed_record_request(int(SPACE_ID) if SPACE_ID.isdigit() else 0)
        
        # Don't block the request - fire and forget
        asyncio.create_task(_record())
    except ImportError:
        # coreed_cli not available, log locally
        print(f"📝 Request recorded for Space {SPACE_ID} (off-chain)")
    except Exception as e:
        print(f"⚠️ Failed to record request: {e}")


# Initialize model
model = None
tokenizer = None

def load_model():
    """Load your model from MODEL_PATH"""
    global model, tokenizer
    
    model_path = os.getenv("MODEL_PATH")
    if not model_path or not Path(model_path).exists():
        raise ValueError(f"Model file not found at {model_path}. Please download from 0G Storage.")
    
    # TODO: Load your model here
    # Example for transformers:
    # from transformers import AutoModelForCausalLM, AutoTokenizer
    # tokenizer = AutoTokenizer.from_pretrained(model_path)
    # model = AutoModelForCausalLM.from_pretrained(model_path)
    # model.eval()
    
    # For now, just mark as loaded
    _health_status["model_loaded"] = True
    _health_status["status"] = "healthy"
    _health_status["timestamp"] = int(time.time())
    
    print(f"✅ Coreed Agent Space started - Space ID: {os.getenv('SPACE_ID')}")
    print(f"📁 Model path: {model_path}")


# Health check endpoint for Coreed Space Registry
@app.get("/health")
async def health_check():
    """
    Health check endpoint. Returns the current health status of the agent.
    Coreed platform pings this endpoint to verify the agent is live.
    """
    # Update timestamp
    _health_status["timestamp"] = int(time.time())
    
    # Add sleep configuration info
    health_response = _health_status.copy()
    health_response["sleep_timeout"] = os.getenv("COREED_SLEEP_TIMEOUT", "3600")
    health_response["auto_sleep"] = os.getenv("COREED_AUTO_SLEEP", "true").lower() == "true"
    
    return health_response


# Gradio interface
def chat(message, history):
    """
    Chat with the model.
    """
    if not _health_status["model_loaded"]:
        return "Model not loaded. Please wait..."
    
    # Record request for sleep management
    record_request()
    
    # TODO: Implement your chat logic here
    # Example:
    # inputs = tokenizer(message, return_tensors="pt").to("cuda")
    # outputs = model.generate(**inputs, max_new_tokens=100)
    # response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    # For now, return a mock response
    response = f"This is a mock chat response to: {message}"
    return response


def predict(prompt):
    """
    Generate text from a prompt.
    """
    if not _health_status["model_loaded"]:
        return "Model not loaded. Please wait..."
    
    # Record request for sleep management
    record_request()
    
    # TODO: Implement your prediction logic here
    # Example:
    # inputs = tokenizer(prompt, return_tensors="pt").to("cuda")
    # outputs = model.generate(**inputs, max_new_tokens=100)
    # response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    # For now, return a mock response
    return f"This is a mock prediction for: {prompt}"


# Create Gradio interface
with gr.Blocks(title=os.getenv("MODEL_NAME", "Coreed Agent"), theme=gr.themes.Soft()) as demo:
    gr.Markdown("# " + (os.getenv("MODEL_NAME", "Coreed Agent")))
    gr.Markdown(f"### Version: {os.getenv('SPACE_VERSION', '1.0.0')} | Space ID: {os.getenv('SPACE_ID', 'unknown')}")
    
    with gr.Tabs():
        with gr.Tab("Chat"):
            chatbot = gr.Chatbot(height=500)
            msg = gr.Textbox(label="Message", placeholder="Type your message here...")
            clear = gr.Button("Clear")
            
            def respond(message, chat_history):
                response = chat(message, chat_history)
                chat_history.append((message, response))
                return "", chat_history
            
            msg.submit(respond, [msg, chatbot], [msg, chatbot])
            clear.click(lambda: None, None, chatbot, queue=False)
        
        with gr.Tab("Predict"):
            with gr.Row():
                with gr.Column():
                    prompt = gr.Textbox(
                        label="Prompt",
                        placeholder="Enter your prompt here...",
                        lines=3
                    )
                    submit = gr.Button("Generate")
                with gr.Column():
                    output = gr.Textbox(
                        label="Output",
                        placeholder="Generated text will appear here...",
                        lines=5
                    )
            
            submit.click(
                predict,
                inputs=prompt,
                outputs=output
            )
    
    gr.Markdown("""
    ---
    ### About
    This is a Coreed Agent Space powered by 0G Chain. 
    
    **Features:**
    - Deploy AI models as live APIs
    - Health monitoring integrated with Coreed Space Registry
    - Automatic Docker image generation
    - Git push-to-deploy workflow
    
    **Source:** [View on Coreed](https://coreed.ai)
    """)


# Initialize model on startup
load_model()

# Mount Gradio app to FastAPI
app = gr.mount_gradio_app(app, demo)


if __name__ == "__main__":
    port = int(os.getenv("SERVER_PORT", 7860))
    server_name = os.getenv("GRADIO_SERVER_NAME", "0.0.0.0")
    
    print(f"🚀 Starting Gradio server on {server_name}:{port}")
    print(f"📁 Model path: {os.getenv('MODEL_PATH', 'not set')}")
    print(f"🆔 Space ID: {os.getenv('SPACE_ID', 'not set')}")
    
    uvicorn.run(
        app,
        host=server_name,
        port=port,
        log_level="info"
    )
