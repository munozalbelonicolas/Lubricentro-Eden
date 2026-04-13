import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          backgroundColor: '#0f172a',
          color: 'white',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '20px' }}>¡Ups! Algo salió mal.</h2>
          <p style={{ color: '#94a3b8', marginBottom: '30px' }}>
            Hubo un error inesperado al cargar esta sección.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Recargar Página
          </button>
          <pre style={{ 
            marginTop: '40px', 
            fontSize: '12px', 
            color: '#ef4444', 
            textAlign: 'left',
            padding: '20px',
            background: '#1e293b',
            borderRadius: '8px',
            maxWidth: '80%'
          }}>
            {this.state.error?.toString()}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
