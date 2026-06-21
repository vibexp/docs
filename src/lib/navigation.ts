/**
 * Shared link sets for the docs-site chrome (header nav + footer columns).
 * Centralized so the overridden Header and Footer never drift on hrefs/UTM.
 *
 * All external destinations are env-driven with neutral placeholder defaults so
 * the public repo carries no real org domains. Configure the real values via the
 * `PUBLIC_*` build-time vars documented in `.env.example`; left unset, the site
 * builds and renders with `example.com` placeholders.
 */

export interface NavLink {
  label: string
  href: string
  external: boolean
}

/** External destinations, env-driven with neutral placeholder defaults. */
const WEBSITE_URL = import.meta.env.PUBLIC_WEBSITE_URL || 'https://example.com'
const BLOG_URL = import.meta.env.PUBLIC_BLOG_URL || 'https://blog.example.com'
const APP_URL = import.meta.env.PUBLIC_APP_URL || 'https://app.example.com'
const GITHUB_URL =
  import.meta.env.PUBLIC_GITHUB_URL || 'https://github.com/your-org'
const GITHUB_REPO_URL =
  import.meta.env.PUBLIC_GITHUB_REPO_URL ||
  'https://github.com/your-org/your-repo'
const TWITTER_URL =
  import.meta.env.PUBLIC_TWITTER_URL || 'https://x.com/your_handle'

/** Appends the shared docs UTM params to an external URL. */
function withUtm(base: string, medium: string): string {
  const sep = base.includes('?') ? '&' : '?'
  const hashIndex = base.indexOf('#')
  const utm = `utm_source=docs&utm_medium=${medium}&utm_campaign=docs_site`
  if (hashIndex === -1) {
    return `${base}${sep}${utm}`
  }
  // Keep any fragment after the query string.
  const path = base.slice(0, hashIndex)
  const hash = base.slice(hashIndex)
  const pathSep = path.includes('?') ? '&' : '?'
  return `${path}${pathSep}${utm}${hash}`
}

export const headerNavLinks: NavLink[] = [
  { label: 'Docs', href: '/', external: false },
  { label: 'Getting Started', href: '/user-guide/intro', external: false },
  {
    label: 'Website',
    href: withUtm(WEBSITE_URL, 'navbar'),
    external: true,
  },
  {
    label: 'Blog',
    href: withUtm(BLOG_URL, 'navbar'),
    external: true,
  },
  {
    label: 'Login',
    href: withUtm(`${APP_URL}/login`, 'navbar'),
    external: true,
  },
  { label: 'GitHub', href: GITHUB_URL, external: true },
]

export interface FooterColumn {
  title: string
  links: NavLink[]
}

export const footerColumns: FooterColumn[] = [
  {
    title: 'Docs',
    links: [
      { label: 'Getting Started', href: '/user-guide/intro', external: false },
      { label: 'Prompts', href: '/user-guide/prompts', external: false },
      {
        label: 'API Keys',
        href: '/user-guide/integrations/api-keys',
        external: false,
      },
    ],
  },
  {
    title: 'Community',
    links: [
      {
        label: 'GitHub',
        href: withUtm(GITHUB_REPO_URL, 'footer'),
        external: true,
      },
      {
        label: 'X (Twitter)',
        href: withUtm(TWITTER_URL, 'footer'),
        external: true,
      },
    ],
  },
]
