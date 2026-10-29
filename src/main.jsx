import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

// Affiche l'erreur au lieu d'une page blanche
class Boom extends React.Component {
  state = { err: null }
  static getDerivedStateFromError(err) { return { err } }
  render() {
    if (this.state.err) {
      return (
        <div className="wrap"><div className="panel">
          <b>Une erreur est survenue.</b>
          <p className="muted">{String(this.state.err.message || this.state.err)}</p>
        </div></div>
      )
    }
    return this.props.children
  }
}
createRoot(document.getElementById('root')).render(<Boom><App /></Boom>)
