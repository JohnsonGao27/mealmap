import React, { useEffect, useState } from 'react'
import Editor from './Editor.jsx'
import { deleteRecord, readRecords, saveRecord } from './storage.js'

const money = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' })

function emptyRecord() {
  const today = new Date()
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset())
  return {
    id: crypto.randomUUID(),
    restaurant: '',
    dish: '',
    date: today.toISOString().slice(0, 10),
    rating: 5,
    price: '',
    review: '',
    photo: '',
    location: null,
  }
}

function RecordMap({ records }) {
  const places = records.filter(record => record.location)
  const [selectedId, setSelectedId] = useState('')
  const selected = places.find(record => record.id === selectedId) || places[0]

  if (!selected) return <p className="empty">No records with a location yet.</p>

  const { latitude, longitude } = selected.location
  const bounds = [longitude - 0.015, latitude - 0.01, longitude + 0.015, latitude + 0.01]
  const mapUrl = new URL('https://www.openstreetmap.org/export/embed.html')
  mapUrl.search = new URLSearchParams({
    bbox: bounds.join(','),
    layer: 'mapnik',
    marker: [latitude, longitude].join(','),
  })

  return (
    <section className="panel map-panel">
      <label>
        Restaurant
        <select value={selected.id} onChange={event => setSelectedId(event.target.value)}>
          {places.map(record => (
            <option key={record.id} value={record.id}>{record.restaurant} · {record.date}</option>
          ))}
        </select>
      </label>
      <iframe className="map-frame" title={`Map of ${selected.restaurant}`} src={mapUrl.href} />
      <p className="record-meta">{latitude.toFixed(5)}, {longitude.toFixed(5)} · Map requires internet</p>
    </section>
  )
}

function RecordCard({ record, onEdit, onDelete }) {
  return (
    <article className="record panel">
      {record.photo && <img className="record-photo" src={record.photo} alt={`Meal at ${record.restaurant}`} />}
      <div className="record-body">
        <div className="record-heading">
          <h2>{record.restaurant}</h2>
          <time dateTime={record.date}>{record.date}</time>
        </div>
        <p className="record-meta">{record.rating}/5 · {money.format(record.price)} per person</p>
        {record.dish && <p><strong>Recommended:</strong> {record.dish}</p>}
        {record.review && <p>{record.review}</p>}
        <div className="button-row">
          <button className="button" onClick={() => onEdit(record)}>Edit</button>
          <button className="button" onClick={() => onDelete(record)}>Delete</button>
        </div>
      </div>
    </article>
  )
}

export default function App() {
  const [records, setRecords] = useState(null)
  const [editor, setEditor] = useState(null)
  const [view, setView] = useState('records')
  const [error, setError] = useState('')

  useEffect(() => {
    readRecords().then(setRecords).catch(() => setError('Records could not be loaded. Reload to try again.'))
  }, [])

  async function save(record) {
    await saveRecord(record)
    setRecords(current => [record, ...current.filter(item => item.id !== record.id)])
    setEditor(null)
  }

  async function remove(record) {
    if (!window.confirm(`Delete the record for ${record.restaurant}?`)) return
    setError('')
    try {
      await deleteRecord(record.id)
      setRecords(current => current.filter(item => item.id !== record.id))
    } catch {
      setError('The record could not be deleted. Please try again.')
    }
  }

  const ordered = [...(records || [])].sort(
    (a, b) => b.date.localeCompare(a.date) || b.updatedAt - a.updatedAt,
  )
  const title = editor ? (editor.updatedAt ? 'Edit record' : 'New record') : view === 'map' ? 'Map' : 'Food records'

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <div className="brand">MealMap</div>
          <nav className="navigation" aria-label="Main navigation">
            <button type="button" aria-current={view === 'records' ? 'page' : undefined} disabled={Boolean(editor)} onClick={() => setView('records')}>Records</button>
            <button type="button" aria-current={view === 'map' ? 'page' : undefined} disabled={Boolean(editor)} onClick={() => setView('map')}>Map</button>
          </nav>
        </div>
      </header>
      <main className="container">
        <div className="page-heading">
          <h1>{title}</h1>
          {!editor && view === 'records' && records && (
            <button className="button primary" onClick={() => { setError(''); setEditor(emptyRecord()) }}>New record</button>
          )}
        </div>
        {error && <p className="notice" role="alert">{error}</p>}
        {editor && <Editor key={editor.id} record={editor} onSave={save} onCancel={() => setEditor(null)} />}
        {!editor && records === null && !error && <p role="status">Loading records…</p>}
        {!editor && records && view === 'map' && <RecordMap records={ordered} />}
        {!editor && records && view === 'records' && (
          ordered.length ? (
            <section className="records" aria-label="Food records">
              {ordered.map(record => <RecordCard key={record.id} record={record} onEdit={setEditor} onDelete={remove} />)}
            </section>
          ) : <p className="empty">No records yet.</p>
        )}
      </main>
    </>
  )
}
