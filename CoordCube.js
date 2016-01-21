var CoordCube = function(cubieCube) {
	if (typeof cubieCube !== 'undefined') {
		this.twist = c.getTwist();
		this.flip = c.getFlip();
		this.parity = c.cornerParity();
		this.FRtoBR = c.getFRtoBR();
		this.URFtoDLF = c.getURFtoDLF();
		this.URtoUL = c.getURtoUL();
		this.UBtoDF = c.getUBtoDF();
		this.URtoDF = c.getURtoDF();
	} else {
		this.twist = undefined;
		this.flip = undefined;
		this.parity = undefined;
		this.FRtoBR = undefined;
		this.URFtoDLF = undefined;
		this.URtoUL = undefined;
		this.UBtoDF = undefined;
		this.URtoDF = undefined;
	}
}

CoordCube.N_TWIST = 2187;// 3^7 possible corner orientations
CoordCube.N_FLIP = 2048;// 2^11 possible edge flips
CoordCube.N_SLICE1 = 495;// 12 choose 4 possible positions of FR,FL,BL,BR edges
CoordCube.N_SLICE2 = 24;// 4! permutations of FR,FL,BL,BR edges in phase2
CoordCube.N_PARITY = 2; // 2 possible corner parities
CoordCube.N_URFtoDLF = 20160;// 8!/(8-6)! permutation of URF,UFL,ULB,UBR,DFR,DLF corners
CoordCube.N_FRtoBR = 11880; // 12!/(12-4)! permutation of FR,FL,BL,BR edges
CoordCube.N_URtoUL = 1320; // 12!/(12-3)! permutation of UR,UF,UL edges
CoordCube.N_UBtoDF = 1320; // 12!/(12-3)! permutation of UB,DR,DF edges
CoordCube.N_URtoDF = 20160; // 8!/(8-6)! permutation of UR,UF,UL,UB,DR,DF edges in phase2

CoordCube.N_URFtoDLB = 40320;// 8! permutations of the corners
CoordCube.N_URtoBR = 479001600;// 8! permutations of the corners

CoordCube.N_MOVE = 18;


// A move on the coordinate level
CoordCube.prototype.move = function(m) {
	this.twist = CoordCube.twistMove[this.twist][m];
	this.flip = CoordCube.flipMove[this.flip][m];
	this.parity = CoordCube.parityMove[this.parity][m];
	this.FRtoBR = CoordCube.FRtoBR_Move[this.FRtoBR][m];
	this.URFtoDLF = CoordCube.URFtoDLF_Move[this.URFtoDLF][m];
	this.URtoUL = CoordCube.URtoUL_Move[this.URtoUL][m];
	this.UBtoDF = CoordCube.UBtoDF_Move[this.UBtoDF][m];
	if (this.URtoUL < 336 && this.UBtoDF < 336) {// updated only if UR,UF,UL,UB,DR,DF
		// are not in UD-slice
		this.URtoDF = CoordCube.MergeURtoULandUBtoDF[this.URtoUL][this.UBtoDF];
	}
}

// ******************************************Phase 1 move tables*****************************************************

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Move table for the twists of the corners
// twist < 2187 in phase 2.
// twist = 0 in phase 2.
CoordCube.twistMove = [];
var a = new CubieCube();
for (var i = 0; i < CoordCube.N_TWIST; i++) {
	a.setTwist(i);
	CoordCube.twistMove[i] = [];
	for (var j = 0; j < 6; j++) {
		for (var k = 0; k < 3; k++) {
			a.cornerMultiply(CubieCube.moveCube[j]);
			CoordCube.twistMove[i][3 * j + k] = a.getTwist();
		}
		a.cornerMultiply(CubieCube.moveCube[j]);// 4. faceturn restores
		// a
	}
}

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Move table for the flips of the edges
// flip < 2048 in phase 1
// flip = 0 in phase 2.
CoordCube.flipMove = [];
var a = new CubieCube();
for (var i = 0; i < CoordCube.N_FLIP; i++) {
	a.setFlip(i);
	CoordCube.flipMove[i] = [];
	for (var j = 0; j < 6; j++) {
		for (var k = 0; k < 3; k++) {
			a.edgeMultiply(CubieCube.moveCube[j]);
			CoordCube.flipMove[i][3 * j + k] = a.getFlip();
		}
		a.edgeMultiply(CubieCube.moveCube[j]);
		// a
	}
}


// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Parity of the corner permutation. This is the same as the parity for the edge permutation of a valid cube.
// parity has values 0 and 1
CoordCube.parityMove = [
	[1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1],
	[0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]
];

// ***********************************Phase 1 and 2 movetable********************************************************

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Move table for the four UD-slice edges FR, FL, Bl and BR
// FRtoBRMove < 11880 in phase 1
// FRtoBRMove < 24 in phase 2
// FRtoBRMove = 0 for solved cube
CoordCube.FRtoBR_Move = [];
var a = new CubieCube();
for (var i = 0; i < CoordCube.N_FRtoBR; i++) {
	a.setFRtoBR(i);
	CoordCube.FRtoBR_Move[i] = [];
	for (var j = 0; j < 6; j++) {
		for (var k = 0; k < 3; k++) {
			a.edgeMultiply(CubieCube.moveCube[j]);
			CoordCube.FRtoBR_Move[i][3 * j + k] = a.getFRtoBR();
		}
		a.edgeMultiply(CubieCube.moveCube[j]);
	}
}


// *******************************************Phase 1 and 2 movetable************************************************

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Move table for permutation of six corners. The positions of the DBL and DRB corners are determined by the parity.
// URFtoDLF < 20160 in phase 1
// URFtoDLF < 20160 in phase 2
// URFtoDLF = 0 for solved cube.
CoordCube.URFtoDLF_Move = [];
var a = new CubieCube();
for (var i = 0; i < CoordCube.N_URFtoDLF; i++) {
	a.setURFtoDLF(i);
	CoordCube.URFtoDLF_Move[i] = [];
	for (var j = 0; j < 6; j++) {
		for (var k = 0; k < 3; k++) {
			a.cornerMultiply(CubieCube.moveCube[j]);
			CoordCube.URFtoDLF_Move[i][3 * j + k] = a.getURFtoDLF();
		}
		a.cornerMultiply(CubieCube.moveCube[j]);
	}
}


// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Move table for the permutation of six U-face and D-face edges in phase2. The positions of the DL and DB edges are
// determined by the parity.
// URtoDF < 665280 in phase 1
// URtoDF < 20160 in phase 2
// URtoDF = 0 for solved cube.
CoordCube.URtoDF_Move = [];
var a = new CubieCube();
for (var i = 0; i < CoordCube.N_URtoDF; i++) {
	a.setURtoDF(i);
	CoordCube.URtoDF_Move[i] = [];
	for (var j = 0; j < 6; j++) {
		for (var k = 0; k < 3; k++) {
			a.edgeMultiply(CubieCube.moveCube[j]);
			CoordCube.URtoDF_Move[i][3 * j + k] = a.getURtoDF();
			// Table values are only valid for phase 2 moves!
			// For phase 1 moves, casting to short is not possible.
		}
		a.edgeMultiply(CubieCube.moveCube[j]);
	}
}


// **************************helper move tables to compute URtoDF for the beginning of phase2************************

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Move table for the three edges UR,UF and UL in phase1.
CoordCube.URtoUL_Move = [];
var a = new CubieCube();
for (var i = 0; i < CoordCube.N_URtoUL; i++) {
	a.setURtoUL(i);
	CoordCube.URtoUL_Move[i] = [];
	for (var j = 0; j < 6; j++) {
		for (var k = 0; k < 3; k++) {
			a.edgeMultiply(CubieCube.moveCube[j]);
			CoordCube.URtoUL_Move[i][3 * j + k] = a.getURtoUL();
		}
		a.edgeMultiply(CubieCube.moveCube[j]);
	}
}

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Move table for the three edges UB,DR and DF in phase1.
CoordCube.UBtoDF_Move = [];
var a = new CubieCube();
for (var i = 0; i < CoordCube.N_UBtoDF; i++) {
	a.setUBtoDF(i);
	CoordCube.UBtoDF_Move[i] = [];
	for (var j = 0; j < 6; j++) {
		for (var k = 0; k < 3; k++) {
			a.edgeMultiply(CubieCube.moveCube[j]);
			CoordCube.UBtoDF_Move[i][3 * j + k] = a.getUBtoDF();
		}
		a.edgeMultiply(CubieCube.moveCube[j]);
	}
}

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Table to merge the coordinates of the UR,UF,UL and UB,DR,DF edges at the beginning of phase2
CoordCube.MergeURtoULandUBtoDF = [];
// for i, j <336 the six edges UR,UF,UL,UB,DR,DF are not in the
// UD-slice and the index is <20160
for (var uRtoUL = 0; uRtoUL < 336; uRtoUL++) {
	for (var uBtoDF = 0; uBtoDF < 336; uBtoDF++) {
		CoordCube.MergeURtoULandUBtoDF[uRtoUL][uBtoDF] = CubieCube.getURtoDF(uRtoUL, uBtoDF);
	}
}

// ****************************************Pruning tables for the search*********************************************

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Pruning table for the permutation of the corners and the UD-slice edges in phase2.
// The pruning table entries give a lower estimation for the number of moves to reach the solved cube.
CoordCube.Slice_URFtoDLF_Parity_Prun = [];
for (var i = 0; i < CoordCube.N_SLICE2 * CoordCube.N_URFtoDLF * CoordCube.N_PARITY / 2; i++) {
	CoordCube.Slice_URFtoDLF_Parity_Prun[i] = -1;
}
var depth = 0;
CoordCube.setPruning(CoordCube.Slice_URFtoDLF_Parity_Prun, 0, 0);
var done = 1;
while (done != CoordCube.N_SLICE2 * CoordCube.N_URFtoDLF * CoordCube.N_PARITY) {
	for (var i = 0; i < CoordCube.N_SLICE2 * CoordCube.N_URFtoDLF * CoordCube.N_PARITY; i++) {
		var parity = i % 2;
		var URFtoDLF = (i / 2) / CoordCube.N_SLICE2;
		var slice = (i / 2) % CoordCube.N_SLICE2;
		if (CoordCube.getPruning(CoordCube.Slice_URFtoDLF_Parity_Prun, i) == depth) {
			for (var j = 0; j < 18; j++) {
				switch (j) {
				case 3:
				case 5:
				case 6:
				case 8:
				case 12:
				case 14:
				case 15:
				case 17:
					continue;
				default:
					var newSlice = CoordCube.FRtoBR_Move[slice][j];
					var newURFtoDLF = CoordCube.URFtoDLF_Move[URFtoDLF][j];
					var newParity = CoordCube.parityMove[parity][j];
					if (CoordCube.getPruning(CoordCube.Slice_URFtoDLF_Parity_Prun, (CoordCube.N_SLICE2 * newURFtoDLF + newSlice) * 2 + newParity) == 0x0f) {
						CoordCube.setPruning(CoordCube.Slice_URFtoDLF_Parity_Prun, (CoordCube.N_SLICE2 * newURFtoDLF + newSlice) * 2 + newParity,(depth + 1));
						done++;
					}
				}
			}
		}
	}
	depth++;
}


// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Pruning table for the permutation of the edges in phase2.
// The pruning table entries give a lower estimation for the number of moves to reach the solved cube.
CoordCube.Slice_URtoDF_Parity_Prun = [];
for (var i = 0; i < CoordCube.N_SLICE2 * CoordCube.N_URtoDF * CoordCube.N_PARITY / 2; i++) {
	CoordCube.Slice_URtoDF_Parity_Prun[i] = -1;
}
var depth = 0;
CoordCube.setPruning(CoordCube.Slice_URtoDF_Parity_Prun, 0, 0);
var done = 1;
while (done != CoordCube.N_SLICE2 * CoordCube.N_URtoDF * CoordCube.N_PARITY) {
	for (var i = 0; i < CoordCube.N_SLICE2 * CoordCube.N_URtoDF * CoordCube.N_PARITY; i++) {
		var parity = i % 2;
		var URtoDF = (i / 2) / CoordCube.N_SLICE2;
		var slice = (i / 2) % CoordCube.N_SLICE2;
		if (CoordCube.getPruning(CoordCube.Slice_URtoDF_Parity_Prun, i) == depth) {
			for (var j = 0; j < 18; j++) {
				switch (j) {
				case 3:
				case 5:
				case 6:
				case 8:
				case 12:
				case 14:
				case 15:
				case 17:
					continue;
				default:
					var newSlice = CoordCube.FRtoBR_Move[slice][j];
					var newURtoDF = CoordCube.URtoDF_Move[URtoDF][j];
					var newParity = CoordCube.parityMove[parity][j];
					if (CoordCube.getPruning(CoordCube.Slice_URtoDF_Parity_Prun, (CoordCube.N_SLICE2 * newURtoDF + newSlice) * 2 + newParity) == 0x0f) {
						CoordCube.setPruning(CoordCube.Slice_URtoDF_Parity_Prun, (CoordCube.N_SLICE2 * newURtoDF + newSlice) * 2 + newParity, (depth + 1));
						done++;
					}
				}
			}
		}
	}
	depth++;
}

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Pruning table for the twist of the corners and the position (not permutation) of the UD-slice edges in phase1
// The pruning table entries give a lower estimation for the number of moves to reach the H-subgroup.
CoordCube.Slice_Twist_Prun = [];
for (var i = 0; i < CoordCube.N_SLICE1 * CoordCube.N_TWIST / 2 + 1; i++) {
	CoordCube.Slice_Twist_Prun[i] = -1;
}
var depth = 0;
CoordCube.setPruning(CoordCube.Slice_Twist_Prun, 0, 0);
var done = 1;
while (done != CoordCube.N_SLICE1 * CoordCube.N_TWIST) {
	for (var i = 0; i < CoordCube.N_SLICE1 * CoordCube.N_TWIST; i++) {
		var twist = i / CoordCube.N_SLICE1, slice = i % CoordCube.N_SLICE1;
		if (CoordCube.getPruning(CoordCube.Slice_Twist_Prun, i) == depth) {
			for (var j = 0; j < 18; j++) {
				var newSlice = CoordCube.FRtoBR_Move[slice * 24][j] / 24;
				var newTwist = CoordCube.twistMove[twist][j];
				if (CoordCube.getPruning(CoordCube.Slice_Twist_Prun, CoordCube.N_SLICE1 * newTwist + newSlice) == 0x0f) {
					CoordCube.setPruning(CoordCube.Slice_Twist_Prun, CoordCube.N_SLICE1 * newTwist + newSlice, (depth + 1));
					done++;
				}
			}
		}
	}
	depth++;
}


// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Pruning table for the flip of the edges and the position (not permutation) of the UD-slice edges in phase1
// The pruning table entries give a lower estimation for the number of moves to reach the H-subgroup.
CoordCube.Slice_Flip_Prun = [];
for (var i = 0; i < CoordCube.N_SLICE1 * CoordCube.N_FLIP / 2; i++) {
	CoordCube.Slice_Flip_Prun[i] = -1;
}
var depth = 0;
CoordCube.setPruning(CoordCube.Slice_Flip_Prun, 0, 0);
var done = 1;
while (done != CoordCube.N_SLICE1 * CoordCube.N_FLIP) {
	for (var i = 0; i < CoordCube.N_SLICE1 * CoordCube.N_FLIP; i++) {
		var flip = i / CoordCube.N_SLICE1, slice = i % CoordCube.N_SLICE1;
		if (CoordCube.getPruning(CoordCube.Slice_Flip_Prun, i) == depth) {
			for (var j = 0; j < 18; j++) {
				var newSlice = CoordCube.FRtoBR_Move[slice * 24][j] / 24;
				var newFlip = CoordCube.flipMove[flip][j];
				if (CoordCube.getPruning(CoordCube.Slice_Flip_Prun, CoordCube.N_SLICE1 * newFlip + newSlice) == 0x0f) {
					CoordCube.setPruning(CoordCube.Slice_Flip_Prun, CoordCube.N_SLICE1 * newFlip + newSlice, (depth + 1));
					done++;
				}
			}
		}
	}
	depth++;
}

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Set pruning value in table. Two values are stored in one byte.
CoordCube.setPruning = function(table, index, value) {
	if ((index & 1) == 0) {
		table[index / 2] &= 0xf0 | value;
	} else {
		table[index / 2] &= 0x0f | (value << 4);
	}
}

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Extract pruning value
CoordCube.getPruning = function(table, index) {
	if ((index & 1) == 0) {
		return (table[index / 2] & 0x0f);
	} else {
		return ((table[index / 2] & 0xf0) >>> 4);
	}
}

