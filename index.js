function init() {

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
	var ready = function(cube) {

		var seq = parseScript("M2' U M2' U2 M2' U M2'")

		performSequence(cube, seq)
	}
	
	/*
	 * Initialisation du cube
	 */
	attachVirtualRubik(document.getElementById('canvas1'), ready, colors, xRot, yRot)
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