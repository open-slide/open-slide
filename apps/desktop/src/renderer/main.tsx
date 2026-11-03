import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app';
import './index.css';

// biome-ignore lint/style/noNonNullAssertion: #root is guaranteed by index.html
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
