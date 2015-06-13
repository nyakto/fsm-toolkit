var FSM = require('./fsm');
var StateSet = require('./stateSet');
var util = require('util');

/**
 * @constructor
 * @extends {FSM}
 * @property {Object<string, Object<string, StateSet>>} transitions
 * @property {Object<string, StateSet>} lambdaTransitions
 */
function NFA() {
    FSM.call(this);
    this.transitions = {};
    this.lambdaTransitions = {};
}
util.inherits(NFA, FSM);

/**
 * @param {State} src
 * @param {string} symbol
 * @param {State} dst
 */
NFA.prototype.addTransition = function (src, symbol, dst) {
    if (!this.transitions.hasOwnProperty(src.id)) {
        this.transitions[src.id] = {};
    }
    var srcTransitions = this.transitions[src.id];
    if (!srcTransitions.hasOwnProperty(symbol)) {
        srcTransitions[symbol] = new StateSet();
    }
    srcTransitions[symbol].add(dst);
};

/**
 * @param {State} src
 * @param {State} dst
 */
NFA.prototype.addLambdaTransition = function (src, dst) {
    if (!this.lambdaTransitions.hasOwnProperty(src.id)) {
        this.lambdaTransitions[src.id] = new StateSet();
    }
    this.lambdaTransitions[src.id].add(dst);
};

module.exports = NFA;
