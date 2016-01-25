/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
                 2-phase Algorithm
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

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

/* Retourne la solution sous forme d'une chaine de caractères.                     */
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

/* Retourne la solution sous forme d'une chaine de caractères avec un séparateur   *
 * entre la phase 1 et la phase 2.                                                 */
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

/* Calcule et retourne les mouvements pour résoudre le cube sous forme d'une       *
 * chaîne de caractères.                                                           *
 *                                                                                 *
 * Paramètres :                                                                    *
 * - facelets : cube représenté sous forme d'une chaîne de caractères.             *
 * - maxDepth : profondeur maximale de recherche. Avec 21 une solution est trouvée *
 * en moins d'une seconde, avec 20 en quelques secondes.                           *
 * - timeOut : temps maximal de calcul pour trouver une solution en ms. Si une     *
 * solution n'est pas trouvée dans le temps imparti, retourne un code erreur.      *
 * - useSeparateur : si vrai, un point sera mis dans le résultat entre les étapes  *
 * de la phase 1 et de la phase 2.                                                 *
 *                                                                                 *
 * Codes erreur :                                                                  *
 * Error 1: Il n'y a pas 9 facettes de chaque couleur                              *
 * Error 2: Il n'y a pas 12 arêtes uniques                                         *
 * Error 3: Une des arêtes a été inversée                                          *
 * Error 4: Il n'y a pas 8 coins uniques                                           *
 * Error 5: Un coin a été tourné                                                   *
 * Error 6: Erreur de parité : 2 coins ou 2 arêtes ont été echangés                *
 * Error 7: Aucune solution n'existe pour la maxDepth donnée                       *
 * Error 8: Timeout, aucune solution n'a été trouvée dans le temps imparti         */
Search.solution = function(facelets, maxDepth, timeOut, useSeparator) {
	var s;

	// Vérifie que le cube passé en paramètre est correct
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

	// Initialisation
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

	Search.minDistPhase1[1] = 1; // Sinon échec pour depth=1 et n=0
	var mv = 0, n = 0;
	var busy = false;
	var depthPhase1 = 1;

	var tStart = new Date().getTime();
	
	// Boucle principale
	do {
		do {
			if ((depthPhase1 - n > Search.minDistPhase1[n + 1]) && !busy) {

				if (Search.ax[n] == 0 || Search.ax[n] == 3) {// Initialise le prochain mouvement
					Search.ax[++n] = 1;
				} else {
					Search.ax[++n] = 0;
				}
				Search.po[n] = 1;
			} else if (++Search.po[n] > 3) {
				do { // Incrémente l'axe
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

		// Calcule les nouvelles coordonées et la nouvelle distance min  pour la phase 1 (minDistPhase1)
		// Si minDistPhase1=0, alors le sous groupe H est atteind
		mv = 3 * Search.ax[n] + Search.po[n] - 1;
		Search.flip[n + 1] = CoordCube.flipMove[Search.flip[n]][mv];
		Search.twist[n + 1] = CoordCube.twistMove[Search.twist[n]][mv];
		Search.slice[n + 1] = CoordCube.FRtoBR_Move[Search.slice[n] * 24][mv] / 24 | 0;
		Search.minDistPhase1[n + 1] = Math.max(CoordCube.getPruning(CoordCube.Slice_Flip_Prun, CoordCube.N_SLICE1 * Search.flip[n + 1]
				+ Search.slice[n + 1]), CoordCube.getPruning(CoordCube.Slice_Twist_Prun, CoordCube.N_SLICE1 * Search.twist[n + 1] + Search.slice[n + 1]));
		
		if (Search.minDistPhase1[n + 1] == 0 && n >= depthPhase1 - 5) {
			Search.minDistPhase1[n + 1] = 10; // A la place de 10, n'importe quelle valeur >5 est possible
			if (n == depthPhase1 - 1 && (s = Search.totalDepth(depthPhase1, maxDepth)) >= 0) {
				if (s == depthPhase1 || (Search.ax[depthPhase1 - 1] != Search.ax[depthPhase1] && Search.ax[depthPhase1 - 1] != Search.ax[depthPhase1] + 3)) {
					return useSeparator ? Search.solutionToString(s, depthPhase1) : Search.solutionToString(s);
				}
			}

		}
	} while (true);
}

/* Applique la phase 2 de l'algorithm et retourne la somme des profondeurs des     *
 * phases 1 et 2.                                                                  *
 * Dans la phase 2, seulement les mouvements U, D, R2, F2, L2 et B2 sont autorisés.*/
Search.totalDepth = function(depthPhase1, maxDepth) {
	var mv = 0, d1 = 0, d2 = 0;
	var maxDepthPhase2 = Math.min(10, maxDepth - depthPhase1); // Autorise seulement 10 mouvement maximum en phase 2
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
	if ((Search.minDistPhase2[depthPhase1] = Math.max(d1, d2)) == 0) { // Déjà résolu
		return depthPhase1;
	}

	var depthPhase2 = 1;
	var n = depthPhase1;
	var busy = false;
	Search.po[depthPhase1] = 0;
	Search.ax[depthPhase1] = 0;
	Search.minDistPhase2[n + 1] = 1; // Sinon échec pour depthPhase2=1 et n=0
	// Fin de l'initialisation
	do {
		do {
			if ((depthPhase1 + depthPhase2 - n > Search.minDistPhase2[n + 1]) && !busy) {

				if (Search.ax[n] == 0 || Search.ax[n] == 3) { // Initialise le prochain mouvement
					Search.ax[++n] = 1;
					Search.po[n] = 2;
				} else {
					Search.ax[++n] = 0;
					Search.po[n] = 1;
				}
			} else if ((Search.ax[n] == 0 || Search.ax[n] == 3) ? (++Search.po[n] > 3) : ((Search.po[n] = Search.po[n] + 2) > 3)) {
				do { // Incrémente l'axe
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
		// Calcule les nouvelles coordonnées et la nouvelle minDist
		mv = 3 * Search.ax[n] + Search.po[n] - 1;

		Search.URFtoDLF[n + 1] = CoordCube.URFtoDLF_Move[Search.URFtoDLF[n]][mv];
		Search.FRtoBR[n + 1] = CoordCube.FRtoBR_Move[Search.FRtoBR[n]][mv];
		Search.parity[n + 1] = CoordCube.parityMove[Search.parity[n]][mv];
		Search.URtoDF[n + 1] = CoordCube.URtoDF_Move[Search.URtoDF[n]][mv];

		Search.minDistPhase2[n + 1] = Math.max(CoordCube.getPruning(CoordCube.Slice_URtoDF_Parity_Prun, (CoordCube.N_SLICE2
				* Search.URtoDF[n + 1] + Search.FRtoBR[n + 1]) * 2 + Search.parity[n + 1]),
				CoordCube.getPruning(CoordCube.Slice_URFtoDLF_Parity_Prun, (CoordCube.N_SLICE2
				* Search.URFtoDLF[n + 1] + Search.FRtoBR[n + 1]) * 2 + Search.parity[n + 1]));

	} while (Search.minDistPhase2[n + 1] != 0);
	return depthPhase1 + depthPhase2;
}