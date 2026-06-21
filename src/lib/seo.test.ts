import { describe, expect, it } from 'vitest'

import { SITE_URL } from './site'
import {
  SITE,
  buildJsonLd,
  buildOrganization,
  buildWebSite,
  escapeJsonLd,
  toAbsoluteUrl,
} from './seo'

describe('SITE constants', () => {
  it('uses the canonical docs origin', () => {
    expect(SITE.origin).toBe(SITE_URL)
  })

  it('points the OG image at a 1200x630 social card', () => {
    expect(SITE.ogImage).toBe('/og-banner.png')
    expect(SITE.ogImageWidth).toBe(1200)
    expect(SITE.ogImageHeight).toBe(630)
  })
})

describe('toAbsoluteUrl', () => {
  it('resolves a relative path against the origin', () => {
    expect(toAbsoluteUrl('/og-banner.png', SITE_URL)).toBe(
      'https://docs.example.com/og-banner.png'
    )
  })

  it('leaves an already-absolute URL intact', () => {
    expect(toAbsoluteUrl('https://example.com', SITE_URL)).toBe(
      'https://example.com/'
    )
  })
})

describe('escapeJsonLd', () => {
  it('escapes characters that could break out of an inline script', () => {
    const escaped = escapeJsonLd({ html: '<script>&</script>' })
    expect(escaped).not.toContain('<')
    expect(escaped).not.toContain('>')
    expect(escaped).toContain('\\u003c')
    expect(escaped).toContain('\\u003e')
    expect(escaped).toContain('\\u0026')
    // End-to-end: the escaped payload can never close the inline <script>.
    expect(escaped).not.toContain('</')
  })

  it('escapes the U+2028 / U+2029 line terminators', () => {
    const escaped = escapeJsonLd({ text: '  ' })
    expect(escaped).toContain('\\u2028')
    expect(escaped).toContain('\\u2029')
    expect(escaped).not.toContain(' ')
    expect(escaped).not.toContain(' ')
  })

  it('emits valid JSON for undefined input', () => {
    expect(escapeJsonLd(undefined)).toBe('null')
  })
})

describe('buildOrganization', () => {
  it('builds an Organization node with an absolute logo URL', () => {
    const node = buildOrganization(SITE_URL)
    expect(node).toMatchObject({
      '@type': 'Organization',
      name: 'VibeXP',
      url: 'https://example.com',
      logo: 'https://docs.example.com/logo.svg',
    })
  })
})

describe('buildWebSite', () => {
  it('builds a WebSite node pointing at the docs origin', () => {
    expect(buildWebSite(SITE_URL)).toEqual({
      '@type': 'WebSite',
      name: 'VibeXP Documentation',
      url: SITE_URL,
    })
  })
})

describe('buildJsonLd', () => {
  it('emits an escaped @graph with the Organization and WebSite nodes', () => {
    const json = buildJsonLd(SITE_URL)
    const parsed = JSON.parse(json) as {
      '@context': string
      '@graph': Array<{ '@type': string }>
    }
    expect(parsed['@context']).toBe('https://schema.org')
    expect(parsed['@graph'].map(node => node['@type'])).toEqual([
      'Organization',
      'WebSite',
    ])
  })

  it('defaults the origin to the canonical docs site', () => {
    expect(buildJsonLd()).toBe(buildJsonLd(SITE_URL))
  })
})
