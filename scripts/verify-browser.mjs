// Run against a production preview and a separately launched, isolated Chrome CDP profile.
import { writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const appUrl = process.env.APP_URL ?? 'http://127.0.0.1:5173/'
const pages = await (
  await fetch(
    `${process.env.BROWSER_DEBUG_URL ?? 'http://127.0.0.1:9224'}/json/list`,
  )
).json()
const page = pages.find((item) => item.type === 'page')
if (!page) throw Error('Open a tab in the isolated test browser first.')
const ws = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((resolve) =>
  ws.addEventListener('open', resolve, { once: true }),
)
let sequence = 0
const waiting = new Map()
const errors = []
const scripts = []
const warnings = []
let catalogRequests = 0
let held = []
let intercept = false
ws.addEventListener('message', (event) => {
  const message = JSON.parse(event.data)
  if (message.id) {
    const pending = waiting.get(message.id)
    waiting.delete(message.id)
    if (pending) {
      if (message.error) pending.reject(Error(JSON.stringify(message.error)))
      else pending.resolve(message.result)
    }
  }
  if (
    message.method === 'Runtime.consoleAPICalled' &&
    message.params.type === 'warning'
  )
    warnings.push(
      message.params.args
        .map((item) => item.value ?? item.description)
        .join(' '),
    )
  if (
    message.method === 'Network.requestWillBeSent' &&
    message.params.request.url.endsWith('/api/products.json')
  )
    catalogRequests += 1
  if (message.method === 'Runtime.exceptionThrown')
    errors.push(message.params.exceptionDetails.text)
  if (
    message.method === 'Runtime.consoleAPICalled' &&
    message.params.type === 'error'
  )
    errors.push(
      message.params.args
        .map((item) => item.value ?? item.description)
        .join(' '),
    )
  if (
    message.method === 'Network.requestWillBeSent' &&
    message.params.type === 'Script'
  )
    scripts.push(message.params.request.url)
  if (message.method === 'Fetch.requestPaused') {
    if (intercept) held.push(message.params.requestId)
    else
      void send('Fetch.continueRequest', {
        requestId: message.params.requestId,
      })
  }
})
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence
    waiting.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params }))
  })
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  })
  if (result.exceptionDetails)
    throw Error(JSON.stringify(result.exceptionDetails))
  return result.result.value
}
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
async function waitFor(expression) {
  for (let n = 0; n < 160; n++) {
    if (await evaluate(`Boolean(${expression})`)) return
    await pause(50)
  }
  throw Error(`Timed out: ${expression}`)
}
function assert(value, label) {
  if (!value) throw Error(label)
  console.log(`PASS ${label}`)
}
async function click(selector) {
  await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`)
  await pause(100)
}
async function fill(selector, value) {
  await evaluate(
    `{const input = document.querySelector(${JSON.stringify(selector)}); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(value)}); input.dispatchEvent(new Event('input', {bubbles:true})); input.dispatchEvent(new Event('change', {bubbles:true}));}`,
  )
}
async function navigate(path, ready) {
  await send('Page.navigate', { url: new URL(path, appUrl).href })
  await waitFor(ready)
}
await send('Page.enable')
await send('Runtime.enable')
await send('Network.enable')
await send('Network.setCacheDisabled', { cacheDisabled: true })
await navigate('/community', `document.querySelector('#register')`)
// Runtime.enable can replay logs from an earlier development/HMR session.
errors.length = 0
warnings.length = 0
scripts.length = 0
const saved = await evaluate(`localStorage.getItem('shopboard-cart-v1')`)
try {
  await evaluate(`localStorage.removeItem('shopboard-cart-v1')`)
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  })
  if (process.env.API_STATE) {
    await verifyApiState(process.env.API_STATE)
  } else {
    await navigate(
      '/',
      `document.querySelector('#overview-value')?.textContent.includes('931')`,
    )
    assert(
      !scripts.some((url) => /CheckoutPage|checkout.*\.js/.test(url)),
      'checkout module is not requested on the overview',
    )
    await click('nav a[href="/products"]')
    await waitFor(
      `document.querySelectorAll('#catalog-grid article').length === 15`,
    )
    await fill('#search-products', 'no-such-item')
    await waitFor(
      `document.querySelector('main')?.textContent.includes('No products match')`,
    )
    await click('#reset-filters')
    await waitFor(
      `document.querySelectorAll('#catalog-grid article').length === 15`,
    )
    await click('article[data-product-id="1"] h3 button')
    await waitFor(
      `document.querySelector('main h1')?.textContent === 'Leather Tote Bag'`,
    )
    await click('input[aria-label="Black for Leather Tote Bag"]')
    await click('button[aria-label="Add Leather Tote Bag to cart"]')
    await waitFor(`document.querySelector('#cart-count')?.textContent === '1'`)
    await click('nav a[href="/community"]')
    await waitFor(`document.querySelector('#register')`)
    assert(
      await evaluate(
        `document.querySelector('#cart-count').textContent === '1'`,
      ),
      'one cart survives route navigation',
    )
    await evaluate('history.back()')
    await waitFor(
      `document.querySelector('main h1')?.textContent === 'Leather Tote Bag'`,
    )
    await evaluate('history.forward()')
    await waitFor(`document.querySelector('#register')`)
    assert(true, 'browser back and forward restore the routed pages')
    await navigate(
      '/cart',
      `document.querySelector('main')?.textContent.includes('Leather Tote Bag · Black')`,
    )
    assert(
      await evaluate(
        `document.querySelector('#cart-count').textContent === '1'`,
      ),
      'cart survives a full refresh',
    )
    await click('main a[href="/checkout"]')
    await waitFor(`document.querySelector('form[aria-label="Checkout"]')`)
    await click('form button[type="submit"]')
    await waitFor(`document.querySelector('#name-error')`)
    assert(
      await evaluate(
        `document.activeElement.id === 'name' && document.querySelector('#name').getAttribute('aria-describedby') === 'name-error'`,
      ),
      'checkout focuses and describes invalid fields',
    )
    for (const [id, value] of [
      ['name', 'Test Buyer'],
      ['email', 'test@example.com'],
      ['address', '123 Sample Street'],
      ['city', 'Istanbul'],
      ['postalCode', '34000'],
      ['country', 'Türkiye'],
    ])
      await fill(`#${id}`, value)
    for (const width of [375, 768, 1024, 1440]) {
      await send('Emulation.setDeviceMetricsOverride', {
        width,
        height: 900,
        deviceScaleFactor: 1,
        mobile: width < 600,
      })
      await pause(100)
      assert(
        await evaluate(
          `document.documentElement.scrollWidth <= innerWidth + 1`,
        ),
        `checkout has no horizontal overflow at ${width}px`,
      )
    }
    const screenshot = await send('Page.captureScreenshot', { format: 'png' })
    await writeFile(
      join(tmpdir(), 'shopboard-checkout.png'),
      Buffer.from(screenshot.data, 'base64'),
    )
    await click('form button[type="submit"]')
    await waitFor(
      `document.querySelector('main h1')?.textContent === 'Demo checkout complete'`,
    )
    assert(
      await evaluate(
        `!localStorage.getItem('shopboard-cart-v1').includes('Sample Street')`,
      ),
      'demo checkout never stores delivery information',
    )
    await navigate(
      '/products/missing',
      `document.querySelector('main h1')?.textContent === 'Product not found'`,
    )
    await navigate(
      '/missing',
      `document.querySelector('main h1')?.textContent.includes('404')`,
    )
    assert(
      await evaluate(`!!document.querySelector('nav')`),
      '404 keeps the shared layout',
    )
    // Suspend and fail only the catalog, proving that the surrounding shell survives.
    await send('Fetch.enable', {
      patterns: [
        { urlPattern: '*/api/products.json', requestStage: 'Request' },
      ],
    })
    intercept = true
    await send('Page.navigate', { url: new URL('/', appUrl).href })
    await waitFor(
      `document.querySelector('#hero') && document.querySelector('main [role="status"]')`,
    )
    assert(
      await evaluate(`!!document.querySelector('nav')`),
      'slow metrics do not block the overview or navigation',
    )
    while (!held.length) await pause(50)
    await send('Fetch.fulfillRequest', {
      requestId: held.shift(),
      responseCode: 503,
      body: '',
    })
    await waitFor(`document.querySelector('[role="alert"]')`)
    intercept = false
    await click('[role="alert"] button')
    await waitFor(
      `document.querySelector('#overview-value')?.textContent.includes('931')`,
    )
    assert(true, 'scoped Error Boundary retries a failed API request')
    // React intentionally logs caught boundary errors. Exclude that expected scenario.
    const unexpected = errors.filter(
      (error) =>
        !/503|ApiError|above error|Request failed|RetryBoundary|SectionBoundary/.test(
          error,
        ),
    )
    assert(
      unexpected.length === 0,
      `no unexpected runtime/React errors: ${unexpected.join('; ')}`,
    )
    console.log('Screenshot: ' + join(tmpdir(), 'shopboard-checkout.png'))
  }
  assert(warnings.length === 0, `no Console warnings: ${warnings.join('; ')}`)
} finally {
  intercept = false
  for (const requestId of held)
    await send('Fetch.continueRequest', { requestId }).catch(() => {})
  await send('Fetch.disable').catch(() => {})
  await evaluate(
    saved === null
      ? `localStorage.removeItem('shopboard-cart-v1')`
      : `localStorage.setItem('shopboard-cart-v1',${JSON.stringify(saved)})`,
  ).catch(() => {})
  ws.close()
}

async function verifyApiState(state) {
  await evaluate(`localStorage.setItem('shopboard-cart-v1', '{"1::Brown":2}')`)
  const started = Date.now()
  if (state === 'delay') {
    await navigate(
      '/',
      `document.querySelector('#hero') && document.querySelector('main [role="status"]')`,
    )
    assert(
      await evaluate(`!!document.querySelector('nav')`),
      'real 3000ms API delay leaves the shell and hero usable',
    )
    await waitFor(
      `document.querySelector('#overview-value')?.textContent.includes('931')`,
    )
    assert(
      Date.now() - started >= 2800,
      'loading fallback remains until the delayed API responds',
    )
    await waitFor(`document.querySelector('#cart-count')?.textContent === '2'`)
  } else if (state === 'fail') {
    await navigate('/', `document.querySelector('[role="alert"]')`)
    assert(
      await evaluate(
        `!!document.querySelector('#hero') && !!document.querySelector('nav')`,
      ),
      'HTTP 500 isolates the failed section',
    )
    const beforeRetry = catalogRequests
    await click('[role="alert"] button')
    for (
      let attempt = 0;
      attempt < 100 && catalogRequests <= beforeRetry;
      attempt++
    )
      await pause(50)
    assert(
      catalogRequests > beforeRetry,
      'Try again makes a new request against the failing base URL',
    )
    await waitFor(`document.querySelector('[role="alert"]')`)
  } else if (state === 'empty') {
    await navigate(
      '/products',
      `document.querySelector('main')?.textContent.includes('No products yet')`,
    )
    assert(
      await evaluate(
        `document.querySelectorAll('#catalog-grid article').length === 0 && !document.querySelector('main').textContent.includes('No products match')`,
      ),
      'empty API has distinct empty-catalog feedback',
    )
  } else throw Error(`Unknown API_STATE: ${state}`)
  assert(
    await evaluate(
      `localStorage.getItem('shopboard-cart-v1') === '{"1::Brown":2}'`,
    ),
    'test base URL preserves the saved cart',
  )
  await click('nav a[href="/community"]')
  await waitFor(`document.querySelector('#register')`)
  assert(true, 'community remains usable in this API state')
  const unexpected = errors.filter(
    (error) =>
      !/500|ApiError|above error|Request failed|RetryBoundary|SectionBoundary/.test(
        error,
      ),
  )
  assert(
    unexpected.length === 0,
    `no unexpected runtime errors in ${state}: ${unexpected.join('; ')}`,
  )
}
