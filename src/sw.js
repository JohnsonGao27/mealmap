const cachePrefix = 'mealmap-shell-'
const cacheName = cachePrefix + '__BUILD_VERSION__'
const shellAssets = '__SHELL_ASSETS__'
const assetPaths = new Set(shellAssets)

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName)
    await cache.addAll(shellAssets.map((url) => new Request(url, { cache: 'reload' })))
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys()
    await Promise.all(names
      .filter((name) => name.startsWith(cachePrefix) && name !== cacheName)
      .map((name) => caches.delete(name)))
    await self.clients.claim()
  })())
})

async function openPage(request) {
  try {
    const response = await fetch(request)
    if (response.ok) return response
  } catch {}

  const cache = await caches.open(cacheName)
  return (await cache.match('/index.html')) ?? Response.error()
}

async function openAsset(request, path) {
  const cache = await caches.open(cacheName)
  return (await cache.match(path)) ?? fetch(request)
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  if (request.mode === 'navigate' && (url.pathname === '/' || url.pathname === '/index.html')) {
    event.respondWith(openPage(request))
  } else if (assetPaths.has(url.pathname)) {
    event.respondWith(openAsset(request, url.pathname))
  }
})
