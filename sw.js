/* Service worker de Rubik'IA.

   Objectif : le site marche hors ligne, y compris les 18 Mo de tables du solveur.

   Deux politiques, et le choix entre les deux est la seule chose qui compte ici :

   - CoordCube.js d'abord le cache. Ce sont des tables précalculées qui ne changeront
     jamais, et c'est de loin le plus gros téléchargement de la page.
   - tout le reste d'abord le réseau, le cache ne servant que de secours. Les noms de
     fichiers ne portent pas d'empreinte de contenu : servir le cache en premier
     figerait la version installée chez le visiteur, exactement le piège dans lequel
     un Cache-Control d'un an nous avait déjà fait tomber côté serveur.
*/

var CACHE = 'rubikia-v1'

// Le strict nécessaire pour que la page démarre hors ligne dès la première visite.
// Le reste (bibliothèque 3D, modèles, nuanceurs, solveur) est mis en cache au vol.
var SHELL = [
	'./',
	'index.html',
	'style.css',
	'index.js',
	'favicon.svg',
	'manifest.webmanifest',
	'jquery/jquery-2.1.1.min.js',
	'lib3dcube/virtualrubik.js'
]

self.addEventListener('install', function(event) {
	event.waitUntil(
		caches.open(CACHE)
			.then(function(cache) { return cache.addAll(SHELL) })
			// Un fichier manquant ne doit pas faire échouer toute l'installation.
			.catch(function() {})
			.then(function() { return self.skipWaiting() })
	)
})

self.addEventListener('activate', function(event) {
	event.waitUntil(
		caches.keys()
			.then(function(names) {
				return Promise.all(names.map(function(name) {
					return name === CACHE ? null : caches.delete(name)
				}))
			})
			.then(function() { return self.clients.claim() })
	)
})

function cacheFirst(request) {
	return caches.match(request).then(function(hit) {
		if (hit) return hit
		return fetch(request).then(function(response) {
			if (response && response.ok) {
				var copy = response.clone()
				caches.open(CACHE).then(function(cache) { cache.put(request, copy) })
			}
			return response
		})
	})
}

function networkFirst(request) {
	return fetch(request).then(function(response) {
		if (response && response.ok) {
			var copy = response.clone()
			caches.open(CACHE).then(function(cache) { cache.put(request, copy) })
		}
		return response
	}).catch(function() {
		return caches.match(request).then(function(hit) {
			if (hit) return hit
			// Hors ligne sur une navigation : on retombe sur la page d'accueil en cache.
			if (request.mode === 'navigate') return caches.match('index.html')
			throw new Error('hors ligne et absent du cache')
		})
	})
}

self.addEventListener('fetch', function(event) {
	var request = event.request
	if (request.method !== 'GET') return

	var url = new URL(request.url)
	if (url.origin !== self.location.origin) return

	if (/CoordCube\.js$/.test(url.pathname)) event.respondWith(cacheFirst(request))
	else event.respondWith(networkFirst(request))
})
