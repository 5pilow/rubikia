var CubieCube = function(cornerPermutation, cornerOrientation, edgePermutation, edgeOrientation){
	// initialize to Id-Cube

	// cornerOrientationrner permutation
	this.cornerPermutation = typeof cornerPermutation !== 'undefined' ? cornerPermutation.slice() : [Corner.URF, Corner.UFL, Corner.ULB, Corner.UBR, Corner.DFR, Corner.DLF, Corner.DBL, Corner.DRB];

	// cornerOrientationrner orientation
	this.cornerOrientation = typeof cornerOrientation !== 'undefined' ? cornerOrientation.slice() : [0, 0, 0, 0, 0, 0, 0, 0];

	// edge permutation
	this.edgePermutation = typeof edgePermutation !== 'undefined' ? edgePermutation.slice() : [Edge.UR, Edge.UF, Edge.UL, Edge.UB, Edge.DR, Edge.DF, Edge.DL, Edge.DB, Edge.FR, Edge.FL, Edge.BL, Edge.BR];

	// edge orientation
	this.edgeOrientation = typeof edgeOrientation !== 'undefined' ? edgeOrientation.slice() : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
}


// ************************************** Moves on the cubie level ***************************************************
// this CubieCube array redgePermutationresents the 6 basic cube moves
CubieCube.moveCube = [];
CubieCube.moveCube[0] = new CubieCube(
	[Corner.UBR, Corner.URF, Corner.UFL, Corner.ULB, Corner.DFR, Corner.DLF, Corner.DBL, Corner.DRB],
	[0, 0, 0, 0, 0, 0, 0, 0],
	[Edge.UB, Edge.UR, Edge.UF, Edge.UL, Edge.DR, Edge.DF, Edge.DL, Edge.DB, Edge.FR, Edge.FL, Edge.BL, Edge.BR],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
);
CubieCube.moveCube[1] = new CubieCube(
	[Corner.DFR, Corner.UFL, Corner.ULB, Corner.URF, Corner.DRB, Corner.DLF, Corner.DBL, Corner.UBR],
	[2, 0, 0, 1, 1, 0, 0, 2],
	[Edge.FR, Edge.UF, Edge.UL, Edge.UB, Edge.BR, Edge.DF, Edge.DL, Edge.DB, Edge.DR, Edge.FL, Edge.BL, Edge.UR],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
);				
CubieCube.moveCube[2] = new CubieCube(
	[Corner.UFL, Corner.DLF, Corner.ULB, Corner.UBR, Corner.URF, Corner.DFR, Corner.DBL, Corner.DRB],
	[1, 2, 0, 0, 2, 1, 0, 0],
	[Edge.UR, Edge.FL, Edge.UL, Edge.UB, Edge.DR, Edge.FR, Edge.DL, Edge.DB, Edge.UF, Edge.DF, Edge.BL, Edge.BR],
	[0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0]
);				
CubieCube.moveCube[3] = new CubieCube(
	[Corner.URF, Corner.UFL, Corner.ULB, Corner.UBR, Corner.DLF, Corner.DBL, Corner.DRB, Corner.DFR],
	[0, 0, 0, 0, 0, 0, 0, 0],
	[Edge.UR, Edge.UF, Edge.UL, Edge.UB, Edge.DF, Edge.DL, Edge.DB, Edge.DR, Edge.FR, Edge.FL, Edge.BL, Edge.BR],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
);				
CubieCube.moveCube[4] = new CubieCube(
	[Corner.URF, Corner.ULB, Corner.DBL, Corner.UBR, Corner.DFR, Corner.UFL, Corner.DLF, Corner.DRB],
	[0, 1, 2, 0, 0, 2, 1, 0]
	[Edge.UR, Edge.UF, Edge.BL, Edge.UB, Edge.DR, Edge.DF, Edge.FL, Edge.DB, Edge.FR, Edge.UL, Edge.DL, Edge.BR],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
);				
CubieCube.moveCube[5] = new CubieCube(
	[Corner.URF, Corner.UFL, Corner.UBR, Corner.DRB, Corner.DFR, Corner.DLF, Corner.ULB, Corner.DBL],
	[0, 0, 1, 2, 0, 0, 2, 1],
	[Edge.UR, Edge.UF, Edge.UL, Edge.BR, Edge.DR, Edge.DF, Edge.DL, Edge.BL, Edge.FR, Edge.FL, Edge.UB, Edge.DB],
	[0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1]
);
	
// n choose k
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
	
// Left rotation of all array elements between l and r
CubieCube.rotateLeft = function(array, l, r) {
	var temp = array[l];
	for (var i = l; i < r; i++) {
		array[i] = array[i + 1];
	}
	array[r] = temp;
}

// Right rotation of all array elements between l and r
CubieCube.rotateRight = function(array, l, r){
	var temp = array[r];
	for (var i = r; i > l; i--) {
		array[i] = array[i - 1];
	}
	array[l] = temp;
}
	
// return cube in facelet representation
CubieCube.prototype.toFaceCube = function() {
	var faceCube = new FaceCube();
	for (var c in Corner) {
		var i = Corner[c];
		var j = this.cornerPermutation[i];// cornercubie with index j is at
		// cornerposition with index i
		var ori = this.cornerOrientation[i];// Orientation of this cubie
		for (var n = 0; n < 3; n++) {
			faceCube.f[FaceCube.cornerFacelet[i][(n + ori) % 3]] = FaceCube.cornerColor[j][n];
		}
	}
	for (var e in Edge) {
		var i = Edge[e];
		var j = this.edgePermutation[i];// edgecubie with index j is at edgeposition
		// with index i
		var ori = this.edgeOrientation[i];// Orientation of this cubie
		for (var n = 0; n < 2; n++) {
			faceCube.f[FaceCube.edgeFacelet[i][(n + ori) % 2]] = FaceCube.edgeColor[j][n];
		}
	}
	return faceCube;
}
	
// Multiply this CubieCube with another cubiecube, restricted to the corners.<br>
// Because we also describe reflections of the whole cube by permutations, we get a complication with the corners. The
// orientations of mirrored corners are described by the numbers 3, 4 and 5. The composition of the orientations
// cannot
// be computed by addition modulo three in the cyclic group C3 any more. Instead the rules below give an addition in
// the dihedral group D3 with 6 elements.<br>
//	 
// NOTE: Because we do not use symmetry reductions and hence no mirrored cubes in this simple implementation of the
// Two-Phase-Algorithm, some code is not necessary here.
//	
CubieCube.prototype.cornerMultiply = function(cubieCube) {
	var cornerPerm = [];
	var cornerOri = [];
	for (var corn in Corner) {
		corn = Corner[corn];
		cornerPerm[corn] = this.cornerPermutation[cubieCube.cornerPermutation[corn]];

		var oriA = this.cornerOrientation[cubieCube.cornerPermutation[corn]];
		var oriB = cubieCube.cornerOrientation[corn];
		var ori = 0;
		
		if (oriA < 3 && oriB < 3) {// if both cubes are regular cubes...
			ori = oriA + oriB; // just do an addition modulo 3 here
			if (ori >= 3) {
				ori -= 3; // the composition is a regular cube
			}
			// +++++++++++++++++++++not used in this implementation +++++++++++++++++++++++++++++++++++
		} else if (oriA < 3 && oriB >= 3) {// if cube cubieCube is in a mirrored
		// state...
			ori = oriA + oriB;
			if (ori >= 6) {
				ori -= 3; // the composition is a mirrored cube
			}
		} else if (oriA >= 3 && oriB < 3) { // if cube a is an a mirrored
		// state...
			ori = oriA - oriB;
			if (ori < 3) {
				ori += 3; // the composition is a mirrored cube
			}
		} else if (oriA >= 3 && oriB >= 3) {// if both cubes are in mirrored
		// states...
			ori = oriA - oriB;
			if (ori < 0) {
				ori += 3; // the composition is a regular cube
			}
			// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
		}
		cornerOri[corn] = ori;
	}
	for (var c in Corner) {
		c = Corner[c];
		this.cornerPermutation[c] = cornerPerm[c];
		this.cornerOrientation[c] = cornerOri[c];
	}
}
		
// Multiply this CubieCube with another cubiecube, restricted to the edges.
CubieCube.prototype.edgeMultiply = function(cubieCube) {
	var edgePerm = [];
	var edgeOri = [];
	for (var edge in Edge) {
		edge = Edge[edge];
		edgePerm[edge] = this.edgePermutation[cubieCube.edgePermutation[edge]];
		edgeOri[edge] = (cubieCube.edgeOrientation[edge] + this.edgeOrientation[cubieCube.edgePermutation[edge]]) % 2;
	}
	for (var e in Edge) {
		e = Edge[e];
		this.edgePermutation[e] = edgePerm[e];
		this.edgeOrientation[e] = edgeOri[e];
	}
}
	
// Multiply this CubieCube with another CubieCube.
CubieCube.prototype.multiply = function(cubieCube) {
	this.cornerMultiply(cubieCube);
	// this.edgeMultiply(cubieCube);
}
	
// Compute the inverse CubieCube
CubieCube.prototype.invCubieCube = function(cubieCube) {
	for (var edge in Edge){
		edge = Edge[edge];
		cubieCube.edgePermutation[this.edgePermutation[edge]] = edge;
	}
	for (var edge in Edge){
		edge = Edge[edge];
		cubieCube.edgeOrientation[edge] = this.edgeOrientation[cubieCube.edgePermutation[edge]];
	}
	for (var corn in Corner) {
		corn = Corner[corn];
		cubieCube.cornerPermutation[this.cornerPermutation[corn]] = corn;
	}
	for (var corn in Corner) {
		corn = Corner[corn];
		var ori = this.cornerOrientation[cubieCube.cornerPermutation[corn]];
		if (ori >= 3) {// Just for completeness. We do not invert mirrored
			// cubes in the program.
			cubieCube.cornerOrientation[corn] = ori;
		}
		else {// the standard case
			cubieCube.cornerOrientation[corn] = -ori;
			if (cubieCube.cornerOrientation[corn] < 0) {
				cubieCube.cornerOrientation[corn] += 3;
			}
		}
	}
}
	
	// ********************************************* Get and set coordinates *********************************************

// return the twist of the 8 corners. 0 <= twist < 3^7
CubieCube.prototype.getTwist = function() {
	var ret = 0;
	for (var i = Corner.URF; i < Corner.DRB; i++) {
		ret = 3 * ret + this.cornerOrientation[i];
	}
	return ret;
}

CubieCube.prototype.setTwist = function(twist) {
	var twistParity = 0;
	for (var i = Corner.DRB - 1; i >= Corner.URF; i--) {
		twistParity += this.cornerOrientation[i] = twist % 3;
		twist = twist / 3 | 0;
	}
	this.cornerOrientation[Corner.DRB] = (3 - twistParity % 3) % 3;
}

// return the flip of the 12 edges. 0<= flip < 2^11
CubieCube.prototype.getFlip = function() {
	var ret = 0;
	for (var i = Edge.UR; i < Edge.BR; i++) {
		ret = 2 * ret + this.edgeOrientation[i];
	}
	return ret;
}

CubieCube.prototype.setFlip = function(flip) {
	var flipParity = 0;
	for (var i = Edge.BR - 1; i >= Edge.UR; i--) {
		flipParity += this.edgeOrientation[i] = flip % 2;
		flip = flip / 2 | 0;
	}
	this.edgeOrientation[Edge.BR] = (2 - flipParity % 2) % 2;
}

// Parity of the corner permutation
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

// permutation of the UD-slice edges FR,FL,BL and BR
CubieCube.prototype.getFRtoBR = function() {
	var a = 0, x = 0;
	var edge4 = new Array(4).fill(0) ;
	// compute the index a < (12 choose 4) and the permutation array perm.
	for (var j = Edge.BR; j >= Edge.UR; j--) {
		if (Edge.FR <= this.edgePermutation[j] && this.edgePermutation[j] <= Edge.BR) {
			a += CubieCube.Cnk(11 - j, x + 1);
			edge4[3 - x++] = this.edgePermutation[j];
		}
	}
	var b = 0;
	for (var j = 3; j > 0; j--) {// compute the index b < 4! for the
	// permutation in perm
		var k = 0;
		while (edge4[j] != j + 8) {
			CubieCube.rotateLeft(edge4, 0, j);
			k++;
		}
		b = (j + 1) * b + k;
	}
	return 24 * a + b;
}

// Permutation of all corners except DBL and DRB
CubieCube.prototype.getURFtoDLF = function() {
	var a = 0, x = 0;
	var corner6 = new Array(6).fill(0);
	// compute the index a < (8 choose 6) and the corner permutation.
	for (var j = Corner.URF; j <= Corner.DRB; j++)
		if (this.cornerPermutation[j] <= Corner.DLF) {
			a += CubieCube.Cnk(j, x + 1);
			corner6[x++] = this.cornerPermutation[j];
		}

	var b = 0;
	for (var j = 5; j > 0; j--) {// compute the index b < 6! for the
	// permutation in corner6
		var k = 0;
		while (corner6[j] != j) {
			CubieCube.rotateLeft(corner6, 0, j);
			k++;
		}
		b = (j + 1) * b + k;
	}
	return 720 * a + b;
}

// Permutation of the six edges UR,UF,UL,UB,DR,DF.
CubieCube.prototype.getURtoDF = function() {
	var a = 0, x = 0;
	var edge6 = new Array(6).fill(0);
	// compute the index a < (12 choose 6) and the edge permutation.
	for (var j = Edge.UR; j <= Edge.BR; j++)
		if (this.edgePermutation[j] <= Edge.DF) {
			a += CubieCube.Cnk(j, x + 1);
			edge6[x++] = this.edgePermutation[j];
		}

	var b = 0;
	for (var j = 5; j > 0; j--) {// compute the index b < 6! for the
	// permutation in edge6
		var k = 0;
		while (edge6[j] != j) {
			CubieCube.rotateLeft(edge6, 0, j);
			k++;
		}
		b = (j + 1) * b + k;
	}
	return 720 * a + b;
}

// Permutation of the three edges UR,UF,UL
CubieCube.prototype.getURtoUL = function() {
	var a = 0, x = 0;
	var edge3 = new Array(3).fill(0);
	// compute the index a < (12 choose 3) and the edge permutation.
	for (var j = Edge.UR; j <= Edge.BR; j++)
		if (this.edgePermutation[j] <= Edge.UL) {
			a += CubieCube.Cnk(j, x + 1);
			edge3[x++] = this.edgePermutation[j];
		}

	var b = 0;
	for (var j = 2; j > 0; j--) {// compute the index b < 3! for the
	// permutation in edge3
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
	var a = idx / 6 | 0; // Combination
	for (var e in Edge) {
		this.edgePermutation[Edge[e]] = Edge.BR;// Use BR to invalidate all edges
	}
	for (var j = 1, k; j < 3; j++) {// generate permutation from index b
		k = b % (j + 1);
		b = b / (j + 1) | 0;
		while (k-- > 0) {
			CubieCube.rotateRight(edge3, 0, j);
		}
	}
	x = 2;// generate combination and set edges
	for (var j = Edge.BR; j >= 0; j--) {
		if (a - CubieCube.Cnk(j, x + 1) >= 0) {
			this.edgePermutation[j] = edge3[x];
			a -= CubieCube.Cnk(j, x-- + 1);
		}
	}
}

// Permutation of the three edges UB,DR,DF
CubieCube.prototype.getUBtoDF = function() {
	var a = 0, x = 0;
	var edge3 = new Array(3).fill(0);
	// compute the index a < (12 choose 3) and the edge permutation.
	for (var j = Edge.UR; j <= Edge.BR; j++) {
		if (Edge.UB <= this.edgePermutation[j] && this.edgePermutation[j] <= Edge.DF) {
			a += CubieCube.Cnk(j, x + 1);
			edge3[x++] = this.edgePermutation[j];
		}
	}
	var b = 0;
	for (var j = 2; j > 0; j--) {// compute the index b < 3! for the
	// permutation in edge3
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
	var a = idx / 6 | 0; // Combination
	for (var e in Edge) {
		this.edgePermutation[Edge[e]] = Edge.BR;// Use BR to invalidate all edges
	}
	for (var j = 1, k; j < 3; j++) {// generate permutation from index b
		k = b % (j + 1);
		b = b / (j + 1) | 0;
		while (k-- > 0) {
			CubieCube.rotateRight(edge3, 0, j);
		}
	}
	x = 2;// generate combination and set edges
	for (var j = Edge.BR; j >= 0; j--) {
		if (a - CubieCube.Cnk(j, x + 1) >= 0) {
			this.edgePermutation[j] = edge3[x];
			a -= CubieCube.Cnk(j, x-- + 1);
		}
	}
}

// Permutation of the six edges UR,UF,UL,UB,DR,DF
CubieCube.prototype.getURtoDF = function(idx1, idx2) {
	var cubeA = new CubieCube();
	var cubeB = new CubieCube();
	cubeA.setURtoUL(idx1);
	cubeB.setUBtoDF(idx2);
	for (var i = 0; i < 8; i++) {
		if (cubeA.edgePermutation[i] != Edge.BR) {
			if (cubeB.edgePermutation[i] != Edge.BR) {// collision
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
	for (var j = 7; j > 0; j--) {// compute the index b < 8! for the permutation in perm
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
	var x = 7;// set corners
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
	var x = 11;// set edges
	for (var j = 11; j >= 0; j--) {
		this.edgePermutation[j] = perm[x--];
	}
}

// Check a cubiecube for solvability. Return the error code.
// 0: Cube is solvable
// -2: Not all 12 edges exist exactly once
// -3: Flip error: One edge has to be flipped
// -4: Not all corners exist exactly once
// -5: Twist error: One corner has to be twisted
// -6: Parity error: Two corners ore two edges have to be exchanged
CubieCube.prototype.verify = function() {
	var sum = 0;
	var edgeCount = new Array(12).fill(0);
	for (var e in Edge) {
		edgeCount[this.edgePermutation[Edge[e]]]++;
	}
	for (var i = 0; i < 12; i++) {
		if (edgeCount[i] != 1) {
			return -2; 
		}
	}
	for (var i = 0; i < 12; i++) {
		sum += this.edgeOrientation[i];
	}
	if (sum % 2 != 0){
		return -3;
	}
	var cornerCount = new Array(8).fill(0);
	for (var c in Corner) {
		cornerCount[this.cornerPermutation[Corner[c]]]++;
	}
	for (var i = 0; i < 8; i++) {
		if (cornerCount[i] != 1) {
			return -4;// missing corners
		}
	}
	sum = 0;
	for (var i = 0; i < 8; i++) {
		sum += this.cornerOrientation[i];
	}
	if (sum % 3 != 0) {
		return -5;// twisted corner
	}
	if ((this.edgeParity() ^ this.cornerParity()) != 0) {
		return -6;// parity error
	}
	return 0;// cube ok
}