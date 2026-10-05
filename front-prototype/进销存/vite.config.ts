import { createHash } from 'node:crypto'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

let annotationsCompiledForBuild = false

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

function compileAnnotationsPlugin(): Plugin {
  return {
    name: 'compile-annotations',
    apply: 'build',
    buildStart() {
      if (annotationsCompiledForBuild) return
      annotationsCompiledForBuild = true
      const workspace = path.resolve(import.meta.dirname, 'annotations/annotation.workspace.json')
      execSync(`python tools/annotation/compile_annotations.py "${workspace}" --check-sources`, {
        cwd: __dirname,
        stdio: 'inherit',
      })
      execSync(`python tools/annotation/compile_annotations.py "${workspace}"`, {
        cwd: __dirname,
        stdio: 'inherit',
      })
    },
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const query = `?v=${annotationKitAssetVersion()}`
        return html
          .replaceAll('annotation-kit/runtime.css', `annotation-kit/runtime.css${query}`)
          .replaceAll('annotation-kit/runtime.js', `annotation-kit/runtime.js${query}`)
      },
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), compileAnnotationsPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
