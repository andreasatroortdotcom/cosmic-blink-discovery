# Cosmic Blink Discovery

Create Astroswipe: a citizen science web application for NASA's Space Apps Challenge ("Planet X and SPHEREx").

Concept & User Experience:
A Tinder and TikTok-inspired swipeable feed where citizen scientists and astronomers inspect celestial patches of sky mapped by NASA's SPHEREx mission across multiple 6-month survey epochs to discover moving objects (comets, asteroids, brown dwarfs, Planet X/Planet Nine) and variable stars.

Key Features & Specifications:
1. Swipeable Feed / Card Deck (Mobile-first, touch-friendly Tinder-style cards with swipe left/right/up and tactile action buttons):
   - Card displays coordinates (Right Ascension & Declination), constellation name, and metadata (epoch dates, infrared wavelength bands).
   - Animated Blink Comparator: Loops smoothly through consecutive SPHEREx survey images taken ~6 months apart, making moving or brightening objects immediately eye-catching.
   - Interactive Toolbar on each card:
     * Toggle "Difference Image" (image subtraction between epochs to show dipoles where movement occurred).
     * Toggle "Gaia Overlay" (overlay known stars from the Gaia catalog with proper motion vectors, filtering out known background stars so only unknown anomalies stand out).
     * Infrared Band Selector (SPHEREx maps 102 near-IR bands from 0.75 to 5.0 µm; allow switching between detector arrays / composite false-color bands).
     * Field of View (FOV) slider/zoom.
     * Speed control for the epoch blink loop (slow, normal, fast).

2. Swipe Actions:
   - Swipe Right (or Green Planet Button): "Flag Anomaly / Moving Object!" -> Prompts user to classify (Brown Dwarf candidate, Asteroid/Comet, Planet X candidate, Variable Star, or Unknown anomaly) and adds to their personal Discovery Log.
   - Swipe Left (or Red Pass Button): "Static Sky / No motion".
   - Swipe Up / Tap (or Blue Star Button): "Deep Dive Inspector" -> Opens full detail view with on-the-fly 102-band infrared spectrum plot (SED), coordinates, shareable URL query parameters (`?ra=...&dec=...&fov=...`), and export/report option.

3. Pre-loaded NASA Challenge Test Targets:
   Quick-select carousel or drawer to immediately load the official benchmark targets:
   - Barnard's Star (highest proper motion star marching across epochs)
   - WISE 0855 (fast-moving, extremely cold brown dwarf at RA 08h55m10.831s, Dec -07d14m42.53s)
   - Epsilon Indi B (brown dwarf pair orbiting a star)
   - RW Aurigae & R Draconis (variable stars shifting in brightness)
   - Simulated Planet X / Kuiper Belt candidate anomaly

4. Citizen Scientist Gamification & Community:
   - Personal Discovery Log & Stats (cards reviewed, candidates flagged, discovery streak, ranking badge: e.g. "Stellar Scout", "Brown Dwarf Hunter", "Planet X Pioneer").
   - Community Candidates Feed showing recently flagged anomalies by other volunteers with voting/verification.

5. Design & Tech:
   - Sleek, high-contrast dark space theme with deep cosmic purples, starlight glows, and crisp scientific typography.
   - Coordinate search bar (enter custom RA/Dec or common astronomical names).
   - URL coordinate deep linking so any view can be embedded or shared directly.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://cosmic-blink-discovery.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d03acabf-9022-4d7f-8e61-841d8a7213ae).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
