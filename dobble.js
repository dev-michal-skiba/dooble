// ============================================================
// Dobble Card Generator - Core Logic
// ============================================================

// --- Prime utilities ---

function isPrime(n) {
    if (n < 2) return false;
    for (let i = 2; i * i <= n; i++) {
        if (n % i === 0) return false;
    }
    return true;
}

function findLargestPrime(imageCount) {
    for (let p = Math.floor(Math.sqrt(imageCount)); p >= 2; p--) {
        if (isPrime(p) && p * p + p + 1 <= imageCount) return p;
    }
    return 2;
}

function getCardInfo(imageCount) {
    const p = findLargestPrime(imageCount);
    const totalCards = p * p + p + 1;
    const symbolsPerCard = p + 1;
    const totalSymbols = p * p + p + 1;
    return { p, totalCards, symbolsPerCard, totalSymbols };
}

// --- Finite Projective Plane card generation ---

function generateCards(p) {
    const cards = [];

    // Type 1: p^2 cards — lines y = mx + c over Z_p
    for (let m = 0; m < p; m++) {
        for (let c = 0; c < p; c++) {
            const card = [];
            for (let i = 0; i < p; i++) {
                card.push(i * p + ((m * i + c) % p));
            }
            card.push(p * p + m); // point at infinity for slope m
            cards.push(card);
        }
    }

    // Type 2: p cards — vertical lines x = a
    for (let a = 0; a < p; a++) {
        const card = [];
        for (let j = 0; j < p; j++) {
            card.push(a * p + j);
        }
        card.push(p * p + p); // the infinity-of-infinities point
        cards.push(card);
    }

    // Type 3: 1 card — the line at infinity
    const card = [];
    for (let i = 0; i <= p; i++) {
        card.push(p * p + i);
    }
    cards.push(card);

    return cards;
}

// --- Deterministic PRNG (seeded LCG) ---

function seededRand(seed) {
    let s = (seed + 1) | 0;
    return function () {
        s = (Math.imul(s, 1664525) + 1013904223) | 0;
        return (s >>> 0) / 4294967296;
    };
}

// --- Layout: deterministic positions & sizes, cached per symbol count ---
// All coordinates are in unit-circle space (R = 1). Scale by actual R at render time.

const sizesCache = {};
const TARGET_FILL = 0.75; // target ratio of total image area to circle area
const EFFECTIVE_R = 0.99; // unit circle minus 1% margin

// Returns the image sizes for a given symbol count (cached — same for all cards).
function getSizes(count) {
    if (sizesCache[count]) return sizesCache[count];

    const weights = Array.from({ length: count }, (_, i) => {
        const t = count > 1 ? i / (count - 1) : 0;
        return 1 - 0.5 * t;
    });
    const sumSqWeights = weights.reduce((s, w) => s + w * w, 0);

    const fillMaxSize = Math.sqrt(TARGET_FILL * Math.PI * EFFECTIVE_R * EFFECTIVE_R / sumSqWeights);
    const fitMaxSize = findMaxSize(weights, EFFECTIVE_R);
    const maxSize = Math.min(fillMaxSize, fitMaxSize);

    sizesCache[count] = weights.map(w => maxSize * w);
    return sizesCache[count];
}

// Returns a fresh random layout for each call — every card gets its own arrangement.
function getLayout(count) {
    return computePlacements(getSizes(count), EFFECTIVE_R);
}

// Binary search: largest maxSize where weighted images all fit in effectiveR.
function findMaxSize(weights, effectiveR) {
    let lo = 0;
    let hi = effectiveR * Math.SQRT2; // absolute max: corners just touch circle

    for (let iter = 0; iter < 40; iter++) {
        const mid = (lo + hi) / 2;
        const rand = seededRand(weights.length * 1999 + 7); // same seed every iter → deterministic
        const sizes = weights.map(w => mid * w);
        const result = placeAll(sizes, effectiveR, rand, false);
        if (result !== null) lo = mid; else hi = mid;
    }
    return lo;
}

// Place all images with the given sizes. Returns placement array on success, null on failure.
// With allowFallback=true uses best-of-N candidate selection + sector fallback.
function placeAll(sizes, effectiveR, rand, allowFallback) {
    const placements = [];

    for (let idx = 0; idx < sizes.length; idx++) {
        const size = sizes[idx];
        const maxDist = effectiveR - size * Math.SQRT2 / 2;

        if (!allowFallback) {
            // Binary-search mode: first-fit is sufficient
            let placed = false;
            for (let attempt = 0; attempt < 300 && !placed; attempt++) {
                const angle = rand() * Math.PI * 2;
                const dist = maxDist > 0 ? rand() * maxDist : 0;
                const x = Math.cos(angle) * dist;
                const y = Math.sin(angle) * dist;
                const rotation = Math.PI / 2 - angle;

                if (!fitsInCircle(x, y, size, rotation, effectiveR)) continue;
                if (hasOverlap(placements, x, y, size, rotation)) continue;

                placements.push({ x, y, size, rotation });
                placed = true;
            }
            if (!placed) return null;
        } else {
            // Final placement: pick the best of a few valid candidates
            let bestCandidate = null;
            let bestScore = -Infinity;
            let validCount = 0;
            const targetCandidates = 10;

            for (let attempt = 0; attempt < 1000       && validCount < targetCandidates; attempt++) {
                const angle = rand() * Math.PI * 2;
                const dist = maxDist > 0 ? rand() * maxDist : 0;
                const x = Math.cos(angle) * dist;
                const y = Math.sin(angle) * dist;
                const rotation = Math.PI / 2 - angle;

                if (!fitsInCircle(x, y, size, rotation, effectiveR)) continue;
                if (hasOverlap(placements, x, y, size, rotation)) continue;

                // Score = minimum distance to any neighbor or boundary
                let minDist = effectiveR - Math.sqrt(x * x + y * y);
                for (const p of placements) {
                    const d = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
                    minDist = Math.min(minDist, d);
                }

                if (minDist > bestScore) {
                    bestScore = minDist;
                    bestCandidate = { x, y, size, rotation };
                }
                validCount++;
            }

            if (bestCandidate) {
                placements.push(bestCandidate);
            } else {
                // Fallback: sector position at reduced size
                const a = (idx / sizes.length) * Math.PI * 2;
                const d = Math.max(0, (effectiveR - size * Math.SQRT2 / 2) * 0.3);
                placements.push({
                    x: Math.cos(a) * d,
                    y: Math.sin(a) * d,
                    size: size * 0.6,
                    rotation: Math.PI / 2 - a
                });
            }
        }
    }

    return placements;
}

// Compute placement with a random seed — each call produces a different layout.
function computePlacements(sizes, effectiveR) {
    const rand = seededRand((Math.random() * 0xFFFFFF) | 0);
    return placeAll(sizes, effectiveR, rand, true);
}

// --- Circle / overlap checks ---

function fitsInCircle(x, y, size, rotation, R) {
    const half = size / 2;
    const corners = [[-half, -half], [half, -half], [half, half], [-half, half]];
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    for (const [cx, cy] of corners) {
        const rx = x + cx * cos - cy * sin;
        const ry = y + cx * sin + cy * cos;
        if (rx * rx + ry * ry > R * R) return false;
    }
    return true;
}

// Exact OBB-OBB overlap test using the Separating Axis Theorem.
// Returns true if the two squares overlap, false if they are separated.
function squaresOverlap(ax, ay, sa, ra, bx, by, sb, rb) {
    const ha = sa / 2;
    const hb = sb / 2;
    const dx = bx - ax;
    const dy = by - ay;

    // Test the 4 separating axes: 2 edge normals from A, 2 from B
    const axes = [
        [Math.cos(ra),  Math.sin(ra)],
        [-Math.sin(ra), Math.cos(ra)],
        [Math.cos(rb),  Math.sin(rb)],
        [-Math.sin(rb), Math.cos(rb)]
    ];

    for (const [nx, ny] of axes) {
        // Distance between centres projected onto this axis
        const sep = Math.abs(dx * nx + dy * ny);
        // Half-extent of each square projected onto this axis
        // For a square with half-size h and rotation r:
        //   extent = h * (|cos(r)*nx + sin(r)*ny| + |-sin(r)*nx + cos(r)*ny|)
        const extA = ha * (Math.abs(Math.cos(ra) * nx + Math.sin(ra) * ny) +
                           Math.abs(-Math.sin(ra) * nx + Math.cos(ra) * ny));
        const extB = hb * (Math.abs(Math.cos(rb) * nx + Math.sin(rb) * ny) +
                           Math.abs(-Math.sin(rb) * nx + Math.cos(rb) * ny));
        if (sep > extA + extB) return false; // separating axis found → no overlap
    }
    return true; // no separating axis found → overlap
}

function hasOverlap(placements, x, y, size, rotation) {
    for (const p of placements) {
        if (squaresOverlap(p.x, p.y, p.size, p.rotation, x, y, size, rotation)) return true;
    }
    return false;
}

// --- Card rendering on canvas ---

function renderCardToCanvas(canvas, images, symbolIndices, diameterPx) {
    canvas.width = diameterPx;
    canvas.height = diameterPx;
    const ctx = canvas.getContext('2d');
    const cx = diameterPx / 2;
    const cy = diameterPx / 2;
    const R = diameterPx / 2;

    ctx.clearRect(0, 0, diameterPx, diameterPx);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, diameterPx, diameterPx);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R - 1, 0, Math.PI * 2);
    ctx.clip();

    // Layout slots (position/size) are fixed; randomly assign which symbol gets which slot
    const layout = getLayout(symbolIndices.length);
    const shuffled = [...symbolIndices];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    for (let i = 0; i < layout.length; i++) {
        const img = images[shuffled[i]];
        const pl = layout[i];
        if (!img || !pl) continue;

        ctx.save();
        ctx.translate(cx + pl.x * R, cy + pl.y * R);
        ctx.rotate(pl.rotation);
        const halfSize = (pl.size * R) / 2;
        ctx.drawImage(img, -halfSize, -halfSize, pl.size * R, pl.size * R);
        ctx.restore();
    }

    ctx.restore();

    // Draw circle border
    ctx.beginPath();
    ctx.arc(cx, cy, R - 2, 0, Math.PI * 2);
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = Math.max(2, diameterPx * 0.006);
    ctx.stroke();
}

// --- Render card back ---

function renderBackToCanvas(canvas, backImage, diameterPx) {
    canvas.width = diameterPx;
    canvas.height = diameterPx;
    const ctx = canvas.getContext('2d');
    const cx = diameterPx / 2;
    const cy = diameterPx / 2;
    const R = diameterPx / 2;

    ctx.clearRect(0, 0, diameterPx, diameterPx);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, diameterPx, diameterPx);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R - 1, 0, Math.PI * 2);
    ctx.clip();

    // Draw back image covering the circle (center-crop)
    const imgW = backImage.naturalWidth || backImage.width;
    const imgH = backImage.naturalHeight || backImage.height;
    const scale = Math.max(diameterPx / imgW, diameterPx / imgH);
    const drawW = imgW * scale;
    const drawH = imgH * scale;
    ctx.drawImage(backImage, cx - drawW / 2, cy - drawH / 2, drawW, drawH);

    ctx.restore();

    // Border
    ctx.beginPath();
    ctx.arc(cx, cy, R - 2, 0, Math.PI * 2);
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = Math.max(2, diameterPx * 0.006);
    ctx.stroke();
}

// --- PDF generation ---

const MIN_CARD_GAP = 6; // mm — minimum space between adjacent cards

async function generatePDF(frontImages, backImage, cols, rows, onProgress) {
    if (!window.jspdf) {
        throw new Error('jsPDF library failed to load. Please check your internet connection and try reloading the page.');
    }
    const { jsPDF } = window.jspdf;

    const pageW = 210; // A4 width mm
    const pageH = 297; // A4 height mm
    const margin = 10; // mm
    const usableW = pageW - 2 * margin;
    const usableH = pageH - 2 * margin;

    const cardDiameter = Math.min(
        (usableW - MIN_CARD_GAP * (cols + 1)) / cols,
        (usableH - MIN_CARD_GAP * (rows + 1)) / rows
    );
    const gutterX = (usableW - cardDiameter * cols) / (cols + 1);
    const gutterY = (usableH - cardDiameter * rows) / (rows + 1);
    const cardsPerPage = cols * rows;

    // Canvas resolution: ~250 DPI
    const diameterPx = Math.round(cardDiameter * 10);

    const info = getCardInfo(frontImages.length);
    const cards = generateCards(info.p);

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const canvas = document.createElement('canvas');

    const totalPages = Math.ceil(cards.length / cardsPerPage);
    let isFirstPage = true;

    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
        // --- Front page ---
        if (!isFirstPage) doc.addPage();
        isFirstPage = false;

        const startCard = pageIdx * cardsPerPage;
        const endCard = Math.min(startCard + cardsPerPage, cards.length);
        const cardPositions = [];

        for (let i = startCard; i < endCard; i++) {
            const localIdx = i - startCard;
            const col = localIdx % cols;
            const row = Math.floor(localIdx / cols);

            const x = margin + gutterX + col * (cardDiameter + gutterX);
            const y = margin + gutterY + row * (cardDiameter + gutterY);

            renderCardToCanvas(canvas, frontImages, cards[i], diameterPx);
            doc.addImage(canvas, 'PNG', x, y, cardDiameter, cardDiameter);
            cardPositions.push({ col, row });
        }

        // --- Back page (mirrored horizontally for long-edge flip) ---
        doc.addPage();

        for (let i = 0; i < cardPositions.length; i++) {
            const { col, row } = cardPositions[i];
            const mirroredCol = cols - 1 - col;

            const x = margin + gutterX + mirroredCol * (cardDiameter + gutterX);
            const y = margin + gutterY + row * (cardDiameter + gutterY);

            renderBackToCanvas(canvas, backImage, diameterPx);
            doc.addImage(canvas, 'PNG', x, y, cardDiameter, cardDiameter);
        }

        if (onProgress) {
            onProgress(Math.round(((pageIdx + 1) / totalPages) * 100));
            // Yield to browser for UI update
            await new Promise(r => setTimeout(r, 0));
        }
    }

    return doc.output('blob');
}
