import { TorClient } from 'tor-js/standard'
import { browser } from '@web/constants/browserapi'

const TOR_STORAGE_KEY = 'torEnabled'
const SNOWFLAKE_URL = 'wss://snowflake.pse.dev/'
const KEEPALIVE_ALARM_NAME = 'tor-keepalive'

// Keep the original fetch before any patching
const originalFetch = globalThis.fetch.bind(globalThis)

class TorService {
  #client: TorClient | null = null

  #enabled = false

  #status: 'disconnected' | 'connecting' | 'connected' = 'disconnected'

  async init(): Promise<void> {
    try {
      const stored = await browser.storage.local.get(TOR_STORAGE_KEY)
      if (stored[TOR_STORAGE_KEY]) {
        await this.setEnabled(true)
      }
    } catch (e) {
      console.error('[TorService] Failed to load stored state:', e)
    }
  }

  get enabled(): boolean {
    return this.#enabled
  }

  get status(): string {
    return this.#status
  }

  async setEnabled(enabled: boolean): Promise<void> {
    this.#enabled = enabled

    try {
      await browser.storage.local.set({ [TOR_STORAGE_KEY]: enabled })
    } catch (e) {
      console.error('[TorService] Failed to persist state:', e)
    }

    if (enabled) {
      await this.#connect()
      // Register keep-alive alarm every 4 minutes to prevent service worker death
      browser.alarms?.create(KEEPALIVE_ALARM_NAME, { periodInMinutes: 4 })
    } else {
      this.#disconnect()
      browser.alarms?.clear(KEEPALIVE_ALARM_NAME)
    }
  }

  async #connect(): Promise<void> {
    if (this.#client) return

    this.#status = 'connecting'
    try {
      this.#client = new TorClient({
        snowflakeUrl: SNOWFLAKE_URL,
        connectionTimeout: 30000,
        circuitTimeout: 90000,
        circuitBuffer: 2
      })
      await this.#client.waitForCircuit()
      this.#status = 'connected'
      console.log('[TorService] Connected to Tor network')
    } catch (e) {
      console.error('[TorService] Failed to connect:', e)
      this.#status = 'disconnected'
      this.#client = null
    }
  }

  #disconnect(): void {
    if (this.#client) {
      try {
        this.#client.dispose()
      } catch (e) {
        // ignore disposal errors
      }
      this.#client = null
    }
    this.#status = 'disconnected'
  }

  async fetch(url: string, options?: RequestInit): Promise<Response> {
    if (!this.#enabled || !this.#client) {
      return originalFetch(url, options)
    }

    try {
      return await this.#client.fetch(url, options)
    } catch (e) {
      console.warn('[TorService] Tor fetch failed, falling back to direct:', e)
      return originalFetch(url, options)
    }
  }

  keepAlive(): void {
    // Simply accessing the client keeps the service worker alive
    if (this.#enabled && this.#status === 'disconnected') {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.#connect()
    }
  }

  getState(): { enabled: boolean; status: string } {
    return { enabled: this.#enabled, status: this.#status }
  }
}

const torService = new TorService()
export default torService
export { originalFetch }
