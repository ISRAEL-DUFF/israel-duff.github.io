// install script

/*
 installation steps
  1. Open a cache.
  2. Cache our files.
  3. Confirm whether all the required assets are cached or not.
*/

// cache name and List of files to cache
const CACHE_NAME = 'service-worker-cache-v1'
const urlsToCache = [
  './',
  './test.html',
  './styles/alert.css',
  './styles/flexbox.css',
  './scripts/alert.js'
]

// the install event
self.addEventListener('install', function(event) {
  // step 1
  event.waitUntil(caches.open(CACHE_NAME).then(
      function(cache) {
        console.log('opened cache')
        // you can do some other stuffs here
        return cache.addAll(urlsToCache)  // step 2
      }).catch((err) => {
        console.log('error:', err.message)
      })
  );
});




// cache and return requests
self.addEventListener('request', function(event) {
    event.respondWith(
      caches.match(event.request)
  ).then((response) => {
    // chache hit - return the response
    if(response) {
      return response
    } else { // cache mis - fetch from server
      return fetch(event.request)
    }
  })
})