import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import Sitemap from 'vite-plugin-sitemap';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    {
      name: 'copy-index-to-404',
      closeBundle() {
        if (fs.existsSync(path.resolve(__dirname, 'dist/index.html'))) {
          fs.copyFileSync(
            path.resolve(__dirname, 'dist/index.html'),
            path.resolve(__dirname, 'dist/404.html')
          );
        }
      }
    },
    Sitemap({
      hostname: 'https://munozalbelonicolas.github.io',
      exclude: ['/404'],
      dynamicRoutes: [
        '/lubricentro-eden/',
        '/lubricentro-eden/store',
        '/lubricentro-eden/login',
        '/lubricentro-eden/register',
        '/lubricentro-eden/workshop-agenda'
      ],
      robots: [{ userAgent: '*', allow: '/', disallow: '/dashboard' }]
    })
  ],

  // 🔴 CLAVE para GitHub Pages o Dominio Propio
  base: '/',

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          axios: ['axios'],
        },
      },
    },
  },
}));