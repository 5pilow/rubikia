/*
Quelques explications :
- Menu principal
https://web.archive.org/web/20150909231317/http://www.kociemba.org/cube.htm
*/

var Search = {};
Search.ax = new Array(31).fill(0); // Axe du mouvement
Search.po = new Array(31).fill(0); // Angle de rotation

Search.flip = new Array(31).fill(0); // Coordonnées phase 1
Search.twist = new Array(31).fill(0);
Search.slice = new Array(31).fill(0);

Search.parity = new Array(31).fill(0); // Coordonnées phase 2
Search.URFtoDLF = new Array(31).fill(0);
Search.FRtoBR = new Array(31).fill(0);
Search.URtoUL = new Array(31).fill(0);
Search.UBtoDF = new Array(31).fill(0);
Search.URtoDF = new Array(31).fill(0);

Search.minDistPhase1 = new Array(31).fill(0); // Estimations de la distance au but pour IDA*
Search.minDistPhase2 = new Array(31).fill(0);
	
// Retourne la solution sous forme d'une chaine de caractère
Search.solutionToString = function(length) {
	var s = "";
	for (var i = 0; i < length; i++) {
		switch (Search.ax[i]) {
		case 0:
			s += "U";
			break;
		case 1:
			s += "R";
			break;
		case 2:
			s += "F";
			break;
		case 3:
			s += "D";
			break;
		case 4:
			s += "L";
			break;
		case 5:
			s += "B";
			break;
		}
		switch (Search.po[i]) {
		case 1:
			s += " ";
			break;
		case 2:
			s += "2 ";
			break;
		case 3:
			s += "' ";
			break;
		}
	}
	return s;
}
	
Search.solutionToString = function(length, depthPhase1) {
	var s = "";
	for (var i = 0; i < length; i++) {
		switch (Search.ax[i]) {
		case 0:
			s += "U";
			break;
		case 1:
			s += "R";
			break;
		case 2:
			s += "F";
			break;
		case 3:
			s += "D";
			break;
		case 4:
			s += "L";
			break;
		case 5:
			s += "B";
			break;
		}
		switch (Search.po[i]) {
		case 1:
			s += " ";
			break;
		case 2:
			s += "2 ";
			break;
		case 3:
			s += "' ";
			break;

		}
		if (i == depthPhase1 - 1) {
			s += ". ";
		}
	}
	return s;
};
	
/**
 * Computes the solver string for a given cube.
 * 
 * @param facelets
 *          is the cube definition string, see {@link Facelet} for the format.
 * 
 * @param maxDepth
 *          defines the maximal allowed maneuver length. For random cubes, a maxDepth of 21 usually will return a
 *          solution in less than 0.5 seconds. With a maxDepth of 20 it takes a few seconds on average to find a
 *          solution, but it may take much longer for specific cubes.
 * 
 *@param timeOut
 *          defines the maximum computing time of the method in seconds. If it does not return with a solution, it returns with
 *          an error code.
 * 
 * @param useSeparator
 *          determines if a " . " separates the phase1 and phase2 parts of the solver string like in F' R B R L2 F .
 *          U2 U D for example.<br>
 * @return The solution string or an error code:<br>
 *         Error 1: There is not exactly one facelet of each colour<br>
 *         Error 2: Not all 12 edges exist exactly once<br>
 *         Error 3: Flip error: One edge has to be flipped<br>
 *         Error 4: Not all corners exist exactly once<br>
 *         Error 5: Twist error: One corner has to be twisted<br>
 *         Error 6: Parity error: Two corners or two edges have to be exchanged<br>
 *         Error 7: No solution exists for the given maxDepth<br>
 *         Error 8: Timeout, no solution within given time
 */
Search.solution = function(facelets, maxDepth, timeOut, useSeparator) {
	var s;

	// +++++++++++++++++++++check for wrong input +++++++++++++++++++++++++++++
	var count = {U:0, R:0, F:0, D:0, L:0, B:0};
	for (var i = 0; i < 54; i++) {
		count[Color[facelets.substring(i, i + 1)]]++;
	}
	
	for (var i in {U:0, R:0, F:0, D:0, L:0, B:0}) {
		if (count[i] != 9) {
			return "Error 1";
		}
	}
	var cubieCube = new FaceCube(facelets).toCubieCube();
	if ((s = cubieCube.verify()) != 0) {
		return "Error " + Math.abs(s);
	}

	// +++++++++++++++++++++++ initialization +++++++++++++++++++++++++++++++++
	var coordCube = new CoordCube(cubieCube);

	Search.po[0] = 0;
	Search.ax[0] = 0;
	Search.flip[0] = coordCube.flip;
	Search.twist[0] = coordCube.twist;
	Search.parity[0] = coordCube.parity;
	Search.slice[0] = coordCube.FRtoBR / 24 | 0;
	Search.URFtoDLF[0] = coordCube.URFtoDLF;
	Search.FRtoBR[0] = coordCube.FRtoBR;
	Search.URtoUL[0] = coordCube.URtoUL;
	Search.UBtoDF[0] = coordCube.UBtoDF;

	Search.minDistPhase1[1] = 1;// else failure for depth=1, n=0
	var mv = 0, n = 0;
	var busy = false;
	var depthPhase1 = 1;

	var tStart = new Date().getTime();
	
	// +++++++++++++++++++ Main loop ++++++++++++++++++++++++++++++++++++++++++
	do {
		do {
			if ((depthPhase1 - n > Search.minDistPhase1[n + 1]) && !busy) {

				if (Search.ax[n] == 0 || Search.ax[n] == 3) {// Initialize next move
					Search.ax[++n] = 1;
				} else {
					Search.ax[++n] = 0;
				}
				Search.po[n] = 1;
			} else if (++Search.po[n] > 3) {
				do {// increment axis
					if (++Search.ax[n] > 5) {

						if (new Date().getTime() - tStart > timeOut) {
							return "Error 8";
						}
						if (n == 0) {
							if (depthPhase1 >= maxDepth) {
								return "Error 7";
							} else {
								depthPhase1++;
								Search.ax[n] = 0;
								Search.po[n] = 1;
								busy = false;
								break;
							}
						} else {
							n--;
							busy = true;
							break;
						}

					} else {
						Search.po[n] = 1;
						busy = false;
					}
				} while (n != 0 && (Search.ax[n - 1] == Search.ax[n] || Search.ax[n - 1] - 3 == Search.ax[n]));
			} else {
				busy = false;
			}
		} while (busy);

		// +++++++++++++ compute new coordinates and new minDistPhase1 ++++++++++
		// if minDistPhase1 =0, the H subgroup is reached
		mv = 3 * Search.ax[n] + Search.po[n] - 1;
		Search.flip[n + 1] = CoordCube.flipMove[Search.flip[n]][mv];
		Search.twist[n + 1] = CoordCube.twistMove[Search.twist[n]][mv];
		Search.slice[n + 1] = CoordCube.FRtoBR_Move[Search.slice[n] * 24][mv] / 24 | 0;
		Search.minDistPhase1[n + 1] = Math.max(CoordCube.getPruning(CoordCube.Slice_Flip_Prun, CoordCube.N_SLICE1 * Search.flip[n + 1]
				+ Search.slice[n + 1]), CoordCube.getPruning(CoordCube.Slice_Twist_Prun, CoordCube.N_SLICE1 * Search.twist[n + 1] + Search.slice[n + 1]));
		// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

		if (Search.minDistPhase1[n + 1] == 0 && n >= depthPhase1 - 5) {
			Search.minDistPhase1[n + 1] = 10;// instead of 10 any value >5 is possible
			if (n == depthPhase1 - 1 && (s = Search.totalDepth(depthPhase1, maxDepth)) >= 0) {
				if (s == depthPhase1 || (Search.ax[depthPhase1 - 1] != Search.ax[depthPhase1] && Search.ax[depthPhase1 - 1] != Search.ax[depthPhase1] + 3)) {
					return useSeparator ? Search.solutionToString(s, depthPhase1) : Search.solutionToString(s);
				}
			}

		}
	} while (true);
}
	
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Apply phase2 of algorithm and return the combined phase1 and phase2 depth. In phase2, only the moves
// U,D,R2,F2,L2 and B2 are allowed.
Search.totalDepth = function(depthPhase1, maxDepth) {
	var mv = 0, d1 = 0, d2 = 0;
	var maxDepthPhase2 = Math.min(10, maxDepth - depthPhase1);// Allow only max 10 moves in phase2
	for (var i = 0; i < depthPhase1; i++) {
		mv = 3 * Search.ax[i] + Search.po[i] - 1;
		Search.URFtoDLF[i + 1] = CoordCube.URFtoDLF_Move[Search.URFtoDLF[i]][mv];
		Search.FRtoBR[i + 1] = CoordCube.FRtoBR_Move[Search.FRtoBR[i]][mv];
		Search.parity[i + 1] = CoordCube.parityMove[Search.parity[i]][mv];
	}

	if ((d1 = CoordCube.getPruning(CoordCube.Slice_URFtoDLF_Parity_Prun,
			(CoordCube.N_SLICE2 * Search.URFtoDLF[depthPhase1] + Search.FRtoBR[depthPhase1]) * 2 + Search.parity[depthPhase1])) > maxDepthPhase2) {
		return -1;
	}
	for (var i = 0; i < depthPhase1; i++) {
		mv = 3 * Search.ax[i] + Search.po[i] - 1;
		Search.URtoUL[i + 1] = CoordCube.URtoUL_Move[Search.URtoUL[i]][mv];
		Search.UBtoDF[i + 1] = CoordCube.UBtoDF_Move[Search.UBtoDF[i]][mv];
	}
	Search.URtoDF[depthPhase1] = CoordCube.MergeURtoULandUBtoDF[Search.URtoUL[depthPhase1]][Search.UBtoDF[depthPhase1]];

	if ((d2 = CoordCube.getPruning(CoordCube.Slice_URtoDF_Parity_Prun,
			(CoordCube.N_SLICE2 * Search.URtoDF[depthPhase1] + Search.FRtoBR[depthPhase1]) * 2 + Search.parity[depthPhase1])) > maxDepthPhase2) {
		return -1;
	}
	if ((Search.minDistPhase2[depthPhase1] = Math.max(d1, d2)) == 0) {// already solved
		return depthPhase1;
	}
	// now set up search

	var depthPhase2 = 1;
	var n = depthPhase1;
	var busy = false;
	Search.po[depthPhase1] = 0;
	Search.ax[depthPhase1] = 0;
	Search.minDistPhase2[n + 1] = 1;// else failure for depthPhase2=1, n=0
	// +++++++++++++++++++ end initialization +++++++++++++++++++++++++++++++++
	do {
		do {
			if ((depthPhase1 + depthPhase2 - n > Search.minDistPhase2[n + 1]) && !busy) {

				if (Search.ax[n] == 0 || Search.ax[n] == 3) {// Initialize next move
					Search.ax[++n] = 1;
					Search.po[n] = 2;
				} else {
					Search.ax[++n] = 0;
					Search.po[n] = 1;
				}
			} else if ((Search.ax[n] == 0 || Search.ax[n] == 3) ? (++Search.po[n] > 3) : ((Search.po[n] = Search.po[n] + 2) > 3)) {
				do {// increment axis
					if (++Search.ax[n] > 5) {
						if (n == depthPhase1) {
							if (depthPhase2 >= maxDepthPhase2) {
								return -1;
							} else {
								depthPhase2++;
								Search.ax[n] = 0;
								Search.po[n] = 1;
								busy = false;
								break;
							}
						} else {
							n--;
							busy = true;
							break;
						}

					} else {
						if (Search.ax[n] == 0 || Search.ax[n] == 3) {
							Search.po[n] = 1;
						} else {
							Search.po[n] = 2;
						}
						busy = false;
					}
				} while (n != depthPhase1 && (Search.ax[n - 1] == Search.ax[n] || Search.ax[n - 1] - 3 == Search.ax[n]));
			} else {
				busy = false;
			}
		} while (busy);
		// +++++++++++++ compute new coordinates and new minDist ++++++++++
		mv = 3 * Search.ax[n] + Search.po[n] - 1;

		Search.URFtoDLF[n + 1] = CoordCube.URFtoDLF_Move[Search.URFtoDLF[n]][mv];
		Search.FRtoBR[n + 1] = CoordCube.FRtoBR_Move[Search.FRtoBR[n]][mv];
		Search.parity[n + 1] = CoordCube.parityMove[Search.parity[n]][mv];
		Search.URtoDF[n + 1] = CoordCube.URtoDF_Move[Search.URtoDF[n]][mv];

		Search.minDistPhase2[n + 1] = Math.max(CoordCube.getPruning(CoordCube.Slice_URtoDF_Parity_Prun, (CoordCube.N_SLICE2
				* Search.URtoDF[n + 1] + Search.FRtoBR[n + 1])
				* 2 + Search.parity[n + 1]), CoordCube.getPruning(CoordCube.Slice_URFtoDLF_Parity_Prun, (CoordCube.N_SLICE2
				* Search.URFtoDLF[n + 1] + Search.FRtoBR[n + 1])
				* 2 + Search.parity[n + 1]));
		// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

	} while (Search.minDistPhase2[n + 1] != 0);
	return depthPhase1 + depthPhase2;
}