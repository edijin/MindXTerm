import { create } from 'zustand';
import { AppConfig, AIAnalysisResult, CommandHistory } from '../../shared/types';

interface TerminalTab {
  id: string;
  title: string;
  type: 'local' | 'ssh';
  history: CommandHistory[];
  currentOutput: string;
  lastCommand: string;
  isAnalyzing: boolean;
  analysis: AIAnalysisResult | null;
  showSuggestions: boolean;
}

interface AppState {
  terminals: Map<string, TerminalTab>;
  activeTerminalId: string | null;
  paneLayout: string[];
  activeInPane: Map<number, string | null>;
  config: AppConfig | null;
  settingsOpen: boolean;
  sshDialogOpen: boolean;
  confirmDialog: {
    open: boolean;
    command: string;
    terminalId: string;
    onConfirm: () => void;
  } | null;
  
  addTerminal: (id: string, type: 'local' | 'ssh', title: string) => void;
  removeTerminal: (id: string) => void;
  setActiveTerminal: (id: string | null, paneIndex?: number) => void;
  appendOutput: (terminalId: string, data: string) => void;
  setLastCommand: (terminalId: string, command: string) => void;
  addCommandHistory: (terminalId: string, command: string, output: string) => void;
  setAnalyzing: (terminalId: string, analyzing: boolean) => void;
  setAnalysis: (terminalId: string, analysis: AIAnalysisResult | null) => void;
  setShowSuggestions: (terminalId: string, show: boolean) => void;
  setConfig: (config: AppConfig) => void;
  setSettingsOpen: (open: boolean) => void;
  setSSHDialogOpen: (open: boolean) => void;
  showConfirmDialog: (command: string, terminalId: string, onConfirm: () => void) => void;
  closeConfirmDialog: () => void;
  splitPane: () => void;
  closePane: (paneIndex: number) => void;
  resetTerminalOutput: (terminalId: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  terminals: new Map(),
  activeTerminalId: null,
  paneLayout: ['pane-0'],
  activeInPane: new Map([[0, null]]),
  config: null,
  settingsOpen: false,
  sshDialogOpen: false,
  confirmDialog: null,

  addTerminal: (id, type, title) => set((state) => {
    const newTerminals = new Map(state.terminals);
    newTerminals.set(id, {
      id,
      title,
      type,
      history: [],
      currentOutput: '',
      lastCommand: '',
      isAnalyzing: false,
      analysis: null,
      showSuggestions: false
    });
    
    const newActiveInPane = new Map(state.activeInPane);
    if (state.paneLayout.length === 1 && newActiveInPane.get(0) === null) {
      newActiveInPane.set(0, id);
    }
    
    return {
      terminals: newTerminals,
      activeTerminalId: id,
      activeInPane: newActiveInPane
    };
  }),

  removeTerminal: (id) => set((state) => {
    const newTerminals = new Map(state.terminals);
    newTerminals.delete(id);
    
    const newActiveInPane = new Map(state.activeInPane);
    let newActiveId = state.activeTerminalId;
    
    for (const [paneIdx, termId] of newActiveInPane) {
      if (termId === id) {
        const remaining = Array.from(newTerminals.keys());
        const newId = remaining.length > 0 ? remaining[0] : null;
        newActiveInPane.set(paneIdx, newId);
        if (state.activeTerminalId === id) {
          newActiveId = newId;
        }
      }
    }
    
    return {
      terminals: newTerminals,
      activeTerminalId: newActiveId,
      activeInPane: newActiveInPane
    };
  }),

  setActiveTerminal: (id, paneIndex = 0) => set((state) => {
    const newActiveInPane = new Map(state.activeInPane);
    newActiveInPane.set(paneIndex, id);
    return {
      activeTerminalId: id,
      activeInPane: newActiveInPane
    };
  }),

  appendOutput: (terminalId, data) => set((state) => {
    const terminal = state.terminals.get(terminalId);
    if (!terminal) return state;
    
    const newTerminals = new Map(state.terminals);
    newTerminals.set(terminalId, {
      ...terminal,
      currentOutput: terminal.currentOutput + data
    });
    
    return { terminals: newTerminals };
  }),

  setLastCommand: (terminalId, command) => set((state) => {
    const terminal = state.terminals.get(terminalId);
    if (!terminal) return state;
    
    const newTerminals = new Map(state.terminals);
    newTerminals.set(terminalId, {
      ...terminal,
      lastCommand: command,
      currentOutput: ''
    });
    
    return { terminals: newTerminals };
  }),

  addCommandHistory: (terminalId, command, output) => set((state) => {
    const terminal = state.terminals.get(terminalId);
    if (!terminal) return state;
    
    const newHistory = [...terminal.history, {
      command,
      output,
      timestamp: Date.now()
    }].slice(-20);
    
    const newTerminals = new Map(state.terminals);
    newTerminals.set(terminalId, {
      ...terminal,
      history: newHistory
    });
    
    return { terminals: newTerminals };
  }),

  setAnalyzing: (terminalId, analyzing) => set((state) => {
    const terminal = state.terminals.get(terminalId);
    if (!terminal) return state;
    
    const newTerminals = new Map(state.terminals);
    newTerminals.set(terminalId, {
      ...terminal,
      isAnalyzing: analyzing
    });
    
    return { terminals: newTerminals };
  }),

  setAnalysis: (terminalId, analysis) => set((state) => {
    const terminal = state.terminals.get(terminalId);
    if (!terminal) return state;
    
    const newTerminals = new Map(state.terminals);
    newTerminals.set(terminalId, {
      ...terminal,
      analysis,
      showSuggestions: analysis !== null && analysis.suggestions.length > 0
    });
    
    return { terminals: newTerminals };
  }),

  setShowSuggestions: (terminalId, show) => set((state) => {
    const terminal = state.terminals.get(terminalId);
    if (!terminal) return state;
    
    const newTerminals = new Map(state.terminals);
    newTerminals.set(terminalId, {
      ...terminal,
      showSuggestions: show
    });
    
    return { terminals: newTerminals };
  }),

  setConfig: (config) => set({ config }),

  setSettingsOpen: (open) => set({ settingsOpen: open }),

  setSSHDialogOpen: (open) => set({ sshDialogOpen: open }),

  showConfirmDialog: (command, terminalId, onConfirm) => set({
    confirmDialog: { open: true, command, terminalId, onConfirm }
  }),

  closeConfirmDialog: () => set({ confirmDialog: null }),

  splitPane: () => set((state) => {
    if (state.paneLayout.length >= 4) return state;
    const newIndex = state.paneLayout.length;
    return {
      paneLayout: [...state.paneLayout, `pane-${newIndex}`],
      activeInPane: new Map(state.activeInPane).set(newIndex, null)
    };
  }),

  closePane: (paneIndex) => set((state) => {
    if (state.paneLayout.length <= 1) return state;
    const newLayout = state.paneLayout.filter((_, i) => i !== paneIndex);
    const newActiveInPane = new Map<number, string | null>();
    let newActiveId = state.activeTerminalId;
    let idx = 0;
    for (const [oldIdx, termId] of state.activeInPane) {
      if (oldIdx !== paneIndex) {
        newActiveInPane.set(idx, termId);
        idx++;
      } else if (termId === state.activeTerminalId) {
        const firstTerm = newActiveInPane.get(0);
        newActiveId = firstTerm || null;
      }
    }
    return {
      paneLayout: newLayout,
      activeInPane: newActiveInPane,
      activeTerminalId: newActiveId
    };
  }),

  resetTerminalOutput: (terminalId) => set((state) => {
    const terminal = state.terminals.get(terminalId);
    if (!terminal) return state;
    const newTerminals = new Map(state.terminals);
    newTerminals.set(terminalId, {
      ...terminal,
      currentOutput: ''
    });
    return { terminals: newTerminals };
  })
}));
