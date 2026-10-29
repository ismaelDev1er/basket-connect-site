import { useState } from 'react'
import { sb } from '../supabase'
import { Avatar, NIVEAUX, POSTES, Wait, useLoad } from '../lib.jsx'

export default function Profil({ user, go }) {
  const [rows] = useLoad(() => sb.from('profiles').select('*').eq('id', user.id))
  const [busy, setBusy] = useState(false)
  if (!rows) return <Wait />
  const p = rows[0] || {}

  async function save(e) {
    e.preventDefault()
    const d = new FormData(e.target)
    const g = (k) => (d.get(k) || '').toString().trim()
    setBusy(true)
    // La photo n'est pas envoyée : elle reste celle de l'ancien site
    const { error } = await sb.from('profiles').upsert({
      id: user.id, pseudo: g('pseudo'), role: g('role'),
      poste: g('poste') || null, taille: +g('taille') || null, niveau: g('niveau'), ville: g('ville') || null,
      bio: g('bio') || null, whatsapp: g('whatsapp') || null, video_url: g('video_url') || null, palmares: g('palmares') || null,
      sans_club: d.has('sans_club'), visible: d.has('visible'),
    })
    setBusy(false)
    if (error) return alert('Enregistrement impossible : ' + error.message)
    go('joueurs')
  }

  return (
    <>
      <h2>Mon profil</h2>
      <form className="panel form" onSubmit={save}>
        <div className="full row"><Avatar p={p} /><small className="muted">Je suis</small>
          <select name="role" defaultValue={p.role || 'joueur'} style={{ maxWidth: 180 }}>
            <option value="joueur">Joueur / joueuse</option><option value="entraineur">Entraîneur</option>
          </select></div>
        <label>Pseudo<input name="pseudo" required maxLength={30} defaultValue={p.pseudo} /></label>
        <label>Poste<select name="poste" defaultValue={p.poste}>{POSTES.map((x) => <option key={x}>{x}</option>)}</select></label>
        <label>Taille (cm)<input name="taille" type="number" min={100} max={240} defaultValue={p.taille} /></label>
        <label>Niveau<select name="niveau" defaultValue={p.niveau}>{NIVEAUX.map((x) => <option key={x}>{x}</option>)}</select></label>
        <label>Ville<input name="ville" maxLength={60} defaultValue={p.ville} /></label>
        <label>WhatsApp (visible des membres connectés)<input name="whatsapp" maxLength={20} placeholder="70 00 00 00" defaultValue={p.whatsapp} /></label>
        <label className="full">Lien de ma vidéo (YouTube, TikTok, Facebook)<input name="video_url" type="url" maxLength={300} placeholder="https://…" defaultValue={p.video_url} /></label>
        <label className="full">Palmarès (titres, équipes, saisons)<textarea name="palmares" rows={2} maxLength={500} defaultValue={p.palmares} /></label>
        <label className="full">Présentation<textarea name="bio" rows={3} maxLength={240} defaultValue={p.bio} /></label>
        <label className="chk full"><input type="checkbox" name="sans_club" defaultChecked={p.sans_club} />Je recherche un club</label>
        <label className="chk full"><input type="checkbox" name="visible" defaultChecked={p.visible !== false} />Afficher mon profil aux autres membres</label>
        <div className="full"><button className="btn" disabled={busy}>Enregistrer</button></div>
      </form>
      <p className="note">Ne publiez ni adresse, ni pièce d’identité. Les mineurs doivent s’inscrire avec l’accord d’un responsable.</p>
    </>
  )
}
