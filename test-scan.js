const { execFile } = require('child_process')
const { promisify } = require('util')
const execFileAsync = promisify(execFile)

async function scan() {
  const dirName = 'ShadowTrackerExtra'
  const depth = 3

  const drive = 'C'
  const filter = dirName.replace(/'/g, "''")
  // 重定向 stderr 到 stdout，以便在 execFile 中捕获错误详情
  const script = `Get-ChildItem -LiteralPath '${drive}:\\' -Filter '${filter}' -Directory -Recurse -Depth ${depth} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName 2>&1`

  console.log(`[scan] Script: ${script}`)

  try {
    const { stdout, stderr } = await execFileAsync(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', script],
      { timeout: 300000, maxBuffer: 32 * 1024 * 1024 }
    )
    console.log(`[scan] stdout length: ${stdout.length}`)
    console.log(`[scan] stderr length: ${stderr.length}`)
    if (stdout.length < 2000) console.log(`[scan] stdout:\n${stdout}`)
    if (stderr.length) console.log(`[scan] stderr:\n${stderr}`)
  } catch (e) {
    console.error(`[scan] FAILED - ${e.message}`)
    console.error(`[scan] code=${e.code}, killed=${e.killed}`)
    if (e.stderr) console.error(`[scan] exception stderr:\n${e.stderr}`)
    if (e.stdout) console.error(`[scan] exception stdout:\n${e.stdout}`)
  }
}

scan()
