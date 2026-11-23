# Centered Support page and card spacing

Completed after the robot announcement as a separate commit.

- `assets/workshop/support.css`: centers the existing 820px content column and Support introduction; adds 28px between the MetalKeep and Keep the Lantern Burning cards (24px on mobile); centers the existing bottom Back to the Workshop button with matching separation. Paragraphs inside the cards retain their readable left alignment.
- `support.html`: loads the page-specific stylesheet. All other markup, support copy and link destinations remain unchanged.

Desktop and mobile-width browser checks confirmed that the content-column center matches the viewport center, the heading is centered, and the measured card gaps are 28px/24px. Neither checked viewport has horizontal overflow. The mobile Ko-fi and Back to the Workshop controls remain visible and readable. Navigation and other pages are unchanged by this commit.

- [Desktop screenshot](desktop.jpg)
- [Mobile screenshot](mobile.jpg)
- [Mobile lower cards and buttons](mobile-bottom.jpg)

No merge or deployment has been performed.
