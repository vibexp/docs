/**
 * Framework-agnostic Google Consent Mode v2 helpers for the docs-site cookie
 * banner. Ported from website/src/utils/cookieConsent.ts so the two properties
 * behave identically. No React — these run from the banner's inline script.
 *
 * All `localStorage` / `gtag` access is guarded so private-browsing (where the
 * APIs throw or are absent) degrades to a session-only decision instead of an
 * uncaught error.
 */

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[]
    gtag: (...args: unknown[]) => void
  }
}

export const CONSENT_STORAGE_KEY = 'cookieConsent'

/** Declined consent is re-prompted after this many days; granted never expires. */
export const CONSENT_EXPIRY_DAYS = 7

/**
 * DOM event dispatched to re-open the cookie consent banner from anywhere on the
 * site (e.g. the footer "Cookie Settings" control), without coupling those
 * call-sites to the banner's internal state.
 */
export const COOKIE_SETTINGS_EVENT = 'vx:open-cookie-settings'

interface ConsentData {
  status: 'granted' | 'denied'
  timestamp: number
}

// Re-entrancy guard: prevents infinite recursion between gtag/dataLayer.push and
// GTM on iOS WebKit, where a consent update can fire a re-entrant dataLayer.push
// (gtag → dataLayer.push → GTM re-entrant push → RangeError: stack overflow).
let isUpdatingConsent = false

function storeDecision(status: ConsentData['status']): void {
  const consentData: ConsentData = { status, timestamp: Date.now() }
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consentData))
  } catch (e) {
    if (!(e instanceof DOMException)) throw e
    // localStorage unavailable (private browsing / disabled cookies): the
    // decision applies for this session only.
  }
}

function updateConsentMode(granted: boolean, event: string): void {
  // setTimeout breaks the potential recursive call stack on iOS WebKit + GTM;
  // the isUpdatingConsent guard is the second layer of protection.
  setTimeout(() => {
    if (isUpdatingConsent) return
    isUpdatingConsent = true
    try {
      const value = granted ? 'granted' : 'denied'
      window.gtag('consent', 'update', {
        ad_storage: value,
        ad_user_data: value,
        ad_personalization: value,
        analytics_storage: value,
      })
      window.dataLayer.push({
        event,
        consent_status: granted ? 'granted' : 'denied',
      })
    } catch (e) {
      if (!(e instanceof TypeError)) throw e
      // gtag/dataLayer not present (GTM disabled because no valid container id):
      // the stored decision still persists for when GTM is configured.
    } finally {
      isUpdatingConsent = false
    }
  }, 0)
}

/**
 * Grant cookie consent and update Google Consent Mode v2. Granted consent is
 * stored indefinitely (no expiry). Call when the user accepts the banner.
 */
export function grantCookieConsent(): void {
  storeDecision('granted')
  updateConsentMode(true, 'cookie_consent_update')
}

/**
 * Deny cookie consent and reinforce the all-denied Consent Mode v2 default.
 * Declined consent expires after {@link CONSENT_EXPIRY_DAYS}, after which the
 * banner is shown again. Call when the user declines the banner.
 */
export function denyCookieConsent(): void {
  storeDecision('denied')
  updateConsentMode(false, 'cookie_consent_update')
}

/**
 * Whether the user has a still-valid consent decision:
 * - granted: valid indefinitely;
 * - denied: valid until {@link CONSENT_EXPIRY_DAYS} have elapsed.
 *
 * Returns false (show the banner) when no decision is stored or localStorage is
 * inaccessible.
 */
export function hasCookieConsentDecision(): boolean {
  let consentStr: string | null
  try {
    consentStr = localStorage.getItem(CONSENT_STORAGE_KEY)
  } catch (e) {
    if (!(e instanceof DOMException)) throw e
    return false
  }
  if (!consentStr) return false

  try {
    const consentData: ConsentData = JSON.parse(consentStr)
    if (consentData.status === 'granted') return true
    if (consentData.status === 'denied') {
      const daysSinceDecision =
        (Date.now() - consentData.timestamp) / (1000 * 60 * 60 * 24)
      return daysSinceDecision < CONSENT_EXPIRY_DAYS
    }
    return false
  } catch {
    // Legacy plain-string format — only the two known values are valid.
    return consentStr === 'granted' || consentStr === 'denied'
  }
}

/**
 * Re-open the cookie consent banner regardless of any prior decision, satisfying
 * GDPR Article 7(3) (withdrawing consent must be as easy as giving it). The
 * banner listens for {@link COOKIE_SETTINGS_EVENT} and shows itself again.
 */
export function openCookieSettings(): void {
  window.dispatchEvent(new CustomEvent(COOKIE_SETTINGS_EVENT))
}
