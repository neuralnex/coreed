"use client";

import { useState, useEffect, useRef } from "react";
import { Bot, CheckCircle, AlertCircle, Loader2, Send, X } from "lucide-react";

export interface ComputeInfo {
  connected: boolean;
  models?: any[];
  error?: string;
  baseUrl: string;
  requiresApiKey: boolean;
}

export interface ComputeDeployment {
  id?: string;
  model?: string;
  endpoint?: string;
  status?: string;
}

interface ComputeStatusProps {
  spaceId: string;
}

export interface SpaceInfo {
  gitRepo?: {
    cloneUrl: string;
    repoPath: string;
  } | null;
}

interface ComputeStatusProps {
  spaceId: string;
}

export function ComputeStatus({ spaceId }: ComputeStatusProps) {
  const [computeInfo, setComputeInfo] = useState<ComputeInfo | null>(null);
  const [deployment, setDeployment] = useState<ComputeDeployment | null>(null);
  const [spaceInfo, setSpaceInfo] = useState<SpaceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; timestamp: Date }[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check for stored space info from session storage (after space creation redirect)
  useEffect(() => {
    const storedInfo = sessionStorage.getItem('lastSpaceInfo');
    const storedError = sessionStorage.getItem('lastComputeError');
    
    if (storedInfo) {
      const info = JSON.parse(storedInfo);
      if (info.spaceId === spaceId) {
        setComputeInfo(info.compute);
        setDeployment(info.deployment);
        setSpaceInfo(info);
        sessionStorage.removeItem('lastSpaceInfo');
      }
    }
    
    if (storedError) {
      const err = JSON.parse(storedError);
      sessionStorage.removeItem('lastComputeError');
      setError(err.error || 'Failed to deploy space');
    }
    
    setLoading(false);
  }, [spaceId]);

  // Fetch compute status for this space
  useEffect(() => {
    if (loading) return;
    
    // If we don't have compute info yet, try to fetch it
    if (!computeInfo && !error) {
      fetchComputeStatus();
    }
  }, [spaceId, computeInfo, error, loading]);

  const fetchComputeStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/spaces/create?spaceId=${spaceId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.compute) {
          setComputeInfo(data.compute);
        }
        if (data.deployment) {
          setDeployment(data.deployment);
        }
        if (data.repo) {
          setSpaceInfo({ gitRepo: data.repo });
        }
      }
    } catch (err) {
      console.error('Failed to fetch compute status:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !deployment?.endpoint) return;
    
    setSending(true);
    setError(null);
    
    const userMessage = inputMessage.trim();
    setInputMessage("");
    
    // Add user message to chat
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: userMessage, 
      timestamp: new Date() 
    }]);
    
    try {
      // Call 0G Compute Router for inference
      const response = await fetch(deployment.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: deployment.model || 'zai-org/GLM-4-Flash',
          messages: [...messages.map(m => ({ role: m.role, content: m.content })), 
                     { role: 'user', content: userMessage }],
          max_tokens: 500,
          stream: false
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to get response from 0G Compute');
      }
      
      const data = await response.json();
      const assistantMessage = data.choices?.[0]?.message?.content || "No response from model";
      
      // Add assistant message to chat
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: assistantMessage, 
        timestamp: new Date() 
      }]);
      
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="rounded border border-coreed-line bg-coreed-panel p-5 mb-8">
        <h3 className="font-mono text-xs text-coreed-sage mb-3 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Space Deployment Status
        </h3>
        <p className="font-mono text-sm text-coreed-sage/70">Loading deployment info...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded border border-coreed-clay bg-coreed-panel-raised p-5 mb-8">
        <h3 className="font-mono text-xs text-coreed-clay mb-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Space Deployment Error
        </h3>
        <p className="font-mono text-sm text-coreed-clay">{error}</p>
        <button
          onClick={fetchComputeStatus}
          className="mt-3 rounded border border-coreed-moss px-3 py-1 font-mono text-xs text-coreed-bone hover:border-coreed-moss-bright"
        >
          Retry
        </button>
      </div>
    );
  }

  // Show Git repo info if available
  if (spaceInfo?.gitRepo && !computeInfo?.connected) {
    return (
      <div className="rounded border border-coreed-line bg-coreed-panel p-5 mb-8">
        <h3 className="font-mono text-xs text-coreed-sage mb-3 flex items-center gap-2">
          <Bot className="w-4 h-4" />
          Space Git Repository
        </h3>
        
        <div className="mb-4">
          <p className="font-mono text-xs text-coreed-sage/70 mb-1">Repository URL</p>
          <p className="font-mono text-sm text-coreed-bone break-all">
            {spaceInfo.gitRepo.cloneUrl}
          </p>
        </div>
        
        <div className="mb-4">
          <p className="font-mono text-xs text-coreed-sage/70 mb-2">To develop your space:</p>
          <ol className="font-mono text-xs text-coreed-sage/70 space-y-1">
            <li>1. Clone: <code className="bg-coreed-panel-raised px-1 rounded">git clone {spaceInfo.gitRepo.cloneUrl}</code></li>
            <li>2. Add your code files (app.py, main.py, etc.)</li>
            <li>3. Commit: <code className="bg-coreed-panel-raised px-1 rounded">git add . && git commit -m "my changes"</code></li>
            <li>4. Push: <code className="bg-coreed-panel-raised px-1 rounded">git push origin main</code></li>
            <li>5. Your space will auto-deploy!</li>
          </ol>
        </div>
        
        {!computeInfo?.connected && (
          <div className="border-t border-coreed-line pt-4">
            <p className="font-mono text-xs text-coreed-sage/70 mb-2">
              Optional: Enable 0G Compute for AI inference
            </p>
            <ol className="font-mono text-xs text-coreed-sage/70 space-y-1">
              <li>1. Get an API key from <span className="text-coreed-moss-bright">https://pc.0g.ai</span></li>
              <li>2. Add to .env: <code className="bg-coreed-panel-raised px-1 rounded">OG_COMPUTE_API_KEY=sk-...</code></li>
              <li>3. Deposit 0G tokens</li>
              <li>4. Refresh this page</li>
            </ol>
          </div>
        )}
      </div>
    );
  }

  if (!computeInfo && !spaceInfo?.gitRepo) {
    return (
      <div className="rounded border border-coreed-line bg-coreed-panel p-5 mb-8">
        <h3 className="font-mono text-xs text-coreed-sage mb-3 flex items-center gap-2">
          <Bot className="w-4 h-4" />
          Space Deployment
        </h3>
        <p className="font-mono text-sm text-coreed-sage/70 mb-4">
          Not connected to 0G Compute Router
        </p>
        <p className="font-mono text-xs text-coreed-sage/50 mb-4">
          To enable AI inference for this space:
        </p>
        <ol className="font-mono text-xs text-coreed-sage/70 space-y-1">
          <li>1. Get an API key from <span className="text-coreed-moss-bright">https://pc.0g.ai</span></li>
          <li>2. Add to .env: <code className="bg-coreed-panel-raised px-1 rounded">OG_COMPUTE_API_KEY=sk-...</code></li>
          <li>3. Deposit 0G tokens to your Router account</li>
          <li>4. Refresh this page</li>
        </ol>
      </div>
    );
  }

  // Deployment is ready - show chat interface
  if (deployment?.id && deployment.endpoint) {
    return (
      <div className="rounded border border-coreed-line bg-coreed-panel p-5 mb-8">
        <h3 className="font-mono text-xs text-coreed-sage mb-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-coreed-moss" />
          Space: Deployed + 0G Compute Connected
        </h3>
        
        <div className="mb-4">
          <p className="font-mono text-xs text-coreed-sage/70 mb-1">Model</p>
          <p className="font-mono text-sm text-coreed-bone">{deployment.model}</p>
          
          <p className="font-mono text-xs text-coreed-sage/70 mb-1 mt-2">Endpoint</p>
          <p className="font-mono text-sm text-coreed-bone break-all">{deployment.endpoint}</p>
          
          {spaceInfo?.gitRepo && (
            <>
              <p className="font-mono text-xs text-coreed-sage/70 mb-1 mt-2">Git Repository</p>
              <p className="font-mono text-sm text-coreed-bone break-all">{spaceInfo.gitRepo.cloneUrl}</p>
            </>
          )}
        </div>

        {/* Chat Interface */}
        <div className="border-t border-coreed-line pt-4">
          <h4 className="font-mono text-xs text-coreed-sage mb-3">Chat with your Space (Powered by 0G Compute)</h4>
          
          {/* Messages */}
          <div className="flex flex-col gap-3 h-64 overflow-y-auto mb-4 p-3 bg-coreed-panel-raised rounded">
            {messages.length === 0 ? (
              <p className="font-mono text-xs text-coreed-sage/50 text-center my-8">
                Send a message to test your 0G Compute deployment
              </p>
            ) : (
              messages.map((msg, index) => (
                <div 
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] rounded-lg px-3 py-2 font-mono text-sm ${
                      msg.role === 'user' 
                        ? 'bg-coreed-moss/20 text-coreed-bone' 
                        : 'bg-coreed-panel-raised text-coreed-sage'
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p className="text-[10px] text-coreed-sage/50 mt-1 text-right">
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !sending && sendMessage()}
              placeholder="Type a message..."
              disabled={sending}
              className="flex-1 rounded border border-coreed-line bg-coreed-panel px-3 py-2 font-mono text-sm text-coreed-bone focus:outline-none focus:border-coreed-moss"
            />
            <button
              onClick={sendMessage}
              disabled={sending || !inputMessage.trim()}
              className="rounded border border-coreed-line p-2 text-coreed-sage hover:border-coreed-moss hover:text-coreed-bone disabled:opacity-50"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Connected but no deployment yet
  if (!computeInfo) return null;
  
  return (
    <div className="rounded border border-coreed-line bg-coreed-panel p-5 mb-8">
      <h3 className="font-mono text-xs text-coreed-sage mb-3 flex items-center gap-2">
        <Bot className="w-4 h-4 text-coreed-moss" />
        0G Compute: Connected
      </h3>
      
      <p className="font-mono text-sm text-coreed-bone mb-2">
        ✓ Connected to {computeInfo.baseUrl}
      </p>
      
      {computeInfo.models && computeInfo.models.length > 0 && (
        <div className="mt-4">
          <p className="font-mono text-xs text-coreed-sage/70 mb-2">
            Available Models ({computeInfo.models.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {computeInfo.models.slice(0, 5).map((model: any, index: number) => (
              <span 
                key={index}
                className="font-mono text-[10px] px-2 py-1 bg-coreed-panel-raised rounded text-coreed-sage/80"
              >
                {model.id || model.name}
              </span>
            ))}
            {computeInfo.models.length > 5 && (
              <span className="font-mono text-[10px] px-2 py-1 text-coreed-sage/50">
                +{computeInfo.models.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}
      
      {spaceInfo?.gitRepo && (
        <div className="mt-4">
          <p className="font-mono text-xs text-coreed-sage/70 mb-1">Git Repository</p>
          <p className="font-mono text-sm text-coreed-bone break-all">{spaceInfo.gitRepo.cloneUrl}</p>
        </div>
      )}
      
      <p className="font-mono text-xs text-coreed-sage/50 mt-4">
        To deploy a model to this space, your space can use the 0G Compute endpoint.
      </p>
    </div>
  );
}
