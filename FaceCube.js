function FaceCube(cubeString) {
	this.f = typeof subeString !== 'undefined' ? 
		map.call(cubeString, (c)=>Color[c]) 
		: 
		[Color.U, Color.U, Color.U, Color.U, Color.U, Color.U, Color.U, Color.U, Color.U, 
		Color.R, Color.R, Color.R, Color.R, Color.R, Color.R, Color.R, Color.R, Color.R,
		Color.F, Color.F, Color.F, Color.F, Color.F, Color.F, Color.F, Color.F, Color.F, 
		Color.D, Color.D, Color.D, Color.D, Color.D, Color.D, Color.D, Color.D, Color.D, 
		Color.L, Color.L, Color.L, Color.L, Color.L, Color.L, Color.L, Color.L, Color.L, 
		Color.B, Color.B, Color.B, Color.B, Color.B, Color.B, Color.B, Color.B, Color.B];
}

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Map the corner positions to facelet positions. cornerFacelet[URF.ordinal()][0] e.g. gives the position of the
// facelet in the URF corner position, which defines the orientation.<br>
// cornerFacelet[URF.ordinal()][1] and cornerFacelet[URF.ordinal()][2] give the position of the other two facelets
// of the URF corner (clockwise).
FaceCube.cornerFacelet = [ 
	[ Facelet.U9, Facelet.R1, Facelet.F3 ], 
	[ Facelet.U7, Facelet.F1, Facelet.L3 ], 
	[ Facelet.U1, Facelet.L1, Facelet.B3 ], 
	[ Facelet.U3, Facelet.B1, Facelet.R3 ],
	[ Facelet.D3, Facelet.F9, Facelet.R7 ], 
	[ Facelet.D1, Facelet.L9, Facelet.F7 ], 
	[ Facelet.D7, Facelet.B9, Facelet.L7 ], 
	[ Facelet.D9, Facelet.R9, Facelet.B7 ] 
];

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Map the edge positions to facelet positions. edgeFacelet[UR.ordinal()][0] e.g. gives the position of the facelet in
// the UR edge position, which defines the orientation.<br>
// edgeFacelet[UR.ordinal()][1] gives the position of the other facelet
FaceCube.edgeFacelet = [ 
	[ Facelet.U6, Facelet.R2 ], 
	[ Facelet.U8, Facelet.F2 ],
	[ Facelet.U4, Facelet.L2 ], 
	[ Facelet.U2, Facelet.B2 ], 
	[ Facelet.D6, Facelet.R8 ], 
	[ Facelet.D2, Facelet.F8 ],
	[ Facelet.D4, Facelet.L8 ],
	[ Facelet.D8, Facelet.B8 ], 
	[ Facelet.F6, Facelet.R4 ], 
	[ Facelet.F4, Facelet.L6 ],
	[ Facelet.B6, Facelet.L4 ], 
	[ Facelet.B4, Facelet.R6 ] 
];

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Map the corner positions to facelet colors.
FaceCube.cornerColor = [ 
	[ Color.U, Color.R, Color.F ], 
	[ Color.U, Color.F, Color.L ],
	[ Color.U, Color.L, Color.B ], 
	[ Color.U, Color.B, Color.R ], 
	[ Color.D, Color.F, Color.R ], 
	[ Color.D, Color.L, Color.F ],
	[ Color.D, Color.B, Color.L ], 
	[ Color.D, Color.R, Color.B ] 
];

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Map the edge positions to facelet colors.
FaceCube.edgeColor = [ 
	[ Color.U, Color.R ], 
	[ Color.U, Color.F ],
	[ Color.U, Color.L ], 
	[ Color.U, Color.B ], 
	[ Color.D, Color.R ], 
	[ Color.D, Color.F ], 
	[ Color.D, Color.L ], 
	[ Color.D, Color.B ],
	[ Color.F, Color.R ], 
	[ Color.F, Color.L ], 
	[ Color.B, Color.L ], 
	[ Color.B, Color.R ] 
];

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Gives string representation of a facelet cube
FaceCube.prototype.to_String = function() {
	return this.f.join("");
};

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Gives CubieCube representation of a faceletcube
FaceCube.prototype.toCubieCube = function() {
	var ori;
	var cubieCube = new CubieCube();
	for (var i = 0; i < 8; i++) {
		cubieCube.cornerPermutation[i] = Corner.URF;// invalidate corners
	}
	for (var i = 0; i < 12; i++) {
		cubieCube.edgePermutation[i] = Edge.UR;// and edges
	}
	var col1, col2;
	for (var i in Corner) {
		i = Corner[i];
		// get the colors of the cubie at corner i, starting with U/D
		for (ori = 0; ori < 3; ori++) {
			if (this.f[FaceCube.cornerFacelet[i][ori]] == Color.U || this.f[FaceCube.cornerFacelet[i][ori]] == Color.D) {
				break;
			}
		}
		col1 = this.f[FaceCube.cornerFacelet[i][(ori + 1) % 3]];
		col2 = this.f[FaceCube.cornerFacelet[i][(ori + 2) % 3]];

		for (var j in Corner) {
			j = Corner[j];
			if (col1 == FaceCube.cornerColor[j][1] && col2 == FaceCube.cornerColor[j][2]) {
				// in cornerposition i we have cornercubie j
				cubieCube.cornerPermutation[i] = j;
				cubieCube.cornerOrientation[i] = ori % 3;
				break;
			}
		}
	}
	for (var i in Edge) {
		i = Edge[i];
		for (var j in Edge) {
			j = Edge[j];
			if (this.f[FaceCube.edgeFacelet[i][0]] == FaceCube.edgeColor[j][0] 
				&& this.f[FaceCube.edgeFacelet[i][1]] == FaceCube.edgeColor[j][1]) {
				cubieCube.edgePermutation[i] = j;
				cubieCube.edgeOrientation[i] = 0;
				break;
			}
			if (this.f[FaceCube.edgeFacelet[i][0]] == FaceCube.edgeColor[j][1]
					&& this.f[FaceCube.edgeFacelet[i][1]] == FaceCube.edgeColor[j][0]) {
				cubieCube.edgePermutation[i] = j;
				cubieCube.edgeOrientation[i] = 1;
				break;
			}
		}
	}
	return cubieCube;
};
