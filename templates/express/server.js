/**
 * Coreed Agent Space - Express.js Template
 * 
 * This template provides a REST API for your AI agent.
 * It includes:
 * - Health check endpoint (/health)
 * - Model inference endpoint (/predict)
 * - Chat completion endpoint (/chat)
 * - Automatic model loading from 0G Storage
 * - Sleep management integration (record_request on each inference)
 * 
 * Environment Variables:
 * - MODEL_PATH: Path to the model file (downloaded from 0G Storage)
 * - MODEL_NAME: Name of the model
 * - SPACE_ID: Coreed Space ID
 * - PORT: Server port (default: 3000)
 * - COREED_SLEEP_TIMEOUT: Sleep timeout in seconds (default: 3600)
 * - COREED_AUTO_SLEEP: Enable auto-sleep (default: true)
 */

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Sleep management
const SPACE_ID = process.env.SPACE_ID || 'unknown';

function recordRequest() {
  try {
    // Try to use coreed-cli if available
    const { record_request } = require('coreed-cli');
    if (record_request) {
      record_request(SPACE_ID).catch(() => {});
    } else {
      console.log(`📝 Request recorded for Space ${SPACE_ID} (off-chain)`);
    }
  } catch (e) {
    console.log(`📝 Request recorded for Space ${SPACE_ID} (off-chain)`);
  }
}

// Middleware
app.use(express.json());

// Health check state
let healthStatus = {
  status: 'starting',
  timestamp: Math.floor(Date.now() / 1000),
  spaceId: process.env.SPACE_ID || 'unknown',
  modelLoaded: false
};

// Startup initialization
async function initialize() {
  const modelPath = process.env.MODEL_PATH;
  
  if (!modelPath || !fs.existsSync(modelPath)) {
    throw new Error(`Model file not found at ${modelPath}. Please download from 0G Storage.`);
  }
  
  // TODO: Load your model here
  // Example: model = await pipeline('text-generation', modelPath);
  
  healthStatus.modelLoaded = true;
  healthStatus.status = 'healthy';
  healthStatus.timestamp = Math.floor(Date.now() / 1000);
  
  console.log(`✅ Coreed Agent Space started - Space ID: ${process.env.SPACE_ID}`);
  console.log(`📁 Model path: ${modelPath}`);
}

// Initialize on startup
initialize().catch(err => {
  console.error('❌ Initialization failed:', err.message);
  process.exit(1);
});

// Health check endpoint
app.get('/health', (req, res) => {
  healthStatus.timestamp = Math.floor(Date.now() / 1000);
  res.json({
    status: healthStatus.status,
    timestamp: healthStatus.timestamp,
    spaceId: healthStatus.spaceId,
    modelLoaded: healthStatus.modelLoaded,
    version: process.env.SPACE_VERSION || '1.0.0',
    sleepTimeout: process.env.COREED_SLEEP_TIMEOUT || '3600',
    autoSleep: (process.env.COREED_AUTO_SLEEP || 'true').toLowerCase() === 'true'
  });
});

// Predict endpoint
app.post('/predict', (req, res) => {
  if (!healthStatus.modelLoaded) {
    return res.status(503).json({ error: 'Model not loaded' });
  }
  
  // Record request for sleep management
  recordRequest();
  
  const { prompt, max_tokens = 100, temperature = 0.7, top_p = 0.9 } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }
  
  // TODO: Implement your model inference here
  // Example:
  // const outputs = await model(prompt, {
  //   max_new_tokens: max_tokens,
  //   temperature: temperature
  // });
  
  // For now, return a mock response
  const generatedText = `This is a mock response to: ${prompt}`;
  
  res.json({
    generated_text: generatedText,
    finish_reason: 'stop',
    input_tokens: 10,
    output_tokens: 15
  });
});

// Chat endpoint (OpenAI-compatible)
app.post('/chat', (req, res) => {
  if (!healthStatus.modelLoaded) {
    return res.status(503).json({ error: 'Model not loaded' });
  }
  
  // Record request for sleep management
  recordRequest();
  
  const { messages = [], max_tokens = 100, temperature = 0.7 } = req.body;
  
  if (!messages.length) {
    return res.status(400).json({ error: 'Messages are required' });
  }
  
  // TODO: Implement your chat logic here
  // Example:
  // const lastMessage = messages[messages.length - 1].content;
  // const outputs = await model(lastMessage, { max_new_tokens: max_tokens });
  
  // For now, return a mock response
  const lastMessage = messages[messages.length - 1].content;
  const responseText = `This is a mock chat response to: ${lastMessage}`;
  
  res.json({
    message: {
      role: 'assistant',
      content: responseText
    },
    finish_reason: 'stop',
    usage: {
      prompt_tokens: 20,
      completion_tokens: 15,
      total_tokens: 35
    }
  });
});

// Info endpoint
app.get('/info', (req, res) => {
  res.json({
    name: process.env.MODEL_NAME || 'Coreed Agent',
    version: process.env.SPACE_VERSION || '1.0.0',
    spaceId: process.env.SPACE_ID || 'unknown',
    modelPath: process.env.MODEL_PATH || '',
    status: healthStatus.status
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Agent Space server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down gracefully...');
  process.exit(0);
});
