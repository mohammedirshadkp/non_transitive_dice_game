// main.js
const Dice = require('./dice'); 
const Game = require('./game'); 

// Parsing command line arguments
const args = process.argv.slice(2);
if (args.length < 3) {
    console.error("Error: You must provide at least 3 dice.");
    console.error("Example: node game.js 2,2,4,4,9,9 6,8,1,1,8,6 7,5,3,7,5,3");
    process.exit(1);
}

const diceList = args.map(arg => new Dice(arg.split(',').map(Number)));
const game = new Game(diceList);
game.start();
