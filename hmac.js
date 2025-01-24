const crypto = require('crypto');

class HMACGenerator {
    // Method to generate an HMAC value
    static generateHMACValue(range) {
        const key = crypto.randomBytes(32);  
        const value = crypto.randomInt(range);  
        const hmac = crypto.createHmac('sha3-256', key).update(value.toString()).digest('hex');  
        return { key, value, hmac };  
    }
}

module.exports = HMACGenerator;
