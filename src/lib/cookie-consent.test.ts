import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  CONSENT_EXPIRY_DAYS,
  CONSENT_STORAGE_KEY,
  COOKIE_SETTINGS_EVENT,
  denyCookieConsent,
  grantCookieConsent,
  hasCookieConsentDecision,
  openCookieSettings,
} from './cookie-consent'

/**
 * Minimal in-memory localStorage stub. `throwOnAccess` simulates private
 * browsing / disabled cookies, where the Storage APIs throw a DOMException.
 */
function createStorageStub(options: { throwOnAccess?: boolean } = {}) {
  const store = new Map<string, string>()
  return {
    getItem(key: string): string | null {
      if (options.throwOnAccess) {
        throw new DOMException('blocked', 'SecurityError')
      }
      return store.has(key) ? (store.get(key) as string) : null
    },
    setItem(key: string, value: string): void {
      if (options.throwOnAccess) {
        throw new DOMException('blocked', 'SecurityError')
      }
      store.set(key, value)
    },
    removeItem(key: string): void {
      store.delete(key)
    },
    _raw: store,
  }
}

const DAY_MS = 1000 * 60 * 60 * 24

describe('cookie-consent', () => {
  let storage: ReturnType<typeof createStorageStub>
  let gtag: ReturnType<typeof vi.fn>
  let dataLayer: Record<string, unknown>[]
  let dispatched: Event[]

  beforeEach(() => {
    vi.useFakeTimers()
    storage = createStorageStub()
    gtag = vi.fn()
    dataLayer = []
    dispatched = []

    vi.stubGlobal('localStorage', storage)
    vi.stubGlobal('window', {
      gtag,
      dataLayer,
      dispatchEvent: (event: Event) => {
        dispatched.push(event)
        return true
      },
    })
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  describe('grantCookieConsent', () => {
    it('persists a granted decision with a timestamp', () => {
      grantCookieConsent()

      const stored = JSON.parse(storage._raw.get(CONSENT_STORAGE_KEY) as string)
      expect(stored.status).toBe('granted')
      expect(typeof stored.timestamp).toBe('number')
    })

    it('updates Consent Mode v2 with all signals granted and pushes the event', () => {
      grantCookieConsent()
      vi.runAllTimers()

      expect(gtag).toHaveBeenCalledWith('consent', 'update', {
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
        analytics_storage: 'granted',
      })
      expect(dataLayer).toContainEqual({
        event: 'cookie_consent_update',
        consent_status: 'granted',
      })
    })

    it('makes the decision valid indefinitely (no expiry)', () => {
      grantCookieConsent()
      // Granted timestamp is far in the past — still valid.
      const stored = JSON.parse(storage._raw.get(CONSENT_STORAGE_KEY) as string)
      stored.timestamp = Date.now() - 365 * DAY_MS
      storage._raw.set(CONSENT_STORAGE_KEY, JSON.stringify(stored))

      expect(hasCookieConsentDecision()).toBe(true)
    })
  })

  describe('denyCookieConsent', () => {
    it('persists a denied decision and sets all signals to denied', () => {
      denyCookieConsent()
      vi.runAllTimers()

      const stored = JSON.parse(storage._raw.get(CONSENT_STORAGE_KEY) as string)
      expect(stored.status).toBe('denied')
      expect(gtag).toHaveBeenCalledWith('consent', 'update', {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied',
      })
      expect(dataLayer).toContainEqual({
        event: 'cookie_consent_update',
        consent_status: 'denied',
      })
    })

    it('is valid within the expiry window', () => {
      denyCookieConsent()
      expect(hasCookieConsentDecision()).toBe(true)
    })

    it('expires after CONSENT_EXPIRY_DAYS', () => {
      denyCookieConsent()
      const stored = JSON.parse(storage._raw.get(CONSENT_STORAGE_KEY) as string)
      stored.timestamp = Date.now() - (CONSENT_EXPIRY_DAYS + 1) * DAY_MS
      storage._raw.set(CONSENT_STORAGE_KEY, JSON.stringify(stored))

      expect(hasCookieConsentDecision()).toBe(false)
    })
  })

  describe('hasCookieConsentDecision', () => {
    it('returns false when no decision is stored', () => {
      expect(hasCookieConsentDecision()).toBe(false)
    })

    it('restores a granted decision on reload (fresh read from storage)', () => {
      storage._raw.set(
        CONSENT_STORAGE_KEY,
        JSON.stringify({ status: 'granted', timestamp: Date.now() })
      )
      expect(hasCookieConsentDecision()).toBe(true)
    })

    it('honours the legacy plain-string format', () => {
      storage._raw.set(CONSENT_STORAGE_KEY, 'granted')
      expect(hasCookieConsentDecision()).toBe(true)
    })

    it('returns false for an unknown stored status', () => {
      storage._raw.set(
        CONSENT_STORAGE_KEY,
        JSON.stringify({ status: 'maybe', timestamp: Date.now() })
      )
      expect(hasCookieConsentDecision()).toBe(false)
    })

    it('returns false when localStorage access throws (private browsing)', () => {
      vi.stubGlobal('localStorage', createStorageStub({ throwOnAccess: true }))
      expect(hasCookieConsentDecision()).toBe(false)
    })
  })

  describe('localStorage safety', () => {
    it('does not throw on grant when storage is blocked', () => {
      vi.stubGlobal('localStorage', createStorageStub({ throwOnAccess: true }))
      expect(() => {
        grantCookieConsent()
        vi.runAllTimers()
      }).not.toThrow()
      // Consent still applies for the session via gtag.
      expect(gtag).toHaveBeenCalled()
    })
  })

  describe('openCookieSettings', () => {
    it('dispatches the COOKIE_SETTINGS_EVENT', () => {
      openCookieSettings()
      expect(dispatched).toHaveLength(1)
      expect(dispatched[0]?.type).toBe(COOKIE_SETTINGS_EVENT)
    })
  })
})
