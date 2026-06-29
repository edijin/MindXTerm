import React, { useState, useEffect } from 'react';
import Toolbar from './components/Layout/Toolbar';
import WindowManager from './components/Layout/WindowManager';
import StartupDialog from './components/Layout/StartupDialog';
import SettingsDialog from './components/Settings/SettingsDialog';
import SSHConnectDialog from './components/Terminal/SSHConnectDialog';
import CommandConfirmDialog from './components/AI/CommandConfirmDialog';
import { useAppStore } from './store/useAppStore';
import { DEFAULT_CONFIG } from '../shared/types';

const App: React.FC = () => {
  const setConfig = useAppStore(state => state.setConfig);
  const setStartupDialogOpen = useAppStore(state => state.setStartupDialogOpen);
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      try {
        const savedConfig = await window.electronAPI.getConfig();
        setConfig(savedConfig || DEFAULT_CONFIG);
      } catch (err) {
        setConfig(DEFAULT_CONFIG);
      }
      setConfigLoaded(true);
    };

    initApp();
  }, []);

  // 确保启动对话框在初始化完成后显示
  useEffect(() => {
    if (configLoaded) {
      setStartupDialogOpen(true);
    }
  }, [configLoaded, setStartupDialogOpen]);

  return (
    <div className="app">
      <Toolbar />
      <WindowManager />
      <StartupDialog />
      <SettingsDialog />
      <SSHConnectDialog />
      <CommandConfirmDialog />
    </div>
  );
};

export default App;
