# Roadmap

Roadmap organized by priority. Higher priority items should improve daily usability, reduce friction, or unblock bigger features.

## P0 - Essential fixes and UX

### Forms and input flow

- [x] Save homes in localStorage so users can quickly refer to a house they already accessed
- [x] Remove default room when adding item to prevent adding the item to the wrong room. (Prevent saving when no room is selected)
- [x] Add Enter key support to save room and item modals.
- [x] Validate required fields before saving rooms and items.
- [x] Disable `Add Item` when no room exists yet.
- [x] Show a clear validation error when vendor links are not valid JSON.
- [x] Keep modal actions consistent: `Save`, `Cancel`, loading/disabled states, and error feedback.
- [x] Autofocus the first field when room and item modals open.
- [x] Keep the home detail page visible for non-fatal action errors instead of replacing it with a full-page error.

### Notes and links display

- [x] Add line breaks or max-height handling for long notes.
- [x] Add `show more / show less` behavior when notes are too large.
- [x] Prevent long URLs from breaking the layout on mobile.
- [x] Add link aliases so vendor URLs appear as short readable labels.

### Small quality fixes

- [x] Show visual feedback after copying the home link.
- [x] Add consistent visual feedback for user actions: clickable button states, success confirmation, transient success/error messages, and clear modal feedback after saves/deletes.
- [x] Improve `Join Existing` to accept either a home ID or a full URL.
- [x] Review budget tab item count logic and avoid using `items.value` directly in the template.

## P1 - Research and purchase options

Goal: make the app useful while researching furniture and appliances together. The core flow is: create rooms, add an item need such as `TV`, then compare possible products before deciding what to buy.

### Purchase options per item

- [x] Store purchase options inside the current `items.vendor_links` JSONB field for now, to avoid a schema migration before the app shape is clearer.
- [x] Allow each item to have multiple purchase options.
- [x] Each option should support model/name, store, price, URL, notes, and whether it is the preferred option.
- [x] Show options directly under each item so alternatives can be compared quickly.
- [x] Allow one preferred option per item.
- [x] Keep old simple vendor links readable as legacy options.
- Later, migrate purchase options to a dedicated table if JSONB becomes hard to maintain.

### Budget from selected options

- [x] Use the preferred option price as the item estimate when it exists.
- [x] Fall back to the manual estimated price when no preferred option exists.
- [x] Show the current estimate in the item list.
- [x] Show the lowest researched price as supporting information when options exist.
- [x] Apply selected-option estimates to room and home budget totals.
- Add stronger visual warnings when the total budget is exceeded.
- Add stronger visual warnings when a room budget is exceeded.

### Currency formatting cleanup

- [x] Create a centralized currency formatter.
- [x] Use BRL / pt-BR as the default display format.
- [x] Replace inline currency formatting calls with one shared `formatCurrency(value)` function.
- [x] Avoid hardcoded `USD` / `en-US` formatting inside templates.
- [x] Keep currency formatting independent from future interface language settings.

### Purchase status

- Keep item status visible in the list.
- Add a quick action to mark an item as bought after options are useful.
- Show totals by status: planned, researching, preferred, and bought.
- Split planned estimate from actual spent only after the preferred/bought flow is clearer.

### Future language and currency selector

- Keep interface text in English for now.
- Add BRL / USD / EUR selector only if the app needs multiple currency views.
- Persist a future selected currency in `localStorage`.
- Add a separate language selector only if full interface translation becomes necessary.

## P2 - Subitems and richer item structure

### Subitems

- Create sublists inside items.
- Allow each subitem to have name, estimated price, status, notes, and vendor links.
- Allow marking each subitem as bought.
- Calculate the item total from subitems when subitems exist.
- Example: item `TV` with subitems `Living room TV` and `Bedroom TV`.

### Item categories

- Expand item categories beyond the current basic types.
- Suggested categories:
  - Furniture
  - Appliance
  - Electronics
  - Lighting
  - Kitchen
  - Bathroom
  - Decoration
  - Tools
  - Other
- Add category filter to the item list.
- Add category information to the budget overview.

### Sorting and filtering

- Add filtering by status.
- Add filtering by priority.
- Add search by item name.
- Add sorting by priority, price, status, or creation date.

## P3 - Organization and collaboration

### Sharing

- Improve the copied home link experience with a success message.
- Add a small sharing/help section explaining how another person can join a home.
- Consider adding a short public share code if full UUIDs feel too hard to use.

### Productivity

- Add duplicate item action.
- Add move item to another room action.
- Add room templates such as bedroom, kitchen, living room, bathroom, office, and laundry.
- Add common item suggestions per room template.

### Empty and edge states

- Improve empty state when no rooms exist.
- Improve empty state when a room has no items.
- Improve error state when a home ID does not exist.
- Add loading states for save/delete actions.

## P4 - Technical quality and documentation

### Supabase and data model

- Document required Supabase tables in the README.
- Add expected columns for `homes`, `rooms`, `items`, and future `subitems`.
- Add `.env.example` with required variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
- Handle missing Supabase environment variables with a clear app error.

### Code organization

- Keep changes small while the app is still compact.
- Split `HomeDetail.vue` into smaller components only when the file becomes harder to maintain.
- Potential future components:
  - `BudgetSummary`
  - `RoomsList`
  - `ItemsList`
  - `RoomModal`
  - `ItemModal`
  - `StatusBadge`

## Suggested implementation order

1. Finish all P0 items before starting P1.
2. Fix item room selection, form validation, Enter key submit, and invalid vendor link errors.
3. Improve notes and vendor link display.
4. Improve join/copy link behavior.
5. Fix budget tab item count and improve budget warnings.
6. Start P1 only after P0 is complete.
7. Rework P1 around purchase options per item.
8. Add a centralized BRL currency formatter.
9. Replace all hardcoded currency formatting with `formatCurrency(value)`.
10. Add editable purchase options to the item modal.
11. Show purchase options inside each item.
12. Use the preferred option price in budget totals.
13. Improve budget warnings.
14. Add quick `mark as bought` action after the option flow is stable.
15. Add filters/search/sorting for items.
16. Decide whether purchase options need a dedicated table.
17. Improve README and Supabase documentation.
