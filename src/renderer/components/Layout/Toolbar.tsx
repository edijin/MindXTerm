import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';

const Toolbar: React.FC = () => {
  const setSettingsOpen = useAppStore(state => state.setSettingsOpen);
  const setSSHDialogOpen = useAppStore(state => state.setSSHDialogOpen);
  const addTerminal = useAppStore(state => state.addTerminal);
  const splitPane = useAppStore(state => state.splitPane);
  const paneLayout = useAppStore(state => state.paneLayout);
  const [version, setVersion] = useState('');

  useEffect(() => {
    setVersion(window.electronAPI.getVersion());
  }, []);

  const handleNewLocalTerminal = async () => {
    const result = await window.electronAPI.createLocalTerminal();
    if (result.success && result.terminalId) {
      addTerminal(result.terminalId, 'local', 'Local Terminal');
    }
  };

  const handleNewSSHTerminal = () => {
    setSSHDialogOpen(true);
  };

  return (
    <div className="toolbar">
      <span className="title">⬛ SmartTerminal{version && <span className="version">v{version}</span>}</span>
      
      <button onClick={handleNewLocalTerminal} title="新建本地终端">
        🖥️ 本地终端
      </button>
      
      <button onClick={handleNewSSHTerminal} title="新建SSH连接">
        🔌 SSH 连接
      </button>

      <div className="separator" />

      <button 
        onClick={splitPane} 
        disabled={paneLayout.length >= 4}
        title={paneLayout.length >= 4 ? '最多支持4个窗口' : '分屏'}
      >
        ➗ 分屏
      </button>

      <div className="spacer" style={{ flex: 1 }} />

      <button onClick={() => setSettingsOpen(true)} title="设置">
        ⚙️ 设置
      </button>
    </div>
  );
};

export default Toolbar;
