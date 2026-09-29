import { defineConfig } from 'vitepress'

// why: GitHub Pages serves this repo at /wolven-harness/, so local preview
// and the published site share one base and one URL shape.
const base = '/wolven-harness/'

export default defineConfig({
  title: 'wolven-harness',
  description:
    'A repo where a coding agent can find its instructions, use recorded decisions, and check its work.',
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
        text: 'Guide',
        items: [
          { text: 'Start', link: '/' },
          { text: 'Setup', link: '/harness-init' },
          { text: 'Daily use', link: '/cycle' },
          { text: 'Search', link: '/search' },
          { text: 'Files', link: '/layout' },
          { text: 'Skills', link: '/skills' },
          { text: 'Agents', link: '/runtimes' },
          { text: 'Commands', link: '/commands' },
        ],
      },
      {
        text: 'Project',
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
