const Table = require('cli-table');

class HelpDisplay {
    constructor(dice) {
        this.dice = dice;  // The dice are passed in to calculate probabilities
    }

    // Method to calculate win probability
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

    // Method to display help
    display() {
        console.log("Help: This is a non-transitive dice game where each player selects a dice and rolls it. The highest roll wins.");

        // Create the table to show win probabilities
        const table = new Table({
            head: ['User dice \\ Computer dice', ...this.dice.map((_, index) => index.toString())],
            colWidths: Array(this.dice.length + 1).fill(15)
        });

        this.dice.forEach((userDie, userIndex) => {
            const row = [userDie.values.join(',')];
            this.dice.forEach((computerDie, computerIndex) => {
                if (userIndex === computerIndex) {
                    row.push('- (0.3333)');
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
}

module.exports = HelpDisplay;
