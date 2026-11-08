// Starts disposable Vite instances with actual VITE_API_BASE_URL values.
import { spawn } from 'node:child_process'
import { once } from 'node:events'
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const modes = [
  ['/delay/3000', 'delay'],
  ['/fail/500', 'fail'],
  ['/empty', 'empty'],
]
for (const [index, [base, state]] of modes.entries()) {
  const port = 5184 + index
  const url = `http://127.0.0.1:${port}/`
  const server = spawn(
    process.execPath,
    [
      'node_modules/vite/bin/vite.js',
      '--host',
      '127.0.0.1',
      '--port',
      String(port),
      '--strictPort',
    ],
    {
      env: { ...process.env, VITE_API_BASE_URL: base },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  )
  let logs = ''
  server.stdout.on('data', (chunk) => {
    logs += chunk
  })
  server.stderr.on('data', (chunk) => {
    logs += chunk
  })
  try {
    let ready = false
    for (let attempt = 0; attempt < 100; attempt++) {
      if (server.exitCode !== null) throw Error(logs)
      try {
        ready = (await fetch(url)).ok
      } catch {
        /* Server still starting. */
      }
      if (ready) break
      await pause(100)
    }
    if (!ready) throw Error(`Vite did not start: ${logs}`)
    const child = spawn(process.execPath, ['scripts/verify-browser.mjs'], {
      env: { ...process.env, APP_URL: url, API_STATE: state },
      stdio: 'inherit',
    })
    const [code] = await once(child, 'exit')
    if (code !== 0) throw Error(`Browser checks failed for ${base}`)
    console.log(`PASS actual VITE_API_BASE_URL=${base}`)
  } finally {
    if (server.exitCode === null) {
      server.kill('SIGTERM')
      await once(server, 'exit')
    }
  }
}
