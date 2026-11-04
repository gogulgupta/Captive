import React, { useState, useEffect } from 'react';
import { X, Globe, Check, Server, RefreshCw, AlertCircle } from 'lucide-react';
import { getBackendUrl, setBackendUrl } from '../utils/aiTranscription';

export default function BackendSettingsModal({ isOpen, onClose }) {
  const [urlInput, setUrlInput] = useState("");
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState(null); // { success: boolean, message: string }
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUrlInput(getBackendUrl());
      setStatus(null);
      setSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const testConnection = async () => {
    const cleanUrl = urlInput.trim().replace(/\/+$/, '');
    if (!cleanUrl) return;

    setTesting(true);
    setStatus(null);

    try {
      const resp = await fetch(`${cleanUrl}/health`, { method: 'GET' });
      if (resp.ok) {
        setStatus({ success: true, message: "Connected successfully! Server is online." });
      } else {
        setStatus({ success: false, message: `Server replied with status ${resp.status}` });
      }
    } catch (e) {
      setStatus({ success: false, message: "Server unreachable. Make sure the URL is public & has HTTPS." });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    const cleanUrl = urlInput.trim().replace(/\/+$/, '');
    setBackendUrl(cleanUrl);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
      window.location.reload();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Cloud Server Settings</span>
              <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                Phone & Web
              </span>
            </h2>
            <p className="text-xs text-zinc-400">Set your Streamlit / Cloud Backend URL so phone can transcribe</p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>Python Backend Server URL:</span>
          </label>

          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="e.g. https://xxxx.share.streamlit.io or https://xxxx.onrender.com"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-mono"
          />

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={testConnection}
              disabled={testing || !urlInput.trim()}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-800 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" /> : <Globe className="w-3.5 h-3.5" />}
              <span>Test Connection</span>
            </button>

            <button
              type="button"
              onClick={() => setUrlInput("http://127.0.0.1:5000")}
              className="text-[11px] text-zinc-500 hover:text-zinc-300 underline"
            >
              Reset to Localhost
            </button>
          </div>

          {status && (
            <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
              status.success ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
            }`}>
              {status.success ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              <span>{status.message}</span>
            </div>
          )}

          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
            <div className="text-zinc-200 font-bold">💡 Kyun chahiye cloud URL?</div>
            <div>
              Aapka phone <span className="font-mono text-amber-400">captive-lac.vercel.app</span> se open hai. Phone aapke laptop ke <span className="font-mono text-zinc-300">127.0.0.1:5000</span> ko directly access nahi kar sakta kyunki wo private network par hai.
            </div>
            <div>
              Jab aap apna Streamlit/Render cloud backend URL yahan save karenge, phone direct us cloud server se accurate Hinglish captions generate karega!
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={!urlInput.trim()}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-orange-500/20 disabled:opacity-40"
          >
            {saved ? <Check className="w-4 h-4 text-black" /> : null}
            <span>{saved ? "Saved!" : "Save & Use URL"}</span>
          </button>
        </div>

      </div>
    </div>
  );
}

