//Define 10x20 grid as the board
var grid = [
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0,0,0],
];

//Block shapes
var shapes = {
	I: [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
	J: [[2,0,0], [2,2,2], [0,0,0]],
	L: [[0,0,3], [3,3,3], [0,0,0]],
	O: [[4,4], [4,4]],
	S: [[0,5,5], [5,5,0], [0,0,0]],
	T: [[0,6,0], [6,6,6], [0,0,0]],
	Z: [[7,7,0], [0,7,7], [0,0,0]]
};

//Block colors
var colors = ["F92338", "C973FF", "1C76BC", "FEE356", "53D504", "36E0FF", "F8931D"];

//Used to help create a seeded generated random number for choosing shapes. makes results deterministic (reproducible) for debugging
var rndSeed = 1;

//BLOCK SHAPES
//coordinates and shape parameter of current block we can update
var currentShape = {x: 0, y: 0, shape: undefined};
//store shape of upcoming block
var upcomingShape;
//stores shapes
var bag = [];
//index for shapes in the bag
var bagIndex = 0;

//GAME VALUES
//Game score
var score = 0;
// boolean for changing game speed
var changeSpeed = false;
//for storing current state, we can load later
var saveState;
//stores current game state
var roundState;
//list of available game speeds
var speeds = [500,100,1,0];
//inded in game speed array
var speedIndex = 0;
// game speed
var speed = speeds[speedIndex];
//turn ai on or off
var ai = true;
//drawing game vs updating algorithms
var draw = true;
//how many so far?
var movesTaken = 0;
//max number of moves allowed in a generation
var moveLimit = 500;
//consists of move the 7 move parameters
var moveAlgorithm = {};
//set to highest rate move 
var inspectMoveSelection = false;


//GENETIC ALGORITHM VALUES
//stores number of genomes, init at 50 
var populationSize = 50;
//stores genomes
var genomes = [];
//index of current genome in genomes array
var currentGenome = -1;
//generation number
var generation = 0;
//stores values for a generation
var archive = {
	populationSize: 0,
	currentGeneration: 0,
	elites: [],
	genomes: []
};
//rate of mutation
var mutationRate = 0.05;
//helps calculate mutation
var mutationStep = 0.2;


//main function, called on load
function initialize() {
	//init pop size
	archive.populationSize = populationSize;
	//get the next available shape from the bag
	nextShape();
	//applies the shape to the grid
	applyShape();
	//set both save state and current state from the game
	saveState = getState();
	roundState = getState();
	//create an initial population of genomes
	createInitialPopulation();
	//the game loop
	var loop = function(){
		//boolean for changing game speed
		if (changeSpeed) {
			//restart the clock
			//stop time
			clearInterval(interval);
			//set time, like a digital watch
			interval = setInterval(loop, speed);
			//and don't change it
			changeInterval = false;
		}
		if (speed === 0) {
			//no need to draw on screen elements
			draw = false;
			//updates the game (update fitness, make a move, evaluate next move)
			update();
			update();
			update();
		} else {
			//draw the elements
			draw = true;
		}
		//update regardless
		update();
		if (speed === 0) {
			//now draw elements
			draw = true;
			//now update the score
			updateScore();
		}
	};
	//timer interval
	var interval = setInterval(loop, speed);
}
document.onLoad = initialize();


//key options
window.onkeydown = function (event) {

	var characterPressed = String.fromCharCode(event.keyCode);
	if (event.keyCode == 38) {
		rotateShape();
	} else if (event.keyCode == 40) {
		moveDown();
	} else if (event.keyCode == 37) {
		moveLeft();
	} else if (event.keyCode == 39) {
		moveRight();
	} else if (characterPressed.toUpperCase() == "Q") {
		saveState = getState();
	} else if (characterPressed.toUpperCase() == "W") {
		loadState(saveState);
	} else if (characterPressed.toUpperCase() == "D") {
		//slow down
		speedIndex--;
		if (speedIndex < 0) {
			speedIndex = speeds.length - 1;
		}
		speed = speeds[speedIndex];
		changeSpeed = true;
	} else if (characterPressed.toUpperCase() == "E") {
		//speed up
		speedIndex++;
		if (speedIndex >= speeds.length) {
			speedIndex = 0;
		}
		//adjust speed index
		speed = speeds[speedIndex];
		changeSpeed = true;
		//Turn on/off AI
	} else if (characterPressed.toUpperCase() == "A") {
		ai = !ai;
	} else if (event.keyCode == 16) { // shift
		loadArchive("archive.js")
	} else if (characterPressed.toUpperCase() == "R") {
		//load saved generation values
		loadArchive(prompt("Insert archive:"));
	} else if (characterPressed.toUpperCase() == "G") {
		if (localStorage.getItem("archive") === null) {
			alert("No archive saved. Archives are saved after a generation has passed, and remain across sessions. Try again once a generation has passed");
		} else {
			prompt("Archive from last generation (including from last session):", localStorage.getItem("archive"));
		}
	} else if (characterPressed.toUpperCase() == "F") {
		//?
		inspectMoveSelection = !inspectMoveSelection;
	} else {
		return true;
	}
	//outputs game state to the screen (post key press)
	output();
	return false;
};

/**
 * Creates the initial population of genomes, each with random genes.
 */
 function createInitialPopulation() {
 	//inits the array
 	genomes = [];
 	//for a given population size
 	for (var i = 0; i < populationSize; i++) {
 		//randomly initialize the 7 values that make up a genome
 		//these are all weight values that are updated through evolution
 		var genome = {
 			//unique identifier for a genome
 			id: Math.random(),
 			//The weight of each row cleared by the given move. the more rows that are cleared, the more this weight increases
 			rowsCleared: Math.random() - 0.5,
 			//the absolute height of the highest column to the power of 1.5
 			//added so that the algorithm can be able to detect if the blocks are stacking too high
 			weightedHeight: Math.random() - 0.5,
 			//The sum of all the column’s heights
 			cumulativeHeight: Math.random() - 0.5,
 			//the highest column minus the lowest column
 			relativeHeight: Math.random() - 0.5,
 			//the sum of all the empty cells that have a block above them (basically, cells that are unable to be filled)
 			holes: Math.random() * 0.5,
 			// the sum of absolute differences between the height of each column 
 			//(for example, if all the shapes on the grid lie completely flat, then the roughness would equal 0).
 			roughness: Math.random() - 0.5,
 		};
 		//add them to the array
 		genomes.push(genome);
 	}
 	evaluateNextGenome();
 }

/**
 * Evaluates the next genome in the population. If there is none, evolves the population.
 */
 function evaluateNextGenome() {
 	//increment index in genome array
 	currentGenome++;
 	//If there is none, evolves the population.
 	if (currentGenome == genomes.length) {
 		evolve();
 	}
 	//load current gamestate
 	loadState(roundState);
 	//reset moves taken
 	movesTaken = 0;
 	//and make the next move
 	makeNextMove();
 }

/**
 * Evolves the entire population and goes to the next generation.
 */
 function evolve() {

 	console.log("Generation " + generation + " evaluated.");
 	//reset current genome for new generation
 	currentGenome = 0;
 	//increment generation
 	generation++;
 	//resets the game
 	reset();
 	//gets the current game state
 	roundState = getState();
 	//sorts genomes in decreasing order of fitness values
 	genomes.sort(function(a, b) {
 		return b.fitness - a.fitness;
 	});
 	//add a copy of the fittest genome to the elites list
 	archive.elites.push(clone(genomes[0]));
 	console.log("Elite's fitness: " + genomes[0].fitness);

 	//remove the tail end of genomes, focus on the fittest
 	while(genomes.length > populationSize / 2) {
 		genomes.pop();
 	}
 	//sum of the fitness for each genome
 	var totalFitness = 0;
 	for (var i = 0; i < genomes.length; i++) {
 		totalFitness += genomes[i].fitness;
 	}

 	//get a random index from genome array
	function getRandomGenome() {
		return genomes[randomWeightedNumBetween(0, genomes.length - 1)];
	}
	//create children array
	var children = [];
	//add the fittest genome to array
	children.push(clone(genomes[0]));
	//add population sized amount of children
	while (children.length < populationSize) {
		//crossover between two random genomes to make a child
		children.push(makeChild(getRandomGenome(), getRandomGenome()));
	}
	//create new genome array
	genomes = [];
	//to store all the children in
	genomes = genomes.concat(children);
	//store this in our archive
	archive.genomes = clone(genomes);
	//and set current gen
	archive.currentGeneration = clone(generation);
	console.log(JSON.stringify(archive));
	//store archive, thanks JS localstorage! (short term memory)
	localStorage.setItem("archive", JSON.stringify(archive));
}

/**
 * Creates a child genome from the given parent genomes, and then attempts to mutate the child genome.
 * @param  {Genome} mum The first parent genome.
 * @param  {Genome} dad The second parent genome.
 * @return {Genome}     The child genome.
 */
 function makeChild(mum, dad) {
 	//init the child given two genomes (its 7 parameters + initial fitness value)
 	var child = {
 		//unique id
 		id : Math.random(),
 		//all these params are randomly selected between the mom and dad genome
 		rowsCleared: randomChoice(mum.rowsCleared, dad.rowsCleared),
 		weightedHeight: randomChoice(mum.weightedHeight, dad.weightedHeight),
 		cumulativeHeight: randomChoice(mum.cumulativeHeight, dad.cumulativeHeight),
 		relativeHeight: randomChoice(mum.relativeHeight, dad.relativeHeight),
 		holes: randomChoice(mum.holes, dad.holes),
 		roughness: randomChoice(mum.roughness, dad.roughness),
 		//no fitness. yet.
 		fitness: -1
 	};
 	//mutation time!

 	//we mutate each parameter using our mutationstep
 	if (Math.random() < mutationRate) {
 		child.rowsCleared = child.rowsCleared + Math.random() * mutationStep * 2 - mutationStep;
 	}
 	if (Math.random() < mutationRate) {
 		child.weightedHeight = child.weightedHeight + Math.random() * mutationStep * 2 - mutationStep;
 	}
 	if (Math.random() < mutationRate) {
 		child.cumulativeHeight = child.cumulativeHeight + Math.random() * mutationStep * 2 - mutationStep;
 	}
 	if (Math.random() < mutationRate) {
 		child.relativeHeight = child.relativeHeight + Math.random() * mutationStep * 2 - mutationStep;
 	}
 	if (Math.random() < mutationRate) {
 		child.holes = child.holes + Math.random() * mutationStep * 2 - mutationStep;
 	}
 	if (Math.random() < mutationRate) {
 		child.roughness = child.roughness + Math.random() * mutationStep * 2 - mutationStep;
 	}
 	return child;
 }

/**
 * Returns an array of all the possible moves that could occur in the current state, rated by the parameters of the current genome.
 * @return {Array} An array of all the possible moves that could occur.
 */
 function getAllPossibleMoves() {
 	var lastState = getState();
 	var possibleMoves = [];
 	var possibleMoveRatings = [];
 	var iterations = 0;
 	//for each possible rotation
 	for (var rots = 0; rots < 4; rots++) {

 		var oldX = [];
 		//for each iteration
 		for (var t = -5; t <= 5; t++) {
 			iterations++;
 			loadState(lastState);
 			//rotate shape
 			for (var j = 0; j < rots; j++) {
 				rotateShape();
 			}
 			//move left
 			if (t < 0) {
 				for (var l = 0; l < Math.abs(t); l++) {
 					moveLeft();
 				}
 			//move right
 			} else if (t > 0) {
 				for (var r = 0; r < t; r++) {
 					moveRight();
 				}
 			}
 			//if the shape has moved at all
 			if (!contains(oldX, currentShape.x)) {
 				//move it down
 				var moveDownResults = moveDown();
 				while (moveDownResults.moved) {
 					moveDownResults = moveDown();
 				}
 				//set the 7 parameters of a genome
 				var algorithm = {
 					rowsCleared: moveDownResults.rowsCleared,
 					weightedHeight: Math.pow(getHeight(), 1.5),
 					cumulativeHeight: getCumulativeHeight(),
 					relativeHeight: getRelativeHeight(),
 					holes: getHoles(),
 					roughness: getRoughness()
 				};
 				//rate each move
 				var rating = 0;
 				rating += algorithm.rowsCleared * genomes[currentGenome].rowsCleared;
 				rating += algorithm.weightedHeight * genomes[currentGenome].weightedHeight;
 				rating += algorithm.cumulativeHeight * genomes[currentGenome].cumulativeHeight;
 				rating += algorithm.relativeHeight * genomes[currentGenome].relativeHeight;
 				rating += algorithm.holes * genomes[currentGenome].holes;
 				rating += algorithm.roughness * genomes[currentGenome].roughness;
 				//if the move loses the game, lower its rating
 				if (moveDownResults.lose) {
 					rating -= 500;
 				}
 				//push all possible moves, with their associated ratings and parameter values to an array
 				possibleMoves.push({rotations: rots, translation: t, rating: rating, algorithm: algorithm});
 				//update the position of old X value
 				oldX.push(currentShape.x);
 			}
 		}
 	}
 	//get last state
 	loadState(lastState);
 	//return array of all possible moves
 	return possibleMoves;
 }

/**
 * Returns the highest rated move in the given array of moves.
 * @param  {Array} moves An array of possible moves to choose from.
 * @return {Move}       The highest rated move from the moveset.
 */
 function getHighestRatedMove(moves) {
 	//start these values off small
 	var maxRating = -10000000000000;
 	var maxMove = -1;
 	var ties = [];
 	//iterate through the list of moves
 	for (var index = 0; index < moves.length; index++) {
 		//if the current moves rating is higher than our maxrating
 		if (moves[index].rating > maxRating) {
 			//update our max values to include this moves values
 			maxRating = moves[index].rating;
 			maxMove = index;
 			//store index of this move
 			ties = [index];
 		} else if (moves[index].rating == maxRating) {
 			//if it ties with the max rating
 			//add the index to the ties array
 			ties.push(index);
 		}
 	}
 	//eventually we'll set the highest move value to this move var
	var move = moves[ties[0]];
	//and set the number of ties
	move.algorithm.ties = ties.length;
	return move;
}

/**
 * Makes a move, which is decided upon using the parameters in the current genome.
 */
 function makeNextMove() {
 	//increment number of moves taken
 	movesTaken++;
 	//if its over the limit of moves
 	if (movesTaken > moveLimit) {
 		//update this genomes fitness value using the game score
 		genomes[currentGenome].fitness = clone(score);
 		//and evaluates the next genome
 		evaluateNextGenome();
 	} else {
 		//time to make a move

 		//we're going to re-draw, so lets store the old drawing
 		var oldDraw = clone(draw);
 		draw = false;
 		//get all the possible moves
 		var possibleMoves = getAllPossibleMoves();
 		//lets store the current state since we will update it
 		var lastState = getState();
 		//whats the next shape to play
 		nextShape();
 		//for each possible move 
 		for (var i = 0; i < possibleMoves.length; i++) {
 			//get the best move. so were checking all the possible moves, for each possible move. moveception.
 			var nextMove = getHighestRatedMove(getAllPossibleMoves());
 			//add that rating to an array of highest rates moves
 			possibleMoves[i].rating += nextMove.rating;
 		}
 		//load current state
 		loadState(lastState);
 		//get the highest rated move ever
 		var move = getHighestRatedMove(possibleMoves);
 		//then rotate the shape as it says too
 		for (var rotations = 0; rotations < move.rotations; rotations++) {
 			rotateShape();
 		}
 		//and move left as it says
 		if (move.translation < 0) {
 			for (var lefts = 0; lefts < Math.abs(move.translation); lefts++) {
 				moveLeft();
 			}
 			//and right as it says
 		} else if (move.translation > 0) {
 			for (var rights = 0; rights < move.translation; rights++) {
 				moveRight();
 			}
 		}
 		//update our move algorithm
 		if (inspectMoveSelection) {
 			moveAlgorithm = move.algorithm;
 		}
 		//and set the old drawing to the current
 		draw = oldDraw;
 		//output the state to the screen
 		output();
 		//and update the score
 		updateScore();
 	}
 }

/**
 * Updates the game.
 */
 function update() {
 	//if we have our AI turned on and the current genome is nonzero
 	//make a move
 	if (ai && currentGenome != -1) {
 		//move the shape down
 		var results = moveDown();
 		//if that didn't do anything
 		if (!results.moved) {
 			//if we lost
 			if (results.lose) {
 				//update the fitness
 				genomes[currentGenome].fitness = clone(score);
 				//move on to the next genome
 				evaluateNextGenome();
 			} else {
 				//if we didnt lose, make the next move
 				makeNextMove();
 			}
 		}
 	} else {
        //else just move down
 		moveDown();
 	}
 	//output the state to the screen
 	output();
 	//and update the score
 	updateScore();
 }

/**
 * Moves the current shape down if possible.
 * @return {Object} The results of the movement of the piece.
 */
 function moveDown() {
 	//array of possibilities
 	var result = {lose: false, moved: true, rowsCleared: 0};
 	//remove the shape, because we will draw a new one
 	removeShape();
 	//move it down the y axis
 	currentShape.y++;
 	//if it collides with the grid
 	if (collides(grid, currentShape)) {
 		//update its position
 		currentShape.y--;
 		//apply (stick) it to the grid 
 		applyShape();
 		//move on to the next shape in the bag
 		nextShape();
 		//clear rows and get number of rows cleared
 		result.rowsCleared = clearRows();
 		//check again if this shape collides with our grid
 		if (collides(grid, currentShape)) {
 			//reset
 			result.lose = true;
 			if (ai) {
 			} else {
 				reset();
 			}
 		}
 		result.moved = false;
 	}
 	//apply shape, update the score and output the state to the screen
 	applyShape();
 	score++;
 	updateScore();
 	output();
 	return result;
 }

/**
 * Moves the current shape to the left if possible.
 */
 function moveLeft() {
 	//remove current shape, slide it over, if it collides though, slide it back
 	removeShape();
 	currentShape.x--;
 	if (collides(grid, currentShape)) {
 		currentShape.x++;
 	}
 	//apply the new shape
 	applyShape();
 }

/**
 * Moves the current shape to the right if possible.
 */
 //same deal
 function moveRight() {
 	removeShape();
 	currentShape.x++;
 	if (collides(grid, currentShape)) {
 		currentShape.x--;
 	}
 	applyShape();
 }

/**
 * Rotates the current shape clockwise if possible.
 */
 //slide it if we can, else return to original rotation
 function rotateShape() {
 	removeShape();
 	currentShape.shape = rotate(currentShape.shape, 1);
 	if (collides(grid, currentShape)) {
 		currentShape.shape = rotate(currentShape.shape, 3);
 	}
 	applyShape();
 }

/**
 * Clears any rows that are completely filled.
 */
 function clearRows() {
 	//empty array for rows to clear
 	var rowsToClear = [];
 	//for each row in the grid
 	for (var row = 0; row < grid.length; row++) {
 		var containsEmptySpace = false;
 		//for each column
 		for (var col = 0; col < grid[row].length; col++) {
 			//if its empty
 			if (grid[row][col] === 0) {
 				//set this value to true
 				containsEmptySpace = true;
 			}
 		}
 		//if none of the columns in the row were empty
 		if (!containsEmptySpace) {
 			//add the row to our list, it's completely filled!
 			rowsToClear.push(row);
 		}
 	}
 	//increase score for up to 4 rows. it maxes out at 12000
 	if (rowsToClear.length == 1) {
 		score += 400;
 	} else if (rowsToClear.length == 2) {
 		score += 1000;
 	} else if (rowsToClear.length == 3) {
 		score += 3000;
 	} else if (rowsToClear.length >= 4) {
 		score += 12000;
 	}
 	//new array for cleared rows
 	var rowsCleared = clone(rowsToClear.length);
 	//for each value
 	for (var toClear = rowsToClear.length - 1; toClear >= 0; toClear--) {
 		//remove the row from the grid
 		grid.splice(rowsToClear[toClear], 1);
 	}
 	//shift the other rows
 	while (grid.length < 20) {
 		grid.unshift([0,0,0,0,0,0,0,0,0,0]);
 	}
 	//return the rows cleared
 	return rowsCleared;
 }

/**
 * Applies the current shape to the grid.
 */
 function applyShape() {
 	//for each value in the current shape (row x column)
 	for (var row = 0; row < currentShape.shape.length; row++) {
 		for (var col = 0; col < currentShape.shape[row].length; col++) {
 			//if its non-empty
 			if (currentShape.shape[row][col] !== 0) {
 				//set the value in the grid to its value. Stick the shape in the grid!
 				grid[currentShape.y + row][currentShape.x + col] = currentShape.shape[row][col];
 			}
 		}
 	}
 }

/**
 * Removes the current shape from the grid.
 */
 //same deal but reverse
 function removeShape() {
 	for (var row = 0; row < currentShape.shape.length; row++) {
 		for (var col = 0; col < currentShape.shape[row].length; col++) {
 			if (currentShape.shape[row][col] !== 0) {
 				grid[currentShape.y + row][currentShape.x + col] = 0;
 			}
 		}
 	}
 }

/**
 * Cycles to the next shape in the bag.
 */
 function nextShape() {
 	//increment the bag index
 	bagIndex += 1;
 	//if we're at the start or end of the bag
 	if (bag.length === 0 || bagIndex == bag.length) {
 		//generate a new bag of genomes
 		generateBag();
 	}
 	//if almost at end of bag
 	if (bagIndex == bag.length - 1) {
 		//store previous seed
 		var prevSeed = rndSeed;
 		//generate upcoming shape
 		upcomingShape = randomProperty(shapes);
 		//set random seed
 		rndSeed = prevSeed;
 	} else {
 		//get the next shape from our bag
 		upcomingShape = shapes[bag[bagIndex + 1]];
 	}
 	//get our current shape from the bag
 	currentShape.shape = shapes[bag[bagIndex]];
 	//define its position
 	currentShape.x = Math.floor(grid[0].length / 2) - Math.ceil(currentShape.shape[0].length / 2);
 	currentShape.y = 0;
 }

/**
 * Generates the bag of shapes.
 */
 function generateBag() {
 	bag = [];
 	var contents = "";
 	//7 shapes
 	for (var i = 0; i < 7; i++) {
 		//generate shape randomly
 		var shape = randomKey(shapes);
 		while(contents.indexOf(shape) != -1) {
 			shape = randomKey(shapes);
 		}
 		//update bag with generated shape
 		bag[i] = shape;
 		contents += shape;
 	}
 	//reset bag index
 	bagIndex = 0;
 }

/**
 * Resets the game.
 */
 function reset() {
 	score = 0;
 	grid = [[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	[0,0,0,0,0,0,0,0,0,0],
 	];
 	moves = 0;
 	generateBag();
 	nextShape();
 }

/**
 * Determines if the given grid and shape collide with one another.
 * @param  {Grid} scene  The grid to check.
 * @param  {Shape} object The shape to check.
 * @return {Boolean} Whether the shape and grid collide.
 */
 function collides(scene, object) {
 	//for the size of the shape (row x column)
 	for (var row = 0; row < object.shape.length; row++) {
 		for (var col = 0; col < object.shape[row].length; col++) {
 			//if its not empty
 			if (object.shape[row][col] !== 0) {
 				//if it collides, return true
 				if (scene[object.y + row] === undefined || scene[object.y + row][object.x + col] === undefined || scene[object.y + row][object.x + col] !== 0) {
 					return true;
 				}
 			}
 		}
 	}
 	return false;
 }

//for rotating a shape, how many times should we rotate
 function rotate(matrix, times) {
 	//for each time
 	for (var t = 0; t < times; t++) {
 		//flip the shape matrix
 		matrix = transpose(matrix);
 		//and for the length of the matrix, reverse each column
 		for (var i = 0; i < matrix.length; i++) {
 			matrix[i].reverse();
 		}
 	}
 	return matrix;
 }
//flip row x column to column x row
 function transpose(array) {
 	return array[0].map(function(col, i) {
 		return array.map(function(row) {
 			return row[i];
 		});
 	});
 }

/**
 * Outputs the state to the screen.
 */
 function output() {
 	if (draw) {
 		var output = document.getElementById("output");
 		var html = "<h1>Tetris AI</h1><h5>A genetic programming approach</h5>var grid = [";
 		var space = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
 		for (var i = 0; i < grid.length; i++) {
 			if (i === 0) {
 				html += "[" + grid[i] + "]";
 			} else {
 				html += "<br />" + space + "[" + grid[i] + "]";
 			}
 		}
 		html += "];";
 		for (var c = 0; c < colors.length; c++) {
 			html = replaceAll(html, "," + (c + 1), ",<font color=\"" + colors[c] + "\">" + (c + 1) + "</font>");
 			html = replaceAll(html, (c + 1) + ",", "<font color=\"" + colors[c] + "\">" + (c + 1) + "</font>,");
 		}
 		output.innerHTML = html;
 	}
 }

/**
 * Updates the side information.
 */
 function updateScore() {
 	if (draw) {
 		var scoreDetails = document.getElementById("score");
 		var html = "<br /><br /><h2>&nbsp;</h2><h2>Score: " + score + "</h2>";
 		html += "<br /><b>--Upcoming Shape--</b>";
 		for (var i = 0; i < upcomingShape.length; i++) {
 			var next =replaceAll((upcomingShape[i] + ""), "0", "&nbsp;");
 			html += "<br />&nbsp;&nbsp;&nbsp;&nbsp;" + next;
 		}
 		for (var l = 0; l < 4 - upcomingShape.length; l++) {
 			html += "<br />";
 		}
 		for (var c = 0; c < colors.length; c++) {
 			html = replaceAll(html, "," + (c + 1), ",<font color=\"" + colors[c] + "\">" + (c + 1) + "</font>");
 			html = replaceAll(html, (c + 1) + ",", "<font color=\"" + colors[c] + "\">" + (c + 1) + "</font>,");
 		}
 		html += "<br />Drop Time: " + speed;
 		if (ai) {
 			html += "<br />Moves: " + movesTaken + "/" + moveLimit;
 			html += "<br />Generation: " + generation;
 			html += "<br />Individual: " + (currentGenome + 1)  + "/" + populationSize;
 			html += "<br /><pre style=\"font-size:12px\">" + JSON.stringify(genomes[currentGenome], null, 2) + "</pre>";
 			if (inspectMoveSelection) {
 				html += "<br /><pre style=\"font-size:12px\">" + JSON.stringify(moveAlgorithm, null, 2) + "</pre>";
 			}
 		}
 		html = replaceAll(replaceAll(replaceAll(html, "&nbsp;,", "&nbsp;&nbsp;"), ",&nbsp;", "&nbsp;&nbsp;"), ",", "&nbsp;");
 		scoreDetails.innerHTML = html;
 	}
 }

/**
 * Returns the current game state in an object.
 * @return {State} The current game state.
 */
 function getState() {
 	var state = {
 		grid: clone(grid),
 		currentShape: clone(currentShape),
 		upcomingShape: clone(upcomingShape),
 		bag: clone(bag),
 		bagIndex: clone(bagIndex),
 		rndSeed: clone(rndSeed),
 		score: clone(score)
 	};
 	return state;
 }

/**
 * Loads the game state from the given state object.
 * @param  {State} state The state to load.
 */
 function loadState(state) {
 	grid = clone(state.grid);
 	currentShape = clone(state.currentShape);
 	upcomingShape = clone(state.upcomingShape);
 	bag = clone(state.bag);
 	bagIndex = clone(state.bagIndex);
 	rndSeed = clone(state.rndSeed);
 	score = clone(state.score);
 	output();
 	updateScore();
 }

/**
 * Returns the cumulative height of all the columns.
 * @return {Number} The cumulative height.
 */
 function getCumulativeHeight() {
 	removeShape();
 	var peaks = [20,20,20,20,20,20,20,20,20,20];
 	for (var row = 0; row < grid.length; row++) {
 		for (var col = 0; col < grid[row].length; col++) {
 			if (grid[row][col] !== 0 && peaks[col] === 20) {
 				peaks[col] = row;
 			}
 		}
 	}
 	var totalHeight = 0;
 	for (var i = 0; i < peaks.length; i++) {
 		totalHeight += 20 - peaks[i];
 	}
 	applyShape();
 	return totalHeight;
 }

/**
 * Returns the number of holes in the grid.
 * @return {Number} The number of holes.
 */
 function getHoles() {
 	removeShape();
 	var peaks = [20,20,20,20,20,20,20,20,20,20];
 	for (var row = 0; row < grid.length; row++) {
 		for (var col = 0; col < grid[row].length; col++) {
 			if (grid[row][col] !== 0 && peaks[col] === 20) {
 				peaks[col] = row;
 			}
 		}
 	}
 	var holes = 0;
 	for (var x = 0; x < peaks.length; x++) {
 		for (var y = peaks[x]; y < grid.length; y++) {
 			if (grid[y][x] === 0) {
 				holes++;
 			}
 		}
 	}
 	applyShape();
 	return holes;
 }

/**
 * Returns an array that replaces all the holes in the grid with -1.
 * @return {Array} The modified grid array.
 */
 function getHolesArray() {
 	var array = clone(grid);
 	removeShape();
 	var peaks = [20,20,20,20,20,20,20,20,20,20];
 	for (var row = 0; row < grid.length; row++) {
 		for (var col = 0; col < grid[row].length; col++) {
 			if (grid[row][col] !== 0 && peaks[col] === 20) {
 				peaks[col] = row;
 			}
 		}
 	}
 	for (var x = 0; x < peaks.length; x++) {
 		for (var y = peaks[x]; y < grid.length; y++) {
 			if (grid[y][x] === 0) {
 				array[y][x] = -1;
 			}
 		}
 	}
 	applyShape();
 	return array;
 }

/**
 * Returns the roughness of the grid.
 * @return {Number} The roughness of the grid.
 */
 function getRoughness() {
 	removeShape();
 	var peaks = [20,20,20,20,20,20,20,20,20,20];
 	for (var row = 0; row < grid.length; row++) {
 		for (var col = 0; col < grid[row].length; col++) {
 			if (grid[row][col] !== 0 && peaks[col] === 20) {
 				peaks[col] = row;
 			}
 		}
 	}
 	var roughness = 0;
 	var differences = [];
 	for (var i = 0; i < peaks.length - 1; i++) {
 		roughness += Math.abs(peaks[i] - peaks[i + 1]);
 		differences[i] = Math.abs(peaks[i] - peaks[i + 1]);
 	}
 	applyShape();
 	return roughness;
 }

/**
 * Returns the range of heights of the columns on the grid.
 * @return {Number} The relative height.
 */
 function getRelativeHeight() {
 	removeShape();
 	var peaks = [20,20,20,20,20,20,20,20,20,20];
 	for (var row = 0; row < grid.length; row++) {
 		for (var col = 0; col < grid[row].length; col++) {
 			if (grid[row][col] !== 0 && peaks[col] === 20) {
 				peaks[col] = row;
 			}
 		}
 	}
 	applyShape();
 	return Math.max.apply(Math, peaks) - Math.min.apply(Math, peaks);
 }

/**
 * Returns the height of the biggest column on the grid.
 * @return {Number} The absolute height.
 */
 function getHeight() {
 	removeShape();
 	var peaks = [20,20,20,20,20,20,20,20,20,20];
 	for (var row = 0; row < grid.length; row++) {
 		for (var col = 0; col < grid[row].length; col++) {
 			if (grid[row][col] !== 0 && peaks[col] === 20) {
 				peaks[col] = row;
 			}
 		}
 	}
 	applyShape();
 	return 20 - Math.min.apply(Math, peaks);
 }

/**
 * Loads the archive given.
 * @param  {String} archiveString The stringified archive.
 */
 function loadArchive(archiveString) {
 	archive = fullyEvolvedArchive;
 	genomes = clone(archive.genomes);
 	populationSize = archive.populationSize;
 	generation = archive.currentGeneration;
 	currentGenome = 0;
 	reset();
 	roundState = getState();
 	console.log("Archive loaded!");
 }

/**
 * Clones an object.
 * @param  {Object} obj The object to clone.
 * @return {Object}     The cloned object.
 */
 function clone(obj) {
 	return JSON.parse(JSON.stringify(obj));
 }

/**
 * Returns a random property from the given object.
 * @param  {Object} obj The object to select a property from.
 * @return {Property}     A random property.
 */
 function randomProperty(obj) {
 	return(obj[randomKey(obj)]);
 }

/**
 * Returns a random property key from the given object.
 * @param  {Object} obj The object to select a property key from.
 * @return {Property}     A random property key.
 */
 function randomKey(obj) {
 	var keys = Object.keys(obj);
 	var i = seededRandom(0, keys.length);
 	return keys[i];
 }

 function replaceAll(target, search, replacement) {
 	return target.replace(new RegExp(search, 'g'), replacement);
 }

/**
 * Returns a random number that is determined from a seeded random number generator.
 * @param  {Number} min The minimum number, inclusive.
 * @param  {Number} max The maximum number, exclusive.
 * @return {Number}     The generated random number.
 */
 function seededRandom(min, max) {
 	max = max || 1;
 	min = min || 0;

 	rndSeed = (rndSeed * 9301 + 49297) % 233280;
 	var rnd = rndSeed / 233280;

 	return Math.floor(min + rnd * (max - min));
 }

 function randomNumBetween(min, max) {
 	return Math.floor(Math.random() * (max - min + 1) + min);
 }

 function randomWeightedNumBetween(min, max) {
 	return Math.floor(Math.pow(Math.random(), 2) * (max - min + 1) + min);
 }

 function randomChoice(propOne, propTwo) {
 	if (Math.round(Math.random()) === 0) {
 		return clone(propOne);
 	} else {
 		return clone(propTwo);
 	}
 }

 function contains(a, obj) {
 	var i = a.length;
 	while (i--) {
 		if (a[i] === obj) {
 			return true;
 		}
 	}
 	return false;
 }
