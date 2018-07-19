/**
 * Simple container for validation objects in the form of:
 *  ValidationContainer.add({
 *    customValidation: {
 *      message: 'Message when invalid.',
 *      validate: function (value) {
 *        return value === myConditions;
 *      }
 *    }
 *  });
 */
class ValidationContainer {
  constructor(options) {
    this._validations = {};
    this._fallback = options.fallback;
  }

  /**
   * Add new validation objects.
   * @param {Object} toAdd An object containing validatioh objects by key.
   */
  add(toAdd) {
    Object.keys(toAdd).forEach((key) => {
      const vObj = toAdd[key];

      if (this._isValidation(vObj)) {
        vObj.states = vObj.states || {};
        this._validations[key] = vObj;
      }
    });
  }

  /**
   * Get validation object by id, using the fallback if none is found.
   * @param {String} id The id of the validation object.
   * @return {Object} the validation object.
   */
  get(id) {
    var validation;
    Object.keys(this._validations).find((key) => {
      if (key === id) {
        validation = this._validations[key];
      }
    });

    if (!this._fallback && !validation) {
      throw `No known validation or fallback validation has been provided using id: ${id}`;
    }

    return Object.assign({}, this._fallback, validation);
  }

  /**
   * Determine if we have a proper validation object with: `obj.validate` and `obj.message`
   * @param {Object} obj The validation object to check.
   * @return {Boolean} if the object is valid.
   */
  _isValidation(obj) {
    const is = obj && typeof obj.validate === 'function' && typeof obj.message === 'string';
    if (!is) {
      throw 'Not a correct validation object.';
    }

    return true;
  }
}

module.exports = ValidationContainer;
