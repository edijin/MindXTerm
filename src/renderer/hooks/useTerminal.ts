import { useEffect, useRef, useCallback } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';
import { useAppStore } from '../store/useAppStore';

interface UseTerminalOptions {
  terminalId: string;
  onCommandComplete?: (command: string, output: string) => void;
}

export function useTerminal({ terminalId, onCommandComplete }: UseTerminalOptions) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const commandBufferRef = useRef<string>('');
  const outputBufferRef = useRef<string>('');
  const isAISuggestionRef = useRef<boolean>(false);
  const promptEndRef = useRef<boolean>(true);

  const {
    appendOutput,
    setLastCommand,
    addCommandHistory,
    setAnalyzing,
    setAnalysis,
    showConfirmDialog
  } = useAppStore();

  const initTerminal = useCallback(() => {
    if (!terminalRef.current || xtermRef.current) return;

    const xterm = new Terminal({
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#d4d4d4',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#ffffff'
      },
      cursorBlink: true,
      allowProposedApi: true
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    xterm.loadAddon(fitAddon);
    xterm.loadAddon(webLinksAddon);

    xterm.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = xterm;
    fitAddonRef.current = fitAddon;

    xterm.onData((data) => {
      handleInput(data);
    });

    xterm.onKey(({ key, domEvent }) => {
      if (domEvent.ctrlKey && domEvent.key === 'l') {
        xterm.clear();
      }
    });

    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
      window.electronAPI.resizeTerminal(
        terminalId,
        xterm.cols,
        xterm.rows
      );
    });

    resizeObserver.observe(terminalRef.current);

    const unsubscribeData = window.electronAPI.onTerminalData(({ terminalId: tid, data }) => {
      if (tid === terminalId && xtermRef.current) {
        xtermRef.current.write(data);
        appendOutput(terminalId, data);
        outputBufferRef.current += data;
        
        checkCommandComplete(data);
      }
    });

    const unsubscribeExit = window.electronAPI.onTerminalExit((tid) => {
      if (tid === terminalId) {
        xterm.writeln('\r\n\x1b[31m[Terminal closed]\x1b[0m');
      }
    });

    return () => {
      unsubscribeData();
      unsubscribeExit();
      resizeObserver.disconnect();
      xterm.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
    };
  }, [terminalId, appendOutput]);

  const checkCommandComplete = useCallback((data: string) => {
    const promptPatterns = [
      /[#>$%]\s*$/,
      /(PS [A-Z]:.*>\s*)$/,
      /\]\$\s*$/,
      /\]#\s*$/,
      /~\$\s*$/
    ];

    if (promptPatterns.some(p => p.test(data.trimEnd())) && commandBufferRef.current.trim()) {
      const command = commandBufferRef.current.trim();
      const output = outputBufferRef.current;
      
      addCommandHistory(terminalId, command, output);
      
      if (onCommandComplete) {
        onCommandComplete(command, output);
      }
      
      commandBufferRef.current = '';
      outputBufferRef.current = '';
      promptEndRef.current = true;
    }
  }, [terminalId, addCommandHistory, onCommandComplete]);

  const handleInput = useCallback((data: string) => {
    if (!xtermRef.current) return;

    const xterm = xtermRef.current;

    if (data === '\r') {
      const command = commandBufferRef.current.trim();
      if (command) {
        setLastCommand(terminalId, command);
      }
      commandBufferRef.current = '';
      outputBufferRef.current = '';
      promptEndRef.current = false;
      isAISuggestionRef.current = false;
      window.electronAPI.writeToTerminal(terminalId, '\r');
      return;
    }

    if (data === '\u007f') {
      if (commandBufferRef.current.length > 0) {
        commandBufferRef.current = commandBufferRef.current.slice(0, -1);
        window.electronAPI.writeToTerminal(terminalId, '\b \b');
      }
      return;
    }

    if (data === '\u0003') {
      commandBufferRef.current = '';
      outputBufferRef.current = '';
      window.electronAPI.writeToTerminal(terminalId, data);
      return;
    }

    if (data.startsWith('\u001b')) {
      window.electronAPI.writeToTerminal(terminalId, data);
      return;
    }

    commandBufferRef.current += data;
    window.electronAPI.writeToTerminal(terminalId, data);
  }, [terminalId, setLastCommand]);

  const writeInput = useCallback((data: string, isAISuggestion: boolean = false) => {
    isAISuggestionRef.current = isAISuggestion;
    
    for (const char of data) {
      commandBufferRef.current += char;
    }
    window.electronAPI.writeToTerminal(terminalId, data);
  }, [terminalId]);

  const executeCommand = useCallback(async (command: string, isAISuggestion: boolean = false) => {
    if (isAISuggestion) {
      const isBlacklisted = await window.electronAPI.checkBlacklist(command);
      if (isBlacklisted) {
        showConfirmDialog(command, terminalId, () => {
          doExecuteCommand(command);
        });
        return;
      }
    }
    doExecuteCommand(command);
  }, [terminalId, showConfirmDialog]);

  const doExecuteCommand = useCallback((command: string) => {
    if (!xtermRef.current) return;
    
    setAnalysis(terminalId, null);
    xtermRef.current.write(command + '\r');
    commandBufferRef.current = '';
    outputBufferRef.current = '';
    promptEndRef.current = false;
    
    window.electronAPI.writeToTerminal(terminalId, command + '\r');
  }, [terminalId, setAnalysis]);

  const write = useCallback((data: string) => {
    if (xtermRef.current) {
      xtermRef.current.write(data);
    }
  }, []);

  const focus = useCallback(() => {
    if (xtermRef.current) {
      xtermRef.current.focus();
    }
  }, []);

  const fit = useCallback(() => {
    if (fitAddonRef.current && xtermRef.current) {
      fitAddonRef.current.fit();
      window.electronAPI.resizeTerminal(
        terminalId,
        xtermRef.current.cols,
        xtermRef.current.rows
      );
    }
  }, [terminalId]);

  const getSize = useCallback(() => {
    if (xtermRef.current) {
      return { cols: xtermRef.current.cols, rows: xtermRef.current.rows };
    }
    return { cols: 80, rows: 24 };
  }, []);

  useEffect(() => {
    const cleanup = initTerminal();
    return cleanup;
  }, [initTerminal]);

  return {
    terminalRef,
    xtermRef,
    write,
    focus,
    fit,
    writeInput,
    executeCommand,
    getSize
  };
}
