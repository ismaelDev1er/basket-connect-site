import { useCallback, useEffect, useState } from 'react'
import { sb } from './supabase'
import { Wait } from './lib.jsx'
import Auth from './pages/Auth.jsx'
import Joueurs from './pages/Joueurs.jsx'
import Videos from './pages/Videos.jsx'
import Evenements from './pages/Evenements.jsx'
import Clubs from './pages/Clubs.jsx'
import Opportunites from './pages/Opportunites.jsx'
import Messages from './pages/Messages.jsx'
import Profil from './pages/Profil.jsx'

const PAGES = {
  joueurs: ['Joueurs', Joueurs],
  messages: ['Messages', Messages],
  videos: ['Vidéos', Videos],
  evenements: ['Événements', Evenements],
  clubs: ['Clubs', Clubs],
  opportunites: ['Opportunités', Opportunites],
  profil: ['Mon profil', Profil],
}

export default function App() {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)
  const [tab, setTab] = useState(location.hash.slice(1) || 'joueurs')
  const [peer, setPeer] = useState(null)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setReady(true) })
    const { data } = sb.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null))
    return () => data.subscription.unsubscribe()
  }, [])

  const refreshUnread = useCallback(async () => {
    if (!user) return
    const { count } = await sb.from('prives').select('id', { count: 'exact', head: true }).eq('to_id', user.id).eq('lu', false)
    setUnread(count || 0)
  }, [user])

  useEffect(() => {
    if (!user) return
    refreshUnread()
    const ch = sb.channel('unread').on('postgres_changes', { event: '*', schema: 'public', table: 'prives' }, refreshUnread).subscribe()
    const t = setInterval(refreshUnread, 15000)
    return () => { sb.removeChannel(ch); clearInterval(t) }
  }, [user, refreshUnread])

  if (!ready) return <div className="wrap"><Wait /></div>
  if (!user) return <Auth />

  const go = (t, p = null) => { setTab(t); setPeer(p); location.hash = t }
  const Page = (PAGES[tab] || PAGES.joueurs)[1]
  return (
    <div className="wrap">
      <header className="top">
        <div className="logo"><span className="ball" />Basket Connect</div>
        <nav>
          {Object.entries(PAGES).map(([k, [label]]) => (
            <button key={k} aria-current={tab === k} onClick={() => go(k)}>
              {label}{k === 'messages' && unread > 0 && <span className="bdg">{unread > 9 ? '9+' : unread}</span>}
            </button>
          ))}
          <button onClick={() => sb.auth.signOut()}>Déconnexion</button>
        </nav>
      </header>
      <main><Page user={user} go={go} peer={peer} setPeer={setPeer} refreshUnread={refreshUnread} /></main>
    </div>
  )
}
