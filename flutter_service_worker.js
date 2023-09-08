'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';

const RESOURCES = {"assets/AssetManifest.bin": "72933fd461cfb54641797fa3a02c65d3",
"assets/AssetManifest.json": "9a354032ce5d66276728d3be360110e7",
"assets/assets/fonts/cascadia/CascadiaMono-Bold.ttf": "09733c672c8b82dc8c03fc303e117220",
"assets/assets/fonts/cascadia/CascadiaMono-ExtraLight.ttf": "8d01ddbf0a302f6b559855de235ae81a",
"assets/assets/fonts/cascadia/CascadiaMono-Light.ttf": "6eccd195cf747118b56083f3174e3646",
"assets/assets/fonts/cascadia/CascadiaMono-Regular.ttf": "0b375343749159ce0731c09db3f43950",
"assets/assets/fonts/cascadia/CascadiaMono-SemiLight.ttf": "d94dde29e68e3465f120906fcdf09586",
"assets/assets/fonts/pretendard/Pretendard-Black.ttf": "eb51bbd6cd9010dc92357f8303784b17",
"assets/assets/fonts/pretendard/Pretendard-Bold.ttf": "dc5a0e145559879abb18d5969da0df6b",
"assets/assets/fonts/pretendard/Pretendard-ExtraBold.ttf": "a75966342357de44f5a09d07b0ae535a",
"assets/assets/fonts/pretendard/Pretendard-ExtraLight.ttf": "6ff96cb10994cadd3bf7bdc30cd31aa1",
"assets/assets/fonts/pretendard/Pretendard-Light.ttf": "3a2c8b53f02202d322fa86eb9672ba30",
"assets/assets/fonts/pretendard/Pretendard-Medium.ttf": "be5dedc52c0403d321e8202ae6aac2b3",
"assets/assets/fonts/pretendard/Pretendard-Regular.ttf": "65e9a69de2d10a9e43102d5c5eae368b",
"assets/assets/fonts/pretendard/Pretendard-SemiBold.ttf": "bc96c6e0e53f8f953912e93a1e50b8f7",
"assets/assets/fonts/pretendard/Pretendard-Thin.ttf": "86fdcc882292e5db7d6bef1c68aceba6",
"assets/assets/images/kakaotalk_logo.png": "4a880c666617d82195064e058792086a",
"assets/assets/images/kakaotalk_logo.svg": "ce857aebea79196a067dd4ddfd2d5798",
"assets/FontManifest.json": "15b048dcb6ab1b7e75cbfd16eebac7dd",
"assets/fonts/MaterialIcons-Regular.otf": "22992f851e0d5a3b8edbafd60e7fbab7",
"assets/NOTICES": "7f2dece22bf38dd3c8986f400e458eaf",
"assets/shaders/ink_sparkle.frag": "f8b80e740d33eb157090be4e995febdf",
"canvaskit/canvaskit.js": "5caccb235fad20e9b72ea6da5a0094e6",
"canvaskit/canvaskit.wasm": "d9f69e0f428f695dc3d66b3a83a4aa8e",
"canvaskit/chromium/canvaskit.js": "ffb2bb6484d5689d91f393b60664d530",
"canvaskit/chromium/canvaskit.wasm": "393ec8fb05d94036734f8104fa550a67",
"canvaskit/skwasm.js": "95f16c6690f955a45b2317496983dbe9",
"canvaskit/skwasm.wasm": "d1fde2560be92c0b07ad9cf9acb10d05",
"canvaskit/skwasm.worker.js": "51253d3321b11ddb8d73fa8aa87d3b15",
"favicon.png": "7bbbd1db964f61c7fe4eb4e45f7bd7ec",
"flutter.js": "6b515e434cea20006b3ef1726d2c8894",
"icons/icon.png": "7665e0753c4484fa08ce6d71ef2cd86e",
"index.html": "112296bfb4e643013c7bb61b022a8e02",
"/": "112296bfb4e643013c7bb61b022a8e02",
"main.dart.js": "90334e55e94f3bdaccc1ddc01de40086",
"manifest.json": "ef9cc5f320e477d43dc160d0f7d804f7",
"version.json": "033bc66cc39af77967d4aa9878d82858"};
// The application shell files that are downloaded before a service worker can
// start.
const CORE = ["main.dart.js",
"index.html",
"assets/AssetManifest.json",
"assets/FontManifest.json"];

// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value, {'cache': 'reload'})));
    })
  );
});
// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        // Claim client to enable caching on first launch
        self.clients.claim();
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      // Claim client to enable caching on first launch
      self.clients.claim();
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});
// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache only if the resource was successfully fetched.
        return response || fetch(event.request).then((response) => {
          if (response && Boolean(response.ok)) {
            cache.put(event.request, response.clone());
          }
          return response;
        });
      })
    })
  );
});
self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});
// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}
// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
