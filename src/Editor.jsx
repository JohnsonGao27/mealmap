import React, { useState } from 'react'
import Camera, { preparePhoto } from './Camera.jsx'

export default function Editor({ record, onSave, onCancel }) {
  const [form, setForm] = useState(record)
  const [camera, setCamera] = useState(false)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  function change(key, value) {
    setForm(current => ({ ...current, [key]: value }))
  }

  async function choosePhoto(event) {
    const file = event.target.files[0]
    event.target.value = ''
    if (!file) return
    setError('')
    setBusy('photo')
    try {
      change('photo', await preparePhoto(file))
    } catch {
      setError('The photo could not be opened.')
    } finally {
      setBusy('')
    }
  }

  function locate() {
    setError('')
    if (!navigator.geolocation) {
      setError('Location is unavailable in this browser.')
      return
    }
    setBusy('location')
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        change('location', { latitude, longitude })
        setBusy('')
      },
      () => {
        setError('Location is unavailable. Check the browser permission and try again.')
        setBusy('')
      },
      { timeout: 10000 },
    )
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    if (!form.restaurant.trim()) {
      setError('Enter a restaurant name.')
      return
    }
    setBusy('save')
    try {
      await onSave({
        ...form,
        restaurant: form.restaurant.trim(),
        dish: form.dish.trim(),
        review: form.review.trim(),
        rating: Number(form.rating),
        price: Number(form.price),
        updatedAt: Date.now(),
      })
    } catch {
      setError('The record could not be saved. Please try again.')
      setBusy('')
    }
  }

  return (
    <form className="editor panel" onSubmit={submit}>
      <div className="form-grid">
        <label>Restaurant<input required maxLength={100} value={form.restaurant} onChange={event => change('restaurant', event.target.value)} /></label>
        <label>Visit date<input type="date" required value={form.date} onChange={event => change('date', event.target.value)} /></label>
        <label>
          Rating
          <select value={form.rating} onChange={event => change('rating', event.target.value)}>
            {[5, 4, 3, 2, 1].map(value => <option key={value} value={value}>{value} / 5</option>)}
          </select>
        </label>
        <label>Spend per person (£)<input type="number" required min="0" max="10000" step="0.01" inputMode="decimal" value={form.price} onChange={event => change('price', event.target.value)} /></label>
        <label className="wide">Recommended dishes<input maxLength={200} value={form.dish} onChange={event => change('dish', event.target.value)} /></label>
        <label className="wide">Review<textarea rows={3} maxLength={1000} value={form.review} onChange={event => change('review', event.target.value)} /></label>
      </div>
      <div className="photo-tools">
        <label>Choose photo<input type="file" accept="image/*" disabled={Boolean(busy) || camera} onChange={choosePhoto} /></label>
        <div className="button-row">
          {!camera && <button type="button" className="button" disabled={Boolean(busy)} onClick={() => setCamera(true)}>Open camera</button>}
          {form.photo && <button type="button" className="button" disabled={Boolean(busy) || camera} onClick={() => change('photo', '')}>Remove photo</button>}
        </div>
        {camera && <Camera onClose={() => setCamera(false)} onPhoto={photo => { change('photo', photo); setCamera(false) }} />}
        {form.photo && <img className="photo-preview" src={form.photo} alt="Selected meal" />}
      </div>
      <div className="button-row">
        <button type="button" className="button" disabled={Boolean(busy) || camera} onClick={locate}>
          {busy === 'location' ? 'Finding location…' : 'Use current location'}
        </button>
        {form.location && <button type="button" className="button" disabled={Boolean(busy) || camera} onClick={() => change('location', null)}>Clear location</button>}
      </div>
      {form.location && <p className="record-meta">{form.location.latitude.toFixed(5)}, {form.location.longitude.toFixed(5)}</p>}
      {busy === 'photo' && <p role="status">Preparing photo…</p>}
      {error && <p className="notice" role="alert">{error}</p>}
      <div className="button-row">
        <button type="submit" className="button primary" disabled={Boolean(busy) || camera}>{busy === 'save' ? 'Saving…' : 'Save record'}</button>
        <button type="button" className="button" disabled={busy === 'save'} onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}
