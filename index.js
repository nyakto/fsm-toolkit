var DFA = require('./lib/dfa');

module.exports = {
    /**
     * @returns {DFA}
     */
    createDFA: function () {
        return new DFA();
    }
};
