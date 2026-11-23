# Shared navigation artwork repair

The previous `assets/workshop/navigation-frame.webp` contained an embedded lantern/gear emblem, LLW lettering and Projects/Support/Privacy labels. Shared CSS covered the logo area with an opaque gradient and a separate texture, then placed another emblem over it.

The source raster is now repaired: its embedded graphics and lettering are removed, and the full metal face is restored. The original outer copper perimeter, corners, rivets and weathering remain from the original image. The repaired asset keeps its 703 × 91 dimensions and uses lossless WebP (66,622 bytes). Its original outer frame pixels were compared against the decoded input and remain unchanged. The AI-restored interior was cropped from the restoration output, normalized to the original dimensions and composited inside the original frame.

The frame now supplies both the border and metal face through `border-image` with `fill`. There is no separate background texture or gradient beneath the brand. Exactly one existing transparent `lantern-gear-nav.webp` appears immediately left of live LLW™ lettering in each navigation bar. Route 127's landing-page header is corrected to use this same emblem instead of the older SVG.

## Source files

- `assets/workshop/navigation-frame.webp`: repaired original artwork.
- `assets/workshop/navigation.css`: consolidated shared navigation rules and responsive logo/link sizing.
- `assets/workshop/homepage.css`: imports the navigation stylesheet; removes obsolete navigation rules and the opaque emblem-cover patch. All non-navigation CSS rules are preserved.
- `assets/workshop/extraction.json`: updates navigation asset size and restoration provenance.
- `index.html`, `route127/index.html`, `metalkeep/index.html`, `veiled-moon/showcase.html`, `about.html`, `support.html`: refresh shared stylesheet cache versions; Route 127 additionally changes only its navigation emblem source.

## Verification

- Inspected all six page headers in desktop Chromium at a 1363-pixel outer viewport (scrolling pages have 15 pixels reserved for the scrollbar).
- Inspected all six mobile headers in 390-pixel iframes; scrolling documents have 375 usable CSS pixels. This checks responsive CSS, not mobile hardware or touch behavior.
- Each of the twelve inspected headers contains exactly one loaded logo image. Computed brand background is transparent with no background image, and the navigation has no horizontal overflow.
- Mobile links render at 14px; logo and LLW™ remain visible and aligned.
- Visually inspected the source image and desktop/mobile screenshots: no embedded emblem, black rectangular patch or duplicate header logo remains. Copper edges and metal face are continuous.
- Clicked all six destination types: Home, Route 127, MetalKeep, Veiled Moon, About and Support. Clicked mobile Support and its Home return.
- MetalKeep's existing privacy-policy link opens `/privacy.html`. Policy content and URLs are unchanged.
- All href values in the six HTML files match their original values exactly. Homepage retains five navigation links with no Home entry; the other five pages retain six.
- Verified that each HTML file is otherwise byte-for-byte unchanged after normalizing the stylesheet cache version and Route's one header image source.
- Compared every non-navigation CSS rule against the original; no unrelated rule changed.
- `git diff --check` passes.

No gameplay, application functionality, backend, policy content or deployment configuration was changed. No merge or deployment was performed.

## Screenshots

These contact sheets contain actual browser captures, cropped to each navigation bar and assembled with page labels; the header pixels are unaltered.

- [Desktop — all six navigation bars](desktop.jpg)
- [Mobile — all six navigation bars](mobile.jpg)
- [Full desktop homepage viewport](homepage.jpg)

## Restoration brief

Edit the supplied existing panoramic navigation bar, removing the embedded lantern/gear emblem, LLW trademark and Projects/Support/Privacy lettering. Reconstruct those areas as continuous dark graphite weathered iron with matching subtle pitting, scratches, rust and lighting. Preserve the original copper frame, aged corners, rivets, bevels and weathering. No added text, symbols, flat fills or rectangular patches. The original outer frame was retained during final production compositing.
