import React, { useEffect, useRef, useState } from 'react'

function jpeg(source, width, height) {
  if (!width || !height) throw new Error('Photo has no image data.')

  const scale = Math.min(1, 900 / Math.max(width, height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width * scale))
  canvas.height = Math.max(1, Math.round(height * scale))

  const context = canvas.getContext('2d')
  if (!context) throw new Error('Photo processing is unavailable.')

  context.fillStyle = '#fff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(source, 0, 0, canvas.width, canvas.height)
  const photo = canvas.toDataURL('image/jpeg', 0.82)
  if (!photo.startsWith('data:image/jpeg;base64,')) throw new Error('Photo could not be compressed.')
  return photo
}

export async function preparePhoto(file) {
  if (!file || (file.type && !file.type.startsWith('image/'))) throw new Error('Choose an image file.')

  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    await new Promise((resolve, reject) => {
      image.onload = resolve
      image.onerror = () => reject(new Error('Photo could not be opened.'))
      image.src = url
    })
    return jpeg(image, image.naturalWidth, image.naturalHeight)
  } finally {
    URL.revokeObjectURL(url)
  }
}

export default function Camera({ onPhoto, onClose }) {
  const preview = useRef(null)
  const stopCamera = useRef(() => {})
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const video = preview.current
    let active = true
    let stream

    function stop() {
      active = false
      stream?.getTracks().forEach(track => track.stop())
      stream = null
      if (video) video.srcObject = null
    }

    async function start() {
      try {
        const opened = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })
        if (!active) {
          opened.getTracks().forEach(track => track.stop())
          return
        }
        stream = opened
        video.srcObject = stream
        await video.play()
      } catch {
        if (!active) return
        stop()
        setReady(false)
        setError('Camera unavailable. Check the browser permission or choose a photo.')
      }
    }

    stopCamera.current = stop
    void start()
    return stop
  }, [])

  function takePhoto() {
    const video = preview.current
    let photo
    try {
      photo = jpeg(video, video.videoWidth, video.videoHeight)
    } catch {
      setError('The photo could not be taken. Try again.')
      return
    }
    stopCamera.current()
    onPhoto(photo)
  }

  function close() {
    stopCamera.current()
    onClose()
  }

  return (
    <section className="camera" aria-label="Camera">
      <video
        ref={preview}
        aria-label="Camera preview"
        autoPlay
        muted
        playsInline
        hidden={Boolean(error) && !ready}
        onLoadedData={() => setReady(true)}
      />
      {!ready && !error && <p role="status">Opening camera…</p>}
      {error && <p className="notice" role="alert">{error}</p>}
      <div className="button-row">
        <button type="button" className="button primary" disabled={!ready} onClick={takePhoto}>Take photo</button>
        <button type="button" className="button" onClick={close}>Close camera</button>
      </div>
    </section>
  )
}
