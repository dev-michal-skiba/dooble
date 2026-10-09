const { test } = require('node:test');
const assert = require('node:assert/strict');
const { TRANSLATIONS, DEFAULT_LANG, getLang, setLang, t, tn } = require('./i18n.js');

test('default language is Polish', () => {
    assert.equal(DEFAULT_LANG, 'pl');
    assert.equal(getLang(), 'pl');
});

test('Polish and English define the same keys', () => {
    const plKeys = Object.keys(TRANSLATIONS.pl).sort();
    const enKeys = Object.keys(TRANSLATIONS.en).sort();
    assert.deepEqual(enKeys, plKeys);
});

test('no translation is empty', () => {
    for (const [lang, strings] of Object.entries(TRANSLATIONS)) {
        for (const [key, value] of Object.entries(strings)) {
            assert.ok(value.trim().length > 0, `${lang}.${key} is empty`);
        }
    }
});

test('placeholders match between languages', () => {
    const placeholders = (s) => (s.match(/\{\w+\}/g) || []).sort();
    for (const key of Object.keys(TRANSLATIONS.pl)) {
        assert.deepEqual(
            placeholders(TRANSLATIONS.en[key]),
            placeholders(TRANSLATIONS.pl[key]),
            `Placeholder mismatch for "${key}"`
        );
    }
});

test('t() substitutes placeholders and falls back to the key', () => {
    setLang('en');
    assert.equal(t('layout.previewDiameter', { d: '42.0' }), 'Card diameter: 42.0 mm');
    assert.equal(t('no.such.key'), 'no.such.key');
    setLang('pl');
    assert.equal(t('layout.previewDiameter', { d: '42.0' }), 'Średnica karty: 42.0 mm');
});

test('tn() picks correct Polish plural forms', () => {
    setLang('pl');
    const cases = { 1: 'obrazek', 2: 'obrazki', 4: 'obrazki', 5: 'obrazków', 12: 'obrazków',
        17: 'obrazków', 22: 'obrazki', 31: 'obrazków', 57: 'obrazków', 133: 'obrazki' };
    for (const [n, expected] of Object.entries(cases)) {
        assert.equal(tn('unit.image', Number(n)), expected, `n=${n}`);
    }
});

test('tn() picks correct English plural forms', () => {
    setLang('en');
    assert.equal(tn('unit.card', 1), 'card');
    assert.equal(tn('unit.card', 57), 'cards');
    setLang('pl');
});
