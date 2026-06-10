# Roadmap

Roadmap organized by priority. Higher priority items should improve daily usability, reduce friction, or unblock bigger features.

## P0 - Essential fixes and UX

### Forms and input flow

- [x] Save homes in localStorage so users can quickly refer to a house they already accessed
- [x] Remove default room when adding item to prevent adding the item to the wrong room. (Prevent saving when no room is selected)
- [x] Add Enter key support to save room and item modals.
- [x] Validate required fields before saving rooms and items.
- [x] Disable `Add Item` when no room exists yet.
- Show a clear validation error when vendor links are not valid JSON.
- [~] Keep modal actions consistent: `Save`, `Cancel`, loading/disabled states, and error feedback. Error feedback is in place; loading/disabled states still need implementation.
- [x] Autofocus the first field when room and item modals open.
- [x] Keep the home detail page visible for non-fatal action errors instead of replacing it with a full-page error.

### Notes and links display

- Add line breaks or max-height handling for long notes.
- Add `show more / show less` behavior when notes are too large.
- Prevent long URLs from breaking the layout on mobile.
- Add link aliases so vendor URLs appear as short readable labels.

### Small quality fixes

- Show visual feedback after copying the home link.
- Add consistent visual feedback for user actions: clickable button states, success confirmation, transient success/error messages, and clear modal feedback after saves/deletes.
- [x] Improve `Join Existing` to accept either a home ID or a full URL.
- Review budget tab item count logic and avoid using `items.value` directly in the template.

## P1 - Purchase status, budget clarity, and currency

### Purchase status

- Add a quick action to mark an item as bought from the item list.
- Add support to mark future subitems as bought.
- Show totals by status: planned, researching, and bought.
- Make item status more visible in the list.

### Budget tracking

- Split planned cost from actual spent cost.
- Show total budget, planned total, bought total, and remaining budget.
- Add stronger visual warnings when the total budget is exceeded.
- Add stronger visual warnings when a room budget is exceeded.
- Allow editing the total home budget after the home is created.

### Budget navigation

- Improve the current budget summary bar so it works like a quick overview.
- Consider keeping budget information visible while browsing rooms and items.
- Add direct navigation from budget sections to filtered room/item lists.

### Currency format selector

Goal: allow the user to choose how money is displayed without changing the full app language yet.

- Add a currency selector in the home detail header, near `Home` and `Copy Link`.
- Support initial formats: BRL / pt-BR, USD / en-US, and EUR / de-DE.
- Persist the selected currency in `localStorage`.
- Apply the selected currency format to every money value in the app.
- Keep interface text in English for now.

### Currency formatting cleanup

- Create a centralized currency formatter.
- Replace inline currency formatting calls with one shared `formatCurrency(value)` function.
- Avoid hardcoded `USD` / `en-US` formatting inside templates.
- Keep currency formatting independent from future interface language settings.

### Future language support

- Decide later if the app should support multiple interface languages.
- Add a separate language selector only if full interface translation becomes necessary.
- Translate labels, buttons, statuses, priorities, categories, placeholders, and errors only after currency formatting is stable.

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
7. Add a centralized currency formatter.
8. Add the currency selector to the header.
9. Persist selected currency in `localStorage`.
10. Replace all hardcoded currency formatting with `formatCurrency(value)`.
11. Add quick `mark as bought` action.
12. Add planned vs actual budget tracking.
13. Add filters/search/sorting for items.
14. Design the data model for subitems before implementing the UI.
15. Implement subitems.
16. Improve README and Supabase documentation.
