import React, { useEffect, useState } from 'react';
import {
  Key,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Play,
  Eye,
  EyeOff,
  Check
} from 'lucide-react';
import {
  getAiSettings,
  saveAiSettings,
  listAiModels,
  testAiModel,
  getAiUsage,
  AiSettings
} from '../api/client';

export const AiEngineSettings: React.FC = () => {
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // API Key input state
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [keyFeedback, setKeyFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Models list state
  const [models, setModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [savingModel, setSavingModel] = useState(false);
  const [modelFeedback, setModelFeedback] = useState<string | null>(null);

  // Test state
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Usage state
  const [usage, setUsage] = useState<{ calls: number; totalTokens: number; estimatedCostUSD: number } | null>(null);

  const refreshUsage = async () => {
    const u = await getAiUsage();
    if (u) setUsage({ calls: u.calls, totalTokens: u.totalTokens, estimatedCostUSD: u.estimatedCostUSD });
  };

  useEffect(() => {
    refreshUsage();
    const t = setInterval(refreshUsage, 10000);
    return () => clearInterval(t);
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await getAiSettings();
      setSettings(data);
      if (data.model) {
        setSelectedModel(data.model);
      }
    } catch (err: any) {
      console.error('Failed to load AI settings:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveKey = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = apiKeyInput.trim();
    if (!trimmed) return;
    setSavingKey(true);
    setKeyFeedback(null);
    try {
      const updated = await saveAiSettings({ apiKey: trimmed });
      setSettings(updated);
      if (updated.model) {
        setSelectedModel(updated.model);
      }
      setApiKeyInput('');
      setKeyFeedback({ type: 'success', message: 'API key saved successfully!' });
      setTestResult(null);
      setTimeout(() => setKeyFeedback(null), 3500);
    } catch (err: any) {
      setKeyFeedback({ type: 'error', message: err.message || 'Failed to save API key' });
    } finally {
      setSavingKey(false);
    }
  };

  const handleLoadModels = async (verify = false) => {
    setLoadingModels(true);
    setModelsError(null);
    try {
      const res = await listAiModels(undefined, verify);
      if (res.ok && res.models && res.models.length > 0) {
        setModels(res.models);
        // If current selectedModel is not set, set to first available
        if (!selectedModel && res.models.length > 0) {
          handleModelChange(res.models[0]);
        }
      } else {
        setModelsError(res.error || (verify ? 'No models passed live verification.' : 'No models returned from API.'));
      }
    } catch (err: any) {
      setModelsError(err.message || 'Failed to load models.');
    } finally {
      setLoadingModels(false);
    }
  };

  const handleModelChange = async (newModel: string) => {
    setSelectedModel(newModel);
    setSavingModel(true);
    setModelFeedback(null);
    try {
      const updated = await saveAiSettings({ model: newModel });
      setSettings(updated);
      setModelFeedback('Saved');
      setTimeout(() => setModelFeedback(null), 2500);
    } catch (err: any) {
      console.error('Failed to update model:', err);
    } finally {
      setSavingModel(false);
    }
  };

  const handleTestModel = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const targetModel = selectedModel || settings?.model || 'gemini-2.5-flash';
      const res = await testAiModel(targetModel);
      if (res.ok) {
        setTestResult({
          ok: true,
          message: `✓ Working: ${res.reply || 'OK'}`
        });
      } else {
        setTestResult({
          ok: false,
          message: `✗ ${res.error || 'Failed to connect to model'}`
        });
      }
    } catch (err: any) {
      setTestResult({
        ok: false,
        message: `✗ ${err.message || 'Failed to test model'}`
      });
    } finally {
      setTesting(false);
    }
  };

  const defaultModels = [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
  ];

  const modelOptions = Array.from(
    new Set([
      ...(models.length > 0 ? models : defaultModels),
      ...(selectedModel ? [selectedModel] : []),
      ...(settings?.model ? [settings.model] : [])
    ])
  ).filter(Boolean);

  const activeModel = selectedModel || settings?.model || 'gemini-2.5-flash';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* 1. Masked Key Status Line */}
      <div style={{
        padding: '10px 14px',
        backgroundColor: 'rgba(0,0,0,0.35)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <Key size={15} color={settings?.hasKey ? 'var(--accent-green)' : 'var(--text-muted)'} />
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Key:
          </span>
          {initialLoading ? (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Loading status...</span>
          ) : settings?.hasKey ? (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12.5px', color: '#fff', fontWeight: 600 }}>
              {settings.keyHint || 'Configured'}
            </span>
          ) : (
            <span style={{ fontSize: '12px', color: 'var(--accent-red)', fontWeight: 600 }}>
              None Configured
            </span>
          )}
          {settings?.hasKey && (
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              letterSpacing: '0.04em',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: settings.usingEnvKey ? 'rgba(0, 240, 255, 0.12)' : 'rgba(16, 185, 129, 0.12)',
              color: settings.usingEnvKey ? 'var(--accent-cyan)' : 'var(--accent-green)',
              border: `1px solid ${settings.usingEnvKey ? 'rgba(0, 240, 255, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
            }}>
              {settings.usingEnvKey ? 'ENV KEY' : 'SAVED KEY'}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            fontFamily: 'var(--font-heading)',
            letterSpacing: '0.05em',
            color: settings?.hasKey ? 'var(--accent-green)' : 'var(--accent-red)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {settings?.hasKey ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
            {settings?.hasKey ? 'ACTIVE (ONLINE)' : 'INACTIVE'}
          </span>
        </div>
      </div>

      {/* 2. Password input for API Key + Save Button */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Gemini API Key
        </label>
        <form onSubmit={handleSaveKey} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Paste Google Gemini API key..."
              style={{
                width: '100%',
                padding: '9px 36px 9px 12px',
                backgroundColor: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '6px',
                fontSize: '13px',
                fontFamily: 'var(--font-mono)',
                color: '#fff',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '4px'
              }}
              title={showPassword ? 'Hide key' : 'Show key'}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <button
            type="submit"
            disabled={savingKey || !apiKeyInput.trim()}
            className="tactical-btn"
            style={{
              padding: '8px 16px',
              fontSize: '12px',
              height: '38px',
              opacity: (!apiKeyInput.trim() || savingKey) ? 0.5 : 1,
              cursor: (!apiKeyInput.trim() || savingKey) ? 'not-allowed' : 'pointer',
              flexShrink: 0
            }}
          >
            {savingKey ? 'SAVING...' : 'SAVE KEY'}
          </button>
        </form>
        {keyFeedback && (
          <div style={{
            fontSize: '12px',
            color: keyFeedback.type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginTop: '2px'
          }}>
            {keyFeedback.type === 'success' ? <Check size={13} /> : <AlertCircle size={13} />}
            {keyFeedback.message}
          </div>
        )}
      </div>

      {/* 3. Numbered Setup Steps */}
      <div style={{
        padding: '12px 14px',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '6px',
        fontSize: '12px',
        lineHeight: 1.6,
        color: 'var(--text-secondary)'
      }}>
        <div style={{
          fontSize: '11px',
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          color: 'var(--accent-cyan)',
          letterSpacing: '0.05em',
          marginBottom: '4px'
        }}>
          SETUP STEPS
        </div>
        <ol style={{ paddingLeft: '18px', margin: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <li>
            Get a free key at{' '}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--accent-cyan)',
                textDecoration: 'underline',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              https://aistudio.google.com/app/apikey
              <ExternalLink size={11} />
            </a>
          </li>
          <li>Paste it above and Save</li>
          <li>Load models and pick one</li>
          <li>Test it.</li>
        </ol>
      </div>

      {/* 4 & 5 & 6. Model Select + Load Models + Test Button */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            AI Model
          </label>
          {modelFeedback && (
            <span style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 600 }}>
              ✓ {modelFeedback}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={activeModel}
            onChange={(e) => handleModelChange(e.target.value)}
            disabled={savingModel}
            style={{
              flex: 1,
              minWidth: 0,
              padding: '9px 12px',
              backgroundColor: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '6px',
              fontSize: '13px',
              fontFamily: 'var(--font-mono)',
              color: '#fff',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {modelOptions.map((m) => (
              <option key={m} value={m} style={{ backgroundColor: '#131924', color: '#fff' }}>
                {m}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => handleLoadModels(true)}
            disabled={loadingModels}
            className="tactical-btn tactical-btn-secondary"
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              height: '38px',
              cursor: loadingModels ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            <RefreshCw size={13} className={loadingModels ? 'pulse-dot' : ''} />
            {loadingModels ? 'VERIFYING...' : 'LOAD WORKING MODELS'}
          </button>

          <button
            type="button"
            onClick={handleTestModel}
            disabled={testing}
            className="tactical-btn"
            style={{
              padding: '8px 16px',
              fontSize: '12px',
              height: '38px',
              cursor: testing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              backgroundColor: 'var(--accent-cyan)',
              color: '#090c10',
              flexShrink: 0
            }}
          >
            <Play size={13} fill="#090c10" />
            {testing ? 'TESTING...' : 'TEST'}
          </button>
        </div>

        {modelsError && (
          <div style={{
            fontSize: '12px',
            color: 'var(--accent-red)',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            marginTop: '2px'
          }}>
            <AlertCircle size={13} />
            {modelsError}
          </div>
        )}

        {/* 7b. Session Usage Dashboard */}
        <div style={{
          padding: '10px 14px',
          backgroundColor: 'rgba(0,0,0,0.35)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={13} color="var(--accent-cyan)" />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Session AI Usage:
            </span>
            {usage ? (
              <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#fff' }}>
                {usage.calls} calls · {usage.totalTokens.toLocaleString()} tokens · ~${usage.estimatedCostUSD.toFixed(4)}
              </span>
            ) : (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>—</span>
            )}
          </div>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            EST. COST (FLASH-TIER RATES)
          </span>
        </div>

        {/* 7. Inline Test Result */}
        {testResult && (
          <div style={{
            padding: '9px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)',
            marginTop: '4px',
            backgroundColor: testResult.ok ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 70, 85, 0.12)',
            border: `1px solid ${testResult.ok ? 'rgba(16, 185, 129, 0.35)' : 'rgba(255, 70, 85, 0.35)'}`,
            color: testResult.ok ? 'var(--accent-green)' : 'var(--accent-red)',
            wordBreak: 'break-word',
            lineHeight: 1.4
          }}>
            {testResult.message}
          </div>
        )}
      </div>
    </div>
  );
};
