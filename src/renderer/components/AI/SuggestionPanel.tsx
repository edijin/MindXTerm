import React, { useEffect } from 'react';
import { AIAnalysisResult, AISuggestion } from '../../../shared/types';
import { useAppStore } from '../../store/useAppStore';

interface SuggestionPanelProps {
  terminalId: string;
  analysis: AIAnalysisResult;
  onClose: () => void;
}

const SuggestionPanel: React.FC<SuggestionPanelProps> = ({ terminalId, analysis, onClose }) => {
  const terminals = useAppStore(state => state.terminals);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      
      if (e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1;
        if (index < analysis.suggestions.length) {
          handleSelectSuggestion(analysis.suggestions[index].command);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [analysis.suggestions, onClose]);

  const handleSelectSuggestion = (command: string) => {
    window.electronAPI.writeToTerminal(terminalId, command + '\r');
    onClose();
  };

  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case 'low': return '安全';
      case 'medium': return '中等风险';
      case 'high': return '高风险';
      default: return risk;
    }
  };

  return (
    <div className="suggestion-panel" onClick={(e) => e.stopPropagation()}>
      <div className="suggestion-header">
        <span className="title">
          🤖 AI 建议
          {analysis.isTaskComplete && ' ✓ 任务已完成'}
        </span>
        <button onClick={onClose}>关闭 (ESC)</button>
      </div>
      
      {analysis.analysis && (
        <div className="suggestion-analysis">
          {analysis.analysis}
        </div>
      )}

      <div className="suggestion-list">
        {analysis.suggestions.length === 0 ? (
          <div style={{ padding: 12, color: '#888', fontSize: 13 }}>
            没有可用的建议命令。
          </div>
        ) : (
          analysis.suggestions.map((suggestion: AISuggestion, index: number) => (
            <div
              key={suggestion.id}
              className="suggestion-item"
              onClick={() => handleSelectSuggestion(suggestion.command)}
            >
              <span className={`risk-badge risk-${suggestion.risk}`}>
                {getRiskLabel(suggestion.risk)}
              </span>
              <div className="content">
                <div className="command">{suggestion.command}</div>
                <div className="description">{suggestion.description}</div>
              </div>
              <span className="key-hint">按 {index + 1} 执行</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SuggestionPanel;
