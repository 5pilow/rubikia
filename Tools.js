/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
                 Quelques outils pour les cubes
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
var Tools = {};

/* Vérifie que le cube passé en paramètre est possible à résoudre.                 *
 *  0: Le cube a une solution                                                      *
 * -1: Il n'y a pas 9 facettes de chaque couleur                                   *
 * -2: Il n'y a pas 12 arêtes uniques                                              *
 * -3: Une des arêtes a été inversée                                               *
 * -4: Il n'y a pas 8 coins uniques                                                *
 * -5: Un coin a été tourné                                                        *
 * -6: Erreur de parité : 2 coins ou 2 arêtes ont été echangés                     */
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


/* Génère un cube aléatoirement. Retourne le cube sous forme d'une chaîne de       *
 * caractère                                                                       */
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
