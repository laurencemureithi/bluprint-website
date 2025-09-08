# Bluprint — Premium Website (GitHub Pages Ready)

This is a rebuilt, premium-grade static site for **Bluprint Graphics & Printers**, designed to read like a 200,000+ KES studio website.

## Highlights
- Modern gradient dark+light theme with glass cards
- Fully responsive (phone → laptop → ultrawide/TV)
- Light/Dark **theme toggle** (persisted)
- **Transparent pricing** with *live currency conversion* (exchangerate.host)
- **Quote modal** with prefill; forms wired to FormSubmit
- **Portfolio lightbox** and consistent image ratios
- PWA (manifest + offline service worker)
- GitHub Pages friendly (all **relative paths** + `404.html`)

## Structure
```
index.html
work.html
services.html
about.html
contact.html
thank-you.html
privacy.html
terms.html
404.html
assets/
  css/main.css
  js/main.js
  img/ (drop your images here)
case-studies/ (optional)
manifest.json
sw.js
robots.txt
sitemap.xml
```

## Deploy to GitHub Pages
1. Create a repo (e.g., `bluprint-website`) and upload the **contents** of this folder to the repo **root**.
2. In your repo **Settings → Pages**, set **Branch** to `main` and **Folder** to `/ (root)`.
3. Wait a minute and open: `https://YOUR-USERNAME.github.io/REPO-NAME/`.

### Important for URLs & SEO
- The sitemap & robots currently point to: `https://laurencemureithi.github.io/bluprint-website/`.
- If your repo is named differently (e.g., `bluprint-site`), update:
  - `robots.txt` (Sitemap URL)
  - `sitemap.xml` (page URLs)

## Images
Drop your real images in `assets/img/` keeping filenames used in HTML where possible:
- `namanga.jpg`, `debris-flyer.jpg`, `avrek.jpg`, `premium-pork.jpg`, `youtube-thumb.jpg`, `lead-designer.jpg`, `producer.jpg`, `favicon.png`, `og-default.jpg`

You can keep your existing image names from your current repo — just replace the placeholder names in HTML or rename your files accordingly.

## Forms
Forms are wired to **FormSubmit**. Replace the action attribute with your unique endpoint (or keep generic and set email in FormSubmit):
```html
<form action="https://formsubmit.co/YOUR-EMAIL" method="POST">
  <input type="hidden" name="_next" value="./thank-you.html">
</form>
```

## Currency + Phone
- Prices are defined in **KES** in the HTML via `data-price-kes`.
- On load, JS fetches live exchange rates and converts to the visitor’s local currency using `Intl.NumberFormat`.
- If the API fails, KES is shown as a safe fallback.
- Phone placeholders adapt to country (basic mapping).

## Customize
- Colors/gradients: `assets/css/main.css` (CSS variables at the top)
- Add projects: edit `work.html` and add images to `assets/img/`
- Team: edit `about.html` headshots + bios
- Pricing: edit `services.html` and the pricing cards (KES values)

---

Crafted for Bluprint with ❤️ — 2025.
