import { useCallback, useEffect, useState } from 'react'

export const POSTES = ['Meneur', 'Arrière', 'Ailier', 'Ailier fort', 'Pivot']
export const NIVEAUX = ['Loisir', 'Club', 'Régional', 'National']

// Charge des données : const [liste, recharger] = useLoad(() => sb.from('table').select('*'))
export function useLoad(fetcher) {
  const [data, setData] = useState(null)
  const load = useCallback(async () => {
    const { data, error } = await fetcher()
    if (error) console.error(error)
    setData(data || [])
  }, [])
  useEffect(() => { load() }, [load])
  return [data, load]
}

// N'accepte que les liens http(s) (évite les liens piégés)
export const safeUrl = (u) => (/^https?:\/\//i.test(u || '') ? u : null)

// Numéro à 8 chiffres => on ajoute l'indicatif du Burkina (226)
export const waLink = (n, text = '') => {
  let d = (n || '').replace(/\D/g, '')
  if (d.length === 8) d = '226' + d
  return d ? `https://wa.me/${d}${text ? '?text=' + encodeURIComponent(text) : ''}` : null
}

export const ytId = (u) => (u || '').match(/(?:youtu\.be\/|v=|shorts\/)([\w-]{11})/)?.[1]

export function Avatar({ p }) {
  const ok = /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(p?.photo || '')
  return <div className="av">{ok ? <img alt="" src={p.photo} /> : (p?.pseudo || '?')[0].toUpperCase()}</div>
}

export const Wait = () => <p className="muted">Chargement…</p>
