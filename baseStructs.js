/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
                 Définitions des composantes d'un cube
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

 
/* Couleurs du cube (= faces: Up, Left, Front, Right, Back, Down) :                *
 *        |* * *|                                                                  *
 *        |* U *|                                                                  *
 *  |* * *|* * *|* * *|* * *|                                                      *
 *  |* L *|* F *|* R *|* B *|                                                      *
 *  |* * *|* * *|* * *|* * *|                                                      *
 *        |* D *|                                                                  *
 *        |* * *|                                                                  */
var Color = {U : "U", R : "R", F : "F", D : "D", L : "L", B : "B"};


/* Couleurs du cube (= faces: Up, Left, Front, Right, Back, Down) :                *
 *           |U1 U2 U3|                                                            *
 *           |U4 U5 U6|                                                            *
 *           |U7 U8 U9|                                                            *
 *  |L1 L2 L3|F1 F2 F3|R1 R2 R3|B1 B2 B3|                                          *
 *  |L4 L5 L6|F4 F5 F6|R4 R5 R6|B4 B5 B6|                                          *
 *  |L7 L8 L9|F7 F8 F9|R7 R8 R9|B7 B8 B9|                                          *
 *           |D1 D2 D3|                                                            *
 *           |D4 D5 D6|                                                            *
 *           |D7 D8 D9|                                                            */
var Facelet = 
{U1 : 0,  U2 : 1,  U3 : 2,  U4 : 3,  U5 : 4,  U6 : 5,  U7 : 6,  U8 : 7,  U9 : 8,
 R1 : 9,  R2 : 10, R3 : 11, R4 : 12, R5 : 13, R6 : 14, R7 : 15, R8 : 16, R9 : 17,
 F1 : 18, F2 : 19, F3 : 20, F4 : 21, F5 : 22, F6 : 23, F7 : 24, F8 : 25, F9 : 26,
 D1 : 27, D2 : 28, D3 : 29, D4 : 30, D5 : 31, D6 : 32, D7 : 33, D8 : 34, D9 : 35,
 L1 : 36, L2 : 37, L3 : 38, L4 : 39, L5 : 40, L6 : 41, L7 : 42, L8 : 43, L9 : 44,
 B1 : 45, B2 : 46, B3 : 47, B4 : 48, B5 : 49, B6 : 50, B7 : 51, B8 : 52, B9 : 53};


/* Arêtes du cube :                                                                *
 *           |** UB **|                                                            *
 *           |UL ** UR|                                                            *
 *           |** UF **|                                                            *
 *  |** UL **|** UF **|** UR **|** UB **|                                          *
 *  |BL ** FL|FL ** FR|FR ** BR|BR ** BL|                                          *
 *  |** DL **|** DF **|** DR **|** DB **|                                          *
 *           |** DF **|                                                            *
 *           |DL ** DR|                                                            *
 *           |** DB **|                                                            */
var Edge = {UR : 0, UF : 1, UL : 2, UB : 3, DR : 4, DF : 5, DL : 6, DB : 7, 
            FR : 8, FL : 9, BL : 10, BR : 11};


/* Coins du cube :                                                                 *
 *              |ULB *** UBR|                                                      *
 *              |*** *** ***|                                                      *
 *              |UFL *** URF|                                                      *
 *  |ULB *** UFL|UFL *** URF|URF *** UBR|UBR *** ULB|                              *
 *  |*** *** ***|*** *** ***|*** *** ***|*** *** ***|                              *
 *  |DBL *** DLF|DLF *** DFR|DFR *** DRB|DRB *** DBL|                              *
 *              |DLF *** DFR|                                                      *
 *              |*** *** ***|                                                      *
 *              |DBL *** DRB|                                                      */
var Corner = {URF : 0, UFL : 1, ULB : 2, UBR : 3, DFR : 4, DLF : 5, DBL : 6, DRB : 7};


/* Mouvements :                                                                    *
 * Chaque coup/mouvement sur le cube est noté par une lettre correspondant à la    *
 * face tournée, et d'un complément pour indiquer l'angle de rotation (' ou 2).    *
 * Par exemple :                                                                   *
 * - L correspond à tourner la face L (gauche) d'un cran dans le sens des          *
 *  aiguilles d'une montre.                                                        *
 * - U2 correspond à tourner la face U (en haut) de 2 crans dans le sens des       *
 *  aiguilles d'une montre.                                                        *
 * - D' correspond à tourner la face D (en bas) d'un cran dans le sens inverse     *
 *  des aiguilles d'une montre (ou de 3 crans dans le sens des aiguilles d'une     *
 *  montre.                                                                        */