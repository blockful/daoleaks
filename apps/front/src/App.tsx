import { useState } from 'react'
import './App.css'
import { fullFlow } from './lib/proof/fullflow'
import { useClient } from 'wagmi'
import { mainnet } from 'viem/chains'
import type { PublicClient } from 'viem'

function App() {
  const [age, setAge] = useState('')
  const [logs] = useState<string[]>([])
  const [proof] = useState<string>('')

  const viemClient = useClient({ chainId: mainnet.id })

  
  // const addLog = (content: string) => {
  //   setLogs(prev => [...prev, content])
  // }

  // const toHex = (buffer: Uint8Array): string => {
  //   return '0x' + Array.from(buffer)
  //     .map(b => b.toString(16).padStart(2, '0'))
  //     .join('')
  // }
    
  const handleSubmit = async () => {
    await fullFlow(viemClient as PublicClient);
  }

  return (
    <div className="container">
      <h1>Noir app</h1>
      <div className="input-area">
        <input
          type="number"
          placeholder="Enter age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
        />
        <button onClick={handleSubmit}>Submit Age</button>
      </div>
      <div className="outer">
        <div className="inner">
          <h2>Logs</h2>
          {logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>
        <div className="inner">
          <h2>Proof</h2>
          {proof && <div>{proof}</div>}
        </div>
      </div>
    </div>
  )
}

export default App
