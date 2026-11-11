# Work Order 26 — Combat Visual Testing

Open DEVTEST Options → Combat Visual Testing. Pick an encounter, state, variant and viewport. Drag a figure or enter its normalized X/Y, width, height, scale, mirror and layer. X/Y refer to the center of the figure. Save Layout on This Browser applies the layout to the cosmetic renderer immediately and reloads it on refresh. Phone layouts inherit desktop values until overridden.

To transfer a layout, choose Export Layout JSON and copy the displayed text. On another browser, choose Import / Apply Layout JSON, paste it and choose Import / Apply again. To publish a shared default, commit the validated JSON object as the value of `Route127PublishedCombatLayouts` in `runtime/combat_layout_manifest.js`. The manifest is initially empty. Local overrides continue to take precedence.

## Existing layouts

The checked GitHub build and the served DEVTEST script both exposed the fixed Combat Visual Testing preview with no layout persistence in that function. The source and schema of the owner's previously persisted adjustments could not be established remotely. The previous preview remains available under Legacy Composition Preview. No earlier browser keys are removed or reset.

Open the editor on the browser and origin where the old edits were made. Choose Export Existing Layouts and copy the JSON if it finds older keys. Compatible version-1 documents can be imported directly. An unrecognized format requires the exported data before it can be converted. If no older key is found, share the URL of the editor that still displays the adjustments and export there if it provides that feature.

## Coverage

The selector takes canonical IDs, names and classifications from the live registry. The counts include the two registry fixed sites and explicit scripted Factory, Old House and Seaport entries. Regional counts overlap for scenes assigned to multiple regions.

| Group | Count |
|---|---:|
| Active entries shown by default | 219 |
| Inactive entries available via filter | 6 |
| Global | 42 |
| Fixed | 31 |
| Central assignments | 41 |
| Industrial assignments | 66 |
| North assignments | 26 |
| East assignments | 35 |
| West assignments | 39 |
| Lowlands assignments | 22 |
| Seaport assignments | 22 |

| Active entries | Total | Dedicated scene or sprite art | Editable sprite art | Art variants |
|---|---:|---:|---:|---:|
| Combat available | 114 | 45 | 27 | 55 |
| Noncombat | 105 | 15 | 3 | 18 |

All configured file paths resolve in the checkout. The browser checks each assigned image and exposes failures as Art broken. The 159 active entries without dedicated art remain discoverable. Combat entries without a dedicated assignment show Art missing / review. Other unassigned entries show Art unassigned / review because the registry does not distinguish intentional text-only scenes from unfinished art. The default regional background remains available in those previews. Attach Sprite can assign already installed sprite art to a draft without changing combat targets.

## Verification and limitations

- `node tests/combat_layout_catalog.cjs` checks canonical coverage, asset paths, unique unit keys, bounds, import/export and refresh persistence.
- `node tests/roadside_sprites.cjs` exercises the existing sprite renderers, the separate Sentry and Warden assets, and live bat layout application across a defeated unit and scene-state change.
- `node tests/devtest_harness.cjs`, `node tests/roadside_repair.cjs` and `node tests/presentation_formatting.cjs` check parser order, isolation, 139 menus and presentation regressions.
- Opening the editor during the matching gameplay scene can capture live geometry. Other scenes use authored or fallback starting positions. The preview shows a compact canvas for phone compositions. Exact viewport parity, all scripted branches and all image combinations need browser playthrough verification.
