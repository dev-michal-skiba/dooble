// ============================================================
// Dobble Card Generator - Translations (Polish default, English)
// ============================================================

const DEFAULT_LANG = 'pl';
const LANG_STORAGE_KEY = 'dobble-lang';

// Plural forms are separated by "|":
//   pl: one|few|many (1 obrazek, 2 obrazki, 5 obrazków)
//   en: one|other
const TRANSLATIONS = {
    pl: {
        'title': 'Generator kart Dobble',
        'subtitle': 'Stwórz własne karty do gry Dobble z własnych obrazków i wydrukuj je',
        'lang.toggle': 'Zmień język na angielski',

        'help.title': 'Jak to działa?',
        'help.what': 'Dobble to gra, w której <strong>każde dwie karty mają dokładnie jeden wspólny obrazek</strong>. Wygrywa ten, kto najszybciej go znajdzie. Tutaj zrobisz własną talię z własnych zdjęć lub rysunków.',
        'help.howMany.title': 'Ile obrazków przygotować?',
        'help.howMany.text': 'Liczba kart zależy od liczby obrazków. Gra działa tylko dla określonych liczb obrazków:',
        'help.table.images': 'Obrazki',
        'help.table.cards': 'Karty',
        'help.table.perCard': 'Obrazków na karcie',
        'help.table.recommended': 'zalecane',
        'help.recommend': 'Najlepiej przygotuj <strong>57 obrazków</strong> — tak jak w oryginalnej grze. Jeśli dodasz liczbę spoza tabeli (np. 40), użyta zostanie najbliższa mniejsza talia (31 kart), a nadmiarowe obrazki zostaną pominięte.',
        'help.steps.title': 'Krok po kroku',
        'help.steps.1': 'Wybierz obrazki na przód kart (wszystkie naraz).',
        'help.steps.2': 'Wybierz jeden obrazek na tył kart.',
        'help.steps.3': 'Ustaw, ile kart ma się zmieścić na stronie A4.',
        'help.steps.4': 'Kliknij „Wygeneruj i pobierz” i wydrukuj plik PDF.',
        'help.tips.title': 'Wskazówki',
        'help.tips.1': 'Wybieraj proste, wyraźnie różniące się od siebie obrazki.',
        'help.tips.2': 'Drukuj dwustronnie, z obracaniem wzdłuż dłuższej krawędzi (ustawienie domyślne w większości drukarek).',
        'help.tips.3': 'Użyj grubszego papieru (200–300 g/m²), aby karty były trwałe.',
        'help.tips.4': 'Wytnij karty wzdłuż okręgów.',

        'upload.title': '1. Wgraj obrazki',
        'upload.front': 'Obrazki na przód kart (możesz zaznaczyć wiele):',
        'upload.back': 'Obrazek na tył kart:',

        'layout.title': '2. Układ strony',
        'layout.cardsPerPage': 'Kart na stronie:',
        'layout.diameter': 'Średnica karty (mm):',
        'layout.previewDiameter': 'Średnica karty: {d} mm',

        'generate.title': '3. Wygeneruj PDF',
        'generate.button': 'Wygeneruj i pobierz',
        'generate.error': 'Nie udało się wygenerować PDF: {message}',

        'unit.image': 'obrazek|obrazki|obrazków',
        'unit.card': 'karta|karty|kart',

        'stats.tooFew': 'Wgrano {n} {images}. Potrzeba co najmniej 7 (zalecane 57).',
        'stats.uploaded': 'Wgrane obrazki: <strong>{n}</strong>',
        'stats.cards': 'Liczba kart: <strong>{n}</strong>',
        'stats.perCard': 'Obrazków na karcie: <strong>{n}</strong>',
        'stats.used': 'Użyte obrazki: <strong>{n}</strong>',
        'stats.unused': 'Pominięte obrazki: <strong>{n}</strong> (ostatnie z listy)',
        'stats.nextLevel': 'Dodaj jeszcze {missing} {images}, aby talia miała {cards} {cardsWord}.',
        'stats.perfect': 'Idealnie — pełna talia jak w oryginalnej grze!',
    },
    en: {
        'title': 'Dobble Card Generator',
        'subtitle': 'Create your own printable Dobble (Spot It!) cards from your own images',
        'lang.toggle': 'Change language to Polish',

        'help.title': 'How does it work?',
        'help.what': 'Dobble (Spot It!) is a game where <strong>any two cards share exactly one picture</strong>. Whoever spots it first wins. Here you can make your own deck from your own photos or drawings.',
        'help.howMany.title': 'How many images do I need?',
        'help.howMany.text': 'The number of cards depends on the number of images. The game only works with specific image counts:',
        'help.table.images': 'Images',
        'help.table.cards': 'Cards',
        'help.table.perCard': 'Images per card',
        'help.table.recommended': 'recommended',
        'help.recommend': 'For the best result prepare <strong>57 images</strong> — just like the original game. If you add a number not in the table (e.g. 40), the nearest smaller deck is used (31 cards) and the extra images are skipped.',
        'help.steps.title': 'Step by step',
        'help.steps.1': 'Select the images for the card fronts (all at once).',
        'help.steps.2': 'Select one image for the card backs.',
        'help.steps.3': 'Choose how many cards fit on an A4 page.',
        'help.steps.4': 'Click "Generate and Download" and print the PDF.',
        'help.tips.title': 'Tips',
        'help.tips.1': 'Use simple images that are clearly different from each other.',
        'help.tips.2': 'Print double-sided, flipping on the long edge (the default on most printers).',
        'help.tips.3': 'Use thicker paper (200–300 gsm) for durable cards.',
        'help.tips.4': 'Cut the cards out along the circles.',

        'upload.title': '1. Upload Card Images',
        'upload.front': 'Front images (select multiple):',
        'upload.back': 'Card back image:',

        'layout.title': '2. Page Layout',
        'layout.cardsPerPage': 'Cards per page:',
        'layout.diameter': 'Card diameter (mm):',
        'layout.previewDiameter': 'Card diameter: {d} mm',

        'generate.title': '3. Generate PDF',
        'generate.button': 'Generate and Download',
        'generate.error': 'PDF generation failed: {message}',

        'unit.image': 'image|images',
        'unit.card': 'card|cards',

        'stats.tooFew': '{n} {images} uploaded. You need at least 7 (57 recommended).',
        'stats.uploaded': 'Images uploaded: <strong>{n}</strong>',
        'stats.cards': 'Cards to generate: <strong>{n}</strong>',
        'stats.perCard': 'Images per card: <strong>{n}</strong>',
        'stats.used': 'Images used: <strong>{n}</strong>',
        'stats.unused': 'Images skipped: <strong>{n}</strong> (the last ones in the list)',
        'stats.nextLevel': 'Add {missing} more {images} to get a deck of {cards} {cardsWord}.',
        'stats.perfect': 'Perfect — a full deck just like the original game!',
    },
};

let currentLang = DEFAULT_LANG;

function loadLang() {
    try {
        const stored = localStorage.getItem(LANG_STORAGE_KEY);
        if (stored && TRANSLATIONS[stored]) return stored;
    } catch (e) { /* storage unavailable - use default */ }
    return DEFAULT_LANG;
}

function getLang() {
    return currentLang;
}

function setLang(lang) {
    if (!TRANSLATIONS[lang]) return;
    currentLang = lang;
    try {
        localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch (e) { /* storage unavailable - choice lasts for this visit only */ }
}

function t(key, params = {}) {
    let text = TRANSLATIONS[currentLang][key] ?? TRANSLATIONS[DEFAULT_LANG][key] ?? key;
    return text.replace(/\{(\w+)\}/g, (match, name) => (name in params ? params[name] : match));
}

// Pick the correct plural form of a "|"-separated translation for count n.
function tn(key, n) {
    const forms = t(key).split('|');
    if (currentLang === 'pl') {
        if (n === 1) return forms[0];
        const lastDigit = n % 10;
        const lastTwo = n % 100;
        if (lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14)) return forms[1];
        return forms[2];
    }
    return n === 1 ? forms[0] : forms[1];
}

function applyTranslations() {
    document.documentElement.lang = currentLang;
    document.title = t('title');
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = t(el.dataset.i18n);
    });
    // Only our own static translation strings are rendered as HTML
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
        el.innerHTML = t(el.dataset.i18nHtml);
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
        el.setAttribute('aria-label', t(el.dataset.i18nAria));
        el.title = t(el.dataset.i18nAria);
    });
}

currentLang = loadLang();

if (typeof module !== 'undefined') {
    module.exports = { TRANSLATIONS, DEFAULT_LANG, getLang, setLang, t, tn };
}
