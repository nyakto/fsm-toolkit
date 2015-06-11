/**
 * @constructor
 * @property {number} size
 */
function StateSet() {
    this._states = {};
    this.size = 0;
}

/**
 * @param {State} state
 */
StateSet.prototype.add = function (state) {
    if (!this.contains(state)) {
        this._states[state.id] = state;
        this.size++;
        return true;
    }
    return false;
};

/**
 * @param {StateSet} states
 */
StateSet.prototype.addAll = function (states) {
    states.forEach(function (state) {
        this.add(state);
    }, this);
};

/**
 * @param {State} state
 */
StateSet.prototype.remove = function (state) {
    if (this.contains(state)) {
        delete this._states[state.id];
        this.size--;
        return true;
    }
    return false;
};

/**
 * @param {StateSet} states
 */
StateSet.prototype.removeAll = function (states) {
    states.forEach(function (state) {
        this.remove(state);
    }, this);
};

/**
 * @returns {State}
 */
StateSet.prototype.getAny = function () {
    for (var id in this._states) {
        if (this._states.hasOwnProperty(id)) {
            return this._states[id];
        }
    }
    return null;
};

/**
 * @param {State} state
 * @returns {boolean}
 */
StateSet.prototype.contains = function (state) {
    return this._states.hasOwnProperty(state.id);
};

/**
 * @param {string} stateId
 * @returns {boolean}
 */
StateSet.prototype.containsId = function (stateId) {
    return this._states.hasOwnProperty(stateId);
};

/**
 * @param {string} id
 * @returns {State}
 */
StateSet.prototype.findById = function (id) {
    return this._states[id];
};

/**
 * @returns {boolean}
 */
StateSet.prototype.isEmpty = function () {
    return this.size === 0;
};

/**
 * @param {StateSet~forEachCallback} callback
 * @param {*} [context]
 */
StateSet.prototype.forEach = function (callback, context) {
    for (var id in this._states) {
        if (this._states.hasOwnProperty(id)) {
            callback.call(context, this._states[id]);
        }
    }
};

/**
 * @callback StateSet~forEachCallback
 * @param {State} state
 */

module.exports = StateSet;
