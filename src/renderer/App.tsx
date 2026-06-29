import React, { useEffect } from 'react';
import Toolbar from './components/Layout/Toolbar';
import WindowManager from './components/Layout/WindowManager';
import StartupDialog from './components/Layout/StartupDialog';
import SettingsDialog from './components/Settings/SettingsDialog';
import SSHConnectDialog from './components/Terminal/SSHConnectDialog';
import CommandConfirmDialog from './components/AI/CommandConfirmDialog';
import { useAppStore } from './store/useAppStore';
import { DEFAULT_CONFIG } from '../shared/types';

const App: React.FC = () => {
  const config = useAppStore(state => state.config);
  const setConfig = useAppStore(state => state.setConfig);

  useEffect(() => {
    const initApp = async () => {
      const savedConfig = await window.electronAPI.getConfig();
      setConfig(savedConfig || DEFAULT_CONFIG);
    };

    initApp();
  }, []);

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
