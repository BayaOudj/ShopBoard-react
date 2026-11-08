// Exercise the real hook and check chain in a disposable repository. Never commit user files.
import {
  mkdtemp,
  readFile,
  writeFile,
  mkdir,
  chmod,
  rm,
  appendFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = await mkdtemp(join(tmpdir(), 'shopboard-hook-check-'))
const checks = ['typecheck', 'lint', 'format:check', 'test', 'build']
const project = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
)
function git(args, allowFailure = false) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' })
  if (result.error) throw result.error
  if (!allowFailure && result.status !== 0) throw Error(result.stderr)
  return result
}
try {
  await mkdir(join(root, '.githooks'))
  await writeFile(
    join(root, '.githooks/pre-commit'),
    await readFile(new URL('../.githooks/pre-commit', import.meta.url)),
  )
  await chmod(join(root, '.githooks/pre-commit'), 0o755)
  await writeFile(
    join(root, 'gate.mjs'),
    `import { appendFileSync } from 'node:fs'; const check = process.argv[2]; appendFileSync('ran.log', check + '\\n'); process.exit(process.env.SHOPBOARD_FAIL_CHECK === check ? 1 : 0)\n`,
  )
  await writeFile(
    join(root, 'package.json'),
    JSON.stringify({
      private: true,
      scripts: {
        check: project.scripts.check,
        ...Object.fromEntries(
          checks.map((check) => [check, `node gate.mjs ${check}`]),
        ),
      },
    }),
  )
  git(['init', '--quiet'])
  git(['config', 'core.hooksPath', '.githooks'])
  for (const check of checks) {
    await writeFile(join(root, 'ran.log'), '')
    await appendFile(join(root, 'marker.txt'), `${check}\n`)
    git(['add', 'marker.txt'])
    const result = spawnSync(
      'git',
      [
        '-c',
        'user.name=Hook Test',
        '-c',
        'user.email=hook-test@example.invalid',
        'commit',
        '--quiet',
        '-m',
        `Reject ${check}`,
      ],
      {
        cwd: root,
        encoding: 'utf8',
        env: { ...process.env, SHOPBOARD_FAIL_CHECK: check },
      },
    )
    if (result.error) throw result.error
    const ran = (await readFile(join(root, 'ran.log'), 'utf8'))
      .trim()
      .split('\n')
    if (
      result.status === 0 ||
      ran.at(-1) !== check ||
      git(['rev-parse', '--verify', 'HEAD'], true).status === 0
    )
      throw Error(`Hook did not block ${check}: ${result.stderr}`)
    console.log(`PASS commit rejected when ${check} fails`)
  }
  await writeFile(join(root, 'ran.log'), '')
  git([
    '-c',
    'user.name=Hook Test',
    '-c',
    'user.email=hook-test@example.invalid',
    'commit',
    '--quiet',
    '-m',
    'Accept passing checks',
  ])
  const ran = (await readFile(join(root, 'ran.log'), 'utf8')).trim().split('\n')
  if (JSON.stringify(ran) !== JSON.stringify(checks))
    throw Error('Not all commit checks ran')
  console.log('PASS commit accepted only after every check passes')
} finally {
  await rm(root, { recursive: true, force: true })
}
