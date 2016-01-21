var search = new function(){
	this.ax = []; // Axe du mouvement
	this.po = []; // Angle de rotation
	
	this.flip = []; // Coordonnées pahse 1
	this.twist = [];
	this.slice = [];
	
	this.parity = []; // Coordonnées phase 2
	this.URFtoDLF = [];
	this.FRtoBR = [];
	this.URtoUL = [];
	this.UBtoDF = [];
	this.URtoDF = [];
	
	this.minDistPhase1 = []; // Estimations de la distance au but pour IDA*
	this.minDistPhase2 = [];
	
	// Retourne la solution sous forme d'une chaine de caractère
	this.solutionToString(length) {
		var s = "";
		for (var i = 0; i < length; i++) {
			switch (this.ax[i]) {
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
			switch (this.po[i]) {
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
	
	this.solutionToString(length, depthPhase1) {
		var s = "";
		for (var i = 0; i < length; i++) {
			switch (this.ax[i]) {
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
			switch (this.po[i]) {
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
			if (i == depthPhase1 - 1)
				s += ". ";
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
	this.solution(facelets, maxDepth, timeOut, useSeparator) {
		var s;

		// +++++++++++++++++++++check for wrong input +++++++++++++++++++++++++++++
		var count = [];
		for (var i = 0; i < 54; i++) {
			count[Color[facelets.substring(i, i + 1)]]++;
		}
		for (var i = 0; i < 6; i++) {
			if (count[i] != 9) {
				return "Error 1";
			}
		}
// TODO : suite
		FaceCube fc = new FaceCube(facelets);
		CubieCube cc = fc.toCubieCube();
		if ((s = cc.verify()) != 0)
			return "Error " + Math.abs(s);

		// +++++++++++++++++++++++ initialization +++++++++++++++++++++++++++++++++
		CoordCube c = new CoordCube(cc);

		po[0] = 0;
		ax[0] = 0;
		flip[0] = c.flip;
		twist[0] = c.twist;
		parity[0] = c.parity;
		slice[0] = c.FRtoBR / 24;
		URFtoDLF[0] = c.URFtoDLF;
		FRtoBR[0] = c.FRtoBR;
		URtoUL[0] = c.URtoUL;
		UBtoDF[0] = c.UBtoDF;

		minDistPhase1[1] = 1;// else failure for depth=1, n=0
		int mv = 0, n = 0;
		boolean busy = false;
		int depthPhase1 = 1;

		long tStart = System.currentTimeMillis();

		// +++++++++++++++++++ Main loop ++++++++++++++++++++++++++++++++++++++++++
		do {
			do {
				if ((depthPhase1 - n > minDistPhase1[n + 1]) && !busy) {

					if (ax[n] == 0 || ax[n] == 3)// Initialize next move
						ax[++n] = 1;
					else
						ax[++n] = 0;
					po[n] = 1;
				} else if (++po[n] > 3) {
					do {// increment axis
						if (++ax[n] > 5) {

							if (System.currentTimeMillis() - tStart > timeOut << 10)
								return "Error 8";

							if (n == 0) {
								if (depthPhase1 >= maxDepth)
									return "Error 7";
								else {
									depthPhase1++;
									ax[n] = 0;
									po[n] = 1;
									busy = false;
									break;
								}
							} else {
								n--;
								busy = true;
								break;
							}

						} else {
							po[n] = 1;
							busy = false;
						}
					} while (n != 0 && (ax[n - 1] == ax[n] || ax[n - 1] - 3 == ax[n]));
				} else
					busy = false;
			} while (busy);

			// +++++++++++++ compute new coordinates and new minDistPhase1 ++++++++++
			// if minDistPhase1 =0, the H subgroup is reached
			mv = 3 * ax[n] + po[n] - 1;
			flip[n + 1] = CoordCube.flipMove[flip[n]][mv];
			twist[n + 1] = CoordCube.twistMove[twist[n]][mv];
			slice[n + 1] = CoordCube.FRtoBR_Move[slice[n] * 24][mv] / 24;
			minDistPhase1[n + 1] = Math.max(CoordCube.getPruning(CoordCube.Slice_Flip_Prun, CoordCube.N_SLICE1 * flip[n + 1]
					+ slice[n + 1]), CoordCube.getPruning(CoordCube.Slice_Twist_Prun, CoordCube.N_SLICE1 * twist[n + 1]
					+ slice[n + 1]));
			// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

			if (minDistPhase1[n + 1] == 0 && n >= depthPhase1 - 5) {
				minDistPhase1[n + 1] = 10;// instead of 10 any value >5 is possible
				if (n == depthPhase1 - 1 && (s = totalDepth(depthPhase1, maxDepth)) >= 0) {
					if (s == depthPhase1
							|| (ax[depthPhase1 - 1] != ax[depthPhase1] && ax[depthPhase1 - 1] != ax[depthPhase1] + 3))
						return useSeparator ? solutionToString(s, depthPhase1) : solutionToString(s);
				}

			}
		} while (true);
	}
	
}