function mat(a, b){
	return Array(a).fill(0).map(()=>Array(b).fill(0));
}

var Util = new function() {
	// Mouvements
	this.Ux1 = 0;
	this.Ux2 = 1;
	this.Ux3 = 2;
	this.Rx1 = 3;
	this.Rx2 = 4;
	this.Rx3 = 5;
	this.Fx1 = 6;
	this.Fx2 = 7;
	this.Fx3 = 8;
	this.Dx1 = 9;
	this.Dx2 = 10;
	this.Dx3 = 11;
	this.Lx1 = 12;
	this.Lx2 = 13;
	this.Lx3 = 14;
	this.Bx1 = 15;
	this.Bx2 = 16;
	this.Bx3 = 17;

	//Facelettes
	this.U1 = 0;
	this.U2 = 1;
	this.U3 = 2;
	this.U4 = 3;
	this.U5 = 4;
	this.U6 = 5;
	this.U7 = 6;
	this.U8 = 7;
	this.U9 = 8;
	this.R1 = 9;
	this.R2 = 10;
	this.R3 = 11;
	this.R4 = 12;
	this.R5 = 13;
	this.R6 = 14;
	this.R7 = 15;
	this.R8 = 16;
	this.R9 = 17;
	this.F1 = 18;
	this.F2 = 19;
	this.F3 = 20;
	this.F4 = 21;
	this.F5 = 22;
	this.F6 = 23;
	this.F7 = 24;
	this.F8 = 25;
	this.F9 = 26;
	this.D1 = 27;
	this.D2 = 28;
	this.D3 = 29;
	this.D4 = 30;
	this.D5 = 31;
	this.D6 = 32;
	this.D7 = 33;
	this.D8 = 34;
	this.D9 = 35;
	this.L1 = 36;
	this.L2 = 37;
	this.L3 = 38;
	this.L4 = 39;
	this.L5 = 40;
	this.L6 = 41;
	this.L7 = 42;
	this.L8 = 43;
	this.L9 = 44;
	this.B1 = 45;
	this.B2 = 46;
	this.B3 = 47;
	this.B4 = 48;
	this.B5 = 49;
	this.B6 = 50;
	this.B7 = 51;
	this.B8 = 52;
	this.B9 = 53;

	// Couleurs
	this.U = 0;
	this.R = 1;
	this.F = 2;
	this.D = 3;
	this.L = 4;
	this.B = 5;

	// Coins
	this.cornerFacelet = new Int8Array([
		[ this.U9, this.R1, this.F3 ], [ this.U7, this.F1, this.L3 ], [ this.U1, this.L1, this.B3 ], [ this.U3, this.B1, this.R3 ],
		[ this.D3, this.F9, this.R7 ], [ this.D1, this.L9, this.F7 ], [ this.D7, this.B9, this.L7 ], [ this.D9, this.R9, this.B7 ]
	]);
	
	// Angles
	this.edgeFacelet = new Int8Array([
		[ this.U6, this.R2 ], [ this.U8, this.F2 ], [ this.U4, this.L2 ], [ this.U2, this.B2 ], [ this.D6, this.R8 ], [ this.D2, this.F8 ],
		[ this.D4, this.L8 ], [ this.D8, this.B8 ], [ this.F6, this.R4 ], [ this.F4, this.L6 ], [ this.B6, this.L4 ], [ this.B4, this.R6 ]
	]);

	this.Cnk = mat(13, 13);
	this.fact = new Array(14);
	this.permMult = mat(24, 24);
	this.move2str = [
		"U ", "U2", "U'", "R ", "R2", "R'", "F ", "F2", "F'",
		"D ", "D2", "D'", "L ", "L2", "L'", "B ", "B2", "B'"
	];
	this.preMove = [ -1, this.Rx1, this.Rx3, this.Fx1, this.Fx3, this.Lx1, this.Lx3, this.Bx1, this.Bx3];
	this.ud2std = [this.Ux1, this.Ux2, this.Ux3, this.Rx2, this.Fx2, this.Dx1, this.Dx2, this.Dx3, this.Lx2, this.Bx2];
	this.std2ud = new Array(18);
	this.ckmv2 = mat(11, 10);

	/*
	Transforme un array en CubieCube (ccRet : CubieCube résultat)
	*/
	this.toCubieCube = function(f, ccRet) {
		var ori;
		for (var i = 0; i < 8; i++) {
			ccRet.ca[i] = 0;// invalidate corners
		}
		for (var i = 0; i < 12; i++) {
			ccRet.ea[i] = 0;// and edges
		}
		var col1, col2;
		for (var i = 0; i < 8; i++) {
			// get the colors of the cubie at corner i, starting with U/D
			for (ori = 0; ori < 3; ori++) {
				if (f[this.cornerFacelet[i][ori]] == this.U || f[this.cornerFacelet[i][ori]] == this.D) {
					break;
				}
			}
			col1 = f[this.cornerFacelet[i][(ori + 1) % 3]];
			col2 = f[this.cornerFacelet[i][(ori + 2) % 3]];

			for (var j = 0; j < 8; j++) {
				if (col1 == this.cornerFacelet[j][1] / 9 && col2 == this.cornerFacelet[j][2] / 9) {
					// in cornerposition i we have cornercubie j
					ccRet.ca[i] = ori % 3 << 3 | j;
					break;
				}
			}
		}
		for (var i = 0; i < 12; i++) {
			for (var j = 0; j < 12; j++) {
				if (f[this.edgeFacelet[i][0]] == this.edgeFacelet[j][0] / 9	&& f[this.edgeFacelet[i][1]] == this.edgeFacelet[j][1] / 9) {
					ccRet.ea[i] = j << 1;
					break;
				}
				if (f[this.edgeFacelet[i][0]] == this.edgeFacelet[j][1] / 9	&& f[this.edgeFacelet[i][1]] == this.edgeFacelet[j][0] / 9) {
					ccRet.ea[i] = j << 1 | 1;
					break;
				}
			}
		}
	};

	/*
	Retourne le cube sous forme d'une string
	*/
	this.toFaceCube = function(cubiecube) {
		var f = new Array(54);
		var ts = ['U', 'R', 'F', 'D', 'L', 'B'];
		for (var i = 0; i < 54; i++) {
			f[i] = ts[i / 9];
		}
		for (var c = 0; c < 8; c++) {
			var j = cubiecube.ca[c] & 0x7;// cornercubie with index j is at
			// cornerposition with index c
			var ori = cubiecube.ca[c] >> 3;// Orientation of this cubie
			for (var n = 0; n < 3; n++)
				f[this.cornerFacelet[c][(n + ori) % 3]] = ts[this.cornerFacelet[j][n] / 9];
		}
		for (var e = 0; e < 12; e++) {
			var j = cubiecube.ea[e] >> 1;// edgecubie with index j is at edgeposition
			// with index e
			var ori = cubiecube.ea[e] & 1;// Orientation of this cubie
			for (var n = 0; n < 2; n++) {
				f[this.edgeFacelet[e][(n + ori) % 2]] = ts[this.edgeFacelet[j][n] / 9];
			}
		}
		return f.join("");
	};

	this.getNParity = function(idx, n) {
		var p = 0;
		for (var i = n - 2; i >= 0; i--) {
			p ^= idx % (n - i);
			idx /= (n - i);
		}
		return p & 1;
	};

	this.setVal = function(val0, val, isEdge) {
		return isEdge ? (val << 1 | val0 & 1) : (val | val0 & 0xf8);
	};

	this.getVal = function(val0, isEdge) {
		return isEdge ? val0 >> 1 : val0 & 7;
	};

	this.set8Perm = function(arr, idx, isEdge) {
		var val = 0x76543210;
		for (var i = 0; i < 7; i++) {
			var p = this.fact[7 - i];
			var v = idx / p;
			idx -= v * p;
			v <<= 2;
			arr[i] = this.setVal(arr[i], (val >> v & 0x7), isEdge);
			var m = (1 << v) - 1;
			val = val & m | val >> 4 & ~m;
		}
		arr[7] = this.setVal(arr[7], val, isEdge);
	};

	this.get8Perm = function(arr, isEdge) {
		var idx = 0;
		var val = 0x76543210;
		for (var i = 0; i < 7; i++) {
			var v = this.getVal(arr[i], isEdge) << 2;
			idx = (8 - i) * idx + (val >> v & 0x7);
			val -= 0x11111110 << v;
		}
		return idx;
	};

	this.setNPerm = function(arr, idx, n, isEdge) {
		arr[n - 1] = this.setVal(arr[n - 1], 0, isEdge);
		for (var i = n - 2; i >= 0; i--) {
			var arri = idx % (n - i);
			arr[i] = this.setVal(arr[i], arri, isEdge);
			idx /= (n - i);
			for (var j = i + 1; j < n; j++) {
				var arrj = this.getVal(arr[j], isEdge);
				if (arrj >= arri) {
					arr[j] = this.setVal(arr[j], ++arrj, isEdge);
				}
			}
		}
	};

	this.getNPerm = function(arr, n, isEdge) {
		var idx = 0;
		for (var i = 0; i < n; i++) {
			idx *= (n - i);
			var arri = this.getVal(arr[i], isEdge);
			for (var j = i + 1; j < n; j++) {
				var arrj = this.getVal(arr[j], isEdge);
				if (arrj < arri) {
					idx++;
				}
			}
		}
		return idx;
	};

	this.getComb = function(arr, mask, isEdge) {
		var end = arr.length - 1;
		var idxC = 0, idxP = 0, r = 4, val = 0x0123;
		for (var i = end; i >= 0; i--) {
			var perm = this.getVal(arr[i], isEdge);
			if ((perm & 0xc) == mask) {
				var v = (perm & 3) << 2;
				idxP = r * idxP + (val >> v & 0xf);
				val -= 0x0111 >> (12 - v);
				idxC += this.Cnk[i][r--];
			}
		}
		return idxP << 9 | this.Cnk[arr.length][4] - 1 - idxC;
	}

	this.setComb = function(arr, idx, mask, isEdge) {
		var end = arr.length - 1;
		var r = 4, fill = end, val = 0x0123;
		var idxC = this.Cnk[arr.length][4] - 1 - (idx & 0x1ff);
		var idxP = idx >> 9;
		for (var i = end; i >= 0; i--) {
			if (idxC >= this.Cnk[i][r]) {
				idxC -= this.Cnk[i][r--];
				var p = this.fact[r];
				var v = idxP / p << 2;
				idxP %= p;
				arr[i] = this.setVal(arr[i], val >> v & 3 | mask, isEdge);
				var m = (1 << v) - 1;
				val = val & m | val >> 4 & ~m;
			} else {
				if ((fill & 0xc) == mask) {
					fill -= 4;
				}
				arr[i] = this.setVal(arr[i], fill--, isEdge);
			}
		}
	}

	this.init = function(){
		for (var i = 0; i < 10; i++) {
			this.std2ud[this.ud2std[i]] = i;
		}
		for (var i = 0; i < 10; i++) {
			var ix = this.ud2std[i];
			for (var j = 0; j < 10; j++) {
				var jx = this.ud2std[j];
				this.ckmv2[i][j] = (ix / 3 == jx / 3) || ((ix / 3 % 3 == jx / 3 % 3) && (ix >= jx));
			}
			this.ckmv2[10][i] = false;
		}
		this.fact[0] = 1;
		for (var i = 0; i < 13; i++) {
			this.Cnk[i][0] = this.Cnk[i][i] = 1;
			this.fact[i + 1] = this.fact[i] * (i + 1);
			for (var j = 1; j < i; j++) {
				this.Cnk[i][j] = this.Cnk[i - 1][j - 1] + this.Cnk[i - 1][j];
			}
		}
		var arr1 = new Int8Array(4);
		var arr2 = new Int8Array(4);
		var arr3 = new Int8Array(4);
		for (var i = 0; i < 24; i++) {
			this.setNPerm(arr1, i, 4, false);
			for (var j = 0; j < 24; j++) {
				this.setNPerm(arr2, j, 4, false);
				for (var k = 0; k < 4; k++) {
					arr3[k] = arr1[arr2[k]];
				}
				this.permMult[i][j] = this.getNPerm(arr3, 4, false);
			}
		}
	}
}
Util.init();