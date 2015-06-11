var FSM = require('./fsm');
var StateSet = require('./stateSet');
var util = require('util');

/**
 * @constructor
 * @extends FSM
 * @property {Object<string, Object<string, string>>} transitions
 */
function DFA() {
    FSM.call(this);
    this.transitions = {};
}
util.inherits(DFA, FSM);

/**
 * @param {State} src
 * @param {string} symbol
 * @param {State} dst
 */
DFA.prototype.addTransition = function (src, symbol, dst) {
    addTransition(this.transitions, src.id, symbol, dst.id);
};

/**
 * @param {State} [state]
 * @returns {DFAWalker}
 */
DFA.prototype.walker = function (state) {
    if (typeof state === 'undefined') {
        state = this.initialState;
    }
    return new DFAWalker(this, state);
};

/**
 * @returns {DFA}
 * @param {object} [options]
 * @param {DFA~minimizeCompareCallback} options.compare
 * @param {DFA~minimizeMergeCallback} options.merge
 */
DFA.prototype.minimize = function (options) {
    options = options || {};
    var compare = options.compare || defaultCompareCallback;
    var merge = options.merge || defaultMergeCallback;
    var result = new DFA();
    var reachable = findReachableStates(this);
    var reverseTransitions = reverseTransitionsMap(this.transitions, reachable);
    var queue = [];
    var processedStates = new StateSet();
    var finalStates = findFinalStates(this, reachable);

    if (finalStates.isEmpty()) {
        return result;
    }

    var old2new = {};

    queue.push(finalStates);
    while (queue.length > 0) {
        var states = queue.shift();
        processedStates.addAll(states);
        var equalityClasses = splitByEquality(states, reverseTransitions, compare);
        for (var i = 0; i < equalityClasses.length; ++i) {
            var equalityClass = equalityClasses[i];
            var newState = equalityClass.contains(this.initialState) ? result.initialState : result.createState();
            if (this.isFinalState(equalityClass.getAny())) {
                result.markStateAsFinal(newState);
            }
            merge(equalityClass, newState);
            var inputStates = new StateSet();
            equalityClass.forEach(function (state) {
                old2new[state.id] = newState;
                if (reverseTransitions.hasOwnProperty(state.id)) {
                    var inputTransitions = reverseTransitions[state.id];
                    for (var symbol in inputTransitions) {
                        if (inputTransitions.hasOwnProperty(symbol)) {
                            var inputState = this.states.findById(inputTransitions[symbol]);
                            if (!processedStates.contains(inputState)) {
                                inputStates.add(inputState);
                            }
                        }
                    }
                }
            }, this);
            if (!inputStates.isEmpty()) {
                queue.push(inputStates);
            }
        }
    }

    for (var src in this.transitions) {
        if (this.transitions.hasOwnProperty(src)) {
            var transitions = this.transitions[src];
            if (!old2new.hasOwnProperty(src)) {
                continue;
            }
            var newSrc = old2new[src];
            for (var symbol in transitions) {
                if (transitions.hasOwnProperty(symbol)) {
                    var dst = transitions[symbol];
                    if (!old2new.hasOwnProperty(dst)) {
                        continue;
                    }
                    var newDst = old2new[dst];
                    result.addTransition(newSrc, symbol, newDst);
                }
            }
        }
    }

    return result;
};

/**
 * this callback is applied to check if two states can be merged (in case of equality by transitions map)
 * @callback DFA~minimizeCompareCallback
 * @param {State} a
 * @param {State} b
 * @returns {boolean} true if states a and b are equal, false otherwise
 */
function defaultCompareCallback(a, b) {
    return true;
}

/**
 * this callback is applied to transfer properties of old states to created one
 * @callback DFA~minimizeMergeCallback
 * @param {State[]} oldStates equal states from old DFA
 * @param {State} newState created state from minimized DFA
 */
function defaultMergeCallback(oldStates, newState) {
}

/**
 * @param {DFA} dfa
 * @returns {StateSet}
 */
function findReachableStates(dfa) {
    var result = new StateSet();
    var queue = [];

    function add(state) {
        if (result.add(state)) {
            queue.push(state);
        }
    }

    add(dfa.initialState);

    while (queue.length > 0) {
        var state = queue.shift();
        if (dfa.transitions.hasOwnProperty(state.id)) {
            var transitions = dfa.transitions[state.id];
            for (var symbol in transitions) {
                if (transitions.hasOwnProperty(symbol)) {
                    add(dfa.states.findById(transitions[symbol]));
                }
            }
        }
    }

    return result;
}

/**
 * @param {Object<string, Object<string, string>>} transitions
 * @param {StateSet} states
 * @returns {Object<string, Object<string, string>>}
 */
function reverseTransitionsMap(transitions, states) {
    var result = {};

    for (var src in transitions) {
        if (transitions.hasOwnProperty(src) && states.containsId(src)) {
            var srcTransitions = transitions[src];
            for (var symbol in srcTransitions) {
                if (srcTransitions.hasOwnProperty(symbol)) {
                    var dst = srcTransitions[symbol];
                    if (states.containsId(dst)) {
                        addTransition(result, dst, symbol, src);
                    }
                }
            }
        }
    }

    return result;
}

/**
 * @param {DFA} dfa
 * @param {StateSet} states
 * @returns {StateSet}
 */
function findFinalStates(dfa, states) {
    var result = new StateSet();
    states.forEach(function (state) {
        if (dfa.isFinalState(state)) {
            result.add(state);
        }
    });
    return result;
}

/**
 * @param {StateSet} states
 * @param {Object<string, Object<string, string>>} reverseTransitions
 * @param {DFA~minimizeCompareCallback} compare
 * @returns {StateSet[]}
 */
function splitByEquality(states, reverseTransitions, compare) {
    if (states.size <= 1) {
        return [states];
    }
    var equalityClasses = {};
    states.forEach(function (state) {
        var inputSymbols = [];
        if (reverseTransitions.hasOwnProperty(state.id)) {
            var inputTransitions = reverseTransitions[state.id];
            for (var symbol in inputTransitions) {
                if (inputTransitions.hasOwnProperty(symbol)) {
                    inputSymbols.push(symbol);
                }
            }
        }
        var key = inputSymbols.sort().join();
        if (!equalityClasses.hasOwnProperty(key)) {
            equalityClasses[key] = new StateSet();
        }
        equalityClasses[key].add(state);
    });
    var result = [];
    for (var key in equalityClasses) {
        if (equalityClasses.hasOwnProperty(key)) {
            var equalityClass = equalityClasses[key];
            if (equalityClass.size > 1) {
                while (!equalityClass.isEmpty()) {
                    var state = equalityClass.getAny();
                    var newClass = new StateSet();
                    equalityClass.remove(state);
                    newClass.add(state);
                    equalityClass.forEach(function (test) {
                        if (compare(state, test)) {
                            newClass.add(test);
                        }
                    });
                    equalityClass.removeAll(newClass);
                    result.push(newClass);
                }
            } else {
                result.push(equalityClass);
            }
        }
    }
    return result;
}

/**
 * @param {Object<string, Object<string, string>>} transitions
 * @param {string} src
 * @param {string} symbol
 * @param {string} dst
 */
function addTransition(transitions, src, symbol, dst) {
    if (!transitions.hasOwnProperty(src)) {
        transitions[src] = {};
    }
    transitions[src][symbol] = dst;
}

/**
 * @param {DFA} dfa
 * @param {State} currentState
 * @constructor
 * @property {DFA} dfa
 * @property {State} currentState
 */
function DFAWalker(dfa, currentState) {
    this.dfa = dfa;
    this.currentState = currentState;
}

/**
 * @param {string} symbol
 * @returns {boolean}
 */
DFAWalker.prototype.go = function (symbol) {
    if (this.dfa.transitions.hasOwnProperty(this.currentState.id)) {
        var transitions = this.dfa.transitions[this.currentState.id];
        if (transitions.hasOwnProperty(symbol)) {
            this.currentState = this.dfa.states.findById(transitions[symbol]);
            return true;
        }
    }
    return false;
};

/**
 * @returns {boolean}
 */
DFAWalker.prototype.isInFinalState = function () {
    return this.dfa.isFinalState(this.currentState);
};

module.exports = DFA;
