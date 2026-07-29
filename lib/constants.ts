// Brand color - used in JS files where CSS variables aren't available
export const BRAND_COLOR = '#212a3b'; // Dark blue-gray
export const BRAND_COLOR_HOVER = '#3d485e'; // Medium blue-gray

// Sample books for the homepage (using Open Library covers)
export const sampleBooks = [
    {
        _id: '1',
        title: 'Clean Code',
        author: 'Robert Cecil Martin',
        slug: 'clean-code',
        coverURL: 'https://covers.openlibrary.org/b/isbn/9780132350884-L.jpg',
        coverColor: '#f8f4e9',
    },
    {
        _id: '2',
        title: 'JavaScript: The Definitive Guide',
        author: 'David Flanagan',
        slug: 'javascript-the-definitive-guide',
        coverURL: 'https://covers.openlibrary.org/b/isbn/9780596805524-L.jpg',
        coverColor: '#f8f4e9',
    },
    {
        _id: '3',
        title: 'Brave New World',
        author: 'Aldous Huxley',
        slug: 'brave-new-world',
        coverURL: 'https://covers.openlibrary.org/b/isbn/9780060850524-L.jpg',
        coverColor: '#f8f4e9',
    },
    {
        _id: '4',
        title: 'Rich Dad Poor Dad',
        author: 'Robert Kiyosaki',
        slug: 'rich-dad-poor-dad',
        coverURL: 'https://covers.openlibrary.org/b/isbn/9781612680194-L.jpg',
        coverColor: '#f8f4e9',
    },
    {
        _id: '5',
        title: 'Deep Work',
        author: 'Cal Newport',
        slug: 'deep-work',
        coverURL: 'https://covers.openlibrary.org/b/isbn/9781455586691-L.jpg',
        coverColor: '#f8f4e9',
    },
    {
        _id: '6',
        title: 'How to Win Friends and Influence People',
        author: 'Dale Carnegie',
        slug: 'how-to-win-friends-and-influence-people',
        coverURL: 'https://covers.openlibrary.org/b/isbn/9780671027032-L.jpg',
        coverColor: '#f8f4e9',
    },
    {
        _id: '7',
        title: 'The Power of Habit',
        author: 'Charles Duhigg',
        slug: 'the-power-of-habit',
        coverURL: 'https://covers.openlibrary.org/b/isbn/9781400069286-L.jpg',
        coverColor: '#f8f4e9',
    },
    {
        _id: '8',
        title: 'Atomic Habits',
        author: 'James Clear',
        slug: 'atomic-habits',
        coverURL: 'https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg',
        coverColor: '#f8f4e9',
    },
    {
        _id: '9',
        title: 'The Courage to Be Disliked',
        author: 'Fumitake Koga & Ichiro Kishimi',
        slug: 'the-courage-to-be-disliked',
        coverURL: 'https://covers.openlibrary.org/b/isbn/9781501197274-L.jpg',
        coverColor: '#f8f4e9',
    },
    {
        _id: '10',
        title: '1984',
        author: 'George Orwell',
        slug: '1984',
        coverURL: 'https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg',
        coverColor: '#f8f4e9',
    },
];

// File validation helpers
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const ACCEPTED_PDF_TYPES = ['application/pdf'];
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// Groq AI & Web Speech Synthesis Voice Options (Configured with distinct pitch & rate dynamics)
export const voiceOptions = {
    // Male voices
    dave: { id: 'dave', name: 'Dave', description: 'Male, conversational & natural', pitch: 1.05, rate: 1.0, match: ['dave', 'david', 'us male', 'en-us'] },
    daniel: { id: 'daniel', name: 'Daniel', description: 'Male, clear & expressive', pitch: 0.90, rate: 1.05, match: ['daniel', 'mark', 'clear'] },
    chris: { id: 'chris', name: 'Chris', description: 'Male, smooth & friendly', pitch: 0.82, rate: 0.92, match: ['chris', 'guy', 'smooth'] },
    james: { id: 'james', name: 'James', description: 'Male, deep & authoritative', pitch: 0.65, rate: 0.88, match: ['james', 'deep'] },
    alex: { id: 'alex', name: 'Alex', description: 'Male, energetic & engaging', pitch: 0.98, rate: 1.15, match: ['alex', 'richard', 'energetic'] },
    // Female voices
    rachel: { id: 'rachel', name: 'Rachel', description: 'Female, clear & warm', pitch: 1.0, rate: 1.0, match: ['rachel', 'zira', 'female'] },
    sarah: { id: 'sarah', name: 'Sarah', description: 'Female, gentle & articulate', pitch: 1.15, rate: 0.95, match: ['sarah', 'sara', 'female'] },
    samantha: { id: 'samantha', name: 'Samantha', description: 'Female, professional & bright', pitch: 1.25, rate: 1.05, match: ['samantha', 'jenny', 'female'] },
    aria: { id: 'aria', name: 'Aria', description: 'Female, expressive & story-like', pitch: 0.88, rate: 0.92, match: ['aria', 'fiona', 'female'] },
    victoria: { id: 'victoria', name: 'Victoria', description: 'Female, British accent & smooth', pitch: 1.02, rate: 0.96, match: ['victoria', 'en-gb', 'en_gb', 'uk female', 'uk english', 'british', 'hazel', 'susan'] },
    hazel: { id: 'hazel', name: 'Hazel', description: 'Female, friendly & enthusiastic', pitch: 1.35, rate: 1.1, match: ['hazel', 'karen', 'female'] },
};

// Voice categories for the selector UI
export const voiceCategories = {
    male: ['dave', 'daniel', 'chris', 'james', 'alex'],
    female: ['rachel', 'sarah', 'samantha', 'aria', 'victoria', 'hazel'],
};

// Default voice
export const DEFAULT_VOICE = 'rachel';


