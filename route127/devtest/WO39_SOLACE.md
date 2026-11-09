# WO39 Solace menu migration

Baseline is GitHub main `b1c1e29`. The Rusty Lantern pilot remains the baseline for owner-approved behavior. This migration is DEVTEST only.

| Migrated screen | Published actions, in order | Eligibility, outcome and return |
|---|---|---|
| Main Street | Shops, Relay Station, Find Tim, Gates, Talk to visitor, Bulletin Board, Post Office | Relay requires unlock. Visitor uses existing featured selection. Post Office requires courier service phase. Existing hub routing. |
| Shops | Rusty Lantern, Johnny's Trading Post, Murphy's Motor Works, Last Chance Clinic, Solace Savings & Loan, Armory, Back to Solace | Existing shop commands and destinations. |
| Gates hub | North, South, East, West Gate, Back to Solace | Existing graph check and gate destinations. Individual gate menus are separate. |
| Wanderers list | Talk to each present Wanderer, Talk to Gideon, Seek Ash Survivor, Back to Solace | Existing presence, alive, hired, Salt Workers and Ash reunion gates. The selected visitor opens the same interaction model as the featured visitor. |
| Johnny root | View Stock, Sell Items, Talk, Old World Counter, Back | Martha settlement gates the counter. Existing trade and dialogue routes. |
| Johnny stock | Buy Energy Bar, Buy Bandage, Buy Battered Flashlight, Ask About Relay Parts, Buy Tent, Old World Counter, Buy 16-Slot Backpack, Back | Relay quest, Martha, and backpack gates preserved. Existing prices and purchase handlers. Back returns to Johnny root. |
| Murphy root | Crafting Recipes, Crafting, Small Talk, Back | Existing blueprint, crafting and dialogue routes. |
| Murphy small talk | Ask About Work, Inspect Corvette Photo, Ask About Relay Station, Back | Existing command handling. Back returns to Murphy root. |
| Murphy blueprints | Learn each available unlearned recipe, Back | Existing prices, learned checks and charge logic. Back returns to Murphy root. |
| Tim root | Talk Tim, Deliver Tim Letter, Ask About Daniel, Pay Fine, Offer Bribe, Confirm Bribe, Cancel Bribe, Town | Existing courier, Clara, bounty and pending bribe gates. Existing command handlers. |
| Clinic return menu | Treat Wounds, Buy Bandage, Sell Items, Small Talk Wayne, Back | Existing rates and command handlers. Applies on entry, redraw and return from dialogue or selling. |
| Armory stock | Buy each unsold stock item, Sell Items, Back | Existing stock generator, names and purchase handlers. |

The DEVTEST entry now selects the local hub and interior modules in place of their shared registrations. The model publishes the explicit menus to the engine's original numbered and letter bindings. Graphical projects from those live bindings. The Johnny stock output-match filter, two Armory output-match branches, redundant shop routing branch and unused saved function references were removed. Shared files remain the fallback for PLAYTEST.

## Second batch

| Screen | Actions and existing behavior |
|---|---|
| Individual Solace gates | Existing connected-road actions, then Return to Town. The engine still accepts the B alias. |
| Guard challenge | Terminal, trade, Relay, passing through, fight and the existing gated 50-Bolt offer. No new navigation action. Existing bribe cooldown and resolution remain authoritative. |
| Tim dialogue and bribe | Work, gated fine/bribe, Relay, pending confirmation actions, Never Mind. The separate confirmation displays Confirm Bribe and Cancel Bribe. The badge hand-in and quest offer keep the existing command logic. |
| Johnny, Wayne and Amii dialogue | Existing compact topic lists, followed by Back. The Relay parts topic remains conditional. NPC introductions and recovered-item notices remain. |
| Bank | Existing deposit, withdrawal, stash, retrieval, storage, talk and rename pages. Per-page actions and eligible items come from the existing builders. Custom amount uses the existing text prompt and ledger. |
| Sales | Existing eligible stacks, quantity choices and confirmation. Cancel Sale and Back are designated navigation actions. Custom quantity continues to accept typed input. |
| Wanderer interaction and stock | Existing NPC actions, hostile gating, stock and trades. Leave is last. Return from browse wares uses the existing Back command. |
| Room | Rest, Chest, Look Around, Return. Purchase keeps the existing 2,000-Bolt charge and ownership flag. Chest Back restores the same model. The approved Graphical storage modal and Classic typed item/quantity commands keep their existing handlers. |
| Forge, Workshop and crafting | Existing Factory Workshop and Forge action lists, and direct recipe actions for Forge and Murphy. The readiness and charge hooks keep their existing order. |
| Post Office and bulletin confirmation | Existing courier and draft-confirmation actions are published through the structured writers. Free-form text entry remains with its existing handler. |

The Solace interior adapter no longer intercepts formatted dialogue through `add`. The guard builder now owns the bribe action and retires the shared late append in DEVTEST. Forge's obsolete output strip and the filter that suppressed it were removed together. The existing queued menu writers remain as renderers for structured actions. They retain binding syntax and line layout, and the model supplies the normalized action sequence. The hub delegates while a Wanderer is focused so trade and Leave reach the existing handler.

Compatibility paths retained include Tim's locked/found badge flow, typed transaction and storage prompts, the Graphical storage modal, and legacy Factory tutorial branches that do not use the structured writer. These paths keep their gameplay handlers and save state.

## Owner check

In the DEVTEST build, enter Solace Shops and exercise Johnny, Clinic, Murphy, Bank and Armory. Check Tim and a guard, Forge, a featured Wanderer and Jen's bar/room. Switch Classic and Graphical and confirm one final exit where the screen offers one. Check a sale quantity, Bank deposit, room chest deposit and withdrawal, and one older save on mobile or desktop.
