import { useState } from 'react'
import { sb } from '../supabase'
import { Avatar, POSTES, Wait, safeUrl, useLoad, waLink } from '../lib.jsx'

export default function Joueurs({ user, go }) {
  const [list] = useLoad(() => sb.from('profiles').select('*').order('pseudo'))
  const [q, setQ] = useState('')
  const [poste, setPoste] = useState('')
  const [sansClub, setSansClub] = useState(false)
  if (!list) return <Wait />

  const rows = list.filter((p) =>
    (!poste || p.poste === poste) && (!sansClub || p.sans_club) &&
    `${p.pseudo} ${p.ville || ''} ${p.poste || ''}`.toLowerCase().includes(q.toLowerCase()))

  return (
    <>
      <h2>Joueurs et entraîneurs</h2>
      <div className="row">
        <input placeholder="Nom, ville, poste…" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 320 }} />
        <select value={poste} onChange={(e) => setPoste(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="">Tous les postes</option>
          {POSTES.map((p) => <option key={p}>{p}</option>)}
        </select>
        <label className="chk"><input type="checkbox" checked={sansClub} onChange={(e) => setSansClub(e.target.checked)} />Cherchent un club</label>
      </div>
      <div className="grid">
        {rows.map((p) => (
          <article className="card" key={p.id}>
            <Avatar p={p} />
            <h3>{p.pseudo}</h3>
            <small>{p.ville}</small>
            <div className="pills">
              <span className="pill">{p.role === 'entraineur' ? 'Entraîneur' : p.poste}</span>
              {p.taille && <span className="pill">{p.taille} cm</span>}
              {p.niveau && <span className="pill">{p.niveau}</span>}
              {p.sans_club && <span className="pill hot">Cherche un club</span>}
            </div>
            {p.palmares && <p>🏆 {p.palmares}</p>}
            {p.bio && <p>{p.bio}</p>}
            <div className="row">
              {p.id !== user.id && <button className="btn" onClick={() => go('messages', p.id)}>Message</button>}
              {waLink(p.whatsapp) && <a className="btn wa" target="_blank" rel="noreferrer" href={waLink(p.whatsapp, 'Bonjour, je vous contacte depuis Basket Connect.')}>WhatsApp</a>}
              {safeUrl(p.video_url) && <a className="btn g" target="_blank" rel="noreferrer" href={p.video_url}>Vidéo</a>}
            </div>
          </article>
        ))}
        {!rows.length && <p className="muted">Aucun résultat.</p>}
      </div>
    </>
  )
}
