/**
 * Service Worker - Fixed for TypeScript 2026
 */

/// <reference lib="webworker" />

const CACHE_NAME = 'zoe-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
];

// Declare self as ServiceWorkerGlobalScope
declare const self: ServiceWorkerGlobalScope;

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        return response;
      }
      
      return fetch(request).then((fetchResponse) => {
        // Don't cache API calls
        if (request.url.includes('/api/')) {
          return fetchResponse;
        }
        
        const clone = fetchResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, clone);
        });
        
        return fetchResponse;
      });
    })
  );
});

// Message event
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});

export {};
