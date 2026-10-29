import { sb } from '../supabase'
import { Wait, safeUrl, useLoad, ytId } from '../lib.jsx'

// On affiche une miniature légère : la vidéo s'ouvre sur YouTube/TikTok/Facebook (économise les données mobiles)
export default function Videos() {
  const [list] = useLoad(() => sb.from('profiles').select('id,pseudo,poste,ville,video_url').not('video_url', 'is', null).order('pseudo'))
  if (!list) return <Wait />
  const rows = list.filter((p) => safeUrl(p.video_url))
  return (
    <>
      <h2>Highlights</h2>
      <p className="muted">Ajoutez le lien de votre meilleure vidéo dans « Mon profil ».</p>
      <div className="grid">
        {rows.map((p) => {
          const id = ytId(p.video_url)
          return (
            <a className="card vid" key={p.id} href={p.video_url} target="_blank" rel="noreferrer">
              <div className="thumb">{id ? <img loading="lazy" alt="" src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} /> : <span>▶</span>}</div>
              <h3>{p.pseudo}</h3>
              <small>{[p.poste, p.ville].filter(Boolean).join(', ')}</small>
            </a>
          )
        })}
        {!rows.length && <p className="muted">Aucune vidéo pour le moment. Soyez le premier !</p>}
      </div>
    </>
  )
}
