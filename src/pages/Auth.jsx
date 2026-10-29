import { useState } from 'react'
import { sb } from '../supabase'

export default function Auth() {
  const [up, setUp] = useState(false)
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [msg, setMsg] = useState('')

  async function submit(e) {
    e.preventDefault()
    setMsg('')
    const c = { email: email.trim(), password: pw }
    const { data, error } = up ? await sb.auth.signUp(c) : await sb.auth.signInWithPassword(c)
    if (error) setMsg(up ? error.message : 'Email ou mot de passe incorrect.')
    else if (up && !data.session) setMsg('Compte créé. Confirmez votre email, puis connectez-vous.')
  }

  return (
    <div className="wrap">
      <section className="hero">
        <h1>Le basket burkinabè se retrouve ici.</h1>
        <p>Profils de joueurs, vidéos, tournois, clubs et opportunités : tout au même endroit.</p>
      </section>
      <form className="panel form" onSubmit={submit} style={{ maxWidth: 460 }}>
        <label className="full">Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="full">Mot de passe (8 caractères minimum)
          <input type="password" required minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} />
        </label>
        {msg && <p className="full note">{msg}</p>}
        <div className="full row">
          <button className="btn" type="submit">{up ? 'Créer mon compte' : 'Me connecter'}</button>
          <button className="btn g" type="button" onClick={() => setUp(!up)}>
            {up ? 'J’ai déjà un compte' : 'Créer un compte'}
          </button>
        </div>
      </form>
    </div>
  )
}
