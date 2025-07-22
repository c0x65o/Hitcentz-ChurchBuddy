# ChurchBuddy Project To-Do List

## Phase 1: Core Setup & Shared Components
- [x] 1. Project Structure: Set up the basic React project structure, including a modular file system for components and modules.
- [x] 2. Global Styling: Establish global CSS styles and configurations, adhering to plain CSS and CSS Modules.
- [x] 3. Data Models: Define the `ISlide` interface and core data models (Sermon, AssetDeck, Flow, BulletinMessage) based on the spec.
- [x] 4. SlideRenderer: Design and implement the `SlideRenderer` component to universally render HTML content for all slides, ensuring it handles diverse content within the HTML structure (text boxes, images, YouTube embeds).
- [x] 5. SlideThumbnail: Design and implement the `SlideThumbnail` component, adhering to the 16:9 aspect ratio, modern card-like design, subtle shadows, rounded corners, black background with bold white centered text, and responsive font sizes with consistent padding. This will serve as the style guide for the entire app.
- [x] 6. SlideThumbnailList: Design and implement the `SlideThumbnailList` component (reorder, edit, delete slide previews), reusing the `SlideThumbnail` component.
- [x] 7. Sidebar: Design and implement the `Sidebar` component (search + list view).
- [x] 8. SearchBar: Design and implement the `SearchBar` component (real-time module-specific search).
- [x] 9. SlideEditorModal: Design and implement the `SlideEditorModal` component with its toolbar features (add/move/resize text box, font size/color/fonts, add image, add YouTube video player, bold/italic, rotate image by 90 degrees).
- [ ] 10. MyMediaLibrary: Design and implement the `MyMediaLibrary` component (grid view, uploader, image usage tracking, delete assets, assign image as background to collections/slides, drag-and-drop import).

## Phase 2: Module Development
- [ ] 11. Presenter Page: Develop the Presenter Page: display slides, set `ACTIVESLIDE`, scale backgrounds, log to console, preview window. No editing tools.
- [ ] 12. Songs Page: Develop the Songs Page: LyricsEditor (ChordPro support, empty line = new slide), Sidebar, SlideThumbnailList, SlideEditorModal integration, MyMediaLibrary integration, reordering disables auto-generation, autosave, ChordPro only in print.
- [ ] 13. Sermons Page: Develop the Sermons Page (Prepare Mode and Present Mode with tab navigation): TextEditor with toolbar (font, size, bold/italic/underline, lists, insert image, add blank slide, create slide from text, clear slides), SlideThumbnailList, read-only editor in Present Mode, auto-scroll, HTML structure retention.
- [ ] 14. Asset Decks Page: Develop the Asset Decks Page: Sidebar, SlideThumbnailList (auto-play toggle, loop checkbox, set duration), SlideEditorModal integration, YouTube embed button, 10-second auto-cycle.
- [ ] 15. Flows Page: Develop the Flows Page: Search bar, drag-and-drop reorder, Print Flow button, list of collections, editable notes (stored with flow, position tracking).
- [ ] 16. Bulletin Overlay: Implement the Bulletin overlay: present bottom-right, chatbox for previous bulletins, text fields for name and message.

## Phase 3: Cross-Cutting Concerns
- [ ] 17. Autosave: Implement autosave with debounce across all modules.
- [ ] 18. Responsiveness: Ensure full responsiveness for mobile, tablet, and desktop across all modules and components. 