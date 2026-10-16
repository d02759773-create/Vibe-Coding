import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const annotationBundlePath = path.resolve(__dirname, 'public/annotation-kit/annotation.bundle.json')

function annotationKitAssetVersion(): string {
  let buildId = String(Date.now())
  try {
    const bundle = JSON.parse(readFileSync(annotationBundlePath, 'utf-8')) as { buildId?: string }
    if (bundle.buildId) buildId = bundle.buildId
  } catch {
    /* bundle not compiled yet */
  }
  try {
    const runtimePath = path.resolve(__dirname, 'public/annotation-kit/runtime.js')
    const runtimeHash = createHash('sha256').update(readFileSync(runtimePath)).digest('hex').slice(0, 8)
    return `${buildId}-${runtimeHash}`
  } catch {
    return buildId
  }
}

function annotationKitCacheBustPlugin(): Plugin {
  return {
    name: 'annotation-kit-cache-bust',
    transformIndexHtml(html) {
      const query = `?v=${annotationKitAssetVersion()}`
      return html
        .replaceAll('annotation-kit/runtime.css', `annotation-kit/runtime.css${query}`)
        .replaceAll('annotation-kit/runtime.js', `annotation-kit/runtime.js${query}`)
        .replaceAll(
          'annotation-kit/annotation.bundle.inline.js',
          `annotation-kit/annotation.bundle.inline.js${query}`,
        )
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [react(), annotationKitCacheBustPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
