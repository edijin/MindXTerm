import React from 'react';
import { useAppStore } from '../../store/useAppStore';

const CommandConfirmDialog: React.FC = () => {
  const confirmDialog = useAppStore(state => state.confirmDialog);
  const closeConfirmDialog = useAppStore(state => state.closeConfirmDialog);

  if (!confirmDialog || !confirmDialog.open) return null;

  const handleConfirm = () => {
    confirmDialog.onConfirm();
    closeConfirmDialog();
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog" style={{ maxWidth: 500 }}>
        <div className="dialog-header">
          <h3>⚠️ 危险命令确认</h3>
        </div>
        <div className="dialog-body">
          <div className="warning-box">
            <div className="title">此命令在黑名单中</div>
            <div className="content">
              AI 建议执行的命令包含在您配置的黑名单中，可能具有危险性，请确认是否继续执行：
            </div>
          </div>
          <div style={{
            background: '#1a1a1a',
            padding: 12,
            borderRadius: 4,
            fontFamily: 'Consolas, monospace',
            fontSize: 13,
            color: '#f48771',
            wordBreak: 'break-all'
          }}>
            {confirmDialog.command}
          </div>
        </div>
        <div className="dialog-footer">
          <button
            style={{
              padding: '8px 16px',
              background: '#3c3c3c',
              border: '1px solid #555',
              color: '#ccc',
              borderRadius: 4,
              cursor: 'pointer'
            }}
            onClick={closeConfirmDialog}
          >
            取消
          </button>
          <button
            style={{
              padding: '8px 16px',
              background: '#a1260d',
              border: '1px solid #c33',
              color: 'white',
              borderRadius: 4,
              cursor: 'pointer'
            }}
            onClick={handleConfirm}
          >
            确认执行
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommandConfirmDialog;
