/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
    FaceCube représente un cube par toutes ses facettes :
                     |U1 U2 U3|
                     |U4 U5 U6|
            		 |U7 U8 U9|
            |L1 L2 L3|F1 F2 F3|R1 R2 R3|B1 B2 B3|
            |L4 L5 L6|F4 F5 F6|R4 R5 R6|B4 B5 B6|
            |L7 L8 L9|F7 F8 F9|R7 R8 R9|B7 B8 B9|
                     |D1 D2 D3|
                     |D4 D5 D6|
            		 |D7 D8 D9|
    		 
    C'est un tableau de la forme :
            [U1, U2, U3, U4, U5, U6, U7, U8, U9,
             R1, R2, R3, R4, R5, R6, R7, R8, R9,
             F1, F2, F3, F4, F5, F6, F7, F8, F9,
             D1, D2, D3, D4, D5, D6, D7, D8, D9,
             L1, L2, L3, L4, L5, L6, L7, L8, L9,
             B1, B2, B3, B4, B5, B6, B7, B8, B9]
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */



/* Constructeur de FaceCube.                                                       *
 * Crée le FaceCube représenté par la chaine de caractère passée en paramètre,     *
 * ou un cube non mélangé par défault.                                             */
function FaceCube(cubeString) {
	this.f = typeof cubeString !== 'undefined' ? cubeString.split('')
		: // Par defaut
		[Color.U, Color.U, Color.U, Color.U, Color.U, Color.U, Color.U, Color.U, Color.U, 
		Color.R, Color.R, Color.R, Color.R, Color.R, Color.R, Color.R, Color.R, Color.R,
		Color.F, Color.F, Color.F, Color.F, Color.F, Color.F, Color.F, Color.F, Color.F, 
		Color.D, Color.D, Color.D, Color.D, Color.D, Color.D, Color.D, Color.D, Color.D, 
		Color.L, Color.L, Color.L, Color.L, Color.L, Color.L, Color.L, Color.L, Color.L, 
		Color.B, Color.B, Color.B, Color.B, Color.B, Color.B, Color.B, Color.B, Color.B];
}

/* Fait correspondre la position des coins par rapport aux positions des facettes. *
 * Par exemple, cornerFacelet[URF][0] donne la position de la facette à la         *
 * position du coin URF, qui correspond à l'orientation.                           *
 * cornerFacelet[URF][1] et cornerFacelet[URF][2] donne la position des 2 autres   *
 * facettes du coin URF (dans le sens des aiguilles d'un montre)                   */
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


/* Fait correspondre la position des arêtes par rapport aux positions des facettes.*
 * Par exemple, edgeFacelet[UR][0] donne la position de la facette à la position   *
 * de l'arête UR, qui correspond à l'orientation.                                  *
 * edgeFacelet[URF][1] donne la position de l'autre                                */
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


/* Fait correspondre la position des coins par rapport aux couleurs des facettes.  */
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


/* Fait correspondre la position des arêtes par rapport aux couleurs des facettes. */
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

/* Donne la représentation du cube en chaîne de caractères.                        */
FaceCube.prototype.to_String = function() {
	return this.f.join("");
};


/* Donne la représentation en CubieCube du cube                                    */
FaceCube.prototype.toCubieCube = function() {
	var ori;
	var cubieCube = new CubieCube();
	for (var i = 0; i < 8; i++) {
		cubieCube.cornerPermutation[i] = Corner.URF;// Reset les coins du CubieCube
	}
	for (var i = 0; i < 12; i++) {
		cubieCube.edgePermutation[i] = Edge.UR;// et les angles également
	}
	var col1, col2;
	// On récupère les coins
	for (var i in Corner) {
		i = Corner[i];
		// On récupère les couleurs du Cubie au coin i, en commençant par UD
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
				// A la position du coin i, nous avons le coin j
				cubieCube.cornerPermutation[i] = j;
				cubieCube.cornerOrientation[i] = ori % 3;
				break;
			}
		}
	}
	// On récupère les arêtes
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
