import { Link } from 'react-router-dom'
import { BookOpen, Atom, FlaskConical, Cpu, Play, Wrench, AlertTriangle, Check } from 'lucide-react'
import { QuantumAtom } from '../../components/quantum/QuantumAtom'

export function Home() {
  return (
    <>
      {/* HERO */}
      <section className="home-hero">
        <div className="home-hero-left">
          <h1>
            <span>Quantum Computing,</span>
            <span>Made Interactive.</span>
          </h1>
          <p className="home-hero-sub">
            Learn quantum concepts, build circuits, run simulations, and understand complex algorithms with AI.
          </p>
          <div className="home-hero-actions">
            <Link to="/login" className="home-cta">Start Learning <span>→</span></Link>
            <Link to="/login" className="home-cta home-cta-outline">Explore Quantum Lab</Link>
          </div>
          <div className="home-features">
            <span className="home-feature"><span className="home-feature-dot"><Check size={12}/></span> Interactive Learning</span>
            <span className="home-feature"><span className="home-feature-dot"><Check size={12}/></span> AI-Powered Tutor</span>
            <span className="home-feature"><span className="home-feature-dot"><Check size={12}/></span> Real-time Simulation</span>
          </div>
        </div>

        <div className="home-hero-visual">
          <div className="home-atom-wrap">
            <QuantumAtom />
            <span className="home-ket-label home-ket-0">|0⟩</span>
            <span className="home-ket-label home-ket-1">|1⟩</span>
          </div>
          <div className="home-circuit-card">
            <div className="home-circuit-lines">
              <div className="home-qubit-row">
                <span className="home-qubit-label">q₀</span>
                <div className="home-circuit-track">
                  <span className="home-gate h">H</span>
                  <span style={{flex:1, height:1, background:'var(--color-ink)', opacity:0.2}}/>
                  <span className="home-cnot" />
                  <span style={{flex:1, height:1, background:'var(--color-ink)', opacity:0.2}}/>
                  <span className="home-measure">⟡</span>
                </div>
              </div>
              <div className="home-qubit-row">
                <span className="home-qubit-label">q₁</span>
                <div className="home-circuit-track">
                  <span className="home-gate x">X</span>
                  <span style={{flex:1, height:1, background:'var(--color-ink)', opacity:0.2}}/>
                  <span className="home-cnot" style={{background:'var(--color-ink)', color:'#fff'}}/>
                  <span style={{flex:1, height:1, background:'var(--color-ink)', opacity:0.2}}/>
                  <span className="home-measure">⟡</span>
                </div>
              </div>
            </div>
            <div className="home-prob">
              <div className="home-prob-title">Probabilities</div>
              <div className="home-prob-row"><span>|00⟩</span><b>49.8%</b></div>
              <div style={{height:6, background:'var(--color-sage-faint)', borderRadius:999, overflow:'hidden'}}><div style={{width:'49.8%', height:'100%', background:'var(--color-sage)'}}/></div>
              <div className="home-prob-row"><span>|11⟩</span><b>50.2%</b></div>
              <div style={{height:6, background:'var(--color-sage-faint)', borderRadius:999, overflow:'hidden'}}><div style={{width:'50.2%', height:'100%', background:'var(--color-forest)'}}/></div>
            </div>
          </div>
        </div>
      </section>

      {/* THEORY */}
      <section className="home-section">
        <div className="home-section-head">
          <h2>From theory to experimentation.</h2>
          <p className="home-section-sub">Learn it. Build it. Experiment with it.</p>
        </div>
        <div className="home-theory-grid">
          <div className="home-theory-card">
            <div className="home-theory-icon"><BookOpen size={22}/></div>
            <h3>LEARN</h3>
            <p>Understand qubits, superposition, gates, entanglement and more.</p>
            <span className="home-theory-arrow">→</span>
          </div>
          <div className="home-theory-card">
            <div className="home-theory-icon"><Cpu size={22}/></div>
            <h3>BUILD</h3>
            <p>Create quantum circuits using our intuitive drag-and-drop circuit builder.</p>
            <span className="home-theory-arrow">→</span>
          </div>
          <div className="home-theory-card">
            <div className="home-theory-icon"><FlaskConical size={22}/></div>
            <h3>EXPERIMENT</h3>
            <p>Run simulations on powerful backends and visualize quantum states and results.</p>
          </div>
        </div>
      </section>

      {/* QUANTUM LAB */}
      <section className="home-lab">
        <div>
          <div className="home-lab-label">QUANTUM LAB</div>
          <h2>Your quantum<br/>laboratory.</h2>
          <p className="home-lab-desc">Build circuits visually or write quantum code. Run them on powerful simulation backends and explore what happens.</p>
          <Link to="/login" className="home-cta" style={{marginTop:20}}>Open Quantum Lab <span>→</span></Link>
        </div>
        <div className="home-lab-workspace">
          <div className="home-lab-tabs">
            <span className="home-lab-tab active">Qiskit Aer</span>
            <span className="home-lab-tab">PennyLane</span>
            <span className="home-lab-tab">Cirq</span>
          </div>
          <div className="home-lab-toolbar">
            <span className="home-lab-gate">H</span>
            <span className="home-lab-gate">X</span>
            <span className="home-lab-gate">Y</span>
            <span className="home-lab-gate">Z</span>
            <span className="home-lab-gate">S</span>
            <span className="home-lab-gate">T</span>
            <span className="home-lab-gate">CNOT</span>
            <span className="home-lab-gate">SWAP</span>
          </div>
          <div className="home-lab-circuit">
            <div className="home-lab-qubit">
              <span className="home-qubit-label">q₀</span>
              <div className="home-lab-track">
                <span className="home-lab-gate active">H</span>
                <span style={{flex:1, height:1, background:'#0b3d32', opacity:0.2}}/>
                <span className="home-cnot" style={{borderColor:'#0b3d32'}}/>
                <span style={{flex:1, height:1, background:'#0b3d32', opacity:0.2}}/>
                <span className="home-measure">⟡</span>
              </div>
            </div>
            <div className="home-lab-qubit">
              <span className="home-qubit-label">q₁</span>
              <div className="home-lab-track">
                <span className="home-lab-gate" style={{background:'#f2ecdc', borderColor:'#e6d9b8', color:'#9a7b3f'}}>X</span>
                <span style={{flex:1, height:1, background:'#0b3d32', opacity:0.2}}/>
                <span className="home-cnot" style={{background:'#0b3d32', color:'#fff', borderColor:'#0b3d32'}}>⊕</span>
                <span style={{flex:1, height:1, background:'#0b3d32', opacity:0.2}}/>
                <span className="home-measure">⟡</span>
              </div>
            </div>
          </div>
          <div className="home-lab-footer">
            <span className="home-lab-select">Backend: Qiskit Aer ▾</span>
            <span className="home-lab-select">Shots: 1024 ▾</span>
            <button className="home-lab-run"><Play size={12} style={{display:'inline', marginRight:6, verticalAlign:'-1px'}}/>Run Circuit</button>
          </div>
          <div className="home-lab-code">
            <div style={{color:'#7fa08d', fontSize:'0.7rem', marginBottom:6}}>Code Editor • Qiskit</div>
            <div><span style={{color:'#9fc0a8'}}>from</span> qiskit <span style={{color:'#9fc0a8'}}>import</span> QuantumCircuit</div>
            <div>qc = QuantumCircuit(2,2)</div>
            <div>qc.h(0)</div>
            <div>qc.x(1)</div>
            <div>qc.cx(0,1)</div>
            <div>qc.measure([0,1],[0,1])</div>
          </div>
        </div>
      </section>

      {/* AI TUTOR */}
      <section className="home-tutor">
        <div>
          <div className="home-tutor-label">AI QUANTUM TUTOR</div>
          <h2>Your AI tutor,<br/>always by your side.</h2>
          <p className="home-tutor-desc">Ask questions, get explanations, generate code, debug circuits and optimize your quantum experiments.</p>
          <Link to="/login" className="home-cta" style={{marginTop:20}}>Try AI Tutor <span>→</span></Link>
        </div>
        <div className="home-tutor-preview">
          <div className="home-tutor-circuit">
            <div style={{fontSize:'0.75rem', fontWeight:700, color:'var(--color-ink)', marginBottom:8}}>Circuit • q₀ q₁</div>
            <div className="home-lab-track" style={{marginBottom:8}}>
              <span className="home-lab-gate" style={{background:'#fff6e5', borderColor:'#f0d9a8', color:'#a5761c'}}>X</span>
              <span style={{flex:1, height:1, background:'#0b3d32', opacity:0.2}}/>
              <span className="home-gate h">H</span>
              <span style={{flex:1, height:1, background:'#0b3d32', opacity:0.2}}/>
              <span className="home-measure">⟡</span>
            </div>
            <div className="home-tutor-issue"><AlertTriangle size={14}/> Possible issue detected</div>
          </div>
          <div className="home-tutor-card">
            <h4>QUBERA AI</h4>
            <p>I found a possible issue with your circuit.</p>
            <div className="home-tutor-suggest"><b>Suggested correction:</b><br/>Remove the X gate on q₀.</div>
            <div className="home-tutor-actions">
              <button className="home-tutor-btn primary"><Wrench size={12} style={{marginRight:4, verticalAlign:'-1px'}}/>Fix Circuit</button>
              <button className="home-tutor-btn ghost">Explain Why</button>
            </div>
            <div className="home-tutor-input"><Atom size={14}/> Ask anything about quantum...</div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="home-cta-section">
        <h2>Your quantum journey starts here.</h2>
        <p>Learn it. Build it. Experiment with it. Understand it.</p>
        <Link to="/login" className="home-cta" style={{marginTop:18}}>Get Started <span>→</span></Link>
      </section>
    </>
  )
}
