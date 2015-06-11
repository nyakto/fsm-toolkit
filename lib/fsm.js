var StateSet = require('./stateSet');

/**
 * @constructor
 * @property {State} initialState
 * @property {StateSet} states
 * @property {StateSet} finalStates
 */
function FSM() {
    this._stateIdCounter = 0;
    this.states = new StateSet();
    this.finalStates = new StateSet();
    this.initialState = this.createState();
}

/**
 * @returns {State}
 */
FSM.prototype.createState = function () {
    var state = new State(this._stateIdCounter++);
    this.states.add(state);
    return state;
};

/**
 * @param {State} state
 * @param {boolean} [value=true]
 */
FSM.prototype.markStateAsFinal = function (state, value) {
    value = typeof value === 'undefined' ? true : Boolean(value);
    if (value) {
        this.finalStates.add(state);
    } else {
        this.finalStates.remove(state);
    }
};

/**
 * @param {State} state
 */
FSM.prototype.isFinalState = function (state) {
    return this.finalStates.contains(state);
};

/**
 * @constructor
 * @property {string} id unique identifier of the state
 * @param {number} id
 */
function State(id) {
    this.id = String(id);
}

State.prototype.toString = function () {
    return 'state #' + this.id;
};

module.exports = FSM;
