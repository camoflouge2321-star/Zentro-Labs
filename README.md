# Zentro Labs - Premium One-Page Website

A high-end editorial-style agency website built with vanilla HTML, CSS, and JavaScript.

## Live Stack
- `index.html` - Page structure and SEO/social metadata
- `styles.css` - Design system, layout, interactions, responsive styles
- `app.js` - UI behavior, animations, CTA actions, contact form wiring
- `hero.bg.mp4` - Hero background video
- `zentro-mark.svg` / `favicon.svg` - Brand assets

## Quick Start
1. Install dependencies:
```bash
npm install
```

2. Start local server:
```bash
npm run dev
```

3. Open:
`http://127.0.0.1:5500`

## Important Config
- WhatsApp lead link:
Edit `SITE_CONFIG.whatsappPhone` in `app.js` (country code + number, no symbols).

- Domain metadata:
Update canonical/Open Graph/Twitter URLs in `index.html` if your production domain is not `https://zentrolabs.com/`.

- Contact email:
Edit `SITE_CONFIG.contactEmail` in `app.js`.

## Deployment
This is a static site. You can deploy directly to:
- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages

## License
Private client project. All rights reserved.
