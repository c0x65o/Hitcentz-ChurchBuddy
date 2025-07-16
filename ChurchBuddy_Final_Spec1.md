# ChurchBuddy — Full Technical Specification (Markdown Edition)

---

## Project Overview

ChurchBuddy is a browser-based, multi-user collaborative worship and sermon presentation tool optimized for desktop, tablet, and Chromebook devices. The app combines rich text sermon editing, song lyric management with chord support, asset management, and flow sequencing into a single seamless interface. 

The system is SaaS-based, designed for scalability and performance with a DRY component architecture and centralized slide management.

---

## Table of Contents

1. [Frontend Architecture](#frontend-architecture)
2. [Backend Architecture](#backend-architecture)
3. [Slide Structure and Data Model](#slide-structure-and-data-model)
4. [Modules and Pages](#modules-and-pages)
5. [Components List](#components-list)
6. [API Structure](#api-structure)
7. [Styling Guidelines](#styling-guidelines)

---

## Frontend Architecture

- **Autosave**: Implemented with debounce across all modules
- **Responsiveness**: Mobile, tablet, and desktop support with responsive design

---

## Backend Architecture

---

## Slide Structure and Data Model

### Slides (Universal Across App)

```json
{
  "id": "uuid",
  "html": "<div>Your slide content here</div>",
  "backgroundId": "media_id"
}
```

- All slides are rendered as **HTML**. There is only one universal slide type; different content (text, images, videos, etc.) is handled within the HTML structure itself.
- They are modular and used across Songs, Sermons, and Asset Decks
- Each collection (Song/Sermon/AssetDeck) simply points to ordered Slide IDs
- Flows organize a sequence of collections (not slides directly)

---

## Modules and Pages

### Presenter Page

- Displays slides by slide type, ordered by flow
- Clicking a slide sets the variable ACTIVESLIDE to that slide
- Backgrounds scale to fit
- No editing tools available
-log to console what ACTIVESLIDE is
-Preview window to display current ACTIVESLIDE

### Songs Page

- LyricsEditor: Supports ChordPro formatting
- Empty line = new slide
- Sidebar with search, filter
- SlideThumbnailList for generated slides
- SlideEditorModal opens via pencil icon
- MyMediaLibrary opens via media icon or edit modal
- Reordering editing slides disables auto-generation
- Autosave everywhere
- ChordPro only show in printed version

### Sermons Page
-Sermons Page navigate between the two modes seemlessly with a tab at the top
Prepare Mode**
- TextEditor with toolbar:
  - Font, size, bold/italic/underline
  - Bullet/numbered lists
  - Insert Image button (opens MyMedia)
  - Add Blank Slide button
  - Create Slide button (from selected text)
  - Clear Slides button (removes all slide links and slides)
  - Once a slide has been generated slide link text can be edited without effecting the rendered slide
- uses slidethumbnailist
-Present Mode**:
  - Read-only editor of slide
  - Click buttons or thumbnails to set var
  - Auto-scroll to current slide
  - Slide formatting retains HTML structure

### Asset Decks Page

- Sidebar with list of decks
- SlideThumbnailList (auto-play toggle per deck, checkbox for loop, set duration)
- use SlideEditorModal 
- Button on toolYouTube link embeds auto-play
- 10-second auto-cycle available for each asset deck

### Flows Page

- Search bar by type (Song, Sermon, Asset Deck)
- Drag and drop to reorder
- Print Flow button: generates printable doc + song printouts
- Shows list of collections in flow
- Ability to add drag and drop blank editable notes into flow
-Notes should only be stored associated with the flow
### My Media Modul

- Grid of all uploaded images
- Track image usage
- Delete individual assets
- Assign image as background to collections or individual slides
- Background always scales to fit

- **Bulletin overlay** present bottom-right at all times as top layer
-chatbox to see previous bullitens
-Textfield for name
-textfield for message

---

## Components List

| Component             | Description & Pages Used |
|----------------------|---------------------------|
| `Sidebar`            | Search + list view (Songs, Sermons, Assets, Flows) |
| `SearchBar`          | Real-time module-specific search (Sidebar, Flows) |
| `SlideThumbnailList` | Reorder, edit, delete slide previews (All slide-based modules) |
| `SlideEditorModal`   | Edit HTML, assign background (All slide-based modules); includes toolbar with:  
- Add, move, resize text box  
- Font size and color and Fonts
- Add image (from My Media)  
- Add YouTube video player (via link)   
- Bold / Italic styles |
- Rotate image by 90 degrees
| `MyMediaLibrary`     | Media asset grid view + uploader (Media, Editor) Modul| Images Only, From here images will be drag and drop imported, deleted via trashcan icon, selected for use in slides as a sizeable object, selected for use as slide background(scale to fit)


##DATA STructure

SERMON{
 -Name:
 -ListOfSlideIDs[]:
 -OutlineText:
}
ASSETDECK{
 -Name:
 -ListOfSlideIDs[]:
 -AutoplayBool?:FALSE;
 -AutoplayLoop?:TRUE;
 -AutoplayTimeInS:
}
FLOW{
 -UniqueID#:
 -ListOfLists[]:
 -ListOfNotes: "note 1", "note 2", "baptism"
 -ListOfNotePosition:
}

BULLETINMESSAGE{
-Name
-TIMESTAMP 
-MessageTitle:
 -MessageText:
} 

---

## Core Intentions & Requirements (for next project AI)

These points capture the fundamental architectural and design principles that must guide the development of the ChurchBuddy application.

### 1. Universal Slide Type & Rendering

*   All slides in the application are of a single, universal type. Their content is exclusively defined by an HTML string in their `html` property within the `ISlide` interface.
*   There are **no separate enumerated slide types** (e.g., "text slide", "image slide", "video slide").
*   The `SlideRenderer` component will directly render this HTML content.
*   Diverse content, including multiple text boxes, images, and YouTube embeds, will be managed and supported *within the HTML structure itself* through editing tools that generate the appropriate HTML.
*   This approach is critical for maintaining a DRY (Don't Repeat Yourself) architecture and ensuring single-version components.

### 2. Design Aesthetic & Consistency

*   The entire application must adhere to a clean, modern, slick, and unobtrusive look and feel.
*   The visual design should specifically match the `SlideThumbnail` component style:
    *   **16:9 Aspect Ratio:** All slides and their thumbnails must strictly adhere to a 16:9 aspect ratio.
    *   **Modern Card-like Design:** Components, especially thumbnails, should feature a modern card-like design with subtle shadows and rounded corners.
    *   **Typography (for slides):** Slides should feature a black background with bold white centered text, and responsive font sizes with consistent padding. (Note: `SlideThumbnailList` component itself does not handle typography, as it renders what it's told at a specific size and layout).

### 3. Styling Approach

*   The project will **exclusively use plain CSS**, with a strong preference for CSS Modules for component-specific styling.
*   **Tailwind CSS will not be used** for any styling in this project.

### 4. Component Reusability & Uniqueness (DRY Principle)

*   The architecture prioritizes the "Don't Repeat Yourself" (DRY) principle as crucial to project success.
*   This mandates the **reuse of existing components** whenever possible.
*   There must be **exactly one version of each core component/module** in the project (e.g., `list-displayer`, `slide-editor`, `SlideRenderer`, `SlideThumbnailList`).
*   New components should not be created, nor should existing ones be duplicated, without explicit user permission. (For example, the `TopLeftBrand` component was removed, and its functionality was integrated into `App.tsx` to avoid unnecessary components).

### 5. Data Structure Core & Relationships

*   **Sermons, Asset Decks, and Songs** will directly reference ordered `ISlide` IDs.
*   **Flows** will serve to organize sequences of these collections (Sermons, Asset Decks, Songs), not `ISlide`s directly.
*   **Bulletin Messages** are a separate data structure and do not involve `ISlide` IDs.
*   Effectively, all content presented as slides (Sermons, Asset Decks, Songs, and Flows containing them) is ultimately linked via `ISlide` IDs, with Bulletin Messages being the distinct exception. 