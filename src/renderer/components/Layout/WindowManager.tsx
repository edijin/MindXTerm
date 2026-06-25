import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import XTermTerminal from '../Terminal/XTermTerminal';

const WindowManager: React.FC = () => {
  const terminals = useAppStore(state => state.terminals);
  const paneLayout = useAppStore(state => state.paneLayout);
  const activeInPane = useAppStore(state => state.activeInPane);
  const activeTerminalId = useAppStore(state => state.activeTerminalId);
  const setActiveTerminal = useAppStore(state => state.setActiveTerminal);
  const removeTerminal = useAppStore(state => state.removeTerminal);
  const closePane = useAppStore(state => state.closePane);
  const setSSHDialogOpen = useAppStore(state => state.setSSHDialogOpen);
  const addTerminal = useAppStore(state => state.addTerminal);

  const [paneSizes, setPaneSizes] = useState<number[]>([]);
  const [resizing, setResizing] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startSizesRef = useRef<number[]>([]);

  useEffect(() => {
    if (paneSizes.length !== paneLayout.length) {
      const equalSize = 100 / paneLayout.length;
      setPaneSizes(Array(paneLayout.length).fill(equalSize));
    }
  }, [paneLayout.length, paneSizes.length]);

  const handleMouseDown = useCallback((index: number, e: React.MouseEvent) => {
    e.preventDefault();
    setResizing(index);
    startXRef.current = e.clientX;
    startSizesRef.current = [...paneSizes];
  }, [paneSizes]);

  useEffect(() => {
    if (resizing === null) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      const deltaX = e.clientX - startXRef.current;
      const deltaPercent = (deltaX / containerWidth) * 100;
      
      const newSizes = [...startSizesRef.current];
      const newSizeLeft = Math.max(15, Math.min(85, newSizes[resizing] + deltaPercent));
      const newSizeRight = Math.max(15, Math.min(85, newSizes[resizing + 1] - deltaPercent));
      
      newSizes[resizing] = newSizeLeft;
      newSizes[resizing + 1] = newSizeRight;
      
      setPaneSizes(newSizes);
    };

    const handleMouseUp = () => {
      setResizing(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing]);

  const handleNewLocalTerminal = async (paneIndex: number) => {
    const result = await window.electronAPI.createLocalTerminal();
    if (result.success && result.terminalId) {
      addTerminal(result.terminalId, 'local', 'Local Terminal');
      setActiveTerminal(result.terminalId, paneIndex);
    }
  };

  const handleCloseTerminal = (terminalId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.electronAPI.closeTerminal(terminalId);
    removeTerminal(terminalId);
  };

  const getTerminalTabs = () => {
    return Array.from(terminals.values());
  };

  return (
    <div className="layout-container" ref={containerRef}>
      {paneLayout.map((_, paneIndex) => {
        const activeId = activeInPane.get(paneIndex);
        const allTabs = getTerminalTabs();
        
        return (
          <React.Fragment key={paneIndex}>
            <div 
              className="terminal-pane"
              style={{ 
                flex: paneSizes[paneIndex] ? `0 0 ${paneSizes[paneIndex]}%` : 1,
                cursor: resizing !== null ? 'col-resize' : 'default'
              }}
              onClick={() => {
                if (activeId) setActiveTerminal(activeId, paneIndex);
              }}
            >
              <div className="pane-tabs">
                {allTabs.map((tab) => (
                  <div
                    key={tab.id}
                    className={`pane-tab ${activeId === tab.id ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTerminal(tab.id, paneIndex);
                    }}
                  >
                    <span className="tab-title">
                      {tab.type === 'ssh' ? '🔌' : '🖥️'} {tab.title}
                    </span>
                    <span 
                      className="tab-close"
                      onClick={(e) => handleCloseTerminal(tab.id, e)}
                    >
                      ×
                    </span>
                  </div>
                ))}
                {paneLayout.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closePane(paneIndex);
                    }}
                    style={{
                      marginLeft: 'auto',
                      padding: '0 8px',
                      background: 'transparent',
                      border: 'none',
                      color: '#999',
                      cursor: 'pointer',
                      fontSize: 14
                    }}
                    title="关闭此窗格"
                  >
                    ✕
                  </button>
                )}
              </div>
              
              {activeId ? (
                <XTermTerminal 
                  terminalId={activeId} 
                  isActive={activeTerminalId === activeId}
                />
              ) : (
                <div className="empty-state">
                  <div className="icon">⬛</div>
                  <div className="text">在当前窗口打开终端</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="primary"
                      onClick={() => handleNewLocalTerminal(paneIndex)}
                      style={{
                        padding: '8px 20px',
                        background: '#0e639c',
                        border: '1px solid #1177bb',
                        color: 'white',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 13
                      }}
                    >
                      🖥️ 新建本地终端
                    </button>
                    <button
                      onClick={() => setSSHDialogOpen(true)}
                      style={{
                        padding: '8px 20px',
                        background: '#3c3c3c',
                        border: '1px solid #555',
                        color: '#ccc',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 13
                      }}
                    >
                      🔌 SSH 连接
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {paneIndex < paneLayout.length - 1 && (
              <div
                className={`resizer ${resizing === paneIndex ? 'active' : ''}`}
                onMouseDown={(e) => handleMouseDown(paneIndex, e)}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default WindowManager;
