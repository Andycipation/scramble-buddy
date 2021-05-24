"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getScramble = exports.makeImage = void 0;
const Jimp = require("jimp");
const fs = require("fs");
const util_1 = require("./util");
const config_1 = require("../config");
const S = 32;
const LIGHT = 3;
const HEAVY = 7;
const SIDES = ['U', 'L', 'F', 'R', 'B', 'D'];
const DIR = ['', '2', "'"];
const COLORS = [
    0xf9f6f7ff,
    0xfc8621ff,
    0x4fa54cff,
    0xec0101ff,
    0x0e49b5ff,
    0xcad315ff,
];
const CYCLES = [
    [
        [0, 2, 4, 6],
        [1, 3, 5, 7],
        [8, 32, 24, 16],
        [9, 33, 25, 17],
        [10, 34, 26, 18],
    ],
    [
        [8, 10, 12, 14],
        [9, 11, 13, 15],
        [0, 16, 40, 36],
        [7, 23, 47, 35],
        [6, 22, 46, 34],
    ],
    [
        [16, 18, 20, 22],
        [17, 19, 21, 23],
        [4, 30, 40, 10],
        [5, 31, 41, 11],
        [6, 24, 42, 12],
    ],
    [
        [24, 26, 28, 30],
        [25, 27, 29, 31],
        [2, 38, 42, 18],
        [3, 39, 43, 19],
        [4, 32, 44, 20],
    ],
    [
        [32, 34, 36, 38],
        [33, 35, 37, 39],
        [0, 14, 44, 26],
        [1, 15, 45, 27],
        [2, 8, 46, 28],
    ],
    [
        [40, 42, 44, 46],
        [41, 43, 45, 47],
        [12, 20, 28, 36],
        [13, 21, 29, 37],
        [14, 22, 30, 38],
    ],
];
const OPPOSITE_FACE = [5, 3, 4, 1, 2, 0];
function makeImage(scramble, filename) {
    return __awaiter(this, void 0, void 0, function* () {
        const moves = scramble.split(' ');
        const cube = new Array(48);
        for (let c = 0; c < 6; c++) {
            for (let i = 8 * c; i < 8 * (c + 1); i++) {
                cube[i] = c;
            }
        }
        for (const move of moves) {
            const f = SIDES.indexOf(move[0]);
            const turns = DIR.indexOf(move.slice(1)) + 1;
            for (const cycle of CYCLES[f]) {
                const newColors = new Array(4);
                for (let i = 0; i < 4; i++) {
                    newColors[(i + turns) % 4] = cube[cycle[i]];
                }
                for (let i = 0; i < 4; i++) {
                    cube[cycle[i]] = newColors[i];
                }
            }
        }
        const height = 9 * S + 4 * HEAVY + 6 * LIGHT;
        const width = 12 * S + 5 * HEAVY + 8 * LIGHT;
        let fd = fs.openSync(filename, 'w');
        fs.closeSync(fd);
        new Jimp(width, height, 0x000000ff, (error, image) => {
            for (let f = 0; f < 6; f++) {
                for (let i = 0; i < 9; i++) {
                    let p = -1;
                    if (i < 3) {
                        p = i;
                    }
                    else if (i >= 6) {
                        p = 12 - i;
                    }
                    else if (i == 3) {
                        p = 7;
                    }
                    else if (i == 5) {
                        p = 3;
                    }
                    let color = (p != -1 ? cube[8 * f + p] : f);
                    let row = Math.floor(i / 3);
                    if (f == 5) {
                        row += 6;
                    }
                    else if (f >= 1) {
                        row += 3;
                    }
                    let col = i % 3;
                    if (row < 3 || row >= 6) {
                        col += 3;
                    }
                    else {
                        col += 3 * (f - 1);
                    }
                    let y1 = (row + 1) * LIGHT + Math.ceil((row + 1) / 3) * (HEAVY - LIGHT) + row * S;
                    let x1 = (col + 1) * LIGHT + Math.ceil((col + 1) / 3) * (HEAVY - LIGHT) + col * S;
                    for (let x = x1; x < x1 + S; x++) {
                        for (let y = y1; y < y1 + S; y++) {
                            image.setPixelColor(COLORS[color], x, y);
                        }
                    }
                }
            }
            image.write(filename);
        });
    });
}
exports.makeImage = makeImage;
function _getScramble(numMoves) {
    return __awaiter(this, void 0, void 0, function* () {
        let x = -1, y = -1;
        let moves = new Array(numMoves);
        for (let i = 0; i < numMoves; ++i) {
            let z;
            do {
                z = util_1.randInt(0, SIDES.length - 1);
            } while (z == x || z == y);
            moves[i] = SIDES[z] + DIR[util_1.randInt(0, 2)];
            if (OPPOSITE_FACE[z] == y) {
                x = y;
            }
            else {
                x = -1;
            }
            y = z;
        }
        return moves.join(' ');
    });
}
function getScramble(filename) {
    return __awaiter(this, void 0, void 0, function* () {
        const scramble = yield _getScramble(util_1.randInt(17, 20));
        if (config_1.default.MAKE_SCRAMBLE_IMAGES) {
            makeImage(scramble, filename);
        }
        return scramble;
    });
}
exports.getScramble = getScramble;
//# sourceMappingURL=scramble.js.map