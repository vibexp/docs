import { describe, expect, it } from 'vitest'

import { SITE_URL } from './site'

describe('SITE_URL', () => {
  it('defaults to the neutral placeholder docs origin when unconfigured', () => {
    expect(SITE_URL).toBe('https://docs.example.com')
  })

  it('is an absolute https origin with no trailing slash', () => {
    expect(SITE_URL).toMatch(/^https:\/\//)
    expect(SITE_URL.endsWith('/')).toBe(false)
  })
})
