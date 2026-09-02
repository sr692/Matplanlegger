# Matplanlegger v1.6

Familieapp for ukesplan, middagsbank, fryserlager og butikk-uavhengig handleliste. Appen bruker delte husholdningsprofiler uten vanlig innlogging.

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
- Domenet er fortsatt `matplanlegger.rusti.no`.

## Middagsplan
- Dra en planlagt middag fra én dag til en annen.
- Slipp på tom dag = middagen flyttes.
- Slipp på dag som allerede har middag = middagene bytter plass.
- Desktop støtter vanlig dra-og-slipp på kortene.
- Mobil/touch bruker dra-håndtaket øverst til høyre på middagskortet.
- Flytting lagres i den aktive husholdningsprofilen og autosynkes på samme måte som andre endringer.

## Profilbasert middagsbank

Middagsbanken består av en innebygd Default-bank og egne middager per husholdningsprofil. Egne middager lagres i `state.customMeals` og synkroniseres dermed automatisk i samme Cloudflare/D1-profilpayload som ukeplan, fryser og handleliste. Default-middagene ligger fortsatt i `meals.js` og endres ikke av brukerne.

I appen kan brukeren legge til, redigere og slette egne middager. Ingredienser skrives én per linje som `vare | mengde`, og brukes automatisk i handlelisten når middagen velges i ukeplanen.
