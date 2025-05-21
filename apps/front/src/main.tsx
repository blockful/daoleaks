import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

import { Web3Provider } from '@/lib/wagmi/web3-provider.tsx'
import App from './App.tsx'

import { Buffer } from 'buffer';
window.Buffer = Buffer;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Web3Provider>
        <App />
    </Web3Provider>
  </StrictMode>,
)
