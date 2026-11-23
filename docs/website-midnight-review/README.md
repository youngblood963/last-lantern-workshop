# Midnight Workshop artwork review

The homepage now displays raster artwork extracted directly from the owner's approved 1536 × 1024 Midnight Workshop moodboard. No new illustration or generated image was needed. Previous geometric house, windmill, gear and lantern SVGs are no longer referenced by the rendered homepage; the original files remain available to avoid removing assets that may have other consumers.

All new artwork is under `assets/workshop/`:

| Asset | Source size | Placement |
| --- | --- | --- |
| `workshop-scene.webp` | 596 × 250 | Prominent homepage hero scene, retaining the original forest, full moon, house, warm windows, lantern and wall gear |
| `lantern-gear.webp` | 285 × 278 | Main hero emblem; social metadata |
| `lantern-gear-nav.webp` | 80 × 78 | Navigation emblem and favicon |
| `gear.webp` | 79 × 77 | About section ornaments |
| `lantern.webp` | 60 × 83 | About section central ornament |
| `copper-divider.webp` | 231 × 36 | Projects and About heading dividers |
| `copper-corner.webp` | 88 × 70 | Project section corner details |
| `navigation-frame.webp` | 703 × 91 | Navigation border, nine-sliced without its text-bearing center |
| `button-frame.webp` | 332 × 64 | Copper button borders with live ivory text |
| `secondary-frame.webp` | 332 × 61 | Secondary button and project artwork borders |
| `iron-texture.webp` | 202 × 120 | Navigation/button faces and subtle Projects surface |
| `rust-texture.webp` | 198 × 120 | Project artwork frame backing |
| `wood-texture.webp` | 201 × 120 | About and footer background |

`assets/workshop/extraction.json` records source crop coordinates, dimensions, file sizes and source SHA-256. Isolated ornaments have traced alpha mattes. The extracted raster assets total 130,656 bytes (about 128 KiB), plus a homepage-only stylesheet. Frames use their actual metal borders, with the source image's embedded labels excluded; all interactive labels remain real HTML text. Textures are small raster samples, not CSS-drawn replacement materials.

## Source limitations

The flattened moodboard does not contain uncropped full-resolution house or background layers. The available house crop is preserved at its native aspect ratio and displayed no wider than its 596-pixel source. The emblem and small ornaments are displayed below their source dimensions. These are not suitable as sharp full-screen backgrounds or large print graphics. The panel's windmill/forest scene is not extracted as a standalone background because the frame, typography and divider are baked into the source. The existing Route 127 nighttime sky remains the hero background; only its CSS framing changes to avoid displaying a second moon next to the source workshop moon. The full moodboard is not downloaded by homepage visitors.

## Verification

- Desktop Chromium rendering inspected at 1363 × 936.
- Narrow responsive rendering inspected in a 390 × 844 iframe (375 CSS pixels of usable width after the desktop browser's scrollbar). This checks responsive layout, not mobile hardware or touch behavior.
- Hero, Projects, About and footer inspected at both widths. No horizontal overflow at either checked width.
- Every homepage `<img>` loaded successfully, including all new artwork and the existing Google Play badge.
- Projects anchor, Support, Privacy and return-home links clicked successfully in the local preview.
- All 12 anchor destinations are byte-for-byte identical to the original homepage. Local project destinations verified against the repository tree; apps and game routes were not exercised.
- `git diff --check` passes.
- Changes are limited to homepage HTML, removal of obsolete homepage CSS rules, new scoped artwork CSS/assets, provenance and review screenshots. No game, backend, policy-content or infrastructure changes.

## Screenshots

- [Desktop homepage](desktop.jpg)
- [Mobile homepage](mobile.jpg)
- [Desktop project section](projects.jpg)
- [Mobile project section](mobile-projects.jpg)
- [Desktop About and footer](about.jpg)

No merge or deployment has been performed.
