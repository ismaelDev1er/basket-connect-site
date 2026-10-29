import { useState } from 'react'
import { sb } from '../supabase'
import { Wait, useLoad } from '../lib.jsx'

const KINDS = ['Tournoi', 'Match', 'Compétition', 'Détection', 'Autre']
const VIDE = { title: '', kind: 'Tournoi', organizer: '', location: '', event_date: '', description: '' }

export default function Evenements({ user }) {
  const [list, load] = useLoad(() => sb.from('basketball_events').select('*').order('event_date'))
  const [f, setF] = useState(VIDE)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  if (!list) return <Wait />

  async function add(e) {
    e.preventDefault()
    const { error } = await sb.from('basketball_events').insert({ ...f, event_date: new Date(f.event_date).toISOString(), created_by: user.id })
    if (error) return alert('Publication impossible : ' + error.message)
    setF(VIDE); load()
  }
  async function del(id) {
    if (confirm('Supprimer cet événement ?')) { await sb.from('basketball_events').delete().eq('id', id); load() }
  }

  const upcoming = list.filter((ev) => new Date(ev.event_date) >= Date.now() - 864e5)
  const fmt = (d) => new Date(d).toLocaleString('fr', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })

  return (
    <>
      <h2>Tournois et événements</h2>
      <div className="grid">
        {upcoming.map((ev) => (
          <article className="card" key={ev.id}>
            <span className="pill hot">{ev.kind}</span>
            <h3>{ev.title}</h3>
            <small>{fmt(ev.event_date)}<br />{ev.location} · {ev.organizer}</small>
            {ev.description && <p>{ev.description}</p>}
            <div className="row">
              <a className="btn wa" target="_blank" rel="noreferrer"
                href={`https://wa.me/?text=${encodeURIComponent(`${ev.title} : ${fmt(ev.event_date)}, ${ev.location}. Publié sur Basket Connect.`)}`}>Partager</a>
              {ev.created_by === user.id && <button className="btn g" onClick={() => del(ev.id)}>Supprimer</button>}
            </div>
          </article>
        ))}
        {!upcoming.length && <p className="muted">Aucun événement à venir. Publiez le premier ci-dessous.</p>}
      </div>
      <h3>Publier un événement</h3>
      <form className="panel form" onSubmit={add}>
        <label>Titre<input required maxLength={100} value={f.title} onChange={set('title')} /></label>
        <label>Type<select value={f.kind} onChange={set('kind')}>{KINDS.map((k) => <option key={k}>{k}</option>)}</select></label>
        <label>Organisateur<input required maxLength={100} value={f.organizer} onChange={set('organizer')} /></label>
        <label>Lieu<input required maxLength={120} value={f.location} onChange={set('location')} /></label>
        <label>Date et heure<input required type="datetime-local" value={f.event_date} onChange={set('event_date')} /></label>
        <label className="full">Détails (inscription, prix, contact…)<textarea rows={3} maxLength={1000} value={f.description} onChange={set('description')} /></label>
        <div className="full"><button className="btn" type="submit">Publier</button></div>
      </form>
    </>
  )
}
