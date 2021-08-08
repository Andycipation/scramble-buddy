/*
Functions for generating scramble strings.
*/

import Jimp from "jimp";
import { randInt } from "./util";

import config from "../config";

// image-related stuff
const S = 32; // side length of a sticker
const LIGHT = 3; // weight of a light line
const HEAVY = 7; // weight of a heavy line
// color palette; taken from https://colorhunt.co/palettes/white, etc.
const COLORS = [
  0xf9f6f7ff, // white
  0xfc8621ff, // orange
  0x4fa54cff, // green
  0xec0101ff, // red
  0x0e49b5ff, // blue
  0xcad315ff, // yellow
];

// scramble parameters
const FACES = ["U", "L", "F", "R", "B", "D"];
const OPPOSITE_FACE = [5, 3, 4, 1, 2, 0]; // index of opposite
const DIR = ["", "2", "'"];

// below: adapted from my submission to https://dmoj.ca/problem/rubik
const CYCLES: number[][][] = [
  [
    // U
    [0, 2, 4, 6],
    [1, 3, 5, 7],
    [8, 32, 24, 16],
    [9, 33, 25, 17],
    [10, 34, 26, 18],
  ],
  [
    // L
    [8, 10, 12, 14],
    [9, 11, 13, 15],
    [0, 16, 40, 36],
    [7, 23, 47, 35],
    [6, 22, 46, 34],
  ],
  [
    // F
    [16, 18, 20, 22],
    [17, 19, 21, 23],
    [4, 30, 40, 10],
    [5, 31, 41, 11],
    [6, 24, 42, 12],
  ],
  [
    // R
    [24, 26, 28, 30],
    [25, 27, 29, 31],
    [2, 38, 42, 18],
    [3, 39, 43, 19],
    [4, 32, 44, 20],
  ],
  [
    // B
    [32, 34, 36, 38],
    [33, 35, 37, 39],
    [0, 14, 44, 26],
    [1, 15, 45, 27],
    [2, 8, 46, 28],
  ],
  [
    // D
    [40, 42, 44, 46],
    [41, 43, 45, 47],
    [12, 20, 28, 36],
    [13, 21, 29, 37],
    [14, 22, 30, 38],
  ],
];

/**
 * Makes an image showing the cube net for this scramble.
 * @param scramble the scramble string
 * @param filename the output file, which should end in .png
 */
export const makeImage = async (
  scramble: string,
  filename: string
): Promise<void> => {
  // initialize the cube
  const cube = new Array<number>(48);
  for (let c = 0; c < 6; c++) {
    for (let i = 8 * c; i < 8 * (c + 1); i++) {
      cube[i] = c;
    }
  }

  // do the turns
  const moves = scramble.split(" ");
  for (const move of moves) {
    const f = FACES.indexOf(move[0]);
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

  // dimensions
  const height = 9 * S + 4 * HEAVY + 6 * LIGHT;
  const width = 12 * S + 5 * HEAVY + 8 * LIGHT;

  // fill in the cells
  const image = new Jimp(width, height, 0x000000ff);
  for (let f = 0; f < 6; f++) {
    for (let i = 0; i < 9; i++) {
      let p = -1;
      if (i < 3) {
        p = i;
      } else if (i >= 6) {
        p = 12 - i;
      } else if (i == 3) {
        p = 7;
      } else if (i == 5) {
        p = 3;
      }
      const color = p != -1 ? cube[8 * f + p] : f;
      let row = Math.floor(i / 3);
      if (f == 5) {
        row += 6;
      } else if (f >= 1) {
        row += 3;
      }
      let col = i % 3;
      if (row < 3 || row >= 6) {
        col += 3;
      } else {
        col += 3 * (f - 1);
      }
      const y1 =
        (row + 1) * LIGHT +
        Math.ceil((row + 1) / 3) * (HEAVY - LIGHT) +
        row * S;
      const x1 =
        (col + 1) * LIGHT +
        Math.ceil((col + 1) / 3) * (HEAVY - LIGHT) +
        col * S;
      for (let x = x1; x < x1 + S; x++) {
        for (let y = y1; y < y1 + S; y++) {
          image.setPixelColor(COLORS[color], x, y);
        }
      }
    }
  }
  await image.writeAsync(filename);
};

/**
 * Returns a non-redundant scramble string (e.g. no "F B F").
 * @param numMoves the desired length of the scramble
 * @return a scramble with the specified number of moves
 */
const _getScramble = async (numMoves: number): Promise<string> => {
  // last 2 moves
  let x = -1;
  let y = -1;
  const moves = new Array<string>(numMoves);
  for (let i = 0; i < numMoves; ++i) {
    let z: number;
    do {
      z = randInt(0, FACES.length - 1);
    } while (z == x || z == y);
    moves[i] = FACES[z] + DIR[randInt(0, 2)];
    if (OPPOSITE_FACE[z] == y) {
      x = y;
    } else {
      x = -1;
    }
    y = z;
  }
  return moves.join(" ");
};

export const genScramble = async (
  filename: string,
  generateImage = config.MAKE_SCRAMBLE_IMAGES
): Promise<string> => {
  const scramble = await _getScramble(randInt(17, 20));
  if (generateImage) {
    await makeImage(scramble, filename);
  }
  return scramble;
};
