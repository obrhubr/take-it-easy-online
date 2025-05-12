async function load_model(filename = "medium.onnx") {
	const session = await ort.InferenceSession.create(`/models/${filename}`);
	return session;
};

async function evaluate(encoded) {
	const typedArray = new Float32Array(encoded);
	let input = new ort.Tensor('float32', typedArray, [encoded.length]);

	let output = await model.run({"onnx::MatMul_0": input});
	let data = output[23].data;

	return data.reduce((acc, val) => acc + val, 0) / data.length;
};

async function get_expected_scores() {
	function interpolateColor(value, min = 0, max = 1) {
		const ratio = (value - min) / (max - min);

		let r, g, b;

		if (ratio <= 0.5) {
			let t = ratio / 0.5;
			r = Math.round(255 * t);
			g = Math.round(255 * t);
			b = 255;
		} else {
			let t = (ratio - 0.5) / 0.5;
			r = 255;
			g = Math.round(255 * (1 - t));
			b = Math.round(255 * (1 - t));
		};

		return `rgb(${r},${g},${b})`;
	};

	let score_labels = {};
	let rewards = {};

	let current_board = history[history.length - 1];
	for (let i = 0; i < 19; i++) {
		if (current_board[i] != null) { continue; };

		current_board[i] = currentPiece;

		let expected = await evaluate(one_hot(current_board));
		let reward = score_change(current_board, i);
		let score = score_board(current_board);

		rewards[i] = expected + reward;
		score_labels[i] = (expected + reward + score).toFixed(2);

		current_board[i] = null;
	};

	// Set global
	best_tiles = rewards;

	let values = Object.values(score_labels);
	let min = Math.min(...values);
	let max = Math.max(...values);

	let style_labels = Object.fromEntries(
		Object.entries(score_labels).map(([key, value]) => [key, interpolateColor(value, min, max)])
	);
	addTileLabels(score_labels, style_labels);
};

function place_best() {
	let best_tile = Object.keys(best_tiles).reduce((a, b) => best_tiles[a] > best_tiles[b] ? a : b);

	// If the tile is already occupied, return
	if (history[history.length - 1][best_tile] != null) { return; };

	placePiece(document.getElementById(best_tile));
};

async function compute_max_score() {
	let board = new Array(19).fill(null);
	let pieces = shufflePieces([...PIECES], seed);

	for (let step = 0; step < 19; step++) {
		let current_piece = pieces.shift();

		let best_score = -999;
		let best_tile = -1;
		for (let i = 0; i < 19; i++) {
			if (board[i] != null) { continue; };

			board[i] = current_piece;

			let expected = await evaluate(one_hot(board));
			let reward = score_change(board, i);

			if (expected + reward > best_score) {
				best_score = expected + reward;
				best_tile = i;
			};

			board[i] = null;
		};

		board[best_tile] = current_piece;
	};

	return score_board(board);
};

async function load_ai_score() {
	// Simulate game
	let ai_score = await compute_max_score();

	// Set div
	const score_div = document.getElementById("ai-score");
	score_div.innerHTML = `AI's Score: ${ai_score}`;
};

function initialise_buttons() {
	const parent = document.getElementById("ai-buttons");
	parent.innerHTML = `\
		<div class="button-line"> \
			<button id="ai-activate" class="button">Always show rewards</button> \
			<button id="ai-play" class="button">Let AI Play</button> \
		</div> \
		<div class="button-line"> \
			<button id="ai-button" class="button">Calculate reward</button> \
			<button id="ai-place" class="button">Place best</button> \
		</div>`;

	document.getElementById("ai-activate").addEventListener("click", async () => {
		use_ai = true;
		await get_expected_scores();
	});
	document.getElementById("ai-play").addEventListener("click", async () => {
		for (let i = 0; i < 19; i++) {
			await get_expected_scores();
			place_best();
		};
	});
	document.getElementById("ai-button").addEventListener("click", async () => {
		await get_expected_scores();
	});
	document.getElementById("ai-place").addEventListener("click", async () => {
		place_best();
	});
};

let loadAI = (async () => {
	document.getElementById("load-ai").disabled = true;

	model_filename = document.getElementById("select-ai").value;
	model = await load_model(model_filename);

	// Insert buttons
	initialise_buttons();

	// Show AI score
	await load_ai_score();
});