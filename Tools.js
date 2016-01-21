var Tools = {};
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Check if the cube string s represents a solvable cube.
// 0: Cube is solvable
// -1: There is not exactly one facelet of each colour
// -2: Not all 12 edges exist exactly once
// -3: Flip error: One edge has to be flipped
// -4: Not all corners exist exactly once
// -5: Twist error: One corner has to be twisted
// -6: Parity error: Two corners or two edges have to be exchanged
// 
/**
 * Check if the cube definition string s represents a solvable cube.
 * 
 * @param s is the cube definition string , see {@link Facelet}
 * @return 0: Cube is solvable<br>
 *         -1: There is not exactly one facelet of each colour<br>
 *         -2: Not all 12 edges exist exactly once<br>
 *         -3: Flip error: One edge has to be flipped<br>
 *         -4: Not all 8 corners exist exactly once<br>
 *         -5: Twist error: One corner has to be twisted<br>
 *         -6: Parity error: Two corners or two edges have to be exchanged
 */
Tools.verify = function(s) {
	var count = [];
	for (var i = 0; i < 54; i++) {
		count[Color[s.substring(i, i + 1)]]++;
	}

	for (var i = 0; i < 6; i++) {
		if (count[i] != 9) {
			return -1;
		}
	}

	return new FaceCube(s).toCubieCube().verify();
}

/**
 * Generates a random cube.
 * @return A random cube in the string representation. Each cube of the cube space has the same probability.
 */
Tools.randomCube = function() {
	var cubieCube = new CubieCube();
	cubieCube.setFlip(Math.floor(Math.random() * CoordCube.N_FLIP));
	cubieCube.setTwist(Math.floor(Math.random() * CoordCube.N_TWIST));
	do {
		cubieCube.setURFtoDLB(Math.floor(Math.random() * CoordCube.N_URFtoDLB));
		cubieCube.setURtoBR(Math.floor(Math.random() * CoordCube.N_URtoBR));
	} while ((cubieCube.edgeParity() ^ cubieCube.cornerParity()) != 0);
	return cubieCube.toFaceCube().to_String();
}
