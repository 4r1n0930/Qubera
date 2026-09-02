import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export function PublicFooter() {
  return (
    <footer className="home-footer">
      <div className="home-footer-inner">
        <div>
          <div className="home-footer-brand">QUBERA</div>
          <p className="home-footer-desc">An AI-powered platform making quantum computing understandable, visual and truly interactive.</p>
        </div>
        <div className="home-footer-col">
          <h4>Platform</h4>
          <Link to="/">Home</Link>
          <Link to="/learn">Learn</Link>
          <Link to="/quantum-lab">Quantum Lab</Link>
          <Link to="/code-editor">Code Editor</Link>
          <Link to="/dashboard/challenges">Challenges</Link>
        </div>
        <div className="home-footer-col">
          <h4>Resources</h4>
          <a href="#">Documentation</a>
          <a href="#">API</a>
          <a href="#">SDK</a>
          <a href="#">Developer Resources</a>
        </div>
        <div className="home-footer-col">
          <h4>Company</h4>
          <Link to="/contact">About Us</Link>
          <Link to="/contact">Contact Us</Link>
          <a href="#">Careers</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>
        <div className="home-footer-news">
          <h4 style={{fontSize:'0.82rem', fontWeight:700, color:'#fff', margin:'0 0 8px'}}>Stay Updated</h4>
          <p>Subscribe to get updates on new features, quantum tutorials and challenges.</p>
          <form className="home-footer-input" onSubmit={e=>e.preventDefault()}>
            <input placeholder="Enter your email" aria-label="Email for updates" />
            <button type="submit" aria-label="Subscribe"><ArrowRight size={16}/></button>
          </form>
          <div className="home-footer-social">
            <a href="#" aria-label="Twitter">𝕏</a>
            <a href="#" aria-label="GitHub">◈</a>
            <a href="#" aria-label="LinkedIn">in</a>
            <a href="#" aria-label="YouTube">▶</a>
          </div>
        </div>
      </div>
      <div className="home-footer-bottom">
        <span>© 2025 Qubera. All rights reserved.</span>
        <span style={{display:'flex', gap:16}}><a href="#" style={{color:'inherit', textDecoration:'none'}}>Privacy</a><a href="#" style={{color:'inherit', textDecoration:'none'}}>Terms</a></span>
      </div>
    </footer>
  )
}
