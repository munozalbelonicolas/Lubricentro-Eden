import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { TenantProvider } from './context/TenantContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy-client-id.apps.googleusercontent.com';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
      <TenantProvider>
        <AuthProvider>
          <CartProvider>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3500,
                style: {
                  background: '#222222',
                  color: '#F0F0F0',
                  border: '1px solid #333333',
                  borderRadius: '8px',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.9rem',
                },
                success: { iconTheme: { primary: '#22C55E', secondary: '#0D0D0D' } },
                error:   { iconTheme: { primary: '#EF4444', secondary: '#0D0D0D' } },
              }}
            />
          </CartProvider>
        </AuthProvider>
      </TenantProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
