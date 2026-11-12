// English translations of CHANGELOG.md, by version, one string per bullet in the same order.
// The "修复：" (Fix:) prefix is shown as an icon, so it is left out here.
// A version missing here (or with a different number of bullets) falls back to the original Chinese.

const changelog: Record<string, string[]> = {
  'v0.4.5': [
    "With large videos in a batch, AI analysis started once the photos were done while the videos were still uploading, competing with the upload; AI now waits as long as any file is still unfinished (a cancelled upload stops the wait at once, and one with no activity for 10 minutes no longer holds it up)",
    "Task panel at the top right: what each task does and its progress (time left, what it is waiting for) are on separate lines and wrap when needed, instead of being cut down to a few characters; the panel no longer scrolls sideways",
  ],
  'v0.4.4': [
    "Since v0.4.2, Wanmory gave the files in the data folder to the container's own user, so the host user (for example a Raspberry Pi user whose ID isn't 1000) couldn't delete uploaded photos and thumbnails; Wanmory now runs as the owner of the data folder, so everything it writes belongs to that user, and files left by earlier versions are given back",
    "Model files downloaded by the AI service belonged to root and couldn't be deleted on the host; they now go to the owner of the model folder",
    "Uninstall script: when a normal delete is refused, it deletes through a temporary container; only if that fails too does it say so, with the sudo command to run, instead of reporting both failure and success",
  ],
  'v0.4.3': [
    "New status capsule at the top right: while photos upload, import or go through AI analysis it appears left of the toolbar and says in a few words what is happening (Uploading 11%, Upload complete, Waiting for AI analysis, AI analysis 3 / 674); click it for upload progress, each file and background tasks. It replaces the upload window at the bottom left and the task icon at the top of the menu",
    "Uploads keep going when you switch to another page, and progress is visible on every page; closing or reloading the page while photos are still uploading asks first",
    "A stalled upload (the network dropped for a moment, no progress for 45 seconds) reconnects automatically and continues from where it stopped",
    "Without the AI models downloaded, the built-in text recognition still ran, so task progress looked like analysis was happening; now all AI analysis pauses until the models are downloaded, with a hint to download them in Settings → AI, and starts automatically afterwards",
  ],
  'v0.4.2': [
    "Wanmory could not start and kept restarting when the data folder wasn’t owned by the container’s user (for example after installing with sudo, or on a Raspberry Pi); it now fixes the folder’s owner on startup, and also works on USB drives and network shares where the owner can’t be changed",
    "Install script: waits up to 5 minutes before deciding whether Wanmory started; if it keeps restarting, the last log lines are shown, and “Installation complete” is no longer printed when it didn’t start; the closing hint no longer contains Chinese; it now opens with a welcome banner and the version being installed",
  ],
  'v0.4.1': [
    "Two-step verification: authenticator apps now show the entry as “Wanmory:username”, without the Chinese prefix; if you already turned it on, turn it off and scan again to get the new name",
  ],
  'v0.4.0': [
    "The interface now comes in 12 languages: 简体中文, 繁體中文, English, 日本語, 한국어, Deutsch, Français, Español, Português, Русский, Italiano, Tiếng Việt. Set it in My account; by default it follows your browser language, and it stays the same when you sign in on another device. Dates, numbers and place names follow the language too",
    "Two-step verification: turn it on in My account by scanning a QR code with an authenticator app (Google Authenticator, Microsoft Authenticator, 2FAS and others); signing in then asks for a 6-digit code after your password. You get 10 recovery codes for when your phone isn’t at hand",
    "Redesigned avatar picker: a crop preview on top that you can drag and zoom, and below it a choice of uploading an image, a photo from your library, the default avatar or a cartoon",
    "All dialogs now share one look: a centered icon, title and description, with two equal-width buttons below; deleting a member, album or model uses the same delete confirmation",
    "With photos selected, More now offers Share…: use the system share sheet to email them (the photos go straight into the attachments), AirDrop them or send them to other apps; the library must be opened over https or localhost",
    "When sorting by date added, the timeline on the right and the date groups above the photos use the date added too",
    "Security: repeated wrong passwords now lock sign-in for a while; the site can’t be embedded by other websites, and uploaded files are never run as web pages; the local network domain can be changed right in System settings",
    "The upload-complete notice now disappears after 10 seconds",
    "The background stuttered when a confirmation dialog opened",
  ],
  'v0.3.1': [
    "The Places map can now be zoomed and dragged: zoom with the mouse wheel or trackpad, double-click to zoom in, drag to pan, pinch with two fingers on phones, and use the buttons at the bottom right to zoom in, zoom out or show the whole world; at around country level it switches to a street map (online maps must be on) with cities, roads and place names, and the photo pins keep splitting as you zoom, down to individual spots; coming back from the photos returns you to where you were",
    "Website: the calendar on the releases page is now a month calendar with each day’s version numbers, and clicking a version jumps to its notes; fixed pages occasionally loading with no styling on slow networks or right after a site update",
  ],
  'v0.3.0': [
    "A new website: home, architecture, setup & docs, FAQ, releases and feedback, in 12 languages; it follows your browser language by default, and you can switch at the bottom of the page",
    "One-command install and uninstall scripts (install.sh, uninstall.sh): set the port, domain, database password and location, time zone, data directory and photo directory during install; you can choose where the database, data and models live (WANMORY_DB_DIR, WANMORY_DATA_DIR, WANMORY_MODELS_DIR), and WANMORY_DOMAIN sets the domain used on your local network",
    "Places is now a flat world map: countries you have visited are shown in a warm color, each city has a photo pin labeled with the city and country, and clicking one opens the photos taken there; the top right now offers just Map / Grid, and the street map and satellite globe are gone",
    "The Albums page now uses large cards: square covers with the name and item count below, a lock on private albums, and the creator’s name on albums made by someone else; deleting an album uses the standard confirmation dialog, and Add photos inside an album is now a prominent primary button",
    "The People page now shows large 3:4 portraits with the name and count below; click a name to rename. The person header is simpler: avatar, name and age, with the years and photo and video counts on the line below, and Photos, Growth, Places and Together tabs on the right; cards in Growth, Together and Places are the same size as on the People and Albums pages",
    "Every page title is now a single line: the large title followed by a gray description",
    "On phones and other narrow screens, a logo bar sits at the top, and the menu slides in from the right",
    "Demo account: the account named demo (change it with WANMORY_DEMO_USER) cannot change its password, sign out other devices or delete anything, but it can upload, and it can delete photos it uploaded and albums it created within the last 30 minutes",
    "Improvements to featured memories, sign-in history, avatars, aesthetic scoring, IP location and more",
  ],
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
