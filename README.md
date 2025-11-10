# Sveikas įprotis – prototipas v0.2 (Vite + React + Tailwind + PWA)

Nauja: taškai, lyderių lenta, CSV eksportas, filtruojamos alternatyvos, PWA (įdiegimas į telefoną).

## Paleidimas lokaliai
```
npm install
npm run dev
```

## Statinis build'as
```
npm run build
```
Failai atsidurs `dist/` – tinka diegti į bet kurį hostingą.

## Viešas diegimas
### Vercel
- New Project → importuoti šį repo/ZIP.
- Build: `npm run build`
- Output: `dist`

### Netlify (drag & drop)
- `npm run build`
- nueik į app.netlify.com → Add new site → Deploy manually → užtempk `dist` aplanką.

## Kas nauja
- Taškų sistema (+1 rankiniu būdu, +5 už pasiektus dienos tikslus, +1 už 10 min fokusą)
- Lyderių lenta (lokali, pagal komandas/klases)
- CSV eksportas (dienos duomenys + fokusavimo sesijos)
- Filtruojamos be-ekranų alternatyvos (trukmė/nuotaika)
- PWA: `manifest.webmanifest` + `sw.js` (offline cache)

