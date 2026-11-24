# Backpack item portraits — DEVTEST

Selecting an item in the graphical Backpack replaces the backpack illustration with that item's individual transparent portrait. The existing preview dimensions, inventory list, descriptions and action buttons are preserved. The full object is contained, with no cropping. Closing and reopening starts with the normal backpack illustration.

The resolver uses catalog IDs across levels and follows existing modification/upgrade records for older named gear. It does not guess filenames from labels, alter item identity or introduce saved tracking flags. Only the selected portrait loads. An unavailable image, an unregistered item or a depleted stack returns to the existing backpack artwork.

## Implementation

- `runtime/backpack_item_art.js`: isolated wrapper around `TravelerPanels.art`, scoped to selected inventory items.
- `runtime/backpack_item_art_manifest.js`: explicit identities and filenames for completed artwork.
- `assets/items/*.webp`: individual generated portraits with preserved alpha. Original generation PNGs remain outside the published Git tree; WebP is a format-only conversion with no resizing or artistic edits.
- `tools/build_backpack_art.py`: reproducible manifest builder and format conversion.
- `tests/backpack-item-art.cjs`: real native Backpack selection and action regression checks.

All artwork uses the built-in image generator. Exact prompts for saved portraits are recorded in `generation-prompts.json`. This is a DEVTEST feature; no PLAYTEST entry or gameplay code is changed.

## Verification

Native tests cover stable catalog identity at levels 1, 10 and 50, older named gear modifications, switching portraits through real item selection, no inventory/stat/turn/currency changes from selection, failed-image recovery, unregistered/empty selections, panel close and consumption of the last Bandage through the existing Use command.

Desktop graphical checks confirm the shirt and pipe portraits, correct item descriptions, Drop/Cancel, Equip, default backpack restoration and close/reopen. Test characters use a separate local-storage namespace and are prepared by an unpublished local preview fixture. No owner character is used. No mobile verification has been performed.

## Artwork coverage

This is a work-in-progress checkpoint. The planned roster includes 92 catalog weapon/armor designs plus 112 named equipment, supply, crafting and quest item designs. Coverage will be updated after the remaining image batches. Only completed, verified image files are registered; pending or generation-blocked designs retain the ordinary backpack presentation.

The image service has rejected several otherwise benign game-prop requests. They are recorded as blocked rather than replaced with unrelated art or reported as completed. No alternate API route has been used.
