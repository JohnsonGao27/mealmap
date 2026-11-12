import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'

const publicFiles = ['manifest.webmanifest', 'icon-192.png', 'icon-512.png']

const offlineWorker = {
  name: 'offline-worker',
  apply: 'build',
  generateBundle: {
    order: 'post',
    handler(_, bundle) {
      const worker = readFileSync(new URL('./src/sw.js', import.meta.url), 'utf8')
      const hash = createHash('sha256').update(worker)
      const buildFiles = Object.keys(bundle).sort()

      for (const name of buildFiles) {
        const file = bundle[name]
        hash.update(name).update(file.type === 'chunk' ? file.code : file.source)
      }

      for (const name of publicFiles) {
        hash.update(name).update(readFileSync(new URL('./public/' + name, import.meta.url)))
      }

      hash.update(readFileSync(new URL('./index.html', import.meta.url)))
      const version = hash.digest('hex').slice(0, 16)
      const paths = [...new Set(['index.html', ...buildFiles, ...publicFiles])]
        .sort()
        .map((name) => '/' + name)

      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: worker
          .replace("'__BUILD_VERSION__'", JSON.stringify(version))
          .replace("'__SHELL_ASSETS__'", JSON.stringify(paths)),
      })
    },
  },
}

export default defineConfig({ plugins: [offlineWorker] })
