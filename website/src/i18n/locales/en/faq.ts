import type { FaqDict } from '../zh/faq'

// English · FAQ page

const faq: FaqDict = {
  title: 'Frequently Asked Questions',
  lead: 'Answers to the questions we hear most often. Can’t find what you need? Open an issue on GitHub or read the full deployment and user guide.',
  readDocs: 'Read the docs',
  submit: 'Report an issue',
  categories: 'Question categories',
  all: 'All',
  showAll: 'Show all {n} questions',
  groups: [
    {
      key: 'deploy',
      label: 'Deployment',
      items: [
        {
          q: 'What hardware do I need to run Wanmory?',
          a: 'Any x86_64 or ARM64 device that runs Docker will do, such as a NAS, a mini PC or a Raspberry Pi 5. With 4 GB of memory or more, the system automatically picks the lightweight models; with 8 GB or more you can use the Balanced tier. For large libraries or faster AI processing, run the AI service on a computer with a GPU or an Apple Silicon Mac.',
        },
        {
          q: 'Does it work on a Synology or QNAP NAS?',
          a: 'Yes. Wanmory is deployed with Docker Compose and runs on Synology DSM, QNAP QTS, TrueNAS SCALE, Unraid, and Linux distributions such as Ubuntu and Debian. Images are published for both amd64 and arm64, and the matching one is pulled automatically.',
        },
        {
          q: 'Do I have to re-upload the photos already on my NAS?',
          a: 'No. Mount your photo folders under /photos in docker-compose.yml. You can mount several, and read-only (:ro) mounts are recommended. The folders are scanned every 15 minutes and new photos are imported in place, without copying or moving the original files.',
        },
        {
          q: 'Pulling the images is slow. What can I do?',
          a: 'Set WANMORY_REGISTRY in the .env file next to docker-compose.yml to a registry you can reach, then run docker compose up -d again.',
        },
        {
          q: 'How do I upgrade to a new version?',
          a: 'Run docker compose pull && docker compose up -d in the directory containing docker-compose.yml. Database migrations run automatically at startup, and your photos, people and albums are not affected. Settings → System update in the web app tells you when a new version is available.',
        },
        {
          q: 'What if I forget the admin password?',
          a: 'On the host running the app, go to the directory containing docker-compose.yml and run docker compose exec server wanmory reset-password, then choose the account and enter a new password when prompted. Passwords of regular members are reset by an admin under Settings → Members.',
        },
      ],
    },
    {
      key: 'ai',
      label: 'AI & Privacy',
      items: [
        {
          q: 'Are my photos uploaded to the cloud?',
          a: 'No. Photos, thumbnails, the database and all AI results are stored on the device running Wanmory. AI models are downloaded only on first use; after that, face recognition, semantic search and text recognition all run locally.',
        },
        {
          q: 'Can I use the AI features on a low-powered NAS?',
          a: 'Yes. The built-in AI service runs on the CPU only. The first pass over a large library takes longer, and new photos are processed as they arrive. Under Performance and scheduling you can also choose to process only when idle or at night, so everyday use is not affected.',
        },
        {
          q: 'Can the AI service run on a different computer?',
          a: 'Yes. Run the AI service on a Mac or a computer with an NVIDIA GPU, then choose Remote service under Settings → AI and enter its address and access token. The AI service only receives 1440-pixel previews and never touches the originals or the database.',
        },
        {
          q: 'Do the AI features need a constant internet connection?',
          a: 'No. Once the models are downloaded, everything can run fully offline. Only online maps and reverse geocoding need the internet, and both can be turned off in Settings, in which case places show coordinates only.',
        },
        {
          q: 'How are faces grouped?',
          a: 'The system detects the faces in each photo and computes a feature vector for each, and similar faces are grouped into the same person automatically. A person is listed once they appear in at least 3 photos, so passers-by who show up occasionally are not added. Name a person and set a birthday to look back at how they have grown by age.',
        },
        {
          q: 'What kinds of search are supported?',
          a: 'Natural-language search in Chinese, such as “宝宝三岁生日的照片” (photos from baby’s third birthday) or “海边的日落” (sunset at the beach); you can also search the text in photos (IDs, screenshots, signs) and where they were taken. The three kinds of results are merged and ranked, and only clearly relevant photos are returned.',
        },
      ],
    },
    {
      key: 'usage',
      label: 'Using Wanmory',
      items: [
        {
          q: 'How do I open my library on a phone?',
          a: 'On the same local network, open http://wanmory.local:8080 in your phone’s browser. iPhone, iPad, Mac and Windows need no router configuration. Some Android devices do not support .local domains; use the IP address instead.',
        },
        {
          q: 'Which photo and video formats are supported?',
          a: 'Common photo formats including JPEG, PNG, HEIC and RAW (such as DNG), plus common video formats. Web uploads are resumable, so they continue after a network interruption or a page refresh.',
        },
        {
          q: 'Can deleted photos be recovered?',
          a: 'Yes. Deleted photos first go to Recently Deleted, where they can be restored at any time. For photo folders mounted read-only, the original files are kept even if you delete permanently in the app; they simply stop being shown.',
        },
        {
          q: 'How do I clean up bursts and duplicate photos?',
          a: 'Bursts & similar automatically groups burst shots and nearly identical photos and recommends the sharpest one to keep; the rest can be moved to Recently Deleted in one click. Files with exactly the same content are listed separately under Duplicates.',
        },
      ],
    },
    {
      key: 'members',
      label: 'Members & Permissions',
      items: [
        {
          q: 'Can several people use it together?',
          a: 'Yes. An admin creates a separate account for each person, and everyone’s uploads come together in one library. Members can delete only the photos they uploaded, admins can manage everything, and the sign-in log records the time, device and approximate location of every sign-in.',
        },
        {
          q: 'Can other members see the photos I hide?',
          a: 'No. Hidden photos are visible only to you, and private albums only to their creator. People’s names and merges are shared, but the photo counts and person covers each member sees are computed only from the photos that member can see.',
        },
        {
          q: 'What is guest browsing?',
          a: 'With guest browsing on, visitors who are not signed in can browse shared photos read-only; private albums and hidden photos stay invisible. If your library is reachable from the internet, we recommend turning guest browsing off in Settings.',
        },
      ],
    },
  ],
}

export default faq
