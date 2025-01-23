const crypto = require('crypto');
const readline = require('readline');
const Table = require('cli-table'); // A 3rd-party library for rendering tables in the console

class Dice {
    constructor(values) {
        this.values = values;
    }

    roll(index) {
        return this.values[index];
    }
}

class Game {
    constructor(dice) {
        this.dice = dice;
        this.firstPlayer = null;
        this.userDice = null;
        this.computerDice = null;
    }

    determineFirstPlayer() {
        const key = crypto.randomBytes(32);
        const value = Math.floor(Math.random() * 2);
        const hmac = crypto.createHmac('sha3-256', key).update(value.toString()).digest('hex');
        console.log(`I selected a random value in the range 0..1 (HMAC=${hmac}).`);
        console.log("Try to guess my selection.");
        console.log("0 - 0");
        console.log("1 - 1");
        console.log("X - exit");
        console.log("? - help");
        return { key, value };
    }

    generateFairThrow() {
        const key = crypto.randomBytes(32);
        const value = Math.floor(Math.random() * 6); // Generating a face index (0 to 5)
        const hmac = crypto.createHmac('sha3-256', key).update(value.toString()).digest('hex');
        console.log(`I selected a random value in the range 0..5 (HMAC=${hmac}).`);
        return { key, value };
    }

    displayHelp() {
        console.log("Help: This is a non-transitive dice game where each player selects a dice and rolls it. The highest roll wins.");

        // Creating the table
        const table = new Table({
            head: ['User dice \\ Computer dice', ...this.dice.map((_, index) => index.toString())],
            colWidths: Array(this.dice.length + 1).fill(15)
        });

        this.dice.forEach((userDie, userIndex) => {
            const row = [userDie.values.join(',')];
            this.dice.forEach((computerDie, computerIndex) => {
                if (userIndex === computerIndex) {
                    row.push('- (0.3333)'); // Placeholder for same dice probability
                } else {
                    const winProbability = this.calculateWinProbability(userDie, computerDie).toFixed(4);
                    row.push(winProbability);
                }
            });
            table.push(row);
        });

        console.log('Probability of the win for the user:');
        console.log(table.toString());
        console.log("X - exit");
    }

    calculateWinProbability(userDie, computerDie) {
        let userWins = 0;
        let totalRolls = userDie.values.length * computerDie.values.length;
        for (let userRoll of userDie.values) {
            for (let computerRoll of computerDie.values) {
                if (userRoll > computerRoll) userWins++;
            }
        }
        return userWins / totalRolls;
    }

    start() {
        console.log("Let's determine who makes the first move.");
        const { key, value } = this.determineFirstPlayer();

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const guessSelection = () => {
            rl.question('Your selection: ', (guess) => {
                if (guess.toLowerCase() === 'x') {
                    console.log("Exiting the game...");
                    rl.close();
                    return;
                } else if (guess === '?') {
                    this.displayHelp();
                    guessSelection();
                    return;
                }
                guess = parseInt(guess, 10);
                console.log(`My selection: ${value} (KEY=${key.toString('hex')}).`);
                if (guess === value) {
                    console.log("You guessed right! You make the first move.");
                    this.firstPlayer = 'user';
                } else {
                    console.log("You guessed wrong. I make the first move.");
                    this.firstPlayer = 'computer';
                }
                this.selectDice(rl);
            });
        };

        guessSelection();
    }

    selectDice(rl) {
        console.log("Choose your dice:");
        this.dice.forEach((die, index) => {
            console.log(`${index} - ${die.values.join(',')}`);
        });

        const diceSelection = () => {
            rl.question('Your selection: ', (selection) => {
                if (selection.toLowerCase() === 'x') {
                    console.log("Exiting the game...");
                    rl.close();
                    return;
                } else if (selection === '?') {
                    this.displayHelp();
                    diceSelection();
                    return;
                }
                selection = parseInt(selection, 10);
                this.userDice = this.dice[selection];
                console.log(`You choose the [${this.userDice.values.join(',')}] dice.`);
                this.dice.splice(selection, 1); // Remove the selected dice from the list

                // Computer selects dice
                this.computerDice = this.dice[Math.floor(Math.random() * this.dice.length)];
                console.log(`I choose the [${this.computerDice.values.join(',')}] dice.`);

                this.playRounds(rl);
            });
        };

        diceSelection();
    }

    playRounds(rl) {
        console.log("It's time for my throw.");
        const { key: computerKey, value: computerValue } = this.generateFairThrow();

        const userThrow = () => {
            rl.question('Add your number modulo 6 (0 to 5): ', (userValue) => {
                if (userValue.toLowerCase() === 'x') {
                    console.log("Exiting the game...");
                    rl.close();
                    return;
                } else if (userValue === '?') {
                    this.displayHelp();
                    userThrow();
                    return;
                }
                userValue = parseInt(userValue, 10);
                const result = (computerValue + userValue) % 6;
                console.log(`My number is ${computerValue} (KEY=${computerKey.toString('hex')}).`);
                console.log(`The result is ${computerValue} + ${userValue} = ${result} (mod 6).`);
                console.log(`My throw is ${this.computerDice.roll(result)}.`);

                const { key: userKey, value: userThrowValue } = this.generateFairThrow();
                rl.question('Add your number modulo 6 (0 to 5): ', (userValue) => {
                    if (userValue.toLowerCase() === 'x') {
                        console.log("Exiting the game...");
                        rl.close();
                        return;
                    } else if (userValue === '?') {
                        this.displayHelp();
                        userThrow();
                        return;
                    }
                    userValue = parseInt(userValue, 10);
                    const result = (userThrowValue + userValue) % 6;
                    console.log(`My number is ${userThrowValue} (KEY=${userKey.toString('hex')}).`);
                    console.log(`The result is ${userThrowValue} + ${userValue} = ${result} (mod 6).`);
                    console.log(`Your throw is ${this.userDice.roll(result)}.`);

                    if (this.userDice.roll(result) > this.computerDice.roll(result)) {
                        console.log("You win!");
                    } else if (this.userDice.roll(result) < this.computerDice.roll(result)) {
                        console.log("I win!");
                    } else {
                        console.log("It's a tie!");
                    }

                    rl.close();
                });
            });
        };

        userThrow();
    }
}

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
