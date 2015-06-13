var DFA = require('./lib/dfa');
var NFA = require('./lib/nfa');

module.exports = {
    /**
     * @returns {DFA}
     */
    createDFA: function () {
        return new DFA();
    },

    /**
     * @returns {NFA}
     */
    createNFA: function () {
        return new NFA();
    }
};
