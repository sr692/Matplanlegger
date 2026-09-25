# Matplanlegger

En enkel familievennlig middagsplanlegger for `mat.rusti.no`, laget med mobilbruk som hovedfokus.

Appen samler ukeplan, middagsbank, handleliste og fryseroversikt i én profilbasert løsning. Profiler synkroniseres via Cloudflare Worker + D1, mens frontend publiseres som statiske filer på GitHub Pages.

**Gjeldende versjon: v1.13.4**

## Funksjoner

### Middagsplan

- Planlegg middag for mandag–søndag.
- Flytt middager mellom dager med dra-og-slipp, også på touchskjerm.
- Fjern en middag fra en enkelt dag uten å slette den fra Middagsbanken.
- Lås uka for å unngå utilsiktede endringer.
- Automatisk forslag til ukeplan.
- Fullskjermvisning tilpasset blant annet iPad.
- Dagens kort fremheves automatisk.
- Oppskrift kan åpnes direkte fra ukeplanen når middagen har lenke.

### Middagsbank

- Sentrale **Default-middager** som gjelder alle profiler.
- Egne middager per profil.
- Mulighet for å bruke bare egne middager i en profil.
- Kategorier, tags, ingredienser og oppskriftslenker.
- Default-middager hentes fra D1 når API-et er tilgjengelig.
- `meals.js` fungerer som fallback dersom API-et ikke kan nås.

### Admin

Admin kan:

- se alle eksisterende Default-middager
- legge til nye Default-middager
- redigere navn, kategori, tags, ingredienser og oppskriftslenke
- slette Default-middager

Endringer lagres i D1 og gjelder alle profiler.

### Handleliste

Handlelisten bygges automatisk fra ingrediensene i middagene som er satt inn i ukeplanen.

Varene sorteres automatisk i følgende butikkategorier:

1. Frukt og grønnsaker
2. Kjøtt, fisk
3. Pålegg
4. Kjeks
5. Syltetøy
6. Bakevarer
7. Frysevarer
8. Meieri
9. Kaffe
10. Hermetikk
11. Barn/baby
12. Snacks
13. Hygiene
14. Diverse

Andre funksjoner:

- Bare kategorier som inneholder varer vises.
- Automatisk kategorisering basert på varenavn.
- Ukjente varer havner i **Diverse** i stedet for feil kategori.
- Varer som allerede dekkes av Fryser-listen filtreres bort.
- Egne varer kan legges til manuelt.
- Mengde er valgfritt på egne varer.
- Kategori foreslås automatisk, men kan overstyres.
- Egne varer kan slettes direkte fra handlelisten.
- Varer kan hukes av under handling.
- Ferdige varer tones ned og sorteres nederst i kategorien.
- Handleliste-status og egne varer synkroniseres med profilen.
- Mobilvisningen bruker større trykkflater og sticky kategorioverskrifter.

### Fryser

- Legg inn varer som allerede finnes hjemme.
- Mengde og plassering kan registreres.
- Handlelisten forsøker å filtrere bort ingredienser som allerede finnes i fryseren.

### Profiler og synkronisering

Hver husholdningsprofil har sin egen:

- ukeplan
- egne middager
- handleliste og avhuking
- egne handlevarer
- fryser
- innstillinger
- ukelås

Data caches lokalt i nettleseren og synkroniseres mot Cloudflare D1 når Worker er konfigurert. Dette gjør at samme profil kan brukes fra flere enheter.

## Mobil

Frontend er laget med mobil som primær brukssituasjon, spesielt Handleliste.

Fra v1.13.4 har alle tekstfelt og select-felt minst 16 px skriftstørrelse på mobil. Dette hindrer at iOS Safari automatisk zoomer inn når et felt får fokus. Vanlig pinch-to-zoom er fortsatt tilgjengelig.

## Teknisk oppsett

### Frontend

Frontend publiseres på GitHub Pages og består blant annet av:

```text
index.html
app.js
styles.css
i18n.js
meals.js
meal-library-mode.js
recipe-links.js
week-enhancements.js
CNAME

admin/
  index.html
  admin.js
  admin.css
```

### Backend

Backend kjører som en Cloudflare Worker:

```text
worker.js
schema.sql
migration-v1.13.0.sql
migration-v1.13.1.sql
wrangler.toml
```

`wrangler.toml.example` kan brukes som utgangspunkt.

Worker håndterer blant annet:

- synkronisering av profiler
- global Default-middagsbank
- admininnlogging
- oppretting, redigering og sletting av Default-middager

## Cloudflare D1

Worker forventer en D1-binding med navnet:

```text
DB
```

Eksempel:

```toml
[[d1_databases]]
binding = "DB"
database_name = "matplanlegger"
database_id = "DIN-DATABASE-ID"
```

## Versjonshistorikk

### v1.13.4

- Hindrer automatisk iOS Safari-zoom når tekstfelt/select-felt får fokus.
- Vanlig pinch-to-zoom beholdes.

### v1.13.3

- Ny mobiltilpasset Handleliste.
- Automatisk kategorisering av ingredienser.
- Egne handlevarer med valgfri mengde.
- Automatisk eller manuell kategori for egne varer.
- Synkronisert avhuking og egne varer.
- Sticky kategorioverskrifter og større trykkflater på mobil.

### v1.13.2

- **Fjern middag** direkte fra en dag i Middagsplan.
- Fjerner bare planleggingen for dagen, ikke middagen fra Middagsbanken.
- Støtte i vanlig visning og fullskjerm.

### v1.13.1

- Eksisterende Default-middager migrert til D1.
- Admin kan redigere og slette dagens sentrale Default-middager.
- Eksisterende middag-ID-er beholdes.

### v1.13.0

- Egen adminside på `/admin/`.
- D1-basert global Default-middagsbank.
- Serverbeskyttet admininnlogging med Cloudflare Secrets.

## Sikkerhet

- Adminpassord skal aldri ligge i GitHub eller klientkode.
- `ADMIN_PASSWORD` og `ADMIN_SESSION_SECRET` lagres som Cloudflare Secrets.
- Admin-endepunkter krever signert session-token.
- CORS begrenses med `ALLOWED_ORIGIN` til frontend-domenet.
- Klientprofiler synkroniseres gjennom Worker/API i stedet for direkte D1-tilgang fra nettleseren.

---

Matplanlegger er laget for privat bruk på `mat.rusti.no`.
