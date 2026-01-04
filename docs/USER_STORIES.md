# Todo Application - User Stories

## Todo Item Management

### Create Todo
**As a user**, I want to be able to create a new todo item with a title, description, and due date.

**Acceptance Criteria:**
- User can enter a title (required)
- User can enter a description (optional)
- User can select a due date (optional)
- Todo is saved and appears in the list

---

### Edit Todo
**As a user**, I want to edit the details of an existing todo item.

**Acceptance Criteria:**
- User can modify the title, description, and due date
- User can change the assigned category
- Changes are persisted

---

### Delete Todo
**As a user**, I want to delete a todo item.

**Acceptance Criteria:**
- User can delete any todo item
- Deletion is confirmed before removing
- Todo is permanently removed from the list

---

### Mark Complete/Incomplete
**As a user**, I want to mark a todo item as complete or incomplete.

**Acceptance Criteria:**
- User can toggle completion status
- Completed items are visually distinguished
- Completion state is persisted

---

## Category Management

### Assign Category
**As a user**, I want to assign a category to each todo item.

**Acceptance Criteria:**
- User can select from existing categories when creating/editing a todo
- User can change category assignment at any time
- Todos can optionally have no category (uncategorized)

---

### Create Category
**As a user**, I want to create new categories for organizing my todo items.

**Acceptance Criteria:**
- User can create a new category with a name
- New category becomes available for assignment
- Category names must be unique

---

### View by Category
**As a user**, I want to view all my todo items grouped by their categories.

**Acceptance Criteria:**
- Todos are displayed in groups by category
- Uncategorized todos are shown in a separate group
- Empty categories are optionally shown/hidden

---

## Filtering & Sorting

### Filter by Status
**As a user**, I want to filter todo items by their completion status (all, active, completed).

**Acceptance Criteria:**
- User can filter to show all todos
- User can filter to show only active (incomplete) todos
- User can filter to show only completed todos
- Filter selection is visually indicated

---

### Sort Todos
**As a user**, I want to sort todo items by due date or creation date.

**Acceptance Criteria:**
- User can sort by due date (ascending/descending)
- User can sort by creation date (ascending/descending)
- Current sort order is visually indicated
- Todos without due dates are handled appropriately when sorting by due date
