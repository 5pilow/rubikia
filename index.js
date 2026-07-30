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
var SOLUTION_DURATION = 320 // ms par mouvement quand on déroule toute la solution
var STEP_DURATION = 260     // ms pour un seul mouvement, en pas à pas

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

/* ------------------------------------------------------- Lecture pas à pas */

/* La séquence affichée est découpée en jetons. « position » est le nombre de jetons
   déjà appliqués au cube : tout ce qui est avant est fait, le jeton à cette position
   est le prochain à jouer. Le point séparateur des deux phases compte comme un jeton,
   simplement traversé. */
var track = { tokens: [], position: 0 }

var FACE_NAMES = { U: 'du haut', D: 'du bas', L: 'de gauche', R: 'de droite', F: 'avant', B: 'arrière' }
var TURN_NAMES = { '': 'Quart de tour horaire', '\'': 'Quart de tour anti-horaire', '2': 'Demi-tour' }

function moveDescription(token) {
	var face = FACE_NAMES[token[0]]
	var turn = TURN_NAMES[token.slice(1)]
	if (!face || !turn) return token
	return turn + ' de la face ' + face
}

// Inverse d'un mouvement : un demi-tour est son propre inverse.
function invertMove(token) {
	if (token.slice(1) === '2') return token
	return token.slice(1) === '\'' ? token[0] : token + '\''
}

function isSeparator(token) {
	return token === '.'
}

function setSequence(text, keepPosition) {
	// Changer de séquence interrompt un déroulement en cours, qui ne porterait plus
	// sur ce qui est affiché.
	running = false
	$('#script').val(String(text).replace(/\s+/g, ' ').trim())
	track.tokens = currentScript().split(/\s+/).filter(function(t) { return t.length })
	if (!keepPosition) track.position = 0
	if (track.position > track.tokens.length) track.position = track.tokens.length
	renderTrack()
}

function renderTrack() {
	var total = 0, done = 0
	for (var i = 0; i < track.tokens.length; i++) {
		if (isSeparator(track.tokens[i])) continue
		total++
		if (i < track.position) done++
	}

	$('#playback').prop('hidden', track.tokens.length === 0)
	$('#progress').text(done + ' / ' + total)

	var container = $('#track').empty()
	for (var j = 0; j < track.tokens.length; j++) {
		var token = track.tokens[j]
		if (isSeparator(token)) {
			$('<span>').addClass('separator').text('·').attr('title', 'Fin de la première phase de l\'algorithme').appendTo(container)
			continue
		}
		$('<span>')
			.addClass('move' + (j < track.position ? ' done' : (j === track.position ? ' current' : '')))
			.attr({ 'data-index': j, title: moveDescription(token) })
			.text(token)
			.appendTo(container)
	}
	updateButtons()
}

function currentScript() {
	return $('#script').val().trim()
}

var PLAY_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l12.5-7.5z"/></svg>'
var PAUSE_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7.5 4.5h3.2v15H7.5zM13.3 4.5h3.2v15h-3.2z"/></svg>'

// Vrai pendant un « Tout dérouler », qui s'interrompt sur demande.
var running = false

function updateButtons() {
	$('#solve').prop('disabled', busy || !solverReady)
	$('#scramble, #reset').prop('disabled', busy)
	$('#prev').prop('disabled', busy || track.position === 0)
	$('#next').prop('disabled', busy || track.position >= track.tokens.length)

	/* Le bouton de lecture reste actionnable pendant le déroulement, puisque c'est lui
	   qui met en pause : le verrouiller comme les autres rendrait la pause impossible. */
	$('#run')
		.prop('disabled', running ? false : (busy || track.position >= track.tokens.length))
		.html((running ? PAUSE_ICON : PLAY_ICON) + (running ? 'Pause' : 'Tout dérouler'))
}

/* Avance ou recule d'un mouvement. Le modèle se met à jour tout seul : chaque
   rotation du cube 3D émet un cubeTwisted que l'écouteur reporte sur state. */
function step(forward, duration, done) {
	var index = forward ? track.position : track.position - 1

	// On traverse les séparateurs sans rien jouer.
	while (index >= 0 && index < track.tokens.length && isSeparator(track.tokens[index])) {
		index += forward ? 1 : -1
	}
	if (index < 0 || index >= track.tokens.length) { if (done) done(); return }

	var token = track.tokens[index]
	track.position = forward ? index + 1 : index
	// Le surlignage suit le clic tout de suite ; l'attendre la fin de l'animation
	// donnait l'impression que le bouton n'avait pas répondu.
	renderTrack()
	play(forward ? token : invertMove(token), duration === undefined ? STEP_DURATION : duration, function() {
		renderTrack()
		if (track.position >= track.tokens.length && isSolved()) status('Cube résolu.')
		if (done) done()
	})
}

/* Déroule la suite de la séquence, un mouvement à la fois plutôt que d'un bloc. Deux
   raisons : la piste et le compteur avancent en direct au lieu de sauter à la fin, et
   on peut s'arrêter entre deux mouvements. */
function playAll() {
	running = true
	updateButtons()

	var advance = function() {
		if (track.position >= track.tokens.length) {
			running = false
			updateButtons()
			status(isSolved() ? 'Cube résolu.' : 'Séquence terminée.')
			return
		}
		if (!running) {
			updateButtons()
			var left = 0
			for (var i = track.position; i < track.tokens.length; i++) {
				if (!isSeparator(track.tokens[i])) left++
			}
			status('En pause, ' + left + (left > 1 ? ' mouvements restants.' : ' mouvement restant.'))
			return
		}
		step(true, SOLUTION_DURATION, advance)
	}
	advance()
}

function pauseAll() {
	// Le mouvement en cours va au bout, l'arrêt se fait entre deux quarts de tour.
	running = false
}

/* Se replacer d'un clic sur une pastille : on joue ou on défait la différence, sans
   animation, sinon un saut de quinze mouvements durerait cinq secondes. */
function seek(target) {
	var moves = []
	while (track.position < target) {
		if (!isSeparator(track.tokens[track.position])) moves.push(track.tokens[track.position])
		track.position++
	}
	while (track.position > target) {
		track.position--
		if (!isSeparator(track.tokens[track.position])) moves.push(invertMove(track.tokens[track.position]))
	}
	if (!moves.length) { renderTrack(); return }

	play(moves.join(' '), 0, function() {
		renderTrack()
		status(track.position >= track.tokens.length && isSolved() ? 'Cube résolu.' : '')
	})
}

function solve() {
	if (isSolved()) {
		setSequence('')
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
		setSequence('')
		status('Ce cube n\'est pas résolvable : ' + (ERRORS[error[1]] || solution), true)
		return
	}

	setSequence(solution)
	var count = track.tokens.filter(function(t) { return !isSeparator(t) }).length
	status(count + ' mouvements, trouvés en ' + elapsed + ' ms. Avancez coup par coup avec les flèches.')
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
		setSequence('')
		status('')
	})

	$('#scramble').click(function() {
		var scramble = randomScramble(SCRAMBLE_LENGTH)
		setSequence('')
		status('Mélange : ' + scramble)
		play(scramble, SCRAMBLE_DURATION, function() {
			status('Mélange de ' + SCRAMBLE_LENGTH + ' mouvements. À vous, ou cliquez sur Résoudre.')
		})
	})

	$('#solve').click(solve)

	// La séquence reste modifiable : on peut taper la sienne et la dérouler. La toucher
	// remet la lecture au début, sans rien jouer sur le cube.
	$('#script').on('input', function() { setSequence($(this).val()) })

	$('#prev').click(function() { step(false) })
	$('#next').click(function() { step(true) })

	$('#track').on('click', '.move', function() {
		if (busy) return
		var index = +$(this).attr('data-index')
		// Cliquer la pastille courante la joue, cliquer une pastille déjà faite revient
		// juste avant elle.
		seek(index < track.position ? index : index + 1)
	})

	$('#run').click(function() {
		if (running) { pauseAll(); return }
		if (track.position >= track.tokens.length) return
		status('Déroulement de la séquence…')
		playAll()
	})

	$('#reset').click(function() {
		state = solvedState()
		renderNet()
		resync3D()
		setSequence('')
		status(solverReady ? '' : 'Chargement du solveur…')
	})

	/* Les flèches du clavier avancent dans la séquence, sauf pendant la saisie d'une
	   séquence ou d'un réglage, où elles doivent déplacer le curseur. */
	$(document).on('keydown', function(event) {
		if ($(event.target).is('input, textarea')) return
		if (event.key === 'ArrowRight') { step(true); event.preventDefault() }
		else if (event.key === 'ArrowLeft') { step(false); event.preventDefault() }
	})

	bindPointer()

	// La bibliothèque ne se redimensionne pas seule, cf. fitCanvas().
	var pending = null
	$(window).on('resize orientationchange', function() {
		clearTimeout(pending)
		pending = setTimeout(fitCanvas, 150)
	})
}

/* ------------------------------------------ Tourner une face à la souris ou au doigt */

/* La bibliothèque de 2016 ne sait que faire pivoter la VUE. Elle calcule pourtant déjà
   l'intersection du curseur avec le cube (mouseIntersectionTest, qui renvoie la
   facette touchée et le point d'impact) sans jamais s'en servir pour tourner quoi que
   ce soit : on part de là.

   Principe : on retient la facette saisie, puis à chaque déplacement on intersecte le
   rayon du curseur avec le PLAN de cette facette. L'écart entre les deux points
   d'impact est un déplacement exprimé dans le repère du cube, qu'il suffit de projeter
   sur les deux axes de ce plan. L'axe dominant donne la direction du geste. Aucun
   calcul de projection écran, donc rien qui dépende de l'orientation de la vue. */

var GRAB_THRESHOLD = 0.16 // part de la demi-arête à parcourir avant de tourner
var GRAB_DURATION = 180   // ms d'animation pour un tour fait à la main

var grab = null

// Rayon du curseur, dans le repère du cube. Même construction que la bibliothèque.
function modelRay(clientX, clientY) {
	var rect = canvas.getBoundingClientRect()
	var raster = new J3DIVector3(clientX - rect.left, clientY - rect.top, 0)
	var camera = new J3DIVector3(
		(raster[0] - cube.width / 2) / cube.width * 2,
		(raster[1] - cube.height / 2) / -cube.height * 2, 0)

	var world = new J3DIVector3(camera)
	world.multVecMatrix(cube.rasterToCameraMatrix)

	var inverseWorld = new J3DIMatrix4(cube.world.matrix)
	inverseWorld.invert()

	var target = new J3DIVector3(world)
	target.multVecMatrix(inverseWorld)

	var origin = new J3DIVector3()
	origin.load(cube.camPos)
	origin.multVecMatrix(inverseWorld)

	return {
		origin: [origin[0], origin[1], origin[2]],
		direction: [target[0] - origin[0], target[1] - origin[1], target[2] - origin[2]]
	}
}

// Point d'impact du rayon sur le plan d'une facette, dans le repère du cube.
function hitOnPlane(clientX, clientY, axis, sign) {
	var ray = modelRay(clientX, clientY)
	if (Math.abs(ray.direction[axis]) < 1e-9) return null
	var t = (sign * cube.cubeSize / 2 - ray.origin[axis]) / ray.direction[axis]
	if (t <= 0) return null
	return [
		ray.origin[0] + ray.direction[0] * t,
		ray.origin[1] + ray.direction[1] * t,
		ray.origin[2] + ray.direction[2] * t
	]
}

/* Renvoie vrai si le geste part du cube : dans ce cas il tournera une face, et
   l'appelant doit empêcher la bibliothèque de faire pivoter la vue. */
function beginGrab(clientX, clientY) {
	grab = null
	if (!cube || busy) return false

	var hit = cube.mouseIntersectionTest({ clientX: clientX, clientY: clientY })
	if (!hit) return false

	// face : 0 à 2 pour les côtés négatifs des axes x, y, z ; 3 à 5 pour les positifs.
	var axis = hit.face % 3
	var sign = hit.face < 3 ? -1 : 1
	var start = hitOnPlane(clientX, clientY, axis, sign)
	if (!start) return false

	grab = { axis: axis, sign: sign, start: start }
	return true
}

function moveGrab(clientX, clientY) {
	if (!grab || busy) return
	var now = hitOnPlane(clientX, clientY, grab.axis, grab.sign)
	if (!now) return

	var half = cube.cubeSize / 2

	// Des deux axes du plan de la facette, on garde celui le plus parcouru.
	var best = null
	for (var axis = 0; axis < 3; axis++) {
		if (axis === grab.axis) continue
		var travel = (now[axis] - grab.start[axis]) / half
		if (!best || Math.abs(travel) > Math.abs(best.travel)) best = { axis: axis, travel: travel }
	}
	if (!best || Math.abs(best.travel) < GRAB_THRESHOLD) return

	/* L'axe de rotation est perpendiculaire à la normale de la facette et à la
	   direction du geste : c'est leur produit vectoriel. Le sens de rotation est
	   l'opposé du signe obtenu (vérifié sur les deux cas de référence : pousser la face
	   avant vers la droite tourne la tranche horizontale, la pousser vers le haut
	   tourne la tranche verticale dans le sens d'un R). */
	var normal = [0, 0, 0]; normal[grab.axis] = grab.sign
	var gesture = [0, 0, 0]; gesture[best.axis] = best.travel > 0 ? 1 : -1
	var cross = [
		normal[1] * gesture[2] - normal[2] * gesture[1],
		normal[2] * gesture[0] - normal[0] * gesture[2],
		normal[0] * gesture[1] - normal[1] * gesture[0]
	]
	var rotationAxis = cross[0] !== 0 ? 0 : (cross[1] !== 0 ? 1 : 2)
	var angle = cross[rotationAxis] > 0 ? -1 : 1

	// Tranche saisie, repérée le long de l'axe de rotation.
	var coordinate = grab.start[rotationAxis] / half
	var layerMask = coordinate < -1 / 3 ? 1 : (coordinate > 1 / 3 ? 4 : 2)

	grab = null

	/* Tourner à la main invalide la séquence affichée, qui avait été calculée pour un
	   autre cube : la laisser serait trompeur. */
	if (track.tokens.length) {
		setSequence('')
		status('Le cube a changé, relancez la résolution.')
	}

	cube.cube3d.attributes.twistDuration = GRAB_DURATION
	cube.cube.transform(rotationAxis, layerMask, angle)
}

function endGrab() {
	grab = null
}

function bindPointer() {
	/* En capture sur le document : les écouteurs de la bibliothèque sont posés sur le
	   canvas, donc en aval. Quand le geste part du cube, on arrête la propagation et
	   elle ne verra jamais l'appui, ce qui l'empêche de faire pivoter la vue. */
	document.addEventListener('mousedown', function(event) {
		if (event.target !== canvas || event.button !== 0) return
		if (beginGrab(event.clientX, event.clientY)) {
			event.stopPropagation()
			event.preventDefault()
		}
	}, true)

	document.addEventListener('mousemove', function(event) {
		if (grab) moveGrab(event.clientX, event.clientY)
	})
	document.addEventListener('mouseup', endGrab)

	/* Au doigt, rien n'existait : la bibliothèque n'écoute que la souris. On lui relaie
	   les événements tactiles sous la forme qu'elle attend, sauf quand le geste part du
	   cube, où c'est nous qui tournons la face. */
	var touchPoint = function(event) {
		return event.touches[0] || event.changedTouches[0]
	}

	canvas.addEventListener('touchstart', function(event) {
		var touch = touchPoint(event)
		if (!touch || !cube) return
		event.preventDefault()
		if (!beginGrab(touch.clientX, touch.clientY)) {
			cube.onMouseDown({ clientX: touch.clientX, clientY: touch.clientY })
		}
	}, { passive: false })

	canvas.addEventListener('touchmove', function(event) {
		var touch = touchPoint(event)
		if (!touch || !cube) return
		event.preventDefault()
		if (grab) moveGrab(touch.clientX, touch.clientY)
		else cube.onMouseMove({ clientX: touch.clientX, clientY: touch.clientY })
	}, { passive: false })

	canvas.addEventListener('touchend', function(event) {
		var touch = touchPoint(event)
		if (!cube) return
		event.preventDefault()
		if (grab) endGrab()
		else if (touch) cube.onMouseUp({ clientX: touch.clientX, clientY: touch.clientY })
	}, { passive: false })

	canvas.addEventListener('touchcancel', function() {
		endGrab()
		if (cube) cube.isMouseDrag = false
	}, { passive: false })
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

	setSequence('')
	loadSolver()
	registerServiceWorker()
})

/* Installable et utilisable hors ligne : une fois les tables du solveur en cache, le
   site n'a plus besoin du réseau du tout. Voir sw.js pour les politiques de cache. */
function registerServiceWorker() {
	if (!('serviceWorker' in navigator)) return
	// Un service worker exige un contexte sécurisé ; localhost en fait partie.
	if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return
	navigator.serviceWorker.register('sw.js').catch(function() {
		/* Sans lui le site marche normalement, simplement pas hors ligne. */
	})
}

})()