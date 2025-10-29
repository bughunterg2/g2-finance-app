import React from 'react';
import ReactDOM from 'react-dom/client';
import AppRouter from './components/AppRouter';
import './styles/variables.css';
import './style.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>,
);
