# Roadmap

Roadmap organized by priority. Higher priority items should improve daily usability, reduce friction, or unblock bigger features.

## P0 - Essential fixes and UX

### Forms and input flow

- Remove default room when adding item to prevent adding the item to the wrong room. (Prevent saving when no room is selected)
- Add Enter key support to save room and item modals.
- Validate required fields before saving rooms and items.
- Disable `Add Item` when no room exists yet.
- Show a clear validation error when vendor links are not valid JSON.
- Keep modal actions consistent: `Save`, `Cancel`, loading/disabled states, and error feedback.

### Notes and links display

- Add line breaks or max-height handling for long notes.
- Add `show more / show less` behavior when notes are too large.
- Prevent long URLs from breaking the layout on mobile.
- Add link aliases so vendor URLs appear as short readable labels.

### Small quality fixes

- Show visual feedback after copying the home link.
- Improve `Join Existing` to accept either a home ID or a full URL.
- Review budget tab item count logic and avoid using `items.value` directly in the template.

## P1 - Purchase status and budget clarity

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

### Localization and formatting

- Decide whether the app should use English or Portuguese consistently.
- Decide whether currency should stay as USD or become configurable.
- Centralize currency formatting if more budget features are added.

## Suggested implementation order

1. Fix form validation, Enter key submit, and invalid vendor link errors.
2. Improve notes and vendor link display.
3. Improve join/copy link behavior.
4. Fix budget tab item count and improve budget warnings.
5. Add quick `mark as bought` action.
6. Add planned vs actual budget tracking.
7. Add filters/search/sorting for items.
8. Design the data model for subitems before implementing the UI.
9. Implement subitems.
10. Improve README and Supabase documentation.
