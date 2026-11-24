# Owner-authorized DEVTEST + PLAYTEST release

The final deployment work order authorizes merging and deploying the verified repairs. No extended gameplay resumed. New Abandoned Motel/casino asset uploads from main are preserved; no Motel implementation is part of this release.

Seven session repairs are included in both runtime entries: paid encounter preservation after free news; canonical wanderer menus; successful Leave/historical save recovery; Road Reapers combat art; arena single visible exit; roadside captions; and guarded manual equipment swaps. Public promotion is an exact bounded patch to app.js and the three affected presentation modules, with entry cache-token updates. Public artwork positions, gameplay balance and turn constants are unchanged. No public backend changes.

## Targeted checks

- DEVTEST `regional-stress-regressions.cjs`: PASS.
- DEVTEST `shotgun-equipment.cjs`: PASS, twelve actual Backpack/native save/load/combat cases across all four shotguns, plus normal pickup auto-upgrade.
- DEVTEST `non-scenario-panels.cjs`: PASS.
- `ROUTE127_TEST_ENTRY=playtest node route127/devtest/tests/regional-stress-regressions.cjs`: PASS against the complete real public script chain.
- `ROUTE127_TEST_ENTRY=playtest node route127/devtest/tests/shotgun-equipment.cjs`: PASS against the complete real public script chain.
- `public-turn-isolation.cjs`: PASS — QA disabled; 30-turn refill and 150 bank; native zero-turn spending blocked; testing access denied; refill timestamp remains stable on repeated processing; unlimited mode cleared on save load; no DEVTEST options or test observer in the public entry.
- `git diff --check`: PASS.

Release test helpers live only under DEVTEST/tests. They execute isolated offline fixtures, not public accounts or services. No disposable test character, injected supplies, unlimited-turn fixture, or stress observer is loaded by either shipped entry.

## Preserved records and limitations

`last-confirmed-state.json` and the remaining checklist in README are retained. As already disclosed, the former execution/browser environment was replaced and its complete isolated save/logs/screenshots are unrecoverable here. The manifest is not an importable save. This release does not fabricate or reset a replacement character. Regional coverage is concluded at 271 confirmed steps; exact unique/combat aggregate limits and deferred Seaport content remain documented in README.

Deployment outcome is recorded in the PR and final delivery after GitHub Pages reports completion. Approval to deploy does not certify untested regional content.
