import { useState } from 'react'
import { UltraHonkBackend } from '@aztec/bb.js'
import { Noir } from '@noir-lang/noir_js'
// @ts-ignore
import circuit from '../../circuits/target/circuit.json'
import './App.css'

function App() {
  const [age, setAge] = useState('')
  const [logs, setLogs] = useState<string[]>([])
  const [proof, setProof] = useState<string>('')

  const addLog = (content: string) => {
    setLogs(prev => [...prev, content])
  }

  const toHex = (buffer: Uint8Array): string => {
    return '0x' + Array.from(buffer)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }
    
  const handleSubmit = async () => {
    try {
      const noir = new Noir(circuit as any)
      const backend = new UltraHonkBackend(circuit.bytecode)
      
      addLog("Generating witness... ⏳")
      const { witness } = await noir.execute({ age: parseInt(age) })
      addLog("Generated witness... ✅")
      
      addLog("Generating proof... ⏳")
      const proofResult = await backend.generateProof(witness)
      addLog("Generated proof... ✅")

      setProof(toHex(proofResult.proof))
     
      addLog('Verifying proof... ⌛')
      const isValid = await backend.verifyProof(proofResult)
      addLog(`Proof is ${isValid ? "valid" : "invalid"}... ✅`)
    } catch (error) {
      console.error("Error", error)
      addLog("Oh 💔")
    }
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
