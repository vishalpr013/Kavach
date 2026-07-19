import { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon, Check, X, Loader2, Zap, Key,
} from 'lucide-react';
import { getLLMProvider, setLLMProvider, testConnection } from '../api';

const PROVIDERS = [
  { id: 'groq', label: 'Groq', description: 'Fastest inference, free tier. Default provider.', hasDefault: true },
  { id: 'openai', label: 'OpenAI', description: 'GPT-4o-mini. Requires your own API key.', hasDefault: false },
  { id: 'gemini', label: 'Google Gemini', description: 'Gemini 2.0 Flash. Requires your own API key.', hasDefault: false },
  { id: 'claude', label: 'Anthropic Claude', description: 'Claude Sonnet. Requires your own API key.', hasDefault: false },
];

export default function Settings() {
  const [activeProvider, setActiveProvider] = useState('groq');
  const [keySource, setKeySource] = useState('default');
  const [hasKey, setHasKey] = useState(true);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saveMessage, setSaveMessage] = useState(null);

  useEffect(() => {
    const fetchProvider = async () => {
      try {
        const res = await getLLMProvider();
        setActiveProvider(res.data.provider);
        setKeySource(res.data.key_source);
        setHasKey(res.data.has_key);
      } catch (err) {
        console.error('Failed to fetch provider:', err);
      }
    };
    fetchProvider();
  }, []);

  const handleSave = async (provider) => {
    setSaving(true);
    setSaveMessage(null);
    setTestResult(null);

    try {
      const key = provider !== 'groq' || apiKeyInput ? apiKeyInput || null : null;
      const res = await setLLMProvider(provider, key);
      setActiveProvider(res.data.provider);
      setKeySource(res.data.key_source);
      setHasKey(res.data.has_key);
      setSaveMessage({ type: 'success', text: `Switched to ${provider}` });
      setApiKeyInput('');
    } catch (err) {
      setSaveMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to update provider' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testConnection();
      setTestResult(res.data);
    } catch (err) {
      setTestResult({ success: false, provider: activeProvider, message: 'Connection test failed' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <SettingsIcon className="w-5 h-5 text-amber-400" />
        <div>
          <h2 className="section-heading">
            LLM <em>Configuration</em>
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Switch providers or supply your own API key
          </p>
        </div>
      </div>

      {/* Current Status */}
      <div className="card border-amber-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${hasKey ? 'bg-risk-low' : 'bg-risk-critical'}`} />
            <div>
              <span className="font-mono text-xs text-text-primary uppercase">
                {keySource === 'default' ? `Using default ${activeProvider} key` : `Using your ${activeProvider} key`}
              </span>
              <p className="font-mono text-[10px] text-text-muted mt-0.5">
                {hasKey ? 'Key configured and ready' : 'No key configured — please provide one'}
              </p>
            </div>
          </div>

          <button
            onClick={handleTest}
            disabled={testing}
            className="px-4 py-2 bg-surface-600 border border-surface-400 text-text-secondary rounded-md font-mono text-xs uppercase tracking-wider hover:border-amber-500/30 hover:text-amber-400 transition-all disabled:opacity-40 flex items-center gap-2"
          >
            {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            Test Connection
          </button>
        </div>

        {testResult && (
          <div className={`mt-3 p-3 rounded-md border ${
            testResult.success
              ? 'bg-risk-low/5 border-risk-low/20'
              : 'bg-risk-critical/5 border-risk-critical/20'
          }`}>
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <Check className="w-4 h-4 text-risk-low" />
              ) : (
                <X className="w-4 h-4 text-risk-critical" />
              )}
              <span className={`font-mono text-xs ${testResult.success ? 'text-risk-low' : 'text-risk-critical'}`}>
                {testResult.message}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Provider Cards */}
      <div className="space-y-3">
        <span className="bracket-label">SELECT PROVIDER</span>

        {PROVIDERS.map((provider) => (
          <div
            key={provider.id}
            className={`card transition-all duration-200 ${
              activeProvider === provider.id ? 'border-amber-500/30 bg-amber-500/[0.03]' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full border-2 ${
                  activeProvider === provider.id
                    ? 'border-amber-500 bg-amber-500'
                    : 'border-surface-400'
                }`} />
                <div>
                  <h4 className="font-mono text-sm text-text-primary">{provider.label}</h4>
                  <p className="text-[11px] text-text-muted">{provider.description}</p>
                </div>
              </div>

              {activeProvider !== provider.id && (
                <button
                  onClick={() => handleSave(provider.id)}
                  disabled={saving}
                  className="px-3 py-1.5 border border-surface-400 text-text-muted rounded-md font-mono text-[10px] uppercase tracking-wider hover:border-amber-500/30 hover:text-amber-400 transition-all disabled:opacity-40"
                >
                  {saving ? 'Switching...' : 'Select'}
                </button>
              )}
            </div>

            {/* API Key input — show if this is the active provider and it's not using default */}
            {activeProvider === provider.id && (!provider.hasDefault || keySource === 'user') && (
              <div className="mt-3 pt-3 border-t border-surface-500">
                <div className="flex items-center gap-2">
                  <Key className="w-3.5 h-3.5 text-text-muted" />
                  <label className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
                    API Key
                  </label>
                </div>
                <div className="flex gap-2 mt-2">
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder={`Enter your ${provider.label} API key...`}
                    className="flex-1 bg-surface-800 border border-surface-400 rounded-md px-3 py-2 text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-amber-500/50"
                  />
                  <button
                    onClick={() => handleSave(provider.id)}
                    disabled={!apiKeyInput.trim() || saving}
                    className="px-4 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-md font-mono text-[10px] uppercase tracking-wider hover:bg-amber-500/20 transition-all disabled:opacity-40"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            {/* Show "override key" option for Groq */}
            {activeProvider === provider.id && provider.hasDefault && keySource === 'default' && (
              <div className="mt-3 pt-3 border-t border-surface-500">
                <button
                  onClick={() => setKeySource('user')}
                  className="font-mono text-[10px] text-text-muted hover:text-amber-400 transition-colors uppercase tracking-wider"
                >
                  Override with your own key →
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Save feedback */}
      {saveMessage && (
        <div className={`p-3 rounded-md border ${
          saveMessage.type === 'success'
            ? 'bg-risk-low/5 border-risk-low/20 text-risk-low'
            : 'bg-risk-critical/5 border-risk-critical/20 text-risk-critical'
        }`}>
          <span className="font-mono text-xs">{saveMessage.text}</span>
        </div>
      )}
    </div>
  );
}
