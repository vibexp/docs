import { describe, expect, it } from 'vitest'

import { resolveGtmId } from './gtm'

describe('resolveGtmId', () => {
  it('returns a valid explicit container id', () => {
    expect(resolveGtmId('GTM-ABC123')).toBe('GTM-ABC123')
  })

  it('disables GTM (undefined) when empty, null, or undefined and no default is configured', () => {
    expect(resolveGtmId('')).toBeUndefined()
    expect(resolveGtmId(undefined)).toBeUndefined()
    expect(resolveGtmId(null)).toBeUndefined()
  })

  it('disables GTM (undefined) for a malformed explicit id rather than falling back', () => {
    expect(resolveGtmId('not-a-gtm-id')).toBeUndefined()
    expect(resolveGtmId('gtm-lowercase')).toBeUndefined()
    expect(resolveGtmId('GTM-abc')).toBeUndefined()
    expect(resolveGtmId('GA-12345')).toBeUndefined()
  })

  it('only accepts the GTM-<UPPER/DIGITS> shape (no injection chars)', () => {
    expect(resolveGtmId('GTM-X"><script>')).toBeUndefined()
    expect(resolveGtmId('GTM-X Y')).toBeUndefined()
  })
})
