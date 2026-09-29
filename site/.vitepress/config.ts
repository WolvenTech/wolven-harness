import { defineConfig } from 'vitepress'

// why: GitHub Pages serves this repo at /wolven-harness/, so local preview
// and the published site share one base and one URL shape.
const base = '/wolven-harness/'

export default defineConfig({
  title: 'wolven-harness',
  description:
    'AI-assisted dev harness: init an AGENTS.md-based skills tree, wire runtimes, and validate architecture-decision claims.',
  base,
  appearance: false,
  head: [
    ['link', { rel: 'icon', href: `${base}wolven-logo-black.png` }],
    [
      'link',
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Bai+Jamjuree:wght@400;500;700&display=swap',
      },
    ],
  ],
  themeConfig: {
    logo: '/wolven-logo-black.png',
    siteTitle: 'wolven-harness',
    nav: [
      { text: 'README', link: 'https://github.com/WolvenTech/wolven-harness#readme' },
      { text: 'npm', link: 'https://www.npmjs.com/package/@wolven-tech/harness' },
    ],
    sidebar: [
      {
        text: 'Use the harness',
        items: [
          { text: 'Site map', link: '/' },
          { text: 'Commands', link: '/commands' },
          { text: 'The cycle', link: '/cycle' },
          { text: 'Setting up with harness-init', link: '/harness-init' },
          { text: 'Doc layout', link: '/layout' },
          { text: 'Skills', link: '/skills' },
          { text: 'Runtimes', link: '/runtimes' },
          { text: 'Searching your documents', link: '/search' },
        ],
      },
      {
        text: 'Maintain the package',
        items: [
          { text: 'Release', link: '/release' },
          { text: 'Contributing', link: '/contributing' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/WolvenTech/wolven-harness' },
    ],
  },
})
