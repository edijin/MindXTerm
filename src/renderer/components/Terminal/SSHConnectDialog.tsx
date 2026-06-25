import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { SSHConfig } from '../../../shared/types';

const SSHConnectDialog: React.FC = () => {
  const sshDialogOpen = useAppStore(state => state.sshDialogOpen);
  const setSSHDialogOpen = useAppStore(state => state.setSSHDialogOpen);
  const addTerminal = useAppStore(state => state.addTerminal);

  const [config, setConfig] = useState<SSHConfig>({
    host: '',
    port: 22,
    username: '',
    password: ''
  });
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useKey, setUseKey] = useState(false);
  const [privateKey, setPrivateKey] = useState('');

  if (!sshDialogOpen) return null;

  const handleConnect = async () => {
    if (!config.host || !config.username) {
      setError('请填写主机地址和用户名');
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      const sshConfig = { ...config };
      if (useKey) {
        sshConfig.privateKey = privateKey;
        delete sshConfig.password;
      }

      const result = await window.electronAPI.createSSHTerminal(sshConfig);
      
      if (result.success && result.terminalId) {
        addTerminal(result.terminalId, 'ssh', `${config.username}@${config.host}`);
        setSSHDialogOpen(false);
        setConfig({ host: '', port: 22, username: '', password: '' });
        setPrivateKey('');
      } else {
        setError(result.error || '连接失败');
      }
    } catch (err: any) {
      setError(err.message || '连接失败');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <div className="dialog-header">
          <h3>SSH 连接</h3>
          <button className="close-btn" onClick={() => setSSHDialogOpen(false)}>×</button>
        </div>
        <div className="dialog-body">
          {error && (
            <div className="warning-box" style={{ background: '#4d1e1e', borderColor: '#8b3a3a' }}>
              <div className="title" style={{ color: '#f48771' }}>连接错误</div>
              <div className="content" style={{ color: '#e0a0a0' }}>{error}</div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label>主机地址 *</label>
              <input
                type="text"
                value={config.host}
                onChange={(e) => setConfig({ ...config, host: e.target.value })}
                placeholder="192.168.1.1 或 example.com"
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>端口</label>
              <input
                type="number"
                value={config.port}
                onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) || 22 })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>用户名 *</label>
            <input
              type="text"
              value={config.username}
              onChange={(e) => setConfig({ ...config, username: e.target.value })}
              placeholder="root"
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={useKey}
                onChange={(e) => setUseKey(e.target.checked)}
                style={{ width: 'auto' }}
              />
              使用私钥认证
            </label>
          </div>

          {!useKey ? (
            <div className="form-group">
              <label>密码</label>
              <input
                type="password"
                value={config.password || ''}
                onChange={(e) => setConfig({ ...config, password: e.target.value })}
                placeholder="输入密码"
              />
            </div>
          ) : (
            <div className="form-group">
              <label>私钥内容</label>
              <textarea
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
                rows={6}
                style={{ fontFamily: 'monospace', fontSize: 12 }}
              />
            </div>
          )}
        </div>
        <div className="dialog-footer">
          <button
            onClick={() => setSSHDialogOpen(false)}
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
            onClick={handleConnect}
            disabled={connecting}
            style={{
              padding: '8px 20px',
              background: connecting ? '#555' : '#0e639c',
              border: '1px solid #1177bb',
              color: 'white',
              borderRadius: 4,
              cursor: connecting ? 'not-allowed' : 'pointer'
            }}
          >
            {connecting ? '连接中...' : '连接'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SSHConnectDialog;
