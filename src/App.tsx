import React, { useState, useEffect } from 'react';
import { ConnectionConfig } from './types';
import { checkServerHealth } from './services/apiService';
import { Header } from './components/Header';
import { VisionChat } from './components/VisionChat';
import { GpuCalculator } from './components/GpuCalculator';
import { KaggleGuide } from './components/KaggleGuide';
import { ApiPlayground } from './components/ApiPlayground';
import { RepoExplorer } from './components/RepoExplorer';

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'calculator' | 'kaggle' | 'api' | 'repo'>('chat');
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  // Initialize connection from localStorage if present
  const [connection, setConnection] = useState<ConnectionConfig>(() => {
    const saved = localStorage.getItem('gguf_vision_connection');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {}
    }
    return {
      baseUrl: 'https://exemplo.trycloudflare.com',
      isOnline: false,
      modelName: 'gemma-4-E4B-it-UD-Q4_K_XL.gguf',
      latencyMs: null,
      lastChecked: null,
      serverType: 'simulated'
    };
  });

  // Save to localStorage when connection changes
  useEffect(() => {
    localStorage.setItem('gguf_vision_connection', JSON.stringify(connection));
  }, [connection]);

  const handleCheckHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const result = await checkServerHealth(connection.baseUrl);
      setConnection((prev) => ({
        ...prev,
        isOnline: result.online,
        modelName: result.online ? result.modelName : prev.modelName,
        latencyMs: result.online ? result.latencyMs : null,
        lastChecked: new Date().toLocaleTimeString(),
        serverType: result.serverType
      }));
    } catch (_) {
      setConnection((prev) => ({
        ...prev,
        isOnline: false,
        latencyMs: null,
        lastChecked: new Date().toLocaleTimeString()
      }));
    } finally {
      setIsCheckingHealth(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Header & Navigation */}
      <Header
        connection={connection}
        setConnection={setConnection}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onCheckHealth={handleCheckHealth}
        isChecking={isCheckingHealth}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden">
        {activeTab === 'chat' && <VisionChat connection={connection} />}
        {activeTab === 'calculator' && <GpuCalculator />}
        {activeTab === 'kaggle' && <KaggleGuide />}
        {activeTab === 'api' && <ApiPlayground connection={connection} />}
        {activeTab === 'repo' && <RepoExplorer />}
      </main>
    </div>
  );
}
