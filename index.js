/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	Rubik'IA — interface.

	Le solveur (algorithme deux phases de Kociemba) vit dans search.js et ses tables
	dans CoordCube.js ; ce fichier ne fait que l'alimenter et afficher le résultat.

	L'état de référence est ici, dans « state » : 54 facettes numérotées dans l'ordre
	de Kociemba (U0-U8, R9-R17, F18-F26, D27-D35, L36-L44, B45-B53). Le cube 3D et le
	patron 2D n'en sont que deux affichages. Toutes les rotations du cube 3D, y compris
	celles faites à la souris, repassent par ce modèle via un écouteur : les deux vues
	ne peuvent donc pas se désynchroniser.
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

(function() {

// Ordre des faces de Kociemba. C'est celui qu'attend Search.solution().
var FACES = ['U', 'R', 'F', 'D', 'L', 'B']

// lib3dcube numérote ses stickers dans un autre ordre : r, u, f, l, d, b.
var LIB_FACE = { R: 0, U: 1, F: 2, L: 3, D: 4, B: 5 }

// Couleurs officielles du cube, jaune en haut et bleu devant comme en 2016.
var COLORS = {
	U: [255, 213,   0, 255], // jaune
	R: [183,  18,  52, 255], // rouge
	F: [  0,  70, 173, 255], // bleu
	D: [248, 248, 248, 255], // blanc
	L: [255,  88,   0, 255], // orange
	B: [  0, 155,  72, 255]  // vert
}

// Fichiers du solveur, dans l'ordre où ils doivent s'exécuter.
var SOLVER_FILES = ['baseStructs.js', 'FaceCube.js', 'CubieCube.js', 'CoordCube.js', 'search.js', 'Tools.js']

var SCRAMBLE_LENGTH = 22
var SCRAMBLE_DURATION = 110 // ms par mouvement pendant un mélange
var SOLUTION_DURATION = 320 // ms par mouvement quand on déroule la solution

/* ---------------------------------------------------------------- Modèle du cube */

/* Position et normale de chaque facette, en coordonnées entières dans {-1, 0, 1}.
   Décrire les facettes géométriquement plutôt que par une table de permutation
   permet d'appliquer n'importe quelle rotation, y compris les tranches du milieu et
   les rotations du cube entier, sans écrire six tables à la main. */
function geometry(i) {
	var f = Math.floor(i / 9), k = i % 9, r = Math.floor(k / 3), c = k % 3
	switch (f) {
		case 0: return { p: [c - 1,     1, r - 1], n: [ 0,  1,  0] } // U
		case 1: return { p: [    1, 1 - r, 1 - c], n: [ 1,  0,  0] } // R
		case 2: return { p: [c - 1, 1 - r,     1], n: [ 0,  0,  1] } // F
		case 3: return { p: [c - 1,    -1, 1 - r], n: [ 0, -1,  0] } // D
		case 4: return { p: [   -1, 1 - r, c - 1], n: [-1,  0,  0] } // L
		case 5: return { p: [1 - c, 1 - r,    -1], n: [ 0,  0, -1] } // B
	}
}

// Quart de tour dans le sens horaire vu depuis le bout positif de l'axe.
var ROTATION = [
	function(v) { return [ v[0],  v[2], -v[1]] }, // axe x
	function(v) { return [-v[2],  v[1],  v[0]] }, // axe y
	function(v) { return [ v[1], -v[0],  v[2]] }  // axe z
]

var GEOMETRY = [], FACELET_AT = {}
for (var i = 0; i < 54; i++) {
	GEOMETRY[i] = geometry(i)
	FACELET_AT[GEOMETRY[i].p + '|' + GEOMETRY[i].n] = i
}

var state = solvedState()

function solvedState() {
	var s = []
	for (var i = 0; i < 54; i++) s.push(FACES[Math.floor(i / 9)])
	return s
}

function isSolved() {
	for (var i = 0; i < 54; i++) {
		if (state[i] !== state[Math.floor(i / 9) * 9 + 4]) return false
	}
	return true
}

/* Applique au modèle le mouvement que vient de subir le cube 3D.
   layerMask : bit 1 = tranche du côté négatif de l'axe, bit 2 = tranche du milieu,
   bit 4 = tranche du côté positif (7 = le cube entier). angle > 0 = sens horaire. */
function applyTwist(axis, layerMask, angle) {
	var turns = ((angle % 4) + 4) % 4
	for (var t = 0; t < turns; t++) {
		var next = state.slice()
		for (var i = 0; i < 54; i++) {
			var g = GEOMETRY[i], coordinate = g.p[axis]
			var bit = coordinate < 0 ? 1 : (coordinate === 0 ? 2 : 4)
			if (!(layerMask & bit)) continue
			next[FACELET_AT[ROTATION[axis](g.p) + '|' + ROTATION[axis](g.n)]] = state[i]
		}
		state = next
	}
}

/* Le solveur identifie les faces par la lettre des facettes, pas par les centres :
   un cube résolu mais pivoté en entier lui paraîtrait invalide. On renomme donc les
   couleurs d'après les centres avant de l'interroger. La solution reste exprimée
   dans l'orientation que le joueur a sous les yeux. */
function normalizedFacelets() {
	var rename = {}
	for (var f = 0; f < 6; f++) rename[state[f * 9 + 4]] = FACES[f]
	var out = ''
	for (var i = 0; i < 54; i++) out += rename[state[i]] || '?'
	return out
}

/* ------------------------------------------------------------------- Affichages */

var canvas = document.getElementById('canvas')
var cube = null           // instance VirtualRubik
var currentColor = 'U'    // couleur du pinceau
var busy = false          // une animation est en cours

function rgba(color) {
	return 'rgba(' + color[0] + ', ' + color[1] + ', ' + color[2] + ', 1)'
}

function buildNet() {
	$('#faces .face').each(function() {
		var face = $(this).attr('data-face')
		for (var t = 0; t < 9; t++) {
			$('<span>').addClass('tile' + (t === 4 ? ' center' : ''))
				.attr('data-face', face).attr('data-tile', t).appendTo(this)
		}
	})
	$('#colors .color').each(function() {
		$(this).css('background-color', rgba(COLORS[$(this).attr('data-face')]))
	})
}

function renderNet() {
	$('#faces .tile').each(function() {
		var base = FACES.indexOf($(this).attr('data-face')) * 9
		$(this).css('background-color', rgba(COLORS[state[base + +$(this).attr('data-tile')]]))
	})
}

/* Repeint les stickers du cube 3D d'après le modèle. Ne vaut que si la permutation
   interne du cube 3D est à l'identité : c'est le rôle de resync3D() de s'en assurer,
   les stickers étant numérotés par emplacement et non par pièce. */
function paint3D() {
	if (!cube) return
	var fill = cube.cube3d.attributes.stickersFillColor
	for (var f = 0; f < 6; f++) {
		for (var t = 0; t < 9; t++) fill[LIB_FACE[FACES[f]] * 9 + t] = COLORS[state[f * 9 + t]]
	}
	cube.repaint()
}

function resync3D() {
	if (!cube) return
	cube.cube.reset() // ne déclenche que cubeChanged, jamais cubeTwisted
	paint3D()
}

/* La bibliothèque cale son viewport sur canvas.clientWidth (reshape(), dans
   virtualrubik.js) mais ne redimensionne jamais le tampon de rendu : sans cette
   recopie, le cube est tronqué dès que la page n'est plus à la taille d'origine. */
function fitCanvas() {
	var width = Math.round(canvas.clientWidth), height = Math.round(canvas.clientHeight)
	if (!width || !height) return
	if (canvas.width === width && canvas.height === height) return
	canvas.width = width
	canvas.height = height
	if (cube) cube.repaint()
}

/* ------------------------------------------------------------------ Mouvements */

var MOVES = ['U', 'R', 'F', 'D', 'L', 'B'], SUFFIXES = ['', "'", '2']

/* Deux mouvements de suite sur la même face donneraient un mélange plus court qu'il
   n'en a l'air, on l'évite. */
function randomScramble(length) {
	var moves = [], last = null
	while (moves.length < length) {
		var face = MOVES[Math.floor(Math.random() * MOVES.length)]
		if (face === last) continue
		last = face
		moves.push(face + SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)])
	}
	return moves.join(' ')
}

/* Déroule une séquence sur le cube 3D. Le modèle, lui, se met à jour tout seul :
   chaque quart de tour émet un cubeTwisted que l'écouteur reporte sur state. */
function play(script, duration, done) {
	var sequence = parseScript(script)
	if (!cube || !sequence.length) { if (done) done(); return }

	cube.cube3d.attributes.twistDuration = duration
	busy = true
	updateButtons()

	var next = 0
	var owner = {}
	var step = function() {
		// On attend de pouvoir verrouiller le cube, sinon deux séquences lancées
		// coup sur coup s'entremêleraient.
		if (!cube.cube.lock(owner) || cube.cube3d.isTwisting) { cube.repaint(step); return }
		if (cube.cube.cancel) next = sequence.length
		if (next < sequence.length) {
			sequence[next++].applyTo(cube.cube)
			cube.repaint(step)
		} else {
			cube.cube.unlock(owner)
			busy = false
			updateButtons()
			if (done) done()
		}
	}
	cube.repaint(step)
}

/* Traduit un script « U R2 F' » en mouvements de la bibliothèque 3D. Repris tel quel
   du code de 2016 : les axes et les masques sont ceux de Cube.transform(). */
function parseScript(script) {
	var moves = String(script).split(/\s+/)
	var sequence = []

	for (var i = 0; i < moves.length; i++) {
		var move = moves[i]
		if (!move || move === '.') continue

		var axis, layerMask, angle = 1
		switch (move[0]) {
			case 'U': axis = 1; layerMask = 4; break
			case 'u': axis = 1; layerMask = 6; break
			case 'D': axis = 1; layerMask = 1; angle = -1; break
			case 'd': axis = 1; layerMask = 3; angle = -1; break
			case 'R': axis = 0; layerMask = 4; break
			case 'r': axis = 0; layerMask = 6; break
			case 'L': axis = 0; layerMask = 1; angle = -1; break
			case 'l': axis = 0; layerMask = 3; angle = -1; break
			case 'F': axis = 2; layerMask = 4; break
			case 'f': axis = 2; layerMask = 6; break
			case 'B': axis = 2; layerMask = 1; angle = -1; break
			case 'x': axis = 0; layerMask = 7; break
			case 'y': axis = 1; layerMask = 7; break
			case 'z': axis = 2; layerMask = 7; break
			case 'M': axis = 0; layerMask = 2; angle = -1; break
			case 'E': axis = 1; layerMask = 2; break
			case 'S': axis = 2; layerMask = 2; break
			default: continue
		}

		if (move.length > 1) {
			if (move[1] === "'") angle *= -1
			else if (move[1] === '2') angle *= (move[2] === "'" ? -2 : 2)
			else continue
		}

		sequence.push(new TwistNode(axis, layerMask, angle))
	}
	return sequence
}

/* -------------------------------------------------------------- Chargement solveur */

var solverReady = false

function loadSolver() {
	var index = 0
	var next = function() {
		if (index >= SOLVER_FILES.length) {
			solverReady = true
			status('Solveur prêt.')
			updateButtons()
			return
		}
		loadScript(SOLVER_FILES[index++], next)
	}
	next()
}

/* Charge un fichier en affichant sa progression. Les tables pèsent 18 Mo (environ
   3,7 Mo une fois compressées) : sans indicateur, la page a simplement l'air figée.
   On passe donc par fetch pour compter les octets, puis on exécute le résultat via
   un Blob. Si quoi que ce soit échoue, on retombe sur une balise script classique. */
function loadScript(url, done) {
	var settled = false
	var fallback = function() {
		if (settled) return
		settled = true
		inject(url, done)
	}

	if (!window.fetch || !window.ReadableStream) { fallback(); return }

	fetch(url).then(function(response) {
		if (!response.ok || !response.body) throw new Error('HTTP ' + response.status)
		var total = parseInt(response.headers.get('Content-Length'), 10) || 0
		var reader = response.body.getReader()
		var chunks = [], received = 0

		var pump = function() {
			return reader.read().then(function(result) {
				if (result.done) return
				chunks.push(result.value)
				received += result.value.length
				if (total > 1000000) status('Chargement des tables du solveur… ' + Math.round(received / total * 100) + ' %')
				return pump()
			})
		}

		return pump().then(function() {
			if (settled) return
			settled = true
			// Les fichiers de 2016 sont encodés en latin-1 ; on le déclare pour que
			// les commentaires accentués ne fassent pas dérailler l'analyse.
			var blob = new Blob(chunks, { type: 'text/javascript;charset=ISO-8859-1' })
			var objectUrl = URL.createObjectURL(blob)
			inject(objectUrl, function() { URL.revokeObjectURL(objectUrl); done() }, function() {
				URL.revokeObjectURL(objectUrl)
				settled = false
				fallback()
			})
		})
	}).catch(fallback)
}

function inject(url, done, fail) {
	var script = document.createElement('script')
	script.src = url
	script.onload = done
	script.onerror = fail || function() { status('Le solveur n\'a pas pu être chargé.', true) }
	document.head.appendChild(script)
}

/* ----------------------------------------------------------------------- Thème */

/* Trois états, dans cet ordre au clic : automatique (on suit le système), clair,
   sombre. Le choix explicite est mémorisé et pose data-theme sur <html>, ce qui prime
   sur la requête média ; en automatique on retire l'attribut et le CSS reprend la
   main, y compris si le système change de thème en cours de route. */
var THEME_CYCLE = { auto: 'light', light: 'dark', dark: 'auto' }
var THEME_LABELS = { auto: 'automatique', light: 'clair', dark: 'sombre' }
var THEME_ICONS = {
	auto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 0 0 17z" fill="currentColor" stroke="none"/></svg>',
	light: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"/></svg>',
	dark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 14.5A8.6 8.6 0 0 1 9.5 3.5a8.6 8.6 0 1 0 11 11z"/></svg>'
}

function storedTheme() {
	try {
		var choice = localStorage.getItem('rubikia.theme')
		return choice === 'light' || choice === 'dark' ? choice : 'auto'
	} catch (e) {
		return 'auto'
	}
}

function applyTheme(theme) {
	if (theme === 'auto') document.documentElement.removeAttribute('data-theme')
	else document.documentElement.setAttribute('data-theme', theme)

	try {
		if (theme === 'auto') localStorage.removeItem('rubikia.theme')
		else localStorage.setItem('rubikia.theme', theme)
	} catch (e) { /* navigation privée : le choix ne survivra pas au rechargement */ }

	var label = 'Thème ' + THEME_LABELS[theme] + ', cliquer pour changer'
	$('#theme').html(THEME_ICONS[theme]).attr({ 'aria-label': label, title: label })
}

/* ------------------------------------------------------------------- Interface */

// Messages du solveur, tels que documentés en tête de search.js.
var ERRORS = {
	'1': 'il n\'y a pas 9 facettes de chaque couleur.',
	'2': 'il n\'y a pas 12 arêtes différentes.',
	'3': 'une arête est retournée.',
	'4': 'il n\'y a pas 8 coins différents.',
	'5': 'un coin est tourné sur lui-même.',
	'6': 'deux coins ou deux arêtes sont intervertis.',
	'7': 'aucune solution de cette longueur n\'existe, augmentez la limite.',
	'8': 'temps de recherche dépassé, laissez-lui plus de temps.'
}

function status(text, isError) {
	$('#status').text(text).toggleClass('error', !!isError)
}

function showScript(script) {
	$('#script').val(String(script).replace(/\s+/g, ' ').trim())
	updateButtons()
}

function moveCount(script) {
	return String(script).split(/\s+/).filter(function(token) { return token && token !== '.' }).length
}

function currentScript() {
	return $('#script').val().trim()
}

function updateButtons() {
	$('#solve').prop('disabled', busy || !solverReady)
	$('#scramble, #reset').prop('disabled', busy)
	$('#run').prop('disabled', busy || moveCount(currentScript()) === 0)
}

function solve() {
	if (isSolved()) {
		showScript('')
		status('Ce cube est déjà résolu.')
		return
	}

	var maxMoves = Math.max(20, Math.min(30, parseInt($('#max-moves').val(), 10) || 21))
	var timeout = Math.max(100, Math.min(60000, parseInt($('#time').val(), 10) || 5000))

	status('Recherche…')
	var started = Date.now()
	var solution = Search.solution(normalizedFacelets(), maxMoves, timeout, true)
	var elapsed = Date.now() - started

	var error = /^Error (\d)/.exec(solution)
	if (error) {
		showScript('')
		status('Ce cube n\'est pas résolvable : ' + (ERRORS[error[1]] || solution), true)
		return
	}

	showScript(solution)
	status(moveCount(solution) + ' mouvements, trouvés en ' + elapsed + ' ms. Le point sépare les deux phases de l\'algorithme.')
}

function bindEvents() {
	$('#theme').click(function() {
		applyTheme(THEME_CYCLE[storedTheme()])
	})

	$('#colors .color').click(function() {
		currentColor = $(this).attr('data-face')
		$('#colors .color').removeClass('selected')
		$(this).addClass('selected')
	})

	$('#faces').on('click', '.tile', function() {
		if (busy) return
		var tile = +$(this).attr('data-tile')
		if (tile === 4) return // le centre définit sa face, le repeindre n'a pas de sens
		state[FACES.indexOf($(this).attr('data-face')) * 9 + tile] = currentColor
		renderNet()
		// Le cube 3D a pu être tourné depuis : on le remet à plat avant de repeindre.
		resync3D()
		showScript('')
		status('')
	})

	$('#scramble').click(function() {
		var scramble = randomScramble(SCRAMBLE_LENGTH)
		showScript('')
		status('Mélange : ' + scramble)
		play(scramble, SCRAMBLE_DURATION, function() {
			status('Mélange de ' + SCRAMBLE_LENGTH + ' mouvements. À vous, ou cliquez sur Résoudre.')
		})
	})

	$('#solve').click(solve)

	// La séquence est modifiable : on peut taper la sienne et l'exécuter.
	$('#script').on('input', updateButtons)

	$('#run').click(function() {
		var script = currentScript()
		if (!script) return
		status('Exécution de la séquence…')
		play(script, SOLUTION_DURATION, function() {
			showScript('')
			status(isSolved() ? 'Cube résolu.' : 'Séquence terminée.')
		})
	})

	$('#reset').click(function() {
		state = solvedState()
		renderNet()
		resync3D()
		showScript('')
		status(solverReady ? '' : 'Chargement du solveur…')
	})

	bindTouch()

	// La bibliothèque ne se redimensionne pas seule, cf. fitCanvas().
	var pending = null
	$(window).on('resize orientationchange', function() {
		clearTimeout(pending)
		pending = setTimeout(fitCanvas, 150)
	})
}

/* La bibliothèque de 2016 n'écoute que la souris (mousedown/mousemove/mouseup, cf.
   virtualrubik.js) : au doigt, le cube était complètement inerte. On lui relaie donc
   les événements tactiles sous la forme qu'elle attend. */
function bindTouch() {
	var forward = function(handler) {
		return function(event) {
			var touch = event.touches[0] || event.changedTouches[0]
			if (!touch || !cube) return
			event.preventDefault()
			cube[handler]({ clientX: touch.clientX, clientY: touch.clientY })
		}
	}
	canvas.addEventListener('touchstart', forward('onMouseDown'), { passive: false })
	canvas.addEventListener('touchmove', forward('onMouseMove'), { passive: false })
	canvas.addEventListener('touchend', forward('onMouseUp'), { passive: false })
	canvas.addEventListener('touchcancel', function() { if (cube) cube.isMouseDrag = false }, { passive: false })
}

/* ------------------------------------------------------------------ Démarrage */

$(function() {
	applyTheme(storedTheme())
	buildNet()
	renderNet()
	bindEvents()
	fitCanvas()

	// Couleurs de départ : un cube résolu, aussitôt repeint depuis le modèle.
	var initial = []
	for (var i = 0; i < 54; i++) initial.push(Math.floor(i / 9))

	attachVirtualRubik(canvas, function(instance) {
		cube = instance
		cube.cube.addCubeListener({
			cubeTwisted: function(event) {
				applyTwist(event.axis, event.layerMask, event.angle)
				renderNet()
			},
			cubeChanged: function() {}
		})
		paint3D()
		fitCanvas()
	}, initial, -32, -32)

	updateButtons()
	loadSolver()
})

})()