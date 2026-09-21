(() => {
  'use strict';

  const STORAGE_KEY = 'matplan_lang';
  const SUPPORTED = new Set(['no', 'en']);
  const ATTRS = ['placeholder', 'title', 'aria-label'];

  const EN = {
    'Matplanlegger': 'Meal planner',
    'Matplanlegger på rusti.no': 'Meal planner on rusti.no',
    'Bytt til mørk bakgrunn': 'Switch to dark background',
    'Bytt til lys bakgrunn': 'Switch to light background',
    'Bytt tema': 'Switch theme',
    'Bytt til mørkt tema': 'Switch to dark theme',
    'Bytt til lyst tema': 'Switch to light theme',
    'Mørk': 'Dark',
    'Lys': 'Light',
    'Husholdning': 'Household',
    'Ingen profil': 'No profile',
    'Synkroniser': 'Sync',
    'Synker…': 'Syncing…',
    'Synkronisert': 'Synced',
    'Ikke synket': 'Not synced',
    'Lokal profil': 'Local profile',
    'FØR DU STARTER': 'BEFORE YOU START',
    'Lag eller åpne en husholdningsprofil': 'Create or open a household profile',
    'Profilen synker middagsplan, fryser og handleliste mellom mobilene deres.': 'The profile syncs the meal plan, freezer and shopping list across your devices.',
    'Velg profil': 'Choose profile',
    'Hva skal vi spise denne uka?': 'What should we eat this week?',
    'Planlegg middager ut fra det dere faktisk pleier å spise, flytt dager med dra-og-slipp, trekk fra det som finnes i fryseren og få én samlet handleliste.': 'Plan dinners based on what you actually eat, move days with drag and drop, subtract what is already in the freezer and get one combined shopping list.',
    'Foreslå uke': 'Suggest week',
    'Tøm uke': 'Clear week',
    'Navigasjon': 'Navigation',
    'Ukesplan': 'Weekly plan',
    'Handleliste': 'Shopping list',
    'Middagsbank': 'Meal library',
    'Fryser': 'Freezer',
    'DENNE UKEN': 'THIS WEEK',
    'Middagsplan': 'Meal plan',
    'Lås middagsplanen': 'Lock the meal plan',
    'Lås opp middagsplanen': 'Unlock the meal plan',
    'Lås uka': 'Lock week',
    'Lås uke': 'Lock week',
    'Uka er låst': 'Week is locked',
    'Lås opp uka for å endre middagsplanen': 'Unlock the week to change the meal plan',
    'Lås uka for å unngå utilsiktede endringer': 'Lock the week to avoid accidental changes',
    'Velg en profil for å låse uka': 'Choose a profile to lock the week',
    'Dra en middag til en annen dag · klikk for å endre': 'Drag a meal to another day · click to change',
    'Middagsplanen er låst mot endringer': 'The meal plan is locked against changes',
    'Lås opp uka for å foreslå ny uke': 'Unlock the week to suggest a new plan',
    'Lås opp uka for å tømme planen': 'Unlock the week to clear the plan',
    'DET SOM MANGLER': 'WHAT IS MISSING',
    'Oppdater fra uke': 'Update from week',
    'Handlelisten bygges automatisk fra valgte middager og trekker fra det dere allerede har registrert i fryseren.': 'The shopping list is built automatically from selected meals and subtracts what you already have registered in the freezer.',
    'DEFAULT + DERES EGNE': 'BUILT-IN + YOUR OWN',
    'Søk etter middag…': 'Search for a meal…',
    '+ Legg til middag': '+ Add meal',
    'Default-middagene følger appen. Egne middager lagres kun i den aktive husholdningsprofilen og synkroniseres med de andre som bruker samme profil.': 'Built-in meals come with the app. Your own meals are stored only in the active household profile and sync with the others using the same profile.',
    'LAGER': 'STORAGE',
    'Legg til vare': 'Add item',
    'DELT HUSHOLDNING': 'SHARED HOUSEHOLD',
    'Én plan. Én handleliste. Alle i sync.': 'One plan. One shopping list. Everyone in sync.',
    'Del profillenken med de andre i husholdningen. Endringer i middagsplan, fryser og handleliste synkroniseres mellom enhetene.': 'Share the profile link with the rest of the household. Changes to the meal plan, freezer and shopping list sync across devices.',
    '© rusti.no · Matplanlegger': '© rusti.no · Meal planner',
    'HUSHOLDNING': 'HOUSEHOLD',
    'Profiler': 'Profiles',
    'Ingen innlogging. Lag én profil per husholdning og del profilkoden eller lenken med de som skal bruke den.': 'No sign-in required. Create one profile per household and share the profile code or link with the people who will use it.',
    'Aktiv profil': 'Active profile',
    'Kopier delingslenke': 'Copy sharing link',
    'NY PROFIL': 'NEW PROFILE',
    'Lag husholdning': 'Create household',
    'Navn': 'Name',
    'f.eks. Sebastian & Ida': 'e.g. Sebastian & Ida',
    'Lag profil': 'Create profile',
    'HAR DU EN KODE?': 'HAVE A CODE?',
    'Åpne eksisterende': 'Open existing',
    'Profilkode eller delingslenke': 'Profile code or sharing link',
    'Lim inn kode eller lenke': 'Paste code or link',
    'Åpne profil': 'Open profile',
    'Åpner…': 'Opening…',
    'LAGRET PÅ DENNE ENHETEN': 'SAVED ON THIS DEVICE',
    'Profilkoden fungerer som en nøkkel. Alle som har koden kan åpne og endre husholdningen. Ikke legg delingslenken offentlig.': 'The profile code works like a key. Anyone with the code can open and change the household. Do not post the sharing link publicly.',
    'VELG MIDDAG': 'CHOOSE MEAL',
    'Søk…': 'Search…',
    'MIN PROFIL': 'MY PROFILE',
    'Legg til middag': 'Add meal',
    'Rediger middag': 'Edit meal',
    'Kategori': 'Category',
    'f.eks. Idas kyllingpasta': "e.g. Ida's chicken pasta",
    'f.eks. Kylling': 'e.g. Chicken',
    'Ingredienser': 'Ingredients',
    'én per linje: vare | mengde': 'one per line: item | amount',
    'Oppskriftslenke': 'Recipe link',
    'valgfritt': 'optional',
    'Avbryt': 'Cancel',
    'Lagre endringer': 'Save changes',
    'NY VARE': 'NEW ITEM',
    'Legg til i fryseren': 'Add to freezer',
    'Vare': 'Item',
    'f.eks. kyllingfilet': 'e.g. chicken breast',
    'Mengde': 'Amount',
    'f.eks. 600 g eller 2 pk': 'e.g. 600 g or 2 packs',
    'Plassering': 'Location',
    'Kjelleren': 'Basement',
    'Boden': 'Storage room',
    'Lagre': 'Save',
    'Legg til en egen middag i denne profilen': 'Add your own meal to this profile',
    'Velg profil for å legge til egne middager': 'Choose a profile to add your own meals',
    'Åpnet lokal kopi – skyen kunne ikke nås': 'Opened local copy – the cloud could not be reached',
    'Delingslenken er kopiert': 'Sharing link copied',
    'Kopier denne delingslenken:': 'Copy this sharing link:',
    'Velg en husholdningsprofil først': 'Choose a household profile first',
    'Uka er låst opp': 'Week is unlocked',
    'ingen middag': 'no dinner',
    'Ingen middag': 'No dinner',
    '+ Velg middag': '+ Choose meal',
    'Dra til en annen dag': 'Drag to another day',
    'Egen': 'Custom',
    'Default': 'Built-in',
    'Alle': 'All',
    'Ingen middager matcher søket.': 'No meals match your search.',
    'Ingen ingredienser registrert': 'No ingredients registered',
    'Annet': 'Other',
    'Åpne oppskrift ↗': 'Open recipe ↗',
    'Rediger': 'Edit',
    'Slett': 'Delete',
    'Lås opp uka før du sletter en middag som er i planen': 'Unlock the week before deleting a meal that is in the plan',
    'Middagen er slettet': 'The meal was deleted',
    'Oppskriftslenken må starte med http:// eller https://': 'The recipe link must start with http:// or https://',
    'Middagen er oppdatert': 'The meal was updated',
    'Middagen er lagt til': 'The meal was added',
    'Ingen varer å handle fra planlagte middager.': 'No shopping items from planned meals.',
    'Fjern': 'Remove',
    'Fryseren er tom.': 'The freezer is empty.',
    'Profilen er synkronisert': 'The profile is synced',
    'Kunne ikke synkronisere profilen. Endringene er fortsatt lagret på denne enheten.': 'Could not sync the profile. Your changes are still saved on this device.',
    'Worker-URL mangler. Appen lagrer bare lokalt til MATPLAN_API er konfigurert.': 'The Worker URL is missing. The app will save locally only until MATPLAN_API is configured.',
    'Ugyldig profilkode eller delingslenke.': 'Invalid profile code or sharing link.',
    'Fant ikke profilen. Sjekk at koden er riktig.': 'Profile not found. Check that the code is correct.',
    'Cloudflare Worker er ikke konfigurert ennå, så profiler kan bare åpnes på denne enheten.': 'The Cloudflare Worker is not configured yet, so profiles can only be opened on this device.',
    'Kunne ikke åpne profilen akkurat nå.': 'Could not open the profile right now.',
    'Delingslenken peker til en profil som ikke finnes.': 'The sharing link points to a profile that does not exist.',
    'Kylling': 'Chicken',
    'Fisk': 'Fish',
    'Kjøtt': 'Meat',
    'Vegetar': 'Vegetarian',
    'Tex-mex': 'Tex-Mex',
    'rask': 'quick',
    'favoritt': 'favorite',
    'helg': 'weekend',
    'grill': 'grill',
    'hverdag': 'weekday',
    'wok': 'wok',
    'bowl': 'bowl',
    'tex-mex': 'tex-mex',
    'wrap': 'wrap',
    'salat': 'salad',
    'crockpot': 'slow cooker',
    'Bytt eller del profil': 'Switch or share profile',

    // Built-in meal names. User-created meal names are left as entered unless they exactly match one of these.
    'Libapizza med chorizo, tomat & ruccola': 'Liba pizza with chorizo, tomato & arugula',
    'Hjemmelaget pizza': 'Homemade pizza',
    'Hvalbiff på grillen med søtpotetfries & grønnsaker': 'Grilled whale steak with sweet potato fries & vegetables',
    'Kylling, brokkoli & pasta': 'Chicken, broccoli & pasta',
    'Kremet laks': 'Creamy salmon',
    'Fajita søtpotet steak bowl': 'Fajita sweet potato steak bowl',
    'Kremet laksegryte med spinat & soltørket tomat': 'Creamy salmon stew with spinach & sun-dried tomatoes',
    'Wok med svinekjøtt': 'Pork stir-fry',
    'Anna Paulas tyrkiske pasta': "Anna Paula's Turkish pasta",
    'Kylling bowl': 'Chicken bowl',
    'Libapizza med skinke & mozzarella': 'Liba pizza with ham & mozzarella',
    'Laks med mango- og avokadosalat + ris': 'Salmon with mango & avocado salad + rice',
    'Innbakt pizza': 'Folded pizza',
    'Enchiladas med kylling': 'Chicken enchiladas',
    'Asiatisk taco bowl': 'Asian taco bowl',
    'Fiskekakeburger med søtpotetfries': 'Fish cake burger with sweet potato fries',
    'Pulled chicken i wrap': 'Pulled chicken wrap',
    'Wok med scampi': 'Prawn stir-fry',
    'Vegetar nachos': 'Vegetarian nachos',
    'Kremet kylling & chorizo pasta': 'Creamy chicken & chorizo pasta',
    'Ovnsbakt torsk med grønnsaker & poteter': 'Oven-baked cod with vegetables & potatoes',
    'Ovnsbakt kyllingfilet med asiatisk fløtesaus': 'Oven-baked chicken breast with Asian cream sauce',
    'Gresk kjøttdeig i pita': 'Greek minced beef in pita',
    'Tacograteng': 'Taco casserole',
    'Lompelasagne': 'Lompe lasagna',
    'Hjemmelaget burger + søtpotetfries': 'Homemade burger + sweet potato fries',
    'Asiatisk kyllingsalat': 'Asian chicken salad',
    'Crockpot kremet kyllinggryte': 'Slow cooker creamy chicken stew',

    // Built-in ingredients and seeded freezer content.
    'libabrød': 'Liba bread',
    'tomat': 'tomato',
    'ruccola': 'arugula',
    'pizzasaus': 'pizza sauce',
    'rømme': 'sour cream',
    'kyllingfilet': 'chicken breast',
    'basmatiris': 'basmati rice',
    'hakkede tomater': 'chopped tomatoes',
    'matfløte': 'cooking cream',
    'gul løk': 'yellow onion',
    'hvitløk': 'garlic',
    'ingefær': 'ginger',
    'pizzamel': 'pizza flour',
    'gjær': 'yeast',
    'revet ost': 'grated cheese',
    'kjøttdeig': 'minced beef',
    'paprika': 'bell pepper',
    'hvalbiff': 'whale steak',
    'søtpotetfries': 'sweet potato fries',
    'asparges': 'asparagus',
    'brokkoli': 'broccoli',
    'laksefilet': 'salmon fillet',
    'spinat': 'spinach',
    'sitron': 'lemon',
    'svinekjøtt': 'pork',
    'pitabrød': 'pita bread',
    'gresk yoghurt': 'Greek yogurt',
    'agurk': 'cucumber',
    'rødløk': 'red onion',
    'biffstrimler': 'beef strips',
    'søtpotet': 'sweet potato',
    'avokado': 'avocado',
    'mais': 'corn',
    'ris': 'rice',
    'spagetti': 'spaghetti',
    'egg': 'eggs',
    'spekeskinke': 'cured ham',
    'soltørkede tomater': 'sun-dried tomatoes',
    'nudler': 'noodles',
    'gulrot': 'carrot',
    'woksaus': 'stir-fry sauce',
    'nachochips': 'nacho chips',
    'salmalaks': 'Salma salmon',
    'smør': 'butter',
    'skinke': 'ham',
    'tortillalefser': 'tortillas',
    'enchiladasaus': 'enchilada sauce',
    'fiskekaker': 'fish cakes',
    'burgerbrød': 'burger buns',
    'salat': 'salad',
    'fullkornswrap': 'wholegrain wraps',
    'bbq-saus': 'BBQ sauce',
    'scampi': 'prawns',
    'kidneybønner': 'kidney beans',
    'torskefilet': 'cod fillet',
    'poteter': 'potatoes',
    'soyasaus': 'soy sauce',
    'tacokrydder': 'taco seasoning',
    'burgerkjøtt': 'burger patties',
    'koriander': 'coriander',
    'Skivet bacon': 'Sliced bacon',
    'Laksefilet': 'Salmon fillet',
    'Grytekjøtt': 'Stew meat',
    'Kyllingfilet': 'Chicken breast',
    'Grønnsaker': 'Vegetables',
    'Bær': 'Berries',
    'Smoothiefrukt': 'Smoothie fruit',
    'Okse indrefilet': 'Beef tenderloin',
    'Pizzasnurrer': 'Pizza rolls',
    'Boller': 'Buns',
    'diverse': 'assorted',
    'flere': 'several',
    '1 middag': '1 dinner',
    '1 x 2 fileter': '1 x 2 fillets',

    'Mandag': 'Monday',
    'Tirsdag': 'Tuesday',
    'Onsdag': 'Wednesday',
    'Torsdag': 'Thursday',
    'Fredag': 'Friday',
    'Lørdag': 'Saturday',
    'Søndag': 'Sunday'
  };

  const NO_FROM_EN = Object.fromEntries(Object.entries(EN).map(([no, en]) => [en, no]));
  const DAYS = {
    Mandag: 'Monday', Tirsdag: 'Tuesday', Onsdag: 'Wednesday', Torsdag: 'Thursday',
    Fredag: 'Friday', Lørdag: 'Saturday', Søndag: 'Sunday'
  };
  const LOWER_DAYS = Object.fromEntries(Object.entries(DAYS).map(([no, en]) => [no.toLowerCase(), en]));

  const textBase = new WeakMap();
  const attrBase = new WeakMap();
  let currentLanguage = readInitialLanguage();
  let observer;

  function readInitialLanguage() {
    const query = new URLSearchParams(location.search).get('lang');
    if (SUPPORTED.has(query)) return query;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (SUPPORTED.has(saved)) return saved;
    } catch (_) {}
    return 'no';
  }

  function translateCore(core, lang = currentLanguage) {
    if (!core) return core;

    if (lang === 'no') {
      return NO_FROM_EN[core] || core;
    }

    if (EN[core]) return EN[core];

    // Common quantity units used by the built-in meal data.
    let qty = core;
    qty = qty.replace(/^(\d+) stk$/, (_, n) => `${n} pcs`);
    qty = qty.replace(/^(\d+) pk$/, (_, n) => `${n} ${n === '1' ? 'pack' : 'packs'}`);
    qty = qty.replace(/^(\d+) pose$/, (_, n) => `${n} ${n === '1' ? 'bag' : 'bags'}`);
    qty = qty.replace(/^(\d+) poser$/, (_, n) => `${n} bags`);
    qty = qty.replace(/^(\d+) glass$/, (_, n) => `${n} ${n === '1' ? 'jar' : 'jars'}`);
    qty = qty.replace(/^(\d+) beger$/, (_, n) => `${n} ${n === '1' ? 'tub' : 'tubs'}`);
    qty = qty.replace(/^(\d+) boks$/, (_, n) => `${n} ${n === '1' ? 'can' : 'cans'}`);
    qty = qty.replace(/^(\d+) bokser$/, (_, n) => `${n} cans`);
    qty = qty.replace(/^(\d+) flaske$/, (_, n) => `${n} ${n === '1' ? 'bottle' : 'bottles'}`);
    qty = qty.replace(/^(\d+) bunt$/, (_, n) => `${n} ${n === '1' ? 'bunch' : 'bunches'}`);
    if (qty !== core) return qty;

    // Dynamic strings generated by app.js.
    let m;
    if ((m = core.match(/^Profilen «(.+)» er klar$/))) return `Profile “${m[1]}” is ready`;
    if ((m = core.match(/^Åpnet «(.+)»$/))) return `Opened “${m[1]}”`;
    if ((m = core.match(/^Synkronisert med «(.+)»$/))) return `Synced with “${m[1]}”`;
    if ((m = core.match(/^Slette «(.+)» fra denne profilen\?$/))) return `Delete “${m[1]}” from this profile?`;
    if ((m = core.match(/^Byttet (mandag|tirsdag|onsdag|torsdag|fredag|lørdag|søndag) og (mandag|tirsdag|onsdag|torsdag|fredag|lørdag|søndag)$/i))) {
      return `Swapped ${LOWER_DAYS[m[1].toLowerCase()]} and ${LOWER_DAYS[m[2].toLowerCase()]}`;
    }
    if ((m = core.match(/^Flyttet (mandag|tirsdag|onsdag|torsdag|fredag|lørdag|søndag) til (mandag|tirsdag|onsdag|torsdag|fredag|lørdag|søndag)$/i))) {
      return `Moved ${LOWER_DAYS[m[1].toLowerCase()]} to ${LOWER_DAYS[m[2].toLowerCase()]}`;
    }
    if ((m = core.match(/^(Mandag|Tirsdag|Onsdag|Torsdag|Fredag|Lørdag|Søndag): (.+)\. Uka er låst\.$/))) {
      const meal = m[2] === 'ingen middag' ? 'no dinner' : m[2];
      return `${DAYS[m[1]]}: ${meal}. The week is locked.`;
    }
    if ((m = core.match(/^(Mandag|Tirsdag|Onsdag|Torsdag|Fredag|Lørdag|Søndag): (.+)\. Dra for å flytte eller klikk for å endre\.$/))) {
      return `${DAYS[m[1]]}: ${m[2]}. Drag to move or click to change.`;
    }
    if ((m = core.match(/^(Mandag|Tirsdag|Onsdag|Torsdag|Fredag|Lørdag|Søndag): ingen middag\. Klikk for å velge\.$/))) {
      return `${DAYS[m[1]]}: no dinner. Click to choose.`;
    }
    if ((m = core.match(/^Dra (.+) fra (Mandag|Tirsdag|Onsdag|Torsdag|Fredag|Lørdag|Søndag)$/))) {
      return `Drag ${m[1]} from ${DAYS[m[2]]}`;
    }
    if ((m = core.match(/^Til (.+)$/))) return `For ${m[1]}`;

    // Strings such as "Kylling · Egen · favoritt".
    if (core.includes(' · ')) {
      return core.split(' · ').map(part => EN[part] || part).join(' · ');
    }

    return core;
  }

  function translateString(value, lang = currentLanguage) {
    if (typeof value !== 'string' || !value.trim()) return value;
    const match = value.match(/^(\s*)([\s\S]*?)(\s*)$/);
    const lead = match?.[1] || '';
    const core = match?.[2] || value;
    const tail = match?.[3] || '';
    return lead + translateCore(core, lang) + tail;
  }

  function processTextNode(node, capture = false) {
    if (!node || node.nodeType !== Node.TEXT_NODE || !node.nodeValue?.trim()) return;
    if (capture || !textBase.has(node)) textBase.set(node, node.nodeValue);
    const source = textBase.get(node);
    node.nodeValue = translateString(source);
  }

  function processAttributes(el, captureAttrs = null) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return;
    let base = attrBase.get(el);
    if (!base) {
      base = {};
      attrBase.set(el, base);
    }

    for (const attr of ATTRS) {
      if (!el.hasAttribute(attr)) continue;
      if (captureAttrs?.has(attr) || !(attr in base)) base[attr] = el.getAttribute(attr);
      el.setAttribute(attr, translateString(base[attr]));
    }
  }

  function processTree(root) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      processTextNode(root);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;
    if (root.nodeType === Node.ELEMENT_NODE) processAttributes(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeType === Node.TEXT_NODE) processTextNode(node);
      else processAttributes(node);
    }
  }

  function updateHead() {
    document.documentElement.lang = currentLanguage === 'en' ? 'en' : 'no';
    document.title = currentLanguage === 'en' ? 'Meal planner | rusti.no' : 'Matplanlegger | rusti.no';
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = currentLanguage === 'en'
        ? 'Household meal planner – weekly plan, meal library, freezer and shopping list in one place.'
        : 'Matplanlegger for husholdningen – ukesplan, middagsbank, fryser og handleliste på ett sted.';
    }
  }

  function updateToggle() {
    document.querySelectorAll('[data-language]').forEach(button => {
      const active = button.dataset.language === currentLanguage;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    const group = document.getElementById('languageToggle');
    if (group) group.setAttribute('aria-label', currentLanguage === 'en' ? 'Choose language' : 'Velg språk');
  }

  function syncLanguageToUrl() {
    const url = new URL(location.href);
    if (currentLanguage === 'en') url.searchParams.set('lang', 'en');
    else url.searchParams.delete('lang');
    history.replaceState(null, '', url);
  }

  function applyLanguage() {
    observer?.disconnect();
    updateHead();
    processTree(document.body);
    updateToggle();
    observer?.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      characterDataOldValue: true,
      attributes: true,
      attributeFilter: ATTRS
    });
  }

  function setLanguage(lang, persist = true) {
    if (!SUPPORTED.has(lang)) return;
    currentLanguage = lang;
    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, lang); } catch (_) {}
      syncLanguageToUrl();
    }
    applyLanguage();
    window.dispatchEvent(new CustomEvent('matplan:languagechange', { detail: { language: lang } }));
  }

  function installToggle() {
    if (document.getElementById('languageToggle')) return;
    const host = document.querySelector('.profile-tools');
    if (!host) return;

    const style = document.createElement('style');
    style.textContent = `
      .language-toggle{display:inline-flex;align-items:center;padding:3px;border:1px solid var(--line,#d9d5ca);border-radius:999px;background:var(--surface,#fff);gap:2px;flex:0 0 auto}
      .language-toggle button{appearance:none;border:0;background:transparent;color:inherit;font:inherit;font-size:.72rem;font-weight:800;line-height:1;padding:7px 8px;border-radius:999px;cursor:pointer;letter-spacing:.04em}
      .language-toggle button.active{background:var(--text,#161613);color:var(--bg,#f4f1e8)}
      .language-toggle button:focus-visible{outline:2px solid currentColor;outline-offset:2px}
      @media(max-width:720px){.language-toggle button{padding:7px 7px}.language-toggle{order:-1}}
    `;
    document.head.appendChild(style);

    const wrap = document.createElement('div');
    wrap.id = 'languageToggle';
    wrap.className = 'language-toggle';
    wrap.setAttribute('role', 'group');
    wrap.innerHTML = `
      <button type="button" data-language="no" aria-pressed="false">NO</button>
      <button type="button" data-language="en" aria-pressed="false">EN</button>
    `;
    wrap.addEventListener('click', event => {
      const button = event.target.closest('[data-language]');
      if (button) setLanguage(button.dataset.language);
    });

    host.insertBefore(wrap, host.firstChild);
  }

  function installDialogTranslation() {
    const nativeAlert = window.alert.bind(window);
    const nativeConfirm = window.confirm.bind(window);
    const nativePrompt = window.prompt.bind(window);
    window.alert = message => nativeAlert(translateString(String(message ?? '')));
    window.confirm = message => nativeConfirm(translateString(String(message ?? '')));
    window.prompt = (message, defaultValue) => nativePrompt(translateString(String(message ?? '')), defaultValue);
  }

  observer = new MutationObserver(mutations => {
    observer.disconnect();
    for (const mutation of mutations) {
      if (mutation.type === 'characterData') {
        if (mutation.target.nodeValue?.trim()) {
          textBase.set(mutation.target, mutation.target.nodeValue);
          processTextNode(mutation.target);
        }
      } else if (mutation.type === 'attributes') {
        const base = attrBase.get(mutation.target) || {};
        base[mutation.attributeName] = mutation.target.getAttribute(mutation.attributeName);
        attrBase.set(mutation.target, base);
        processAttributes(mutation.target, new Set([mutation.attributeName]));
      } else if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(processTree);
      }
    }
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      characterDataOldValue: true,
      attributes: true,
      attributeFilter: ATTRS
    });
  });

  installToggle();
  installDialogTranslation();
  applyLanguage();

  window.MatplanI18n = {
    get language() { return currentLanguage; },
    setLanguage,
    translate: value => translateString(value)
  };
})();
