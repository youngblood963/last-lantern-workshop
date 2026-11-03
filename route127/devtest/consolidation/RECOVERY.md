# WO25 recovery checkpoint

Protected main: `fc735b5d536787926e0635a9802892e68bd2f136`. The manifest records the shared Playtest script list. All old Devtest engine files, fixtures, QA pages, and assets remain in place. Only the normal Devtest entry was replaced; its exact previous bytes are recoverable with `git show fc735b5d536787926e0635a9802892e68bd2f136:route127/devtest/index.html`. Revert the WO25 implementation commits to restore the prior entry without deleting newer external changes. No automatic cleanup or save migration is included.

Playtest, online-game, backend, private-playtest, nested Factory and website remain unchanged. No production entry or environment switch is created.
