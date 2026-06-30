import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#1e1e1e',
          color: '#f48771',
          fontFamily: 'Consolas, monospace',
          padding: 40,
          textAlign: 'center'
        }}>
          <h2 style={{ marginBottom: 16, color: '#fff' }}>应用加载失败</h2>
          <p style={{ marginBottom: 8, color: '#ccc' }}>{this.state.error?.message}</p>
          <pre style={{
            background: '#2d2d2d',
            padding: 16,
            borderRadius: 4,
            maxWidth: '80%',
            overflow: 'auto',
            fontSize: 12,
            color: '#999',
            textAlign: 'left'
          }}>
            {this.state.error?.stack}
          </pre>
          <button onClick={() => window.location.reload()} style={{
            marginTop: 20,
            padding: '8px 20px',
            background: '#0e639c',
            border: '1px solid #1177bb',
            color: 'white',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 14
          }}>
            重新加载
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

if (typeof window.electronAPI === 'undefined') {
  const root = document.getElementById('root')!;
  root.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#1e1e1e;color:#f48771;font-family:Consolas,monospace;padding:40px;text-align:center;">
      <h2 style="margin-bottom:16px;color:#fff;">Preload 脚本加载失败</h2>
      <p style="margin-bottom:8px;color:#ccc;">window.electronAPI 未定义，无法与主进程通信。</p>
      <p style="color:#999;font-size:13px;">请检查 preload.js 路径是否正确，或重新安装应用。</p>
      <p style="color:#666;font-size:12px;margin-top:20px;">__dirname 错误？preload路径配置错误？</p>
    </div>
  `;
} else {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}
