// English translations of CHANGELOG.md, by version, one string per bullet in the same order.
// The "修复：" (Fix:) prefix is shown as an icon, so it is left out here.
// A version missing here (or with a different number of bullets) falls back to the original Chinese.

const changelog: Record<string, string[]> = {
  'v0.2.9': [
    'New logo: a single-stroke “M” inside a thin circle with a red dot; browser tabs now show an icon too',
    'The left menu can collapse into a narrow icon-only bar (click the logo to expand); it is now split into three groups, Main, Categories and Organize. Categories include Favorites, Rating, Videos, Scenery, Food, Animals and Plants, with Screenshots, Documents and IDs under More',
    'New Plants category, and Pets is now Animals (birds and zoo animals count too); searching a category name (Food, Scenery…) shows that category’s photos directly',
    'New My account page: click the avatar at the bottom left of the menu to change your avatar, name and password, see the devices you are signed in on (browser, IP, last used) and sign out other devices; the theme setting lives here too',
    'System settings are now a set of cards: Members, AI run mode (with a connection test and a warning if it cannot connect), Compute device, Model tier (downloaded models can be deleted), Background processing, Upload directory, Guest browsing, Online maps and System update; models now download automatically from whichever is faster, Hugging Face or a mirror in China',
    'All pop-up windows now share a translucent frosted look, with primary and secondary buttons; errors when adding a member or changing a password are shown right in the window',
    'An album’s Sharing settings are renamed Permissions: Everyone, Specific members, Only me',
    'Darker background in dark mode; all buttons and segmented controls across the app now share one style',
    'The background task icon kept spinning and showing 0 after all tasks had finished',
  ],
  'v0.2.8': [
    'The content area now has a white background (for more accurate photo colors) and the left menu is beige; storage usage at the bottom of the menu is now a small white card',
    'The play button is now just an orange circular icon, showing “Slideshow” on hover',
    'Cleaner person page header: no gradient, a thin border, avatar, name, age and birthday on top and four stats below; the birthday can be set or changed right under the name, and the header is identical across the Photos, Growth, Places and Together tabs',
  ],
  'v0.2.7': [
    'A brand-new warm look: off-white background, brick-orange accent, and a serif font for page titles, names, memories and dates; a new orange logo',
    'Every page now has a search box at the top (searching the whole library); the calendar, sort, filter and display size on the right are combined into one button group, and play is now an orange Slideshow button everywhere',
    'Photos in the library, favorites, albums and people are grouped by month, each group headed like “November 2026”',
    'On This Day is now a large single-photo card',
    'New person page header: large avatar, age and birthday, stats for photos, videos, years spanned and places visited, and the people they often appear with',
    'The left menu always stays visible (it no longer collapses when opening a person or album) and shows storage usage at the bottom; “Upload files” is renamed “Upload photos / videos”',
    'A single click on a photo opens it full size (⌘ / Ctrl or ⇧ click to multi-select); photos fade in when switching pages',
    'The top-right buttons and the timeline on the right jumped when switching pages, the screen flashed when opening a person, and the menu animation stuttered on iPad',
    'Dialogs and menus now have an opaque white background; the selection action bar, background tasks and upload window now use a light frosted style',
    'Forgot your password (even as the only admin, or if you have forgotten the name too)? On the machine running the app, run `docker compose exec server wanmory reset-password`; see “Forgot password” in the README',
  ],
  'v0.2.6': [
    'The title bar at the top of every page now has the same height and position, so titles and buttons no longer jump when switching pages',
    'Switching pages no longer briefly shows the previous page’s photos',
    'In light mode, the content area and the left menu share the same background',
    'Added Sign out at the bottom of the menu; the system settings gear is hidden for non-admins (click your avatar and name for your own settings)',
    'Everything clickable now shows a pointer cursor on hover',
  ],
  'v0.2.5': [
    'Simplified background task panel: faces, content and text are merged into one “AI recognition” row, and metadata and thumbnails into “Importing photos”; both show progress by photo count with an estimated time remaining',
    'With the Auto tier, a tier is settled sooner and processing starts faster even when the AI service is busy right after starting',
  ],
  'v0.2.4': [
    'The AI service uses less memory: idle models are unloaded automatically (after 5 minutes on machines with less than 8 GB of memory, 30 minutes on larger ones), the previous tier’s models are released after switching tiers, and no memory pool is reserved on low-memory machines. On a Raspberry Pi, the AI service uses very little memory when not processing photos',
    'New Auto tier (the default if no tier has been chosen): picked from the AI server’s hardware, Quality with a GPU, and on CPU only, Lite below 6 GB of memory and Balanced above; it follows along if you change AI servers. AI processing does not start until a tier is settled',
  ],
  'v0.2.3': [
    'Background tasks kept showing “AI paused: photos are uploading” long after the uploads had finished. Now only uploads actively transferring data count, and AI resumes 30 seconds after they finish',
    'The library header no longer shows “Processing / Done”; processing progress is now shown only by the task icon at the top of the menu',
  ],
  'v0.2.2': [
    'The version number is shown at the top of the menu; new System update in Settings shows the versions of the app and the AI service, tells you when a new version is available, and lists what is new in it',
    'Release notes are generated automatically when a new version is published',
  ],
  'v0.2.1': [
    'Background processing adapts to the machine: how many photos the AI handles at once and how many threads each model uses are set from whether there is a GPU, the core count and memory, so a Raspberry Pi no longer stalls',
    'AI processing schedule: When idle (the default; pauses while someone is uploading or thumbnails are being generated), Anytime, or At night only',
    'New Performance section in Settings where all of the above can be changed by hand; the AI tier is recommended from the server’s hardware',
    'Background task icon at the top of the menu: appears while tasks are running, and opens to show each task type’s progress and whether AI is paused',
    'The deployment docker-compose.yml now includes the database, so a single file is enough to install',
  ],
  'v0.2.0': [
    'Guest browsing: view shared photos and albums read-only without signing in (can be turned off in Settings)',
    'New sign-in window',
    'Albums can be made private or shared only with specific members; a private album can also hide the photos you uploaded to it',
  ],
  'v0.1.0': ['First release: library, albums, people (face recognition), places, favorites, ratings, semantic search and text recognition'],
}

export default changelog
