# Route 127 cleaning robot announcement

Completed after the navigation repair, as a separate commit. The owner's supplied `broken_cleaner_bot(2).png` is used directly, with transparent margin trimming and proportional downsampling only. No redraw, generated substitute or replacement creature is used.

- `assets/workshop/cleaning-robot.png`: 280 × 240 RGBA PNG, 117,092 bytes, preserving the supplied transparency.
- `index.html`: adds the supplied robot to the existing announcement and refreshes its stylesheet cache version. All text, link destinations and other homepage markup are unchanged.
- `assets/workshop/homepage.css`: adds scoped sticker positioning, narrow-screen spacing and proportional sizing. The existing announcement metal surface, colors, typography and button styling are preserved. No navigation rules are changed by this commit.

The robot displays at 116px wide on desktop, 86px at intermediate widths and 68px on small screens. It overlaps the top and bottom of the bar, to the left of the text, without receiving pointer events.

Desktop and 390 × 844 / 320 × 844 mobile-width iframe previews were visually inspected. The PNG loads, its background stays transparent, and the robot's bounds remain clear of both announcement text and Play Here. The Play Here link retains `route127/playtest/`. All three checked page sizes remain a single screen with no horizontal or vertical document overflow. At the narrowest checked width, the existing text wraps within the bar.

House artwork, hero lantern emblem, nighttime sky, navigation, project pages, gameplay and hidden Lantern Room are unchanged by this commit.

- [Desktop screenshot](desktop.jpg)
- [390px and 320px mobile screenshots](mobile.jpg)

No merge or deployment has been performed. Screenshots are provided for owner review.
