const crypto = require('crypto');
const readline = require('readline');
const Table = require('cli-table');
const Dice = require('./dice');
const HMACGenerator = require('./hmac'); 
const HelpDisplay = require('./help'); 

class Game {
    constructor(dice) {
        this.dice = dice;
        this.firstPlayer = null;
        this.userDice = null;
        this.computerDice = null;
    }


    generateHMACValue(range) {
        return HMACGenerator.generateHMACValue(range);  // Call the static method of HMACGenerator class
    }
    
    displayHelp() {
        const helpDisplay = new HelpDisplay(this.dice);  // Create an instance of HelpDisplay
        helpDisplay.display();
    }

    determineFirstPlayer() {
        const { key, value, hmac } = this.generateHMACValue(2);
        console.log(`I selected a random value in the range 0..1 (HMAC=${hmac}).`);
        console.log("Try to guess my selection.");
        console.log("0 - 0");
        console.log("1 - 1");
        console.log("X - exit");
        console.log("? - help");
        return { key, value };
    }

    generateFairThrow() {
        const { key, value, hmac } = this.generateHMACValue(6);
        const randomValue = value % 6;  // Ensure the value is between 0 and 5
        console.log(`I selected a random value in the range 0..5 (HMAC=${hmac}).`);
        console.log("0 - 0");
        console.log("1 - 1");
        console.log("2 - 2");
        console.log("3 - 3");
        console.log("4 - 4");
        console.log("5 - 5");
        console.log("X - exit");
        console.log("? - help");
        return { key, value: randomValue };
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
                this.dice.splice(selection, 1);

                this.computerDice = this.dice[crypto.randomInt(this.dice.length)];
                console.log(`I choose the [${this.computerDice.values.join(',')}] dice.`);

                this.playRounds(rl);
            });
        };

        diceSelection();
    }


    playRounds(rl) {
        console.log("It's time for my throw.");
        const { key: computerKey, value: computerValue } = this.generateFairThrow(); // Computer's first throw
    
        // Start the first throw (computer)
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
    
                // Calculate the result of both throws and print the throw results
                const result = (computerValue + userValue) % 6;
                console.log(`My number is ${computerValue} (KEY=${computerKey.toString('hex')}).`);
                console.log(`The result is ${computerValue} + ${userValue} = ${result} (mod 6).`);
                console.log(`My throw is ${this.computerDice.roll(result)}.`);
    
                // Now, for the second throw (user)
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
    
                    // Calculate the result for user
                    const resultUser = (userThrowValue + userValue) % 6;
                    console.log(`My number is ${userThrowValue} (KEY=${userKey.toString('hex')}).`);
                    console.log(`The result is ${userThrowValue} + ${userValue} = ${resultUser} (mod 6).`);
                    console.log(`Your throw is ${this.userDice.roll(resultUser)}.`);
    
                    // Now compare the results to determine the winner
                    const userScore = this.userDice.roll(resultUser);
                    const computerScore = this.computerDice.roll(result);
    
                    if (userScore > computerScore) {
                        console.log("You win!");
                        console.log(`${userScore} > ${computerScore}`);
                    } else if (userScore < computerScore) {
                        console.log("I win!");
                        console.log(`${computerScore} > ${userScore}`);
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

module.exports = Game;