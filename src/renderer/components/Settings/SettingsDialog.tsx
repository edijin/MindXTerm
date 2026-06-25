import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { APIConfig, DEFAULT_CONFIG } from '../../../shared/types';

const SettingsDialog: React.FC = () => {
  const config = useAppStore(state => state.config);
  const setConfig = useAppStore(state => state.setConfig);
  const settingsOpen = useAppStore(state => state.settingsOpen);
  const setSettingsOpen = useAppStore(state => state.setSettingsOpen);

  const [apiConfig, setApiConfig] = useState<APIConfig>(DEFAULT_CONFIG.api);
  const [blacklistInput, setBlacklistInput] = useState('');
  const [blacklist, setBlacklist] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'api' | 'blacklist' | 'terminal'>('api');

  useEffect(() => {
    if (config) {
      setApiConfig(config.api);
      setBlacklist([...config.blacklist]);
    }
  }, [config]);

  if (!settingsOpen) return null;

  const handleSave = async () => {
    const newConfig = await window.electronAPI.setConfig({
      api: apiConfig,
      blacklist
    });
    setConfig(newConfig);
    setSettingsOpen(false);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await window.electronAPI.testAPI(apiConfig);
      setTestResult(result);
    } catch (error: any) {
      setTestResult({ success: false, message: error.message });
    } finally {
      setTesting(false);
    }
  };

  const addBlacklistItem = () => {
    const trimmed = blacklistInput.trim();
    if (trimmed && !blacklist.includes(trimmed)) {
      setBlacklist([...blacklist, trimmed]);
      setBlacklistInput('');
    }
  };

  const removeBlacklistItem = (cmd: string) => {
    setBlacklist(blacklist.filter(c => c !== cmd));
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog" style={{ minWidth: 550 }}>
        <div className="dialog-header">
          <h3>设置</h3>
          <button className="close-btn" onClick={() => setSettingsOpen(false)}>×</button>
        </div>
        <div className="dialog-body">
          <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid #3e3e3e' }}>
            {(['api', 'blacklist', 'terminal'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 16px',
                  background: activeTab === tab ? '#2d2d2d' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab ? '2px solid #0e639c' : '2px solid transparent',
                  color: activeTab === tab ? '#fff' : '#999',
                  cursor: 'pointer',
                  fontSize: 13
                }}
              >
                {tab === 'api' ? 'AI 模型' : tab === 'blacklist' ? '命令黑名单' : '终端设置'}
              </button>
            ))}
          </div>

          {activeTab === 'api' && (
            <>
              <div className="form-group">
                <label>API Base URL</label>
                <input
                  type="text"
                  value={apiConfig.baseURL}
                  onChange={(e) => setApiConfig({ ...apiConfig, baseURL: e.target.value })}
                  placeholder="https://api.openai.com/v1"
                />
                <div className="hint">支持 OpenAI 兼容 API 接口</div>
              </div>

              <div className="form-group">
                <label>API Key</label>
                <input
                  type="password"
                  value={apiConfig.apiKey}
                  onChange={(e) => setApiConfig({ ...apiConfig, apiKey: e.target.value })}
                  placeholder="sk-..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>模型名称</label>
                  <input
                    type="text"
                    value={apiConfig.model}
                    onChange={(e) => setApiConfig({ ...apiConfig, model: e.target.value })}
                    placeholder="gpt-4"
                  />
                </div>
                <div className="form-group">
                  <label>Temperature</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={apiConfig.temperature}
                    onChange={(e) => setApiConfig({ ...apiConfig, temperature: parseFloat(e.target.value) || 0.3 })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button
                  onClick={handleTest}
                  disabled={testing}
                  style={{
                    padding: '8px 16px',
                    background: testing ? '#555' : '#3c3c3c',
                    border: '1px solid #555',
                    color: '#ccc',
                    borderRadius: 4,
                    cursor: testing ? 'not-allowed' : 'pointer',
                    fontSize: 13
                  }}
                >
                  {testing ? '测试中...' : '测试连接'}
                </button>
                {testResult && (
                  <span style={{
                    alignSelf: 'center',
                    fontSize: 13,
                    color: testResult.success ? '#4ec9b0' : '#f48771'
                  }}>
                    {testResult.message}
                  </span>
                )}
              </div>
            </>
          )}

          {activeTab === 'blacklist' && (
            <>
              <div className="form-group">
                <label>添加黑名单命令</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={blacklistInput}
                    onChange={(e) => setBlacklistInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addBlacklistItem()}
                    placeholder="输入危险命令，如: rm -rf /"
                    style={{ flex: 1 }}
                  />
                  <button
                    onClick={addBlacklistItem}
                    style={{
                      padding: '8px 16px',
                      background: '#3c3c3c',
                      border: '1px solid #555',
                      color: '#ccc',
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                  >
                    添加
                  </button>
                </div>
                <div className="hint">
                  AI 建议执行这些命令时需要用户确认，用户手动输入的命令不受限制
                </div>
              </div>

              <div className="blacklist-tags">
                {blacklist.map((cmd, idx) => (
                  <span key={idx} className="blacklist-tag">
                    {cmd}
                    <span className="remove" onClick={() => removeBlacklistItem(cmd)}>×</span>
                  </span>
                ))}
                {blacklist.length === 0 && (
                  <span style={{ color: '#666', fontSize: 12 }}>暂无黑名单命令</span>
                )}
              </div>
            </>
          )}

          {activeTab === 'terminal' && (
            <>
              <div className="form-group">
                <label>字体大小</label>
                <input
                  type="number"
                  min={10}
                  max={24}
                  value={config?.terminal.fontSize || 14}
                  onChange={(e) => setConfig({ ...config!, terminal: { ...config!.terminal, fontSize: parseInt(e.target.value) || 14 } })}
                />
              </div>
              <div className="form-group">
                <label>字体系列</label>
                <input
                  type="text"
                  value={config?.terminal.fontFamily || ''}
                  onChange={(e) => setConfig({ ...config!, terminal: { ...config!.terminal, fontFamily: e.target.value } })}
                  placeholder="Consolas, 'Courier New', monospace"
                />
              </div>
            </>
          )}
        </div>
        <div className="dialog-footer">
          <button
            onClick={() => setSettingsOpen(false)}
            style={{
              padding: '8px 16px',
              background: '#3c3c3c',
              border: '1px solid #555',
              color: '#ccc',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '8px 20px',
              background: '#0e639c',
              border: '1px solid #1177bb',
              color: 'white',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsDialog;
