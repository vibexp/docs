/**
 * Google Tag Manager container-id resolution, shared by the Head override (which
 * emits the GTM loader script) and the Header override (which emits the static
 * `<noscript>` fallback iframe). Centralized so both agree on exactly when GTM
 * is enabled.
 *
 * The container id is a public, non-secret value. It comes from `PUBLIC_GTM_ID`
 * and defaults to empty (no container) so the public repo ships no real
 * analytics id and GTM stays disabled until configured. An explicitly-set but
 * malformed `PUBLIC_GTM_ID` also disables GTM (returns `undefined`) rather than
 * emitting an invalid container.
 */
const SHARED_GTM_ID = ''

/** Valid GTM container ids look like `GTM-XXXXXX` (uppercase alphanumerics). */
const GTM_ID_PATTERN = /^GTM-[A-Z0-9]+$/

/**
 * Resolve the GTM container id to use: the provided value when non-empty,
 * otherwise the shared container. Returns `undefined` when the resolved
 * candidate is not a valid container id (so callers can gate all GTM output).
 */
export function resolveGtmId(raw?: string | null): string | undefined {
  const candidate = raw && raw.length > 0 ? raw : SHARED_GTM_ID
  return GTM_ID_PATTERN.test(candidate) ? candidate : undefined
}

/** The container id for this build, or `undefined` to disable GTM entirely. */
export const gtmId = resolveGtmId(import.meta.env.PUBLIC_GTM_ID)
