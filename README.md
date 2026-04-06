# Dooble Card Generator

A web-based tool that generates printable Dobble (Spot It!) cards as a PDF from your own images.

## What is Dobble?

Dobble (also known as Spot It!) is a card game where each card has several images, and **every pair of cards shares exactly one common image**. Players race to find the matching image between any two cards.

## How to Run

1. Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari)
2. No server, build step, or installation required

## How to Use

### Step 1: Upload Images

- **Front images**: Click "select multiple" and choose the images you want on your cards. The more images you provide, the more cards will be generated.
- **Card back image**: Upload a single image that will appear on the back of every card.

The app will calculate how many cards can be generated based on your image count:

| Images needed | Prime (p) | Cards | Images per card |
|--------------|-----------|-------|-----------------|
| 7            | 2         | 7     | 3               |
| 13           | 3         | 13    | 4               |
| 21           | 4*        | -     | -               |
| 31           | 5         | 31    | 6               |
| 57           | 7         | 57    | 8               |

\* p must be prime, so 21 images still uses p=3 (13 cards). The largest prime p where p²+p+1 ≤ your image count is used.

### Step 2: Configure Layout

- Set how many cards per row (columns) and rows per A4 page
- The preview shows the card arrangement with calculated card diameter
- Leave space between cards for cutting

### Step 3: Generate & Print

1. Click **Generate PDF**
2. Wait for the progress bar to complete
3. Click **Download PDF**

## Printing Tips

- Print **double-sided** with **long-edge flip** (the default on most printers)
- Each front page is followed by its corresponding back page with mirrored positions, so fronts and backs align correctly when printed double-sided
- Use **cardstock paper** (200-300 gsm) for durable cards
- Cut along the circular outlines

## Algorithm

The card generation uses the **finite projective plane** construction:

For a prime number **p**:
- Total symbols (images) = p² + p + 1
- Total cards = p² + p + 1
- Images per card = p + 1
- **Every pair of cards shares exactly one image** (mathematically guaranteed)

Cards are generated using three types of "lines" over the finite field Z_p:
1. Lines `y = mx + c` for each slope m and intercept c (p² cards)
2. Vertical lines `x = a` (p cards)
3. The line at infinity (1 card)

## Tech Stack

- Vanilla HTML/CSS/JavaScript (no framework, no build tools)
- [jsPDF](https://github.com/parallax/jsPDF) for PDF generation (loaded from CDN)
- HTML5 Canvas API for card rendering

## File Structure

```
index.html   - UI, styling, image upload handling, orchestration
dobble.js    - Card generation algorithm, canvas rendering, PDF assembly
README.md    - This file
```
