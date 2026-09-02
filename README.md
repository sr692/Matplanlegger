# Matplanlegger v1.7

Familieapp for ukesplan, middagsbank, fryserlager og butikk-uavhengig handleliste. Appen er laget for **mat.rusti.no** og bruker delte husholdningsprofiler uten vanlig innlogging.

Eksempel:
- `Sebastian & Ida` har én profil og deler samme ukesplan, lager og handleliste.
- `Mamma & Pappa` har en annen profil med helt separat data.
- Samme enhet kan huske flere profiler og bytte mellom dem.

## Nytt i v1.6
- Middagsbanken har nå **Default-middager + egne middager per husholdningsprofil**.
- Egne middager kan legges til, redigeres og slettes fra profilen og synkes mellom enhetene.
- Ingredienser i egne middager brukes automatisk i handlelisten.
- Designet beholder den stilrene **svart, off-white og gull**-paletten fra v1.5.
- Ukedager, kort og handleliste bruker nå én konsekvent gullaksent i stedet for mange farger.
- Fargegradienter og dekorative fargeflater er fjernet eller kraftig tonet ned.
- Lys modus bruker varm off-white, sort tekst og dempet gull.
- Mørk modus bruker kullsvart, varme lyse toner og gull.
- Tema kan fortsatt byttes fra toppmenyen og lagres lokalt per enhet.
- Funksjonalitet for profiler, synk, dra-og-slipp, fryser og handleliste er uendret.
- Domenet er nå `mat.rusti.no`.

## Middagsplan
- Dra en planlagt middag fra én dag til en annen.
- Slipp på tom dag = middagen flyttes.
- Slipp på dag som allerede har middag = middagene bytter plass.
- Desktop støtter vanlig dra-og-slipp på kortene.
- Mobil/touch bruker dra-håndtaket øverst til høyre på middagskortet.
- Flytting lagres i den aktive husholdningsprofilen og autosynkes på samme måte som andre endringer.

## Hvordan profilene fungerer
Det finnes ingen konto, e-post eller passord. Når en husholdning opprettes genererer nettleseren en tilfeldig UUID som profilkode. Profilkoden ligger også i delingslenken:

`https://mat.rusti.no/?profile=<profilkode>`

Alle med denne lenken kan lese og endre profilen. Koden er derfor en **capability key** og må behandles som en privat delingslenke. UUID-en er tilfeldig og ikke ment å kunne gjettes, men dette er ikke vanlig autentisering.

## Arkitektur
- GitHub Pages: `index.html`, `styles.css`, `app.js`, `meals.js`, `CNAME`
- Cloudflare Worker: `worker.js`
- Cloudflare D1: tabellen `profiles`
- Lokal cache via `localStorage` for rask åpning/offline-toleranse
- D1 er fasit når API-et er tilgjengelig
- Endringer autosynkes med kort debounce, i tillegg til manuell `Synkroniser`

## 1. Opprett D1
```bash
npx wrangler d1 create matplanlegger
npx wrangler d1 execute matplanlegger --remote --file=schema.sql
```

## 2. Sett opp Worker
Kopier `wrangler.toml.example` til `wrangler.toml`, sett inn D1 database-id og deploy.

```bash
npx wrangler deploy
```

Det kreves ikke `APP_TOKEN`.

## 3. Koble GitHub Pages til Worker
Worker-URL-en er allerede lagt inn før `app.js` i `index.html`:

```html
<script>
  window.MATPLAN_API = 'https://matplanlegger-api.sebastian-be1.workers.dev';
</script>
<script src="meals.js"></script>
<script src="app.js"></script>
```

Hvis `MATPLAN_API` ikke er satt, fungerer appen lokalt, men profiler kan ikke synkroniseres mellom enheter.

## 4. GitHub Pages og domenet
Repoet inneholder en `CNAME`-fil med:

`mat.rusti.no`

På GitHub: **Settings → Pages → Custom domain → `mat.rusti.no`**.

I DNS hos Cloudflare oppretter du normalt en CNAME for `matplanlegger` mot GitHub Pages-hostnavnet ditt. Bruk GitHubs anbefalte Pages-oppsett og slå på **Enforce HTTPS** når sertifikatet er klart.

## Data per profil
Følgende state ligger separat i D1 per profil:
- ukesplan
- fryserlager
- avkrysset handleliste
- middagshistorikk/vekting
- egne middager (`customMeals`)

`meals.js` er appens felles Default-bank. Profilens egne middager ligger separat i profilens state.

## Første profil
Første profil som lages i nettleseren overtar startdataene fra den opprinnelige prototypen, inkludert fryser og onsdag–fredag i ukesplanen. Profil nummer to og videre starter med tom uke/fryser, men samme middagsbibliotek.

## Synkmodell
Dette er bevisst enkelt: **last write wins**. Hvis to personer endrer samme profil samtidig, vil den sist lagrede state-en vinne.


## Profilbasert middagsbank

Middagsbanken består av en innebygd Default-bank og egne middager per husholdningsprofil. Egne middager lagres i `state.customMeals` og synkroniseres dermed automatisk i samme Cloudflare/D1-profilpayload som ukeplan, fryser og handleliste. Default-middagene ligger fortsatt i `meals.js` og endres ikke av brukerne.

I appen kan brukeren legge til, redigere og slette egne middager. Ingredienser skrives én per linje som `vare | mengde`, og brukes automatisk i handlelisten når middagen velges i ukeplanen.
