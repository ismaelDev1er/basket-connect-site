import { useCallback, useEffect, useRef, useState } from 'react'
import { sb } from '../supabase'
import { Avatar, Wait } from '../lib.jsx'

// Recharge les données quand la table change (temps réel) et toutes les 8 secondes (sécurité)
function useLive(table, load) {
  useEffect(() => {
    load()
    const ch = sb.channel('live-' + table).on('postgres_changes', { event: '*', schema: 'public', table }, () => load()).subscribe()
    const t = setInterval(load, 8000)
    return () => { sb.removeChannel(ch); clearInterval(t) }
  }, [])
}
const hhmm = (d) => new Date(d).toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' })

export default function Messages({ user, peer, setPeer, refreshUnread }) {
  const [mode, setMode] = useState(peer ? 'prive' : 'commun')
  return (
    <>
      <h2>Messages</h2>
      <div className="row">
        <button className={'btn' + (mode === 'commun' ? '' : ' g')} onClick={() => { setMode('commun'); setPeer(null) }}>Discussion commune</button>
        <button className={'btn' + (mode === 'prive' ? '' : ' g')} onClick={() => setMode('prive')}>Messages privés</button>
      </div>
      {mode === 'commun' ? <Commun user={user} /> : <Prives user={user} peer={peer} setPeer={setPeer} refreshUnread={refreshUnread} />}
    </>
  )
}

function Commun({ user }) {
  const [msgs, setMsgs] = useState(null)
  const [t, setT] = useState('')
  const box = useRef()
  const load = useCallback(async () => {
    const { data } = await sb.from('messages').select('id,user_id,text,created_at,profiles!messages_user_id_fkey(pseudo)').order('id', { ascending: false }).limit(100)
    setMsgs((data || []).reverse())
  }, [])
  useLive('messages', load)
  useEffect(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight }, [msgs?.length])
  if (!msgs) return <Wait />

  async function send(e) {
    e.preventDefault()
    const x = t.trim()
    if (!x) return
    setT('')
    const { error } = await sb.from('messages').insert({ text: x.slice(0, 500) })
    if (error) { alert(error.code === '23503' ? 'Créez d’abord votre profil (onglet Mon profil).' : 'Message non envoyé : ' + error.message); setT(x) } else load()
  }
  return (
    <>
      <div className="panel chat">
        <div className="msgs" ref={box}>
          {msgs.map((m) => {
            const me = m.user_id === user.id
            return (
              <div key={m.id} className={'mw' + (me ? ' me' : '')}>
                <div className={'m' + (me ? ' me' : '')}>
                  {!me && <b>{m.profiles?.pseudo || 'Joueur'}</b>}{m.text}<span>{hhmm(m.created_at)}</span>
                </div>
              </div>
            )
          })}
          {!msgs.length && <p className="muted">Aucun message. Lancez la discussion !</p>}
        </div>
        <form className="send" onSubmit={send}>
          <input maxLength={500} placeholder="Votre message…" value={t} onChange={(e) => setT(e.target.value)} />
          <button className="btn">Envoyer</button>
        </form>
      </div>
      <p className="note">Discussion ouverte à tous les membres. Restez respectueux.</p>
    </>
  )
}

function Prives({ user, peer, setPeer, refreshUnread }) {
  const [list, setList] = useState(null)
  const [profs, setProfs] = useState({})
  const [blocked, setBlocked] = useState(new Set())
  const [t, setT] = useState('')
  const box = useRef()
  const other = (m) => (m.from_id === user.id ? m.to_id : m.from_id)

  const load = useCallback(async () => {
    const [a, b, c] = await Promise.all([
      sb.from('prives').select('id,from_id,to_id,text,created_at,lu').order('id', { ascending: false }).limit(500),
      sb.from('profiles').select('id,pseudo,photo'),
      sb.from('blocages').select('bloque'),
    ])
    setList((a.data || []).reverse())
    setProfs(Object.fromEntries((b.data || []).map((p) => [p.id, p])))
    setBlocked(new Set((c.data || []).map((x) => x.bloque)))
  }, [])
  useLive('prives', load)

  useEffect(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight }, [list?.length, peer])
  useEffect(() => { // marque comme lus les messages de la conversation ouverte
    if (peer && list?.some((m) => m.from_id === peer && m.to_id === user.id && !m.lu)) {
      sb.from('prives').update({ lu: true }).eq('from_id', peer).eq('to_id', user.id).eq('lu', false).then(() => { load(); refreshUnread() })
    }
  }, [peer, list])
  if (!list) return <Wait />

  if (!peer) {
    const last = {}
    list.forEach((m) => { last[other(m)] = m })
    const ids = Object.keys(last).sort((a, b) => last[b].id - last[a].id)
    return (
      <div className="grid">
        {ids.map((id) => {
          const m = last[id], n = list.filter((x) => x.from_id === id && x.to_id === user.id && !x.lu).length
          return (
            <button key={id} className="card conv" onClick={() => setPeer(id)}>
              <Avatar p={profs[id]} />
              <div><h3>{profs[id]?.pseudo || 'Utilisateur'}{n > 0 && <span className="bdg">{n}</span>}</h3>
                <small>{m.from_id === user.id ? 'Vous : ' : ''}{m.text.slice(0, 60)}</small></div>
            </button>
          )
        })}
        {!ids.length && <p className="muted">Aucune conversation. Dans « Joueurs », cliquez sur « Message » pour écrire à quelqu’un.</p>}
      </div>
    )
  }

  const th = list.filter((m) => other(m) === peer)
  async function send(e) {
    e.preventDefault()
    const x = t.trim()
    if (!x) return
    setT('')
    const { error } = await sb.from('prives').insert({ to_id: peer, text: x.slice(0, 1000) })
    if (error) { alert('Message non envoyé : cette personne ne peut pas recevoir de message.'); setT(x) } else load()
  }
  async function toggleBlock() {
    const isB = blocked.has(peer)
    if (!isB && !confirm('Bloquer cette personne ? Elle ne pourra plus vous écrire.')) return
    const r = isB ? await sb.from('blocages').delete().eq('bloqueur', user.id).eq('bloque', peer) : await sb.from('blocages').insert({ bloque: peer })
    if (r.error) alert('Action impossible.')
    load()
  }
  return (
    <>
      <div className="row">
        <button className="btn g" onClick={() => setPeer(null)}>← Retour</button>
        <h3>{profs[peer]?.pseudo || 'Utilisateur'}</h3>
        <button className="btn g" onClick={toggleBlock}>{blocked.has(peer) ? 'Débloquer' : 'Bloquer'}</button>
      </div>
      <div className="panel chat">
        <div className="msgs" ref={box}>
          {th.map((m) => {
            const me = m.from_id === user.id
            return <div key={m.id} className={'mw' + (me ? ' me' : '')}><div className={'m' + (me ? ' me' : '')}>{m.text}<span>{hhmm(m.created_at)}</span></div></div>
          })}
          {!th.length && <p className="muted">Aucun message. Dites bonjour 👋</p>}
        </div>
        <form className="send" onSubmit={send}>
          <input maxLength={1000} placeholder="Votre message…" value={t} onChange={(e) => setT(e.target.value)} />
          <button className="btn">Envoyer</button>
        </form>
      </div>
      <p className="note">Conversation privée. Ne partagez ni adresse ni données sensibles. Les mineurs doivent être accompagnés d’un responsable.</p>
    </>
  )
}
