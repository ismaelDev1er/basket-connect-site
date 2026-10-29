import { useState } from 'react'
import { sb } from '../supabase'
import { NIVEAUX, Wait, useLoad, waLink } from '../lib.jsx'

export default function Clubs({ user }) {
  const [clubs, loadClubs] = useLoad(() => sb.from('clubs').select('*').order('nom'))
  const [coachs] = useLoad(() => sb.from('profiles').select('id,pseudo,ville,niveau,whatsapp').eq('role', 'entraineur').order('pseudo'))
  const [edit, setEdit] = useState(false)
  if (!clubs || !coachs) return <Wait />
  const mine = clubs.find((c) => c.owner_id === user.id)

  async function save(e) {
    e.preventDefault()
    const v = Object.fromEntries(new FormData(e.target))
    const { error } = mine ? await sb.from('clubs').update(v).eq('id', mine.id) : await sb.from('clubs').insert(v)
    if (error) return alert('Enregistrement impossible : ' + error.message)
    setEdit(false); loadClubs()
  }

  return (
    <>
      <h2>Clubs</h2>
      <div className="grid">
        {clubs.map((c) => (
          <article className="card" key={c.id}>
            <h3>{c.nom}</h3>
            <small>{c.ville}</small>
            <div className="pills">
              {c.niveau && <span className="pill">{c.niveau}</span>}
              {c.verifie && <span className="pill hot">✔ Vérifié</span>}
            </div>
            {c.description && <p>{c.description}</p>}
            {waLink(c.whatsapp) && <a className="btn wa" target="_blank" rel="noreferrer" href={waLink(c.whatsapp, `Bonjour ${c.nom}, je vous contacte depuis Basket Connect.`)}>WhatsApp</a>}
          </article>
        ))}
        {!clubs.length && <p className="muted">Aucun club pour le moment.</p>}
      </div>

      <h3>{mine ? 'Mon club' : 'Vous dirigez un club ?'}</h3>
      {mine && !mine.verifie && <p className="note">Votre club est en attente de validation par l’administrateur.</p>}
      {!edit && <button className="btn g" onClick={() => setEdit(true)}>{mine ? 'Modifier mon club' : 'Créer mon club'}</button>}
      {edit && (
        <form className="panel form" onSubmit={save}>
          <label>Nom<input name="nom" required minLength={2} maxLength={60} defaultValue={mine?.nom} /></label>
          <label>Ville<input name="ville" maxLength={60} defaultValue={mine?.ville} /></label>
          <label>Niveau<select name="niveau" defaultValue={mine?.niveau}>{NIVEAUX.map((n) => <option key={n}>{n}</option>)}</select></label>
          <label>WhatsApp du club<input name="whatsapp" maxLength={20} placeholder="70 00 00 00" defaultValue={mine?.whatsapp} /></label>
          <label className="full">Présentation<textarea name="description" rows={3} maxLength={240} defaultValue={mine?.description} /></label>
          <div className="full row"><button className="btn" type="submit">Enregistrer</button><button className="btn g" type="button" onClick={() => setEdit(false)}>Annuler</button></div>
        </form>
      )}

      <h2>Entraîneurs</h2>
      <div className="grid">
        {coachs.map((c) => (
          <article className="card" key={c.id}>
            <h3>{c.pseudo}</h3><small>{c.ville}</small>
            <div className="pills">{c.niveau && <span className="pill">{c.niveau}</span>}</div>
            {waLink(c.whatsapp) && <a className="btn wa" target="_blank" rel="noreferrer" href={waLink(c.whatsapp, 'Bonjour coach, je vous contacte depuis Basket Connect.')}>WhatsApp</a>}
          </article>
        ))}
        {!coachs.length && <p className="muted">Aucun entraîneur inscrit. Choisissez « Entraîneur » dans votre profil.</p>}
      </div>
    </>
  )
}
