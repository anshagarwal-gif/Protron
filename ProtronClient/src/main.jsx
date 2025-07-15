import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AccessProvider } from './Context/AccessContext';
import { SessionProvider } from './Context/SessionContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SessionProvider>
    <AccessProvider>
    <App />
    </AccessProvider>
    </SessionProvider>
  </StrictMode>,
)
