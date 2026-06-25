import React, { useEffect, useCallback } from 'react';
import { useTerminal } from '../../hooks/useTerminal';
import { useAppStore } from '../../store/useAppStore';
import SuggestionPanel from '../AI/SuggestionPanel';

interface XTermTerminalProps {
  terminalId: string;
  isActive: boolean;
}

const XTermTerminal: React.FC<XTermTerminalProps> = ({ terminalId, isActive }) => {
  const terminal = useAppStore(state => state.terminals.get(terminalId));
  const addCommandHistory = useAppStore(state => state.addCommandHistory);
  const setAnalyzing = useAppStore(state => state.setAnalyzing);
  const setAnalysis = useAppStore(state => state.setAnalysis);
  const setShowSuggestions = useAppStore(state => state.setShowSuggestions);

  const handleCommandComplete = useCallback(async (command: string, output: string) => {
    addCommandHistory(terminalId, command, '');
    
    if (!command || command.length === 0) return;
    
    setAnalyzing(terminalId, true);
    
    try {
      const history = useAppStore.getState().terminals.get(terminalId)?.history || [];
      const result = await window.electronAPI.analyzeWithAI({
        terminalId,
        command,
        output,
        history: history.slice(-10)
      });
      
      setAnalysis(terminalId, result);
    } catch (error: any) {
      setAnalysis(terminalId, {
        analysis: `分析失败: ${error.message}`,
        suggestions: [],
        isTaskComplete: false
      });
    } finally {
      setAnalyzing(terminalId, false);
    }
  }, [terminalId, addCommandHistory, setAnalyzing, setAnalysis]);

  const { terminalRef, focus, fit } = useTerminal({
    terminalId,
    onCommandComplete: handleCommandComplete
  });

  useEffect(() => {
    if (isActive) {
      setTimeout(() => {
        focus();
        fit();
      }, 100);
    }
  }, [isActive, focus, fit]);

  if (!terminal) return null;

  return (
    <div className="terminal-container">
      <div ref={terminalRef} style={{ width: '100%', height: '100%' }} />
      {terminal.isAnalyzing && (
        <div style={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: 'rgba(0,0,0,0.8)',
          padding: '6px 12px',
          borderRadius: 4,
          fontSize: 12,
          color: '#4ec9b0',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          zIndex: 50
        }}>
          <div className="spinner" style={{ width: 12, height: 12 }} />
          AI 分析中...
        </div>
      )}
      {terminal.showSuggestions && terminal.analysis && (
        <SuggestionPanel
          terminalId={terminalId}
          analysis={terminal.analysis}
          onClose={() => setShowSuggestions(terminalId, false)}
        />
      )}
    </div>
  );
};

export default XTermTerminal;
