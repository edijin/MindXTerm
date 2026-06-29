import React, { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';

const StartupDialog: React.FC = () => {
  const startupDialogOpen = useAppStore(state => state.startupDialogOpen);
  const setStartupDialogOpen = useAppStore(state => state.setStartupDialogOpen);
  const setSSHDialogOpen = useAppStore(state => state.setSSHDialogOpen);
  const addTerminal = useAppStore(state => state.addTerminal);

  useEffect(() => {
    if (!startupDialogOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setStartupDialogOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startupDialogOpen, setStartupDialogOpen]);

  if (!startupDialogOpen) return null;

  const handleLocalTerminal = async () => {
    const result = await window.electronAPI.createLocalTerminal();
    if (result.success && result.terminalId) {
      addTerminal(result.terminalId, 'local', 'Local Terminal');
    }
    setStartupDialogOpen(false);
  };

  const handleSSHConnect = () => {
    setStartupDialogOpen(false);
    setSSHDialogOpen(true);
  };

  return (
    <div className="dialog-overlay" style={{ zIndex: 2000 }}>
      <div className="dialog" style={{ minWidth: 420, maxWidth: 480 }}>
        <div className="dialog-header">
          <h3>选择连接方式</h3>
        </div>
        <div className="dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            onClick={handleLocalTerminal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '20px 16px',
              background: '#3c3c3c',
              border: '1px solid #555',
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#0e639c';
              e.currentTarget.style.background = '#37373d';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#555';
              e.currentTarget.style.background = '#3c3c3c';
            }}
          >
            <span style={{ fontSize: 32 }}>🖥️</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 4 }}>本地终端</div>
              <div style={{ fontSize: 12, color: '#999' }}>在本机打开终端窗口</div>
            </div>
          </div>

          <div
            onClick={handleSSHConnect}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '20px 16px',
              background: '#3c3c3c',
              border: '1px solid #555',
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#0e639c';
              e.currentTarget.style.background = '#37373d';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#555';
              e.currentTarget.style.background = '#3c3c3c';
            }}
          >
            <span style={{ fontSize: 32 }}>🔌</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 4 }}>SSH 连接</div>
              <div style={{ fontSize: 12, color: '#999' }}>连接到远程服务器（输入 IP、端口等）</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartupDialog;
