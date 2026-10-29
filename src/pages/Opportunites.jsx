import { useState } from 'react'
import { sb } from '../supabase'
import { Wait, safeUrl, useLoad } from '../lib.jsx'

const TYPES = ['Bourse', 'Camp', 'Académie', 'Détection', 'Autre']

export default function Opportunites({ user }) {
  const [list, load] = useLoad(() => sb.from('opportunites').select('*').order('created_at', { ascending: false }))
  const [type, setType] = useState('')
  const [open, setOpen] = useState(false)
  if (!list) return <Wait />

  async function add(e) {
    e.preventDefault()
    const v = Object.fromEntries(new FormData(e.target))
    v.date_limite = v.date_limite || null
    const { error } = await sb.from('opportunites').insert(v)
    if (error) return alert('Envoi impossible : ' + error.message)
    alert('Merci ! Votre annonce sera publiée après vérification.')
    setOpen(false); load()
  }

  const rows = list.filter((o) => !type || o.type === type)
  return (
    <>
      <h2>Opportunités</h2>
      <p className="muted">Bourses, camps, académies, détections. Chaque annonce est vérifiée avant publication pour éviter les arnaques.</p>
      <div className="row">
        <select value={type} onChange={(e) => setType(e.target.value)} style={{ maxWidth: 200 }}>
          <option value="">Tous les types</option>{TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <button className="btn" onClick={() => setOpen(!open)}>Proposer une opportunité</button>
      </div>
      {open && (
        <form className="panel form" onSubmit={add}>
          <label>Titre<input name="titre" required minLength={3} maxLength={100} /></label>
          <label>Type<select name="type">{TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
          <label>Organisme<input name="organisme" maxLength={100} /></label>
          <label>Pays<input name="pays" maxLength={60} /></label>
          <label>Lien officiel (https://…)<input name="lien" type="url" maxLength={300} /></label>
          <label>Date limite<input name="date_limite" type="date" /></label>
          <label className="full">Description<textarea name="description" rows={3} maxLength={1000} /></label>
          <div className="full"><button className="btn" type="submit">Envoyer pour vérification</button></div>
        </form>
      )}
      <div className="grid">
        {rows.map((o) => (
          <article className="card" key={o.id}>
            <div className="pills"><span className="pill hot">{o.type}</span>{!o.approuve && <span className="pill">En attente</span>}</div>
            <h3>{o.titre}</h3>
            <small>{[o.organisme, o.pays].filter(Boolean).join(', ')}</small>
            {o.date_limite && <p>Date limite : {new Date(o.date_limite).toLocaleDateString('fr')}</p>}
            {o.description && <p>{o.description}</p>}
            {safeUrl(o.lien) && <a className="btn g" href={o.lien} target="_blank" rel="noreferrer">Voir l’annonce</a>}
            {o.created_by === user.id && <button className="btn g" onClick={async () => { await sb.from('opportunites').delete().eq('id', o.id); load() }}>Supprimer</button>}
          </article>
        ))}
        {!rows.length && <p className="muted">Aucune opportunité pour le moment.</p>}
      </div>
    </>
  )
}
