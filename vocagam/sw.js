// Cache name
const CACHE_NAME = 'vocagam-pwa-cache-v1';

// Files to cache
const CACHE_ASSETS = [
    './',
    './index.html',
    './css/styles.css',
    './css/menu.css',
    './css/ui-components.css',
    './matching/column.css',
    './matching/matching.js',
    './matching/matching-col.js',
    './matching/index.html',
    './matching/grid.html',
    './matching/column.html',
    './flashcard/flashcard.html',
    './flashcard/flashcard.js',
    './util.js',
    './word-bank/greek/greek-words.json',
    './manifest.webmanifest',
    './images/foreign_128.png',
    './images/foreign_512.png',
];

// Install event
// self.addEventListener('install', (event) => {
//     console.log('Service Worker: Installing...');
//     event.waitUntil(
//         caches.open(CACHE_NAME)
//             .then((cache) => {
//                 console.log('Service Worker: Caching files');
//                 return cache.addAll(CACHE_ASSETS);
//             })
//     );
// });

self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching files');
                return cache.addAll(CACHE_ASSETS).catch((error) => {
                    console.error('Service Worker: Failed to cache assets:', error);
                });
            })
    );
});

// Activate event
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// Fetch event - CACHE FIRST
// self.addEventListener('fetch', (event) => {
//     console.log('Service Worker: Fetching', event.request.url);
//     event.respondWith(
//         caches.match(event.request)
//             .then((response) => {
//                 // Return cached response if found, otherwise fetch from network
//                 return response || fetch(event.request);
//             })
//     );
// });

// Fetch event with network-first strategy
self.addEventListener('fetch', (event) => {
    console.log('Service Worker: Fetching', event.request.url);
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Check if we received a valid response
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response; // Return the response if it's not valid
                }

                // Clone the response so we can cache it
                const responseToCache = response.clone();

                // Open the cache and store the response
                caches.open(CACHE_NAME)
                    .then((cache) => {
                        cache.put(event.request, responseToCache);
                    });

                return response; // Return the network response
            })
            .catch(() => {
                // If the network request fails, try to return the cached version
                return caches.match(event.request);
            })
    );
});

// Message event (optional)
self.addEventListener('message', (event) => {
    console.log('Service Worker: Message received:', event.data);
    // Handle messages from the client
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});