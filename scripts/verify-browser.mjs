// Requires Node from .nvmrc, a running app, and a separately launched Chromium CDP profile.
import { readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const appUrl = process.env.APP_URL ?? 'http://localhost:5181/'
const debugUrl = process.env.BROWSER_DEBUG_URL ?? 'http://127.0.0.1:9223'
const pages = await (await fetch(`${debugUrl}/json/list`)).json()
const page = pages.find(item => item.type === 'page')
if (!page) throw new Error('Open a page in the isolated debugging browser first.')
const ws = new WebSocket(page.webSocketDebuggerUrl)
await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }))
let sequence = 0
const waiting = new Map()
const errors = []
const consoleErrors = []
const requests = []
let failImage = false
let holdCatalog = false
let catalogPending = []
ws.addEventListener('message', event => {
  const message = JSON.parse(event.data)
  if (message.id) {
    const request = waiting.get(message.id)
    waiting.delete(message.id)
    if (request) {
      if (message.error) request.reject(message.error)
      else request.resolve(message.result)
    }
  }
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text)
  if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') consoleErrors.push(message.params.args.map(arg => arg.value ?? arg.description).join(' '))
  if (message.method === 'Network.requestWillBeSent' && message.params.type === 'Fetch') requests.push(message.params.request.url)
  if (message.method === 'Network.loadingFailed') catalogPending = catalogPending.filter(item => item.networkId !== message.params.requestId)
  if (message.method === 'Fetch.requestPaused') {
    if (holdCatalog && new URL(message.params.request.url).pathname.endsWith('/api/products.json')) {
      catalogPending.push({ id: message.params.requestId, networkId: message.params.networkId })
      return
    }
    const params = failImage
      ? { requestId: message.params.requestId, responseCode: 404, body: '' }
      : { requestId: message.params.requestId }
    void send(failImage ? 'Fetch.fulfillRequest' : 'Fetch.continueRequest', params).catch(error => errors.push(error.message))
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
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails))
  return result.result.value
}
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
function assert(value, label) { if (!value) throw new Error(label); console.log(`PASS ${label}`) }
async function waitFor(expression) {
  for (let index = 0; index < 120; index++) { if (await evaluate(expression)) return; await pause(50) }
  throw new Error(`Timed out: ${expression}`)
}
async function click(selector) {
  await evaluate(`{ const element = document.querySelector(${JSON.stringify(selector)}); if (!element) throw Error('Missing click target'); element.focus(); element.click(); }`)
  await pause(80)
}
async function fill(selector, value) {
  await evaluate(`{ const input = document.querySelector(${JSON.stringify(selector)}); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(value)}); input.dispatchEvent(new Event('input', { bubbles: true })); }`)
  await pause(80)
}
async function sort(value) {
  await evaluate(`{ const select = document.querySelector('#product-sort'); select.value = ${JSON.stringify(value)}; select.dispatchEvent(new Event('change', { bubbles: true })); }`)
  await pause(80)
}
async function key(key, code, virtual) {
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: virtual, ...(key === 'Enter' ? { text: '\r', unmodifiedText: '\r' } : {}) })
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: virtual })
  await pause(80)
}
async function catalogReply(body, status = 200) {
  for (let index = 0; index < 120; index++) {
    if (!catalogPending.length) { await pause(50); continue }
    const pending = catalogPending.shift()
    try {
      await send('Fetch.fulfillRequest', { requestId: pending.id, responseCode: status, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }], body: Buffer.from(typeof body === 'string' ? body : JSON.stringify(body)).toString('base64') })
      return
    } catch (error) { if (!/Invalid|not found|interception/i.test(error.message)) throw error }
  }
  throw new Error('No active catalog request to fulfill')
}
const catalogFixture = JSON.parse(await readFile(new URL('../public/api/products.json', import.meta.url), 'utf8'))
const card = '#catalog-grid article[data-product-id="1"]'
const brownQuantity = '#cart-dialog input[aria-label="Quantity for Leather Tote Bag, Brown"]'
const storageId = { securityOrigin: new URL(appUrl).origin, isLocalStorage: true }
await send('Runtime.enable')
await send('Page.enable')
await send('Network.enable')
await send('Network.setCacheDisabled', { cacheDisabled: true })
await send('DOMStorage.enable')
// Create an origin frame before inspecting storage, while preserving any previous cart.
await send('Page.navigate', { url: new URL('favicon.svg', appUrl).href })
await pause(200)
const stored = await send('DOMStorage.getDOMStorageItems', { storageId })
const originalCart = stored.entries.find(([name]) => name === 'shopboard-cart-v1')?.[1]
await send('DOMStorage.removeDOMStorageItem', { storageId, key: 'shopboard-cart-v1' })
try {
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false })
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] })
  await send('Page.navigate', { url: appUrl })
  await waitFor("document.querySelectorAll('#catalog-grid article').length === 15")
  assert(await evaluate("document.querySelector('#overview-value').textContent === '$931' && document.querySelectorAll('#overview-metrics article').length === 4"), 'original catalog and dashboard values render')
  assert(await evaluate("document.querySelectorAll('#insights-products tr').length === 15"), 'product table contains all listings')
  assert(await evaluate("getComputedStyle(document.body, '::before').animationName !== 'none' && getComputedStyle(document.querySelector('#overview-metrics article'), '::before').animationName !== 'none'"), 'ambient and card light animate')
  await pause(800)
  await writeFile(join(tmpdir(), 'shopboard-react-desktop.png'), Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64'))

  await click('#under-fifty')
  assert(await evaluate("document.querySelectorAll('#catalog-grid article').length === 8"), 'strict under-$50 filter preserves eight matching products')
  await click('#under-fifty')
  await sort('expensive')
  assert(await evaluate("document.querySelector('#catalog-grid article h3').textContent === 'Silver Watch'"), 'descending price sort works')
  await sort('original')
  assert(await evaluate("document.querySelector('#catalog-grid article h3').textContent === 'Everyday Tote'"), 'featured order is preserved')
  await fill('#search-products', 'TOTE')
  assert(await evaluate("document.querySelectorAll('#catalog-grid article').length === 2"), 'case-insensitive search works')
  await click('#category-filters [data-category="Shoes"]')
  assert(await evaluate("document.querySelector('#products h3').textContent === 'No products match these filters' && !document.querySelector('#catalog-grid')"), 'combined filters have a distinct no-match state')
  await click('#reset-filters')
  assert(await evaluate("document.querySelectorAll('#catalog-grid article').length === 15 && document.activeElement.dataset.category === 'All'"), 'clear filters restores products and keyboard focus')

  await click('#names-only')
  await sort('expensive')
  await click('#under-fifty')
  await fill('#search-products', 'tote')
  await click('#collection-grid [data-collection="slow-mornings"]')
  assert(await evaluate("document.querySelector('#product-names').children.length === 3 && document.querySelector('#names-only').checked && !document.querySelector('#under-fifty').checked && document.querySelector('#search-products').value === '' && document.querySelector('#product-sort').value === 'expensive'"), 'collection selection preserves view/sort and resets only the intended filters')
  assert(await evaluate("document.querySelector('#product-names li').textContent === 'Wool Scarf'"), 'collection contents and sort are correct')
  await click('#product-names li button')
  await waitFor("document.querySelector('#product-dialog').open")
  assert(await evaluate("document.querySelector('#detail-name').textContent === 'Wool Scarf'"), 'names-only view opens real details')
  await key('Escape', 'Escape', 27)
  assert(await evaluate("!document.querySelector('#product-dialog').open && document.activeElement.closest('#product-names') !== null"), 'Escape closes details and restores the triggering list button')
  await click('#reset-filters')
  assert(await evaluate("document.querySelector('#product-names').children.length === 15 && document.querySelector('#product-sort').value === 'expensive'"), 'reset preserves sorting and names-only mode')
  await click('#names-only')
  await sort('cheapest')

  await click(`${card} input[value="Black"]`)
  assert(await evaluate(`document.querySelector(${JSON.stringify(card + ' img')}).src.endsWith('/1-black.jpg')`), 'card color changes its actual preview image')
  await click(`${card} h3 button`)
  await waitFor("document.querySelector('#product-dialog').open")
  assert(await evaluate("document.activeElement.id === 'close-product' && document.querySelector('#detail-image').src.endsWith('/1-black.jpg')"), 'native detail dialog receives focus and the selected color')
  await click('#detail-actions input[value="Tan"]')
  assert(await evaluate(`document.querySelector('#detail-image').src.endsWith('/1-tan.jpg') && document.querySelector(${JSON.stringify(card + ' input[value="Tan"]')}).checked`), 'card and dialog color selections stay synchronized')
  for (let index = 0; index < 10; index++) await key('Tab', 'Tab', 9)
  assert(await evaluate("document.querySelector('#product-dialog').contains(document.activeElement)"), 'native modal traps keyboard focus')
  await evaluate("document.querySelector('#close-product').focus()")
  await key('/', 'Slash', 191)
  assert(await evaluate("document.activeElement.id !== 'search-products'"), 'search shortcut does not interrupt a modal')
  await click('#detail-actions button')
  await waitFor("document.querySelector('#cart-count').textContent === '1'")
  await click('#close-product')
  assert(await evaluate(`document.activeElement === document.querySelector(${JSON.stringify(card + ' h3 button')})`), 'details close restores card focus')
  await click(`${card} input[value="Brown"]`)
  await click(`${card} button[aria-label="Add Leather Tote Bag to cart"]`)
  await click(`${card} button[aria-label="Add Leather Tote Bag to cart"]`)
  await click('#open-cart')
  await waitFor("document.querySelector('#cart-dialog').open")
  assert(await evaluate("document.querySelectorAll('#cart-items li').length === 2 && document.querySelector('#cart-subtotal').textContent === '$267'"), 'cart keeps separate color lines and correct subtotal')
  await fill(brownQuantity, '3')
  assert(await evaluate("document.querySelector('#cart-count').textContent === '4' && document.querySelector('#cart-subtotal').textContent === '$356'"), 'quantity edits update the badge and total')
  for (const invalid of ['0', '1.5', '100']) {
    await fill(brownQuantity, invalid)
    assert(await evaluate(`document.querySelector(${JSON.stringify(brownQuantity)}).value === '3'`), `invalid quantity ${invalid} restores the previous value`)
  }
  await click('#review-order')
  assert(await evaluate("document.activeElement.id === 'review-title' && document.querySelector('#review-summary').textContent.includes('Subtotal $356')"), 'order review receives focus and describes the real cart')
  await fill(brownQuantity, '2')
  assert(await evaluate("!document.querySelector('#order-review')"), 'editing the cart invalidates the old order review')
  await click('#cart-dialog button[aria-label="Remove Leather Tote Bag, Tan, from cart"]')
  assert(await evaluate("document.activeElement.id === 'close-cart' && document.querySelector('#cart-subtotal').textContent === '$178'"), 'removing one color preserves the other and restores useful focus')
  await key('Escape', 'Escape', 27)
  assert(await evaluate("!document.querySelector('#cart-dialog').open && document.activeElement.id === 'open-cart'"), 'cart Escape restores header focus')
  await send('Page.reload')
  await waitFor("document.querySelector('#cart-count')?.textContent === '2' && document.querySelectorAll('#catalog-grid article').length === 15")
  assert(await evaluate("JSON.parse(localStorage.getItem('shopboard-cart-v1'))['1::Brown'] === 2"), 'cart persists across a full page reload')
  await click('#open-cart')
  await fill(brownQuantity, '99')
  await click('#close-cart')
  await click(`${card} button[aria-label="Add Leather Tote Bag to cart"]`)
  assert(await evaluate("document.querySelector('#cart-count').textContent === '99' && document.querySelector('#cart-status').textContent === 'Maximum quantity is 99 per product.'"), 'maximum quantity is enforced with visible feedback')
  await click('#open-cart')
  await click('#cart-dialog button[aria-label="Remove Leather Tote Bag, Brown, from cart"]')
  assert(await evaluate("document.querySelector('#review-order').disabled && document.querySelector('#cart-count').textContent === '0'"), 'empty cart disables review')
  await click('#close-cart')

  await evaluate("localStorage.setItem('shopboard-cart-v1', JSON.stringify({1:2,'1::Brown':3,'2::Sage':1,'1::Purple':8}))")
  await send('Page.reload')
  await waitFor("document.querySelector('#cart-count')?.textContent === '6'")
  assert(await evaluate("JSON.stringify(JSON.parse(localStorage.getItem('shopboard-cart-v1'))) === JSON.stringify({'1::Brown':5,'2::Sage':1})"), 'legacy cart migration preserves valid quantities without double counting')
  await evaluate("localStorage.setItem('shopboard-cart-v1','{broken')")
  await send('Page.reload')
  await waitFor("document.querySelectorAll('#catalog-grid article').length === 15")
  assert(await evaluate("document.querySelector('#cart-count').textContent === '0'"), 'malformed saved data does not break shopping')

  await evaluate("document.querySelector('header').focus();document.querySelector('#open-cart').focus()")
  await key('/', 'Slash', 191)
  assert(await evaluate("document.activeElement.id === 'search-products'"), 'slash shortcut focuses product search')
  await key('/', 'Slash', 191)
  assert(await evaluate("document.activeElement.id === 'search-products'"), 'shortcut does not steal focus from an input')
  await click('[aria-label="Workspace notifications"]')
  assert(await evaluate("!!document.querySelector(':popover-open')"), 'notifications popover works')
  await key('Escape', 'Escape', 27)
  assert(await evaluate("!document.querySelector(':popover-open')"), 'notification Escape works')

  const beforeRegistration = requests.length
  await click('#register-form button[type="submit"]')
  assert(await evaluate("document.querySelector('#register-status').textContent.includes('Demo form')"), 'invalid registration is blocked by native validation')
  await evaluate("document.querySelector('#name').focus()")
  await send('Input.insertText', { text: 'Test Visitor' })
  await evaluate("document.querySelector('#email').focus()")
  await send('Input.insertText', { text: 'test@example.com' })
  await evaluate("document.querySelector('#password').focus()")
  await send('Input.insertText', { text: 'short' })
  await click('#register-form button[type="submit"]')
  assert(await evaluate("document.querySelector('#password').validity.tooShort && document.querySelector('#register-status').textContent.includes('Demo form')"), 'native password minimum length is preserved')
  await evaluate("document.querySelector('#password').focus();document.querySelector('#password').select()")
  await send('Input.insertText', { text: 'sample-password' })
  await click('#register-form button[type="submit"]')
  assert(await evaluate("document.querySelector('#register-status').textContent.includes('Your details passed validation')"), 'valid registration reports demo success')
  assert(requests.length === beforeRegistration, 'registration creates no account request')
  assert(await evaluate("!localStorage.getItem('shopboard-cart-v1').includes('sample-password')"), 'passwords are never persisted in cart storage')

  holdCatalog = true
  await send('Fetch.enable', { patterns: [{ urlPattern: '*/api/products.json', requestStage: 'Response' }] })
  await evaluate("localStorage.setItem('shopboard-cart-v1',JSON.stringify({'1::Brown':2}))")
  await send('Page.reload')
  await waitFor("document.querySelector('#products')?.dataset.loadState === 'loading'")
  assert(await evaluate("document.querySelector('#open-cart').disabled && document.querySelector('#products').getAttribute('aria-busy') === 'true'"), 'pending catalog requests show loading and disable purchases')
  await catalogReply('Unavailable', 503)
  await waitFor("document.querySelector('#products').dataset.loadState === 'error'")
  assert(await evaluate("document.querySelector('#retry-products') && JSON.parse(localStorage.getItem('shopboard-cart-v1'))['1::Brown'] === 2"), 'HTTP failure offers retry and preserves the saved cart')
  await click('#retry-products')
  await catalogReply(catalogFixture)
  await waitFor("document.querySelectorAll('#catalog-grid article').length === 15")
  assert(await evaluate("document.querySelector('#cart-count').textContent === '2' && document.activeElement.dataset.category === 'All'"), 'successful retry restores cart and useful keyboard focus')
  await send('Page.reload')
  await catalogReply([])
  await waitFor("document.querySelector('#products').dataset.loadState === 'empty'")
  assert(await evaluate("document.querySelector('#products h3').textContent === 'No products yet' && !document.querySelector('#catalog-grid') && !document.querySelector('main').textContent.includes('NaN') && document.querySelector('#open-cart').disabled"), 'empty HTTP catalog has its own feedback and valid zero-data dashboard')
  assert(await evaluate("JSON.parse(localStorage.getItem('shopboard-cart-v1'))['1::Brown'] === 2"), 'empty HTTP catalog cannot erase a saved cart')
  await send('Page.reload')
  await catalogReply({ products: catalogFixture })
  await waitFor("document.querySelector('#products').dataset.loadState === 'error'")
  assert(true, 'invalid response shapes produce a recoverable error')
  await click('#retry-products')
  await catalogReply('{invalid json')
  await waitFor("document.querySelector('#products').dataset.loadState === 'error'")
  assert(true, 'malformed JSON produces a recoverable error')
  await click('#retry-products')
  await catalogReply(catalogFixture)
  await waitFor("document.querySelectorAll('#catalog-grid article').length === 15")
  assert(await evaluate("document.querySelectorAll('#category-filters button').length === 6 && document.querySelectorAll('#overview-metrics article').length === 4"), 'repeated retries do not duplicate controls or dashboard panels')
  await send('Page.reload')
  await catalogReply(catalogFixture.map(product => product.id === 1 ? { ...product, name: 'AnExceptionallyLongProductName'.repeat(8) } : product))
  await waitFor("document.querySelectorAll('#catalog-grid article').length === 15")
  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 900, deviceScaleFactor: 1, mobile: true })
  await pause(150)
  assert(await evaluate('document.documentElement.scrollWidth <= innerWidth'), 'long product names wrap without overflowing the mobile page')
  await click(`${card} h3 button`)
  await waitFor("document.querySelector('#product-dialog').open")
  assert(await evaluate("document.querySelector('#product-dialog').scrollWidth <= document.querySelector('#product-dialog').clientWidth"), 'long names also fit product details')
  await key('Escape', 'Escape', 27)
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false })
  holdCatalog = false
  await send('Fetch.disable')
  await evaluate("localStorage.setItem('shopboard-cart-v1','{}')")

  failImage = true
  await send('Fetch.enable', { patterns: [{ urlPattern: '*images/products/1-brown.jpg*', requestStage: 'Request' }] })
  await send('Page.reload')
  await waitFor("document.querySelectorAll('#catalog-grid article').length === 15")
  await evaluate(`document.querySelector(${JSON.stringify(card)}).scrollIntoView({behavior:'instant',block:'center'})`)
  await waitFor(`document.querySelector(${JSON.stringify(card)}).textContent.includes('Photo unavailable')`)
  assert(true, 'a missing photo has an accessible fallback without breaking the product')
  failImage = false
  await send('Fetch.disable')
  await send('Page.reload')
  await waitFor("document.querySelectorAll('#catalog-grid article').length === 15")
  for (const width of [375, 768, 1024, 1440]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 540 })
    await evaluate("scrollTo({top:0,behavior:'instant'})")
    await pause(150)
    assert(await evaluate('document.documentElement.scrollWidth <= innerWidth'), `no page overflow at ${width}px`)
    if (width === 375) {
      await writeFile(join(tmpdir(), 'shopboard-react-mobile.png'), Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64'))
      await click(`${card} h3 button`)
      await waitFor("document.querySelector('#product-dialog').open")
      assert(await evaluate("{ const rect = document.querySelector('#product-dialog').getBoundingClientRect(); rect.x >= 0 && rect.right <= innerWidth && rect.height <= innerHeight * .9 + 1 }"), 'product dialog fits the mobile viewport')
      await evaluate("document.querySelector('#product-dialog').scrollTop = document.querySelector('#product-dialog').scrollHeight")
      await key('Escape', 'Escape', 27)
      await click('#open-cart')
      await waitFor("document.querySelector('#cart-dialog').open")
      assert(await evaluate("{ const rect = document.querySelector('#cart-dialog').getBoundingClientRect(); rect.x >= 0 && rect.right <= innerWidth && rect.height <= innerHeight * .9 + 1 }"), 'cart dialog fits the mobile viewport')
      await key('Escape', 'Escape', 27)
    }
  }
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
  await pause(150)
  assert(await evaluate("getComputedStyle(document.body,'::before').animationName === 'none' && document.getAnimations().every(animation => animation.playState !== 'running')"), 'reduced motion stops all ongoing interface animations')
  assert(await evaluate("[...document.querySelectorAll('input')].every(input => input.labels.length > 0 || input.getAttribute('aria-label'))"), 'all inputs retain accessible labels')
  assert(requests.every(url => new URL(url).pathname.endsWith('/api/products.json')), 'application fetch requests stay within the catalog boundary')
  assert(errors.length === 0 && consoleErrors.length === 0, 'no runtime exceptions or React console errors')
} finally {
  await send('Fetch.disable')
  if (originalCart === undefined) await send('DOMStorage.removeDOMStorageItem', { storageId, key: 'shopboard-cart-v1' })
  else await send('DOMStorage.setDOMStorageItem', { storageId, key: 'shopboard-cart-v1', value: originalCart })
  await send('Page.navigate', { url: 'about:blank' })
  ws.close()
}
