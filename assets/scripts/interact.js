function scoreBoard(show_scoring = false) {
	let score = 0;

	if (show_scoring) {
		for (let i = 0; i < 19; i++) {
			let piece = document.getElementById(i);
			piece.childNodes.forEach(child => {
				child.style = "opacity: 0.3;";
			});
		};
	};

	const checkLines = (groups, orientation) => {
		for (const line of groups) {
			const tiles = line.map(getTileAt);

			// Find first non-null tile and get value in that orientation
			const initial = tiles.find(tile => tile !== null)?.[orientation];

			if (initial !== undefined && tiles.every(tile => tile !== null && tile[orientation] === initial)) {
				score += initial * tiles.length;

				if (show_scoring) {
					line.forEach(tile_idx => {
						let piece = document.getElementById(tile_idx);
						let l = piece.querySelector(orientation == 0 ? ".v" : orientation == 1 ? ".d1" : ".d2");
						l.style = "opacity: 1.0;";
					});
				};
			}
		}
	};

	checkLines(straights, 0);
	checkLines(diags_r, 1);
	checkLines(diags_l, 2);

	return score;
};

function addTileLabels(tile_labels, tile_styles) {
	// Apply the labels to the board
	for (let i = 0; i < 19; i++) {
		if (!(i in tile_labels)) { continue; };
		
		const el = document.getElementById(i);

		el.style = `background-color: ${tile_styles[i]};`;

		let label = document.createElement("span");
		label.className = "label";
		label.innerHTML = tile_labels[i];
		el.appendChild(label)
	};
};

function clearTileLabels() {
	// Remove the labels and styles from the board
	for (let i = 0; i < 19; i++) {
		const el = document.getElementById(i);
		el.style = "";

		const labelDiv = el.querySelectorAll('.label');
		labelDiv.forEach((ld) => { ld.remove() });
	};
};

function clearBoard() {
	for (let i = 0; i < 19; i++) {
		const el = document.getElementById(i);
		el.style = "";

		el.className = "tile";
		el.querySelector('.line.v').textContent = "";
		el.querySelector('.line.d1').textContent = "";
		el.querySelector('.line.d2').textContent = "";

		let l = el.querySelectorAll("span");
		l.forEach((el) => { el.style = "opacity: 1.0;" });

		const labelDiv = el.querySelector('.label');
		if (labelDiv) labelDiv.remove();
	};
};

function updateNextPieceDisplay(piece) {
	nextPieceDiv.className = `tile l${piece[0]} l${piece[1]} l${piece[2]}`;
	nextPieceDiv.querySelector('.line.v').textContent = piece[0];
	nextPieceDiv.querySelector('.line.d1').textContent = piece[1];
	nextPieceDiv.querySelector('.line.d2').textContent = piece[2];
}

function loadNextPiece() {
	if (placedCount == 19) {
		currentPiece = null;
		updateNextPieceDisplay([0, 0, 0]);
		tileCountSpan.textContent = "all";
		nextPieceDiv.style.display = "none";

		scoreBoard(placedCount == 19);
		return;
	};

	currentPiece = pieces.shift();
	updateNextPieceDisplay(currentPiece);

	// Clear tile labels
	clearTileLabels();
};

function saveState() {
	const state = [];
	for (let i = 0; i < 19; i++) {
		const tile = getTileAt(i);
		state.push(tile ? [...tile] : null);
	}
	history.push(state);
};

function reset() {
	pieces = [...PIECES];
	pieces = shufflePieces(pieces, seed);

	history = [[null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null]];
	placed_history = [];
	currentPiece = null;

	clearBoard();
	clearTileLabels();

	placedCount = 0;
	tileCountSpan.innerText = placedCount;

	// Reset AI expected score settings
	use_ai = false;

	// Start game
	loadNextPiece();
};

function placePiece(tileDiv) {
	if (!currentPiece) return;

	clearTileLabels();

	tileDiv.className = `tile l${currentPiece[0]} l${currentPiece[1]} l${currentPiece[2]}`;
	tileDiv.innerHTML = `
		<span class="line v">${currentPiece[0]}</span>
		<span class="line d1">${currentPiece[1]}</span>
		<span class="line d2">${currentPiece[2]}</span>
	`;
	placedCount++;
	tileCountSpan.textContent = placedCount;

	// Calculate and show score
	let score = scoreBoard(placedCount == 19);
	scoreSpan.textContent = score;

	placed_history.push(currentPiece);
	saveState();
	loadNextPiece();

	if (use_ai) { get_expected_scores() };
};

function undo() {
	if (history.length > 1) {
		// Restora pieces order
		let last_placed = placed_history.pop();
		if (last_placed) {
			pieces.unshift(currentPiece);
			pieces.unshift(last_placed);
			currentPiece = last_placed;
		};

		// Restore board state
		history.pop();
		const lastState = history[history.length - 1];

		// Apply the last state to the board
		for (let i = 0; i < 19; i++) {
			const tile = lastState[i];
			const el = document.getElementById(i);
			if (tile) {
				el.querySelector('.line.v').textContent = tile[0];
				el.querySelector('.line.d1').textContent = tile[1];
				el.querySelector('.line.d2').textContent = tile[2];
				el.className = `tile l${tile[0]} l${tile[1]} l${tile[2]}`;
			} else {
				el.querySelector('.line.v').textContent = '';
				el.querySelector('.line.d1').textContent = '';
				el.querySelector('.line.d2').textContent = '';
				el.className = "tile";
			};

			// Reset scoring opacity
			let l = el.querySelectorAll("span");
			l.forEach((el) => { el.style = "opacity: 1.0;" });
		};

		placedCount--;
		tileCountSpan.textContent = placedCount;

		// Calculate and show score
		let score = scoreBoard()
		scoreSpan.textContent = score;

		// Reload the latest piece
		loadNextPiece();
	};
};

function getTileAt(index) {
	const el = document.getElementById(index);
	if (!el) return null;

	const v = parseInt(el.querySelector('.line.v')?.textContent);
	const d1 = parseInt(el.querySelector('.line.d1')?.textContent);
	const d2 = parseInt(el.querySelector('.line.d2')?.textContent);

	if (isNaN(v) || isNaN(d1) || isNaN(d2)) return null;

	return [v, d1, d2];
};