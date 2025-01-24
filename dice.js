class Dice {
    constructor(values) {
        this.values = values;
    }

    roll(index) {
        return this.values[index % this.values.length];
    }
}

module.exports = Dice;
