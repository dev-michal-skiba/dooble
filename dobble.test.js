const { test } = require('node:test');
const assert = require('node:assert/strict');
const { findLargestPrime, getCardInfo, generateCards } = require('./dobble.js');

const IMAGE_COUNT = 57;
const REPETITIONS = 100;

test(`generateCards produces valid Dobble deck from ${IMAGE_COUNT} images (x${REPETITIONS})`, () => {
    const p = findLargestPrime(IMAGE_COUNT);
    assert.equal(p, 7, `Expected largest prime p=7 for ${IMAGE_COUNT} images`);

    const { totalCards, symbolsPerCard, totalSymbols } = getCardInfo(IMAGE_COUNT);
    assert.equal(totalCards, 57, 'Expected 57 cards');
    assert.equal(symbolsPerCard, 8, 'Expected 8 symbols per card');
    assert.equal(totalSymbols, 57, 'Expected 57 distinct symbols');

    for (let run = 0; run < REPETITIONS; run++) {
        const cards = generateCards(p);

        assert.equal(
            cards.length,
            totalCards,
            `Run ${run + 1}: expected ${totalCards} cards, got ${cards.length}`
        );

        for (let i = 0; i < cards.length; i++) {
            assert.equal(
                cards[i].length,
                symbolsPerCard,
                `Run ${run + 1}, card ${i}: expected ${symbolsPerCard} symbols, got ${cards[i].length}`
            );
        }

        for (let i = 0; i < cards.length; i++) {
            const setA = new Set(cards[i]);
            for (let j = i + 1; j < cards.length; j++) {
                const shared = cards[j].filter(sym => setA.has(sym));
                assert.equal(
                    shared.length,
                    1,
                    `Run ${run + 1}, cards ${i} and ${j} share ${shared.length} symbols (expected exactly 1)`
                );
            }
        }
    }
});
