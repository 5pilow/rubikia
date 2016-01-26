/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
    CubieCube représente un cube par la position et l'orientation de ses cubes 
	physiques, ceux que l'on peut tourner (appelés cubies), c'est à dire les coins 
	et les arêtes (cf baseStruct.js).
	
	
	- Explications pour le calcul de la permutation (position) :
	La permutation d'une arête (ou d'un coin) correspond à l'arête (ou au coin) qui 
	se trouve à sa position d'origine.
	
	Prenons par exemple le mouvement F pour les coins:
	Le coin UFL prend la place du coin URF, DLF la place de UFL, DFR la place de
	DLF et URF la place de DFR.
	Si on représente cela sous la forme d'un tableau de permutation, on obtient :
		URF UFL ULB UBR DFR DLF DBL DRB
		UFL DLF ULB UBR URF DFR DBL DRB
	
	On ne conserve que la deuxième partie du tableau des permutations car la 
	première est redondante.
	L'ordre des coins est URF UFL ULB UBR DFR DLF DBL DRB.
	L'ordre des arêtes est UR UF UL UB DR DF DL DB FR FL BL BR.
	
	
	
    - Explications pour le calcul de l'orientation :
	L'orientation se calcule par rapport à l'orientation de la facette de 
	référence d'un coin ou d'une arête par rapport à l'orientation de la facette
	de référence du coin ou de l'arête où ils sont.
	Les facettes de référence sont :
                     |U1 U2 U3|
                     |U4 ** U6|
                     |U7 U8 U9|
            |** ** **|** ** **|** ** **|** ** **|
            |** ** **|F4 ** F6|** ** **|B4 ** B6|
            |** ** **|** ** **|** ** **|** ** **|
                     |D1 D2 D3|
                     |D4 ** D6|
                     |D7 D8 D9|

	Prenons par exemple le résultat du mouvement F :
                     |U1 U2 U3|
                     |U4 ** U6|
                     |** ** **|
            |** ** D1|** F4 **|U7 ** **|** ** **|
            |** ** D2|** ** **|U8 ** **|B4 ** B6|
            |** ** D3|** F6 **|U9 ** **|** ** **|
                     |** ** **|
                     |D4 ** D6|
                     |D7 D8 D9|
	Le coin à position URF (haut à droite de la face) a sa facette de référence 
	tournée dans le sens des aiguilles d'une montre par rapport à la référence.
	L'arête à la position FR est inversée par rapport à la référence.
	
	L'orientation d'un coin vaut 0 si il n'est pas tourné, 1 si il est tourné dans 
	le sens des aiguilles d'une montre et 2 si dans le sens contraire des aiguilles 
	d'une montre.
	L'orientation d'une arête vaut 0 si elle n'est pas tournée et 1 si elle est 
	inversée.
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
 
/* Constructeur de CubieCube.                                                      *
 * Crée le CubieCube à partir des positions,                                       *
 * ou un cube non mélangé par défault.                                             */
var CubieCube = function(cornerPermutation, cornerOrientation, edgePermutation, edgeOrientation){
	// Permutation des coins
	this.cornerPermutation = typeof cornerPermutation !== 'undefined' ? 
		cornerPermutation.slice() 
		: // Par defaut
		[Corner.URF, Corner.UFL, Corner.ULB, Corner.UBR, Corner.DFR, Corner.DLF, Corner.DBL, Corner.DRB];

	// Orientation des coins
	this.cornerOrientation = typeof cornerOrientation !== 'undefined' ? 
		cornerOrientation.slice() 
		: // Par defaut 
		[0, 0, 0, 0, 0, 0, 0, 0];

	// Permutation des arêtes
	this.edgePermutation = typeof edgePermutation !== 'undefined' ? 
		edgePermutation.slice() 
		: // Par defaut
		[Edge.UR, Edge.UF, Edge.UL, Edge.UB, Edge.DR, Edge.DF, Edge.DL, Edge.DB, Edge.FR, Edge.FL, Edge.BL, Edge.BR];

	// Orientation des arêtes
	this.edgeOrientation = typeof edgeOrientation !== 'undefined' ? 
		edgeOrientation.slice() 
		: // Par defaut
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
}


/* Correspond à chacun des 6 mouvements de base sur un cube                        */
CubieCube.moveCube = [];
// Mouvement U
CubieCube.moveCube[0] = new CubieCube(
	[Corner.UBR, Corner.URF, Corner.UFL, Corner.ULB, Corner.DFR, Corner.DLF, Corner.DBL, Corner.DRB],
	[0, 0, 0, 0, 0, 0, 0, 0],
	[Edge.UB, Edge.UR, Edge.UF, Edge.UL, Edge.DR, Edge.DF, Edge.DL, Edge.DB, Edge.FR, Edge.FL, Edge.BL, Edge.BR],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
);
// Mouvement R
CubieCube.moveCube[1] = new CubieCube(
	[Corner.DFR, Corner.UFL, Corner.ULB, Corner.URF, Corner.DRB, Corner.DLF, Corner.DBL, Corner.UBR],
	[2, 0, 0, 1, 1, 0, 0, 2],
	[Edge.FR, Edge.UF, Edge.UL, Edge.UB, Edge.BR, Edge.DF, Edge.DL, Edge.DB, Edge.DR, Edge.FL, Edge.BL, Edge.UR],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
);
// Mouvement F
CubieCube.moveCube[2] = new CubieCube(
	[Corner.UFL, Corner.DLF, Corner.ULB, Corner.UBR, Corner.URF, Corner.DFR, Corner.DBL, Corner.DRB],
	[1, 2, 0, 0, 2, 1, 0, 0],
	[Edge.UR, Edge.FL, Edge.UL, Edge.UB, Edge.DR, Edge.FR, Edge.DL, Edge.DB, Edge.UF, Edge.DF, Edge.BL, Edge.BR],
	[0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0]
);
// Mouvement D
CubieCube.moveCube[3] = new CubieCube(
	[Corner.URF, Corner.UFL, Corner.ULB, Corner.UBR, Corner.DLF, Corner.DBL, Corner.DRB, Corner.DFR],
	[0, 0, 0, 0, 0, 0, 0, 0],
	[Edge.UR, Edge.UF, Edge.UL, Edge.UB, Edge.DF, Edge.DL, Edge.DB, Edge.DR, Edge.FR, Edge.FL, Edge.BL, Edge.BR],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
);
// Mouvement L		
CubieCube.moveCube[4] = new CubieCube(
	[Corner.URF, Corner.ULB, Corner.DBL, Corner.UBR, Corner.DFR, Corner.UFL, Corner.DLF, Corner.DRB],
	[0, 1, 2, 0, 0, 2, 1, 0]
	[Edge.UR, Edge.UF, Edge.BL, Edge.UB, Edge.DR, Edge.DF, Edge.FL, Edge.DB, Edge.FR, Edge.UL, Edge.DL, Edge.BR],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
);
// Mouvement B
CubieCube.moveCube[5] = new CubieCube(
	[Corner.URF, Corner.UFL, Corner.UBR, Corner.DRB, Corner.DFR, Corner.DLF, Corner.ULB, Corner.DBL],
	[0, 0, 1, 2, 0, 0, 2, 1],
	[Edge.UR, Edge.UF, Edge.UL, Edge.BR, Edge.DR, Edge.DF, Edge.DL, Edge.BL, Edge.FR, Edge.FL, Edge.UB, Edge.DB],
	[0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1]
);

/* Coefficient binomial (k parmi n)                                                */
CubieCube.Cnk = function(n, k) {
	var i, j, s;
	if (n < k) {
		return 0;
	}
	if (k > n / 2) {
		k = n - k;
	}
	for (s = 1, i = n, j = 1; i != n - k; i--, j++) {
		s *= i;
		s = s / j | 0;
	}
	return s;
}

/* Décale à gauche tous les éléments du tableau entre l et r (cyclique)            */
CubieCube.rotateLeft = function(array, l, r) {
	var temp = array[l];
	for (var i = l; i < r; i++) {
		array[i] = array[i + 1];
	}
	array[r] = temp;
}

/* Décale à droite tous les éléments du tableau entre l et r (cyclique)            */
CubieCube.rotateRight = function(array, l, r){
	var temp = array[r];
	for (var i = r; i > l; i--) {
		array[i] = array[i - 1];
	}
	array[l] = temp;
}

/* Donne la représentation en FaceCube du cube                                     */
CubieCube.prototype.toFaceCube = function() {
	var faceCube = new FaceCube();
	for (var c in Corner) {
		var i = Corner[c];
		var j = this.cornerPermutation[i]; // Le coin à l'index j est à la position i
		var ori = this.cornerOrientation[i]; // Orientation du coin
		for (var n = 0; n < 3; n++) {
			faceCube.f[FaceCube.cornerFacelet[i][(n + ori) % 3]] = FaceCube.cornerColor[j][n];
		}
	}
	for (var e in Edge) {
		var i = Edge[e];
		var j = this.edgePermutation[i]; // L'arête à l'index j est à la position i
		var ori = this.edgeOrientation[i]; // Orientation de l'arête
		for (var n = 0; n < 2; n++) {
			faceCube.f[FaceCube.edgeFacelet[i][(n + ori) % 2]] = FaceCube.edgeColor[j][n];
		}
	}
	return faceCube;
}


/* Valeur de l'orientation des 8 coins. (0 <= twist < 3^7)                         *
 * Elle est calculée à partir des 7 premiers coins car la 8ème peut être retrouvée *
 * grâce à la parité.                                                              */
CubieCube.prototype.getTwist = function() {
	var ret = 0;
	for (var i = Corner.URF; i < Corner.DRB; i++) {
		ret = 3 * ret + this.cornerOrientation[i];
	}
	return ret;
}

/* Récupère la valeur de l'orientation du 8ème coin à partir de la valeur de       *
 * l'orientation des 8 coins grâce à la parité.                                    */
CubieCube.prototype.setTwist = function(twist) {
	var twistParity = 0;
	for (var i = Corner.DRB - 1; i >= Corner.URF; i--) {
		twistParity += this.cornerOrientation[i] = twist % 3;
		twist = twist / 3 | 0;
	}
	this.cornerOrientation[Corner.DRB] = (3 - twistParity % 3) % 3;
}

/* Valeur de l'orientation des 12 arêtes. (0<= flip < 2^11)                        *
 * Elle est calculée à partir des 11 premières arêtes car la 12ème peut être       *
 * retrouvée grâce à la parité.                                                    */
CubieCube.prototype.getFlip = function() {
	var ret = 0;
	for (var i = Edge.UR; i < Edge.BR; i++) {
		ret = 2 * ret + this.edgeOrientation[i];
	}
	return ret;
}

/* Récupère la valeur de l'orientation de la 12ème arête à partir de la valeur de  *
 * l'orientation des 12 arêtes grâce à la parité.                                  */
CubieCube.prototype.setFlip = function(flip) {
	var flipParity = 0;
	for (var i = Edge.BR - 1; i >= Edge.UR; i--) {
		flipParity += this.edgeOrientation[i] = flip % 2;
		flip = flip / 2 | 0;
	}
	this.edgeOrientation[Edge.BR] = (2 - flipParity % 2) % 2;
}

/* Calcule la parité des permutations (positions) des coins                        */
CubieCube.prototype.cornerParity = function() {
	var s = 0;
	for (var i = Corner.DRB; i >= Corner.URF + 1; i--) {
		for (var j = i - 1; j >= Corner.URF; j--) {
			if (this.cornerPermutation[j] > this.cornerPermutation[i]) {
				s++;
			}
		}
	}
	return s % 2;
}

/* Calcule la parité des permutations (positions) des arêtes                       */
CubieCube.prototype.edgeParity = function() {
	var s = 0;
	for (var i = Edge.BR; i >= Edge.UR + 1; i--) {
		for (var j = i - 1; j >= Edge.UR; j--) {
			if (this.edgePermutation[j] > this.edgePermutation[i]) {
				s++;
			}
		}
	}
	return s % 2;
}

/* Permutation des arêtes de la tranche UD : FR, FL, BL et BR                      */
CubieCube.prototype.getFRtoBR = function() {
	var a = 0, x = 0;
	var edge4 = new Array(4).fill(0);
	// Calcule l'index a < (4 parmi 12) et les permutations des arêtes
	for (var j = Edge.BR; j >= Edge.UR; j--) {
		if (Edge.FR <= this.edgePermutation[j] && this.edgePermutation[j] <= Edge.BR) {
			a += CubieCube.Cnk(11 - j, x + 1);
			edge4[3 - x++] = this.edgePermutation[j];
		}
	}
	var b = 0;
	for (var j = 3; j > 0; j--) { // Calcule l'index b < 4! pour les permutations des arêtes
		var k = 0;
		while (edge4[j] != j + 8) {
			CubieCube.rotateLeft(edge4, 0, j);
			k++;
		}
		b = (j + 1) * b + k;
	}
	return 24 * a + b;
}

/* Permutation de tout les coins sauf DBL et DRB                                   */
CubieCube.prototype.getURFtoDLF = function() {
	var a = 0, x = 0;
	var corner6 = new Array(6).fill(0);
	// Calcule l'index a < (6 parmi 8) et les permutations des coins
	for (var j = Corner.URF; j <= Corner.DRB; j++) {
		if (this.cornerPermutation[j] <= Corner.DLF) {
			a += CubieCube.Cnk(j, x + 1);
			corner6[x++] = this.cornerPermutation[j];
		}
	}
	var b = 0;
	for (var j = 5; j > 0; j--) { // Calcule l'index b < 6! pour les permutations des coins
		var k = 0;
		while (corner6[j] != j) {
			CubieCube.rotateLeft(corner6, 0, j);
			k++;
		}
		b = (j + 1) * b + k;
	}
	return 720 * a + b;
}

/* Permutation des 6 arêtes UR, UF, UL, UB, DR et DF                               */
CubieCube.prototype.getURtoDF = function() {
	var a = 0, x = 0;
	var edge6 = new Array(6).fill(0);
	// Calcule l'index a < (6 parmi 12) et les permutations des arêtes
	for (var j = Edge.UR; j <= Edge.BR; j++) {
		if (this.edgePermutation[j] <= Edge.DF) {
			a += CubieCube.Cnk(j, x + 1);
			edge6[x++] = this.edgePermutation[j];
		}
	}
	var b = 0;
	for (var j = 5; j > 0; j--) { // Calcule l'index b < 6! pour les permutations des arêtes
		var k = 0;
		while (edge6[j] != j) {
			CubieCube.rotateLeft(edge6, 0, j);
			k++;
		}
		b = (j + 1) * b + k;
	}
	return 720 * a + b;
}

/* Permutation des 3 arêtes UR, UF et UL                                           */
CubieCube.prototype.getURtoUL = function() {
	var a = 0, x = 0;
	var edge3 = new Array(3).fill(0);
	// Calcule l'index a < (3 parmi 12) et les permutations des arêtes
	for (var j = Edge.UR; j <= Edge.BR; j++)
		if (this.edgePermutation[j] <= Edge.UL) {
			a += CubieCube.Cnk(j, x + 1);
			edge3[x++] = this.edgePermutation[j];
		}

	var b = 0;
	for (var j = 2; j > 0; j--) { // Calcule l'index b < 3! pour les permutations des arêtes
		var k = 0;
		while (edge3[j]	!= j) {
			CubieCube.rotateLeft(edge3, 0, j);
			k++;
		}
		b = (j + 1) * b + k;
	}
	return 6 * a + b;
}

CubieCube.prototype.setURtoUL = function(idx) {
	var x;
	var edge3 = [Edge.UR, Edge.UF, Edge.UL];
	var b = idx % 6; // Permutation
	var a = idx / 6 | 0; // Combinaison
	for (var e in Edge) {
		this.edgePermutation[Edge[e]] = Edge.BR; // Reset les arêtes
	}
	for (var j = 1, k; j < 3; j++) { // Genère les permutation à partir de l'index b
		k = b % (j + 1);
		b = b / (j + 1) | 0;
		while (k-- > 0) {
			CubieCube.rotateRight(edge3, 0, j);
		}
	}
	x = 2; // Genère les combinaisons et les ensembles d'arêtes
	for (var j = Edge.BR; j >= 0; j--) {
		if (a - CubieCube.Cnk(j, x + 1) >= 0) {
			this.edgePermutation[j] = edge3[x];
			a -= CubieCube.Cnk(j, x-- + 1);
		}
	}
}

/* Permutation des 3 arêtes UB, DR et DF                                           */
CubieCube.prototype.getUBtoDF = function() {
	var a = 0, x = 0;
	var edge3 = new Array(3).fill(0);
	// Calcule l'index a < (3 parmi 12) et les permutations des arêtes
	for (var j = Edge.UR; j <= Edge.BR; j++) {
		if (Edge.UB <= this.edgePermutation[j] && this.edgePermutation[j] <= Edge.DF) {
			a += CubieCube.Cnk(j, x + 1);
			edge3[x++] = this.edgePermutation[j];
		}
	}
	var b = 0;
	for (var j = 2; j > 0; j--) { // Calcule l'index b < 3! pour les permutations des arêtes
		var k = 0;
		while (edge3[j] != Edge.UB + j) {
			CubieCube.rotateLeft(edge3, 0, j);
			k++;
		}
		b = (j + 1) * b + k;
	}
	return 6 * a + b;
}

CubieCube.prototype.setUBtoDF = function(idx) {
	var x;
	var edge3 = [Edge.UB, Edge.DR, Edge.DF];
	var b = idx % 6; // Permutation
	var a = idx / 6 | 0; // Combinaison
	for (var e in Edge) {
		this.edgePermutation[Edge[e]] = Edge.BR; // Reset les arêtes
	}
	for (var j = 1, k; j < 3; j++) { // Genère les permutation à partir de l'index b
		k = b % (j + 1);
		b = b / (j + 1) | 0;
		while (k-- > 0) {
			CubieCube.rotateRight(edge3, 0, j);
		}
	}
	x = 2; // Genère les combinaisons et les ensembles d'arêtes
	for (var j = Edge.BR; j >= 0; j--) {
		if (a - CubieCube.Cnk(j, x + 1) >= 0) {
			this.edgePermutation[j] = edge3[x];
			a -= CubieCube.Cnk(j, x-- + 1);
		}
	}
}

/* Permutation des 6 arêtes UR, UF, UL, UB, DR et DF                               */
CubieCube.prototype.getURtoDF = function(idx1, idx2) {
	var cubeA = new CubieCube();
	var cubeB = new CubieCube();
	cubeA.setURtoUL(idx1);
	cubeB.setUBtoDF(idx2);
	for (var i = 0; i < 8; i++) {
		if (cubeA.edgePermutation[i] != Edge.BR) {
			if (cubeB.edgePermutation[i] != Edge.BR) { // Collision
				return -1;
			} else {
				cubeB.edgePermutation[i] = cubeA.edgePermutation[i];
			}
		}
	}
	return cubeB.getURtoDF();
}

CubieCube.prototype.getURFtoDLB = function() {
	var perm = [];
	var b = 0;
	for (var i = 0; i < 8; i++) {
		perm[i] = this.cornerPermutation[i];
	}
	for (var j = 7; j > 0; j--) { // Calcule l'index b < 8! pour les permutations des coins
		var k = 0;
		while (perm[j] != j) {
			CubieCube.rotateLeft(perm, 0, j);
			k++;
		}
		b = (j + 1) * b + k;
	}
	return b;
}

CubieCube.prototype.setURFtoDLB = function(idx) {
	var perm = [Corner.URF, Corner.UFL, Corner.ULB, Corner.UBR, Corner.DFR, Corner.DLF, Corner.DBL, Corner.DRB];
	var k;
	for (var j = 1; j < 8; j++) {
		k = idx % (j + 1);
		idx = idx / (j + 1) | 0;
		while (k-- > 0) {
			CubieCube.rotateRight(perm, 0, j);
		}
	}
	var x = 7; // Rempli les coins
	for (var j = 7; j >= 0; j--) {
		this.cornerPermutation[j] = perm[x--];
	}
}

CubieCube.prototype.setURtoBR = function(idx) {
	var perm = [Edge.UR, Edge.UF, Edge.UL, Edge.UB, Edge.DR, Edge.DF, Edge.DL, Edge.DB, Edge.FR, Edge.FL, Edge.BL, Edge.BR];
	var k;
	for (var j = 1; j < 12; j++) {
		k = idx % (j + 1);
		idx = idx / (j + 1) | 0;
		while (k-- > 0){
			CubieCube.rotateRight(perm, 0, j);
		}
	}
	var x = 11; // Rempli les arêtes
	for (var j = 11; j >= 0; j--) {
		this.edgePermutation[j] = perm[x--];
	}
}

/* Vérifie qu'un cube est possible à résoudre. Retourne un code erreur.            *
 *  0: Le cube a une solution                                                      *
 * -2: Il n'y a pas 12 arêtes uniques                                              *
 * -3: Une des arêtes a été inversée                                               *
 * -4: Il n'y a pas 8 coins uniques                                                *
 * -5: Un coin a été tourné                                                        *
 * -6: Erreur de parité : 2 coins ou 2 arêtes ont été echangés                     */
CubieCube.prototype.verify = function() {
	var sum = 0;
	var edgeCount = new Array(12).fill(0);
	for (var e in Edge) {
		edgeCount[this.edgePermutation[Edge[e]]]++;
	}
	for (var i = 0; i < 12; i++) {
		if (edgeCount[i] != 1) {
			return -2; // Il n'y a pas 12 arêtes uniques 
		}
	}
	for (var i = 0; i < 12; i++) {
		sum += this.edgeOrientation[i];
	}
	if (sum % 2 != 0){
		return -3; // Une des arêtes a été inversée 
	}
	var cornerCount = new Array(8).fill(0);
	for (var c in Corner) {
		cornerCount[this.cornerPermutation[Corner[c]]]++;
	}
	for (var i = 0; i < 8; i++) {
		if (cornerCount[i] != 1) {
			return -4; // Il n'y a pas 8 coins uniques
		}
	}
	sum = 0;
	for (var i = 0; i < 8; i++) {
		sum += this.cornerOrientation[i];
	}
	if (sum % 3 != 0) {
		return -5; // Un coin a été tourné
	}
	if ((this.edgeParity() ^ this.cornerParity()) != 0) {
		return -6; // Erreur de parité : 2 coins ou 2 arêtes ont été echangés
	}
	return 0; // Le cube a une solution
}