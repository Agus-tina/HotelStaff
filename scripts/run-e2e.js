const { spawn } = require('child_process')
const http = require('http')
const path = require('path')

const root = process.cwd()
const frontendDir = path.join(root, 'frontend')
const baseURL = 'http://127.0.0.1:5173'

function waitForServer(url, timeoutMs = 120000) {
  const startedAt = Date.now()

  return new Promise((resolve, reject) => {
    function check() {
      const req = http.get(url, (res) => {
        res.resume()
        resolve()
      })

      req.on('error', () => {
        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error(`No se pudo iniciar Vite en ${url}`))
          return
        }
        setTimeout(check, 500)
      })

      req.setTimeout(2000, () => {
        req.destroy()
      })
    }

    check()
  })
}

function isServerRunning(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume()
      resolve(true)
    })

    req.on('error', () => resolve(false))
    req.setTimeout(1000, () => {
      req.destroy()
      resolve(false)
    })
  })
}

function stopProcessTree(child) {
  if (!child || !child.pid || child.exitCode !== null) return Promise.resolve()

  return new Promise((resolve) => {
    child.once('exit', () => resolve())
    child.kill('SIGTERM')
    setTimeout(resolve, 2000)
  })
}

async function main() {
  let vite = null
  const serverAlreadyRunning = await isServerRunning(baseURL)

  if (!serverAlreadyRunning) {
    vite = spawn(
      process.execPath,
      ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1'],
      {
        cwd: frontendDir,
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      },
    )

    vite.stdout.on('data', (data) => process.stdout.write(data))
    vite.stderr.on('data', (data) => process.stderr.write(data))
  }

  try {
    if (!serverAlreadyRunning) await waitForServer(baseURL)

    const playwright = spawn(
      process.execPath,
      ['node_modules/playwright/cli.js', 'test', ...process.argv.slice(2)],
      {
        cwd: root,
        stdio: 'inherit',
        env: { ...process.env, PW_SKIP_WEBSERVER: '1' },
        windowsHide: true,
      },
    )

    const exitCode = await new Promise((resolve) => {
      playwright.on('exit', (code) => resolve(code ?? 1))
      playwright.on('error', () => resolve(1))
    })

    process.exitCode = exitCode
  } finally {
    await stopProcessTree(vite)
  }
}

main().catch(async (error) => {
  console.error(error.message)
  process.exitCode = 1
})
