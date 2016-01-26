function init() {

	var FACES = {0: 1, 1: 3, 2: 2, 3: 0, 4: 5, 5: 4}
	var COLORS = [
		[140,  0, 15,255], // right : red
		[255,210,  0,255], // up : yellow 
		[  0, 51,115,255], // front : blue
		[255, 70,  0,255], // left : orange
		[248,248,248,255], // down : white 
		[  0,115, 47,255]  // back : green
	  ];

	var current_color = 0

	var cube = null

	/*
	 * Couleurs initiales du cube
	 */
	var colors = [
		0,0,0, 0,0,0, 0,0,0,
		1,1,1, 1,1,1, 1,1,1,
		2,2,2, 2,2,2, 2,2,2,
		3,3,3, 3,3,3, 3,3,3,
		4,4,4, 4,4,4, 4,4,4,
		5,5,5, 5,5,5, 5,5,5
	]

	var yRot = -32;
	var xRot = -32;

	/*
	 * Quand le cube est prêt
	 */
	var ready = function(new_cube) {

		cube = new_cube

		$('#faces .tile').each(function() {

			var tile = $(this).index()
			var face = $(this).parent().index()

			$(this).css('background-color', $($('#colors .color')[FACES[face]]).css('background-color'))
			$(this).attr('color', FACES[face])
		})

		$('#faces .tile').click(function() {

			var tile = $(this).index()
			var face = $(this).parent().index()

			$(this).css('background-color', $($('#colors .color')[current_color]).css('background-color'))
			$(this).attr('color', current_color)

			cube.cube3d.attributes.stickersFillColor[FACES[face] * 9 + tile] = COLORS[current_color]
			cube.repaint()
		})

		// cube.cube.addCubeListener({cubeTwisted: function() {
		// 	console.log("move")
		// 	console.log(cube)
		// }})
	}
	
	/*
	 * Initialisation du cube
	 */
	var reset = function() {
		attachVirtualRubik(document.getElementById('canvas'), ready, colors, xRot, yRot)
	}
	reset()

	$('#faces .face').each(function() {
		var color = $($('#colors .color')[FACES[$(this).index()]]).css('background-color')
		$(this).find('.tile').css('background-color', color)
	})

	$('#colors .color').click(function() {
		current_color = $(this).index()
		$('#colors .color').removeClass('selected')
		$(this).addClass('selected')
	})

	/*
	 * Bouton update
	 */
	$('#update_3d').click(function() {

		attachVirtualRubik(document.getElementById('canvas'), function(new_cube) {

			cube = new_cube

			$('#faces .tile').each(function() {

				var tile = $(this).index()
				var face = $(this).parent().index()
				cube.cube3d.attributes.stickersFillColor[FACES[face] * 9 + tile] = COLORS[$(this).attr('color')]
				cube.repaint()
			})

		}, colors, xRot, yRot)
	})

	/*
	 * Bouton reset
	 */
	$('#reset').click(function() {
		$('#script').val('')
		$('#moves').text('')
		reset()
	})
	
	/*
	 * Bouton solve
	 */ 
	$('#solve').click(function() {

		var facelets = cubeToString()
		var moves = $('#max-moves').val()
		var time = $('#time').val()

		var sol = Search.solution(facelets, moves, time, true)
		$('#script').val(sol)

		$('#moves').text(sol.replace(' . ', '').split(' ').length + ' moves')
	})

	/*
	 * Excute button
	 */
	$('#move').click(function() {

		var script = $('#script').val()
		var seq = parseScript(script)
		performSequence(cube, seq)
	})
}

// Retourne le cube sous forme de chaîne de caractères
function cubeToString() {

	// Tableau de correspondance entre couleurs et faces
	var tab = {"rgb(255, 210, 0)": "U",
				"rgb(255, 101, 0)": "L",
				"rgb(0, 0, 255)": "F",
				"rgb(218, 26, 0)": "R",
				"rgb(0, 128, 0)": "B",
				"rgb(255, 255, 255)": "D"}
	var res = []
	var i = 0

	// Tableau de correspondance entre les 2 modèles
	var faceTab = [0, 4, 2, 1, 5, 3]
	$("#faces .face").each(function() {
		res[faceTab[i]] = ""
		$(this).find('.tile').each(function() {
			var tile = $(this).css('background-color')
			res[faceTab[i]] += tab[tile]
		})
		i++
	})
	console.log(res)
	return res.join('')
}

function performReverseSequence(cube, sequence) {
	
	var f = function() {
        // Cancel all other lenghty operations
        cube.cube.cancel = true;
      
        // Wait until cube3d has finished twisting
        if (cube.cube3d.isTwisting) {
          cube.repaint(f);
          return;
        }
        // Scramble the cube
        cube.cube.setQuiet(true);
  
		  // Keep track of previous axis, to avoid two subsequent moves on
		  // the same axis.
		  var prevAxis = -1;
		  var axis, layerMask, angle;
		  
		  for (var i = sequence.length - 1; i >= 0; --i) {
			var move = sequence[i];
			cube.cube.transform(move.axis, move.layerMask, -move.angle);
		  }

		  cube.cube.setQuiet(false);
        
        // Other lenghty operations are go now
        cube.cube.cancel = false;
    };
    
    cube.repaint(f);
}

function performSequence(cube, sequence) {
	
	cube.cube3d.attributes.twistDuration = cube.cube3d.attributes.userTwistDuration;
		
	// Perform the scrambling moves
	var next = 0; // next twist to be performed
	var owner = new Object();
	
	var f = function() {
		// Wait until we can lock the cube. This prevents that multiple
		// scramble operations run concurrently.
		if (!cube.cube.lock(owner)) {
		  cube.repaint(f);
		  return;
		}
		// Wait until cube3d has finished twisting
		if (cube.cube3d.isTwisting) {
		  cube.repaint(f);
		  return;
		}
		
		if (cube.cube.cancel) {
		  // => cancel? gently stop scrambling
		  next = sequence.length;
		}
		
		// Initiate the next move
		if (next < sequence.length) {
			
		  sequence[next].applyTo(cube.cube);
		  
		  next++;
		  cube.repaint(f);
		} else {
		  // Unlock the cube
		  cube.cube.unlock(owner);
		}
	};
	cube.repaint(f);
}

/*
 * Prend un script comme "U R D2 F' L" et le transforme en tableaux de mouvements
 */
function parseScript(script) {
	
	var moves = script.split(" ");
	var sequence = new Array();

	var count = moves.length;
	for (var i = 0; i < count; i++) {
		
		var move = moves[i];
		var axis, layerMask, angle = 1;
		var letter = move[0];
		
		if (letter == 'U') {
			axis = 1; 
			layerMask = 4;
		} else if (letter == 'u') {
			axis = 1; 
			layerMask = 6;
		} else if (letter == 'D') {
			axis = 1; 
			layerMask = 1;
			angle = -1;
		} else if (letter == 'd') {
			axis = 1; 
			layerMask = 3;
			angle = -1;
		} else if (letter == 'R') {
			axis = 0; 
			layerMask = 4;
		} else if (letter == 'r') {
			axis = 0; 
			layerMask = 6;
		} else if (letter == 'L') {
			axis = 0; 
			layerMask = 1;
			angle = -1;
		} else if (letter == 'l') {
			axis = 0; 
			layerMask = 3;
			angle = -1;
		} else if (letter == 'y') {
			axis = 1; 
			layerMask = 7;
		} else if (letter == 'x') {
			axis = 0; 
			layerMask = 7;
		} else if (letter == 'F') {
			axis = 2; 
			layerMask = 4;
		} else if (letter == 'f') {
			axis = 2; 
			layerMask = 6;
		} else if (letter == 'z') {
			axis = 2; 
			layerMask = 7;
		} else if (letter == 'B') {
			axis = 2; 
			layerMask = 1;
			angle = -1;
		} else if (letter == 'M') {
			axis = 0; 
			layerMask = 2;
			angle = -1;
		} else if (letter == 'S') {
			axis = 2; 
			layerMask = 2;
		} else if (letter == 'E') {
			axis = 1; 
			layerMask = 2;
		} else {
			continue;
		}
		
		if (move.length > 1) {
			if (move[1] == "'") {
				angle *= -1;
			} else if (move[1] == "2") {
				if (move[2] == "'")	angle *= -2; else angle *= 2;
			} else {
				continue;
			}
		}
		
		sequence.push(new TwistNode(axis, layerMask, angle));
	}
	
	return sequence;
}