const { test } = require('node:test');
const assert = require('node:assert/strict');
const { findLargestPrime, getCardInfo, generateCards, getSizes, getLayout, squaresOverlap } = require('./dobble.js');

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

// Image counts that map to each supported prime p:
//   p=2 →  7 images,  3 symbols/card
//   p=3 → 13 images,  4 symbols/card
//   p=4 → 21 images,  5 symbols/card  (p=4 is not prime; findLargestPrime returns 3 → 13 used)
//   p=5 → 31 images,  6 symbols/card
//   p=7 → 57 images,  8 symbols/card
const LAYOUT_TEST_CASES = [7, 13, 31, 57];
const LAYOUT_REPETITIONS = 20;

function hasAnyOverlap(placements) {
    for (let i = 0; i < placements.length; i++) {
        for (let j = i + 1; j < placements.length; j++) {
            const a = placements[i];
            const b = placements[j];
            if (squaresOverlap(a.x, a.y, a.size, a.rotation, b.x, b.y, b.size, b.rotation)) {
                return true;
            }
        }
    }
    return false;
}

for (const imageCount of LAYOUT_TEST_CASES) {
    const { symbolsPerCard } = getCardInfo(imageCount);

    test(`getLayout produces no overlapping images for ${imageCount} images (${symbolsPerCard} symbols/card, x${LAYOUT_REPETITIONS})`, () => {
        const sizes = getSizes(symbolsPerCard);

        for (let run = 0; run < LAYOUT_REPETITIONS; run++) {
            const layout = getLayout(symbolsPerCard);

            assert.equal(
                layout.length,
                symbolsPerCard,
                `Run ${run + 1}: expected ${symbolsPerCard} placements, got ${layout.length}`
            );

            assert.equal(
                hasAnyOverlap(layout),
                false,
                `Run ${run + 1}: overlapping images detected in layout for ${imageCount} images`
            );
        }
    });
}
