const straights = [
	[0, 3, 7],
	[1, 4, 8, 12],
	[2, 5, 9, 13, 16],
	[6, 10, 14, 17],
	[11, 15, 18]
];
const diags_r = [
	[0, 1, 2],
	[3, 4, 5, 6],
	[7, 8, 9, 10, 11],
	[12, 13, 14, 15],
	[16, 17, 18]
];
const diags_l = [
	[2, 6, 11],
	[1, 5, 10, 15],
	[0, 4, 9, 14, 18],
	[3, 8, 13, 17],
	[7, 12, 16]
];

let tile_to_lines = {
	0: [0, 0, 2],
	1: [1, 0, 1],
	2: [2, 0, 0],
	3: [0, 1, 3],
	4: [1, 1, 2],
	5: [2, 1, 1],
	6: [3, 1, 0],
	7: [0, 2, 4],
	8: [1, 2, 3],
	9: [2, 2, 2],
	10: [3, 2, 1],
	11: [4, 2, 0],
	12: [1, 3, 4],
	13: [2, 3, 3],
	14: [3, 3, 2],
	15: [4, 3, 1],
	16: [2, 4, 4],
	17: [3, 4, 3],
	18: [4, 4, 2]
};
let lines = [straights, diags_r, diags_l]

let PIECES = [[1, 2, 8], [9, 6, 3], [1, 6, 3], [1, 2, 3], [1, 6, 8], [5, 7, 8], [5, 2, 3], [5, 2, 4], [9, 6, 4], [9, 2, 3], [1, 7, 8], [5, 2, 8], [5, 6, 3], [1, 6, 4], [1, 7, 4], [5, 6, 4], [5, 7, 4], [9, 2, 4], [9, 7, 8], [9, 2, 8], [1, 2, 4], [5, 6, 8], [9, 7, 4], [9, 7, 3], [5, 7, 3], [1, 7, 3], [9, 6, 8]];
let pieces = [...PIECES];

// Initialise history with empty grid
let history = [[null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null]];
let placed_history = [];

let currentPiece = null;
let placedCount = 0;

const nextPieceDiv = document.getElementById("next-piece");
const scoreSpan = document.getElementById("score");

const tileCountSpan = document.getElementById("tile-count");
tileCountSpan.innerText = placedCount;

function shufflePieces(pieces, seed) {
	function seededRandom(seed) {
		return function() {
			seed = (seed + 0x6D2B79F5) | 0;
			var t = Math.imul(seed ^ seed >>> 15, seed | 1);
			t = t + (t ^ t >>> 7) + (t ^ t >>> 4);
			return ((t ^ t >>> 15) >>> 0) / 4294967296;
		}
	}
	function shuffleArray(arr, seed) {
		const random = seededRandom(seed);
		for (let i = arr.length - 1; i > 0; i--) {
			const j = Math.floor(random() * (i + 1));
			[arr[i], arr[j]] = [arr[j], arr[i]];
		}
		return arr;
	}

	return shuffleArray(pieces, seed);
};

function one_hot(board) {
	let encoded = new Array(19).fill().map(() => new Array(3).fill().map(() => new Array(3).fill(0)));

    for (let idx = 0; idx < board.length; idx++) {
        let p = board[idx];
        if (p !== null) {
            encoded[idx][0][Math.floor((p[0] - 1) / 4)] = 1;
            encoded[idx][1][p[1] === 2 ? 0 : (p[1] - 5)] = 1;
            encoded[idx][2][p[2] === 8 ? 2 : (p[2] - 3)] = 1;
        }
    };

    return encoded.flat(2);
};

function score_board(board) {
	let score = 0;

	const checkLines = (groups, orientation) => {
		for (const line of groups) {
			const tiles = line.map((idx, _) => { return board[idx] });

			// Find first non-null tile and get value in that orientation
			const initial = tiles.find(tile => tile !== null)?.[orientation];

			if (initial !== undefined && tiles.every(tile => tile !== null && tile[orientation] === initial)) {
				score += initial * tiles.length;
			};
		}
	};

	checkLines(straights, 0);
	checkLines(diags_r, 1);
	checkLines(diags_l, 2);

	return score;
};

function score_change(board, tile_idx) {
	let score = 0;

	let groups = tile_to_lines[tile_idx];
	groups.forEach((line_idx, orientation) => {	
		let tiles = lines[orientation][line_idx].map((idx, _) => { return board[idx] });
		const initial = tiles.find(tile => tile !== null)?.[orientation];
		
		if (initial !== undefined && tiles.every(tile => tile !== null && tile[orientation] === initial)) {
			score += initial * tiles.length;
		};
	});

	return score;
};