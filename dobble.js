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
                // Fallback: scan evenly-spaced sector positions at reduced size,
                // but still enforce the no-overlap constraint.
                const reducedSize = size * 0.65;
                const maxD = Math.max(0, effectiveR - reducedSize * Math.SQRT2 / 2);
                const sectors = Math.max(sizes.length * 6, 48);
                let placed = false;
                outer: for (let s = 0; s < sectors; s++) {
                    const a = (s / sectors) * Math.PI * 2;
                    for (let step = 0; step <= 5; step++) {
                        const d = maxD * (step / 5);
                        const x = Math.cos(a) * d;
                        const y = Math.sin(a) * d;
                        const rotation = Math.PI / 2 - a;
                        if (fitsInCircle(x, y, reducedSize, rotation, effectiveR) &&
                            !hasOverlap(placements, x, y, reducedSize, rotation)) {
                            placements.push({ x, y, size: reducedSize, rotation });
                            placed = true;
                            break outer;
                        }
                    }
                }
                if (!placed) return null;
            }
        }
    }

    return placements;
}

// Compute placement with a random seed — retries with smaller sizes until a
// fully overlap-free layout is found.
function computePlacements(sizes, effectiveR) {
    for (let scale = 1.0; scale >= 0.4; scale -= 0.05) {
        const scaledSizes = scale === 1.0 ? sizes : sizes.map(s => s * scale);
        const attempts = scale < 0.8 ? 60 : 30;
        for (let i = 0; i < attempts; i++) {
            const rand = seededRand((Math.random() * 0xFFFFFF) | 0);
            const result = placeAll(scaledSizes, effectiveR, rand, true);
            if (result !== null) return result;
        }
    }
    // Absolute last resort — tiny images spread around the circle
    return sizes.map((_, i) => {
        const a = (i / sizes.length) * Math.PI * 2;
        return { x: Math.cos(a) * effectiveR * 0.3, y: Math.sin(a) * effectiveR * 0.3, size: 0.05, rotation: 0 };
    });
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
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
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
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
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

    // Border — same inset logic as front to keep stroke within canvas bounds
    const borderLW = Math.max(2, Math.round(diameterPx * 0.006));
    ctx.beginPath();
    ctx.arc(cx, cy, R - Math.ceil(borderLW / 2) - 1, 0, Math.PI * 2);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = borderLW;
    ctx.stroke();
}

// --- PDF generation ---

const MIN_CARD_GAP = 6; // mm — minimum space between adjacent cards and page borders
const PX_PER_MM = 300 / 25.4; // 300 DPI

// Available centre-coordinate space on A4 with 10mm margin + 6mm gap on each side:
// x: 178mm wide, y: 265mm tall. Page centre at (105, 148.5).
const CENTRE_W = 178;
const CENTRE_H = 265;
const PAGE_CENTRE_X = 105;
const PAGE_CENTRE_Y = 148.5;

// For 2-4 cards, a zigzag alternating between x=0 and x=(CENTRE_W-D) gives the
// densest packing. At maximum D, both the horizontal span (CENTRE_W-D) and
// vertical span (N-1)*dy saturate, yielding D² - bD + c = 0. This is only valid
// when same-column circles (indices i, i+2) have 2*dy ≥ D+GAP, which holds when
// D ≥ ~92.6mm — true for N ≤ 4 but not for N ≥ 5.
function zigzagLayout(n) {
    const k = (n - 1) * (n - 1);
    const b = 530 + 368 * k;
    const c = 70225 + 31648 * k;
    const D = (b - Math.sqrt(b * b - 4 * c)) / 2;
    const w = CENTRE_W - D;
    const s = D + MIN_CARD_GAP;
    const dy = Math.sqrt(Math.max(0, s * s - w * w));
    const xLeft = PAGE_CENTRE_X - w / 2;
    const xRight = PAGE_CENTRE_X + w / 2;
    const yTop = PAGE_CENTRE_Y - (n - 1) * dy / 2;
    const positions = [];
    for (let i = 0; i < n; i++) {
        positions.push({
            x: i % 2 === 0 ? xLeft : xRight,
            y: yTop + i * dy,
        });
    }
    return { positions, maxDiameter: Math.floor(D * 10) / 10 };
}

// Quincunx (4 corners + middle) is the densest layout for N=5. Binding
// constraint is horizontal: a = D+GAP = CENTRE_W-D => D = (CENTRE_W-GAP)/2 = 86.
function quincunxLayout() {
    const D = (CENTRE_W - MIN_CARD_GAP) / 2; // 86
    const s = D + MIN_CARD_GAP;              // 92
    const b = Math.sqrt(3) / 2 * s;          // offset of middle circle
    const c = 2 * b;                         // total vertical span of centres
    return {
        positions: [
            { x: PAGE_CENTRE_X - s / 2, y: PAGE_CENTRE_Y - c / 2 },
            { x: PAGE_CENTRE_X + s / 2, y: PAGE_CENTRE_Y - c / 2 },
            { x: PAGE_CENTRE_X,         y: PAGE_CENTRE_Y - c / 2 + b },
            { x: PAGE_CENTRE_X - s / 2, y: PAGE_CENTRE_Y + c / 2 },
            { x: PAGE_CENTRE_X + s / 2, y: PAGE_CENTRE_Y + c / 2 },
        ],
        maxDiameter: Math.floor(D * 10) / 10,
    };
}

// For N=6, a 2×3 rectangular grid is optimal (height-limited: 3D+12 = 265).
function grid2x3Layout() {
    const D = (CENTRE_H - 2 * MIN_CARD_GAP) / 3; // 253/3 ≈ 84.333
    const s = D + MIN_CARD_GAP;
    const positions = [];
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 2; col++) {
            positions.push({
                x: PAGE_CENTRE_X - s / 2 + col * s,
                y: PAGE_CENTRE_Y - s + row * s,
            });
        }
    }
    return { positions, maxDiameter: Math.floor(D * 10) / 10 };
}

function findOptimalLayout(n) {
    if (n === 1) {
        return {
            positions: [{ x: PAGE_CENTRE_X, y: PAGE_CENTRE_Y }],
            maxDiameter: Math.floor(CENTRE_W * 10) / 10,
        };
    }
    if (n >= 2 && n <= 4) return zigzagLayout(n);
    if (n === 5) return quincunxLayout();
    if (n === 6) return grid2x3Layout();
    throw new Error('Unsupported cards-per-page: ' + n);
}

async function generatePDF(frontImages, backImage, layoutPositions, cardDiameter, cardsPerPage, onProgress) {
    if (!window.jspdf) {
        throw new Error('jsPDF library failed to load. Please check your internet connection and try reloading the page.');
    }
    const { jsPDF } = window.jspdf;

    const D = cardDiameter;
    const diameterPx = Math.round(D * PX_PER_MM);

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
        const frontCentres = [];

        for (let i = startCard; i < endCard; i++) {
            const { x, y } = layoutPositions[i - startCard];
            renderCardToCanvas(canvas, frontImages, cards[i], diameterPx);
            doc.addImage(canvas, 'PNG', x - D / 2, y - D / 2, D, D);
            frontCentres.push({ x, y });
        }

        // --- Back page (mirrored horizontally for long-edge flip) ---
        doc.addPage();

        for (const { x, y } of frontCentres) {
            const mirroredX = 210 - x; // flip about page centre (210mm wide)
            renderBackToCanvas(canvas, backImage, diameterPx);
            doc.addImage(canvas, 'PNG', mirroredX - D / 2, y - D / 2, D, D);
        }

        if (onProgress) {
            onProgress(Math.round(((pageIdx + 1) / totalPages) * 100));
            await new Promise(r => setTimeout(r, 0));
        }
    }

    return doc.output('blob');
}

// Export for Node.js testing
if (typeof module !== 'undefined') {
    module.exports = { isPrime, findLargestPrime, getCardInfo, generateCards, getSizes, getLayout, squaresOverlap };
}
