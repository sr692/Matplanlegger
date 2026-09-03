# Matplanlegger v1.10

Familieapp for ukesplan, middagsbank, fryserlager og butikk-uavhengig handleliste. Appen er laget for **mat.rusti.no** og bruker delte husholdningsprofiler uten vanlig innlogging.

Eksempel:
- `Sebastian & Ida` har én profil og deler samme ukesplan, lager og handleliste.
- `Mamma & Pappa` har en annen profil med helt separat data.
- Samme enhet kan huske flere profiler og bytte mellom dem.


## Nytt i v1.10 - cache-busting
- `styles.css`, `meals.js` og `app.js` lastes med versjonsparameter `?v=1.10.0`.
- Dette tvinger nettleseren til å hente nye frontend-assets ved versjonsbytte i stedet for å bruke en gammel CSS/JS-cache.
- `index.html` har også eksplisitte no-cache meta-direktiver og en `app-version`-markør.
- Ved neste release skal versjonsparameteren økes, for eksempel til `?v=1.11.0`.

## v1.9 - Ukelås

- Middagsplanen kan låses per husholdningsprofil med ett trykk.
- Låst uke blokkerer Foreslå uke, Tøm uke, dra-og-slipp og manuell endring av dagene.
- Låsestatus lagres og synkroniseres som en del av profilen.
- Handleliste, fryser og middagsbank kan fortsatt brukes mens uka er låst.

## Nytt i v1.8
- Nær sanntids profilsynk: lokale endringer pushes etter ca. **80 ms**.
- Andre åpne enheter sjekker samme profil ca. hvert **500 ms** så lenge appen er synlig.
- Samme nettleser synker enda raskere mellom faner via `BroadcastChannel`.
- Synk kjøres umiddelbart når appen får fokus igjen eller nettet kommer tilbake.
- Endringer som skjer mens en opplasting allerede pågår blir køet og sendt rett etterpå i stedet for å bli droppet.
- Worker lagrer `updatedAt` med millisekundpresisjon for å oppdage raske endringer pålitelig.
- Skjulte faner stopper polling for å unngå unødvendige Worker/D1-kall.

## Tidligere funksjoner
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




