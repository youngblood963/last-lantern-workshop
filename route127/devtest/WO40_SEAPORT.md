# WO40 Seaport menu migration

Baseline `49c95232b`. DEVTEST uses the existing shared menu model and its Solace-tested bindings. The live action writers remain the authority for command strings, quest gates, destinations and transaction effects.

| Screen and action ID prefix | Action source, gates and navigation |
|---|---|
| Harbor root, `seaport:seaport` | Occupied: Harbor Docks, Return to Road. Liberated: Town Streets, Harbor Docks, Market Area, Rusty Anchor, gated Old Customs Office and Talk to Miles, Return to Road. Return still invokes the existing road command. |
| Harbor Docks, `seaport:port55Docks` | Occupied stages retain Inspect or Confront Fishermen, then Free the Survivors once combat is won. Return to Seaport or Back Away retains its original destination. Liberated: bulletin board, clerk, gated parcel, pending reward and Caleb, then Return to Seaport. |
| Town Streets and Market, `seaport:port55Stop` | Current Seaport stop, patrol and visitor providers supply existing actions. Town Streets returns to Harbor. Market returns to the root. |
| Kaiden, `seaport:kaiden` | Main, Small Talk, bribe and Lights quest use the existing crime and quest gates. Main Back returns to Town Streets. Small Talk and quest return preserve their immediate parents. |
| Mia and Red, `seaport:port55Mia`, `seaport:port55MiaTalk`, `seaport:r18Red` | Existing drinks, room, casino and dialogue commands. House Rules remains nested under Small Talk. Mia's refusal, Red's availability and wanted poster gates remain. Red returns to Mia or the conversation, depending on page. |
| Drinks, casino and room, `seaport:r11Drinks`, `seaport:r6Casino`, `seaport:r6Room` | Existing drink prices, room state, game options and return commands. Classic typed chest and Graphical chest modal keep their existing input and storage handlers. |
| Market services, `seaport:port55Service` | General, Clinic, Workshop, Bank and Armory use the existing vacancy, assignment, stock and service builders. The storefront exit returns to Market. Nested choices and confirmations retain their own destinations. Custom Bank amounts still use the existing typed or focused input. |
| Nessa, `seaport:port55Vendor` | Both modes start with Purchase Pets, the existing Silas-gated dialogue choices and Back. Purchase Pets opens the existing Graphical catalog or the existing Classic numbered catalog. Classic catalog Back now returns to Nessa's root. Pet prices and purchase checks use the existing handlers. |
| Wanderer and recruitment, `seaport:port55Guest`, `seaport:port55Recruit` | Existing visitor presence, recruitment, assignment, wares and confirmation rules. Leave or Cancel routes through existing commands. |
| Other structured menus | Dock bulletin board, Seaport crafting, quest acceptance, Silas and Seaport Miles use the existing direct-choice builders. |

The migration removes the root Armory mutation and RETURN WEST output rewrite, the graphical root exit replacement, the obsolete Mia definition, redundant Kaiden and Nessa menu providers, the Red/room exit filter and its registration, and the casino Back-map deletion and graphical filter. Root Miles, Customs and Docks Caleb choices are now assembled before the final exit. The shared numeric writers, Classic aliases, artwork wrappers, Nessa dialog lifetime hook, existing quest callbacks, and menu policies with actual screen-specific behavior remain. For example, the Graphical roster already provides staff inspection, so the existing storefront shortcut difference remains. Menus with distinct exits retain their existing writer rather than discarding a different destination.

## Verification

The DOM suite exercises the actual Seaport entry and commands in Classic and Graphical modes, including the inspect/confront/free sequence using the canonical victory transition, Kaiden's nested quest return, Caleb, Mia drink accounting, Red, room and casino entry, the five Market storefronts, Classic Bank deposit, Nessa's gates and Classic purchase, and three synthetic saves with liberated Seaport. Live browser verification requires a browser that can start Chromium.

Owner route: Town Streets → Harbor Docks → Kaiden → Rusty Anchor (Mia, Red, room, chest and gambling) → Market (including Bank focused amount and assignments) → Nessa (Silas gate and pet catalog) → Wanderers. Toggle Classic and Graphical, check the final exit on each screen, and revisit Solace and Jen's bar. Use a spare profile to check older saves and mobile layout.
