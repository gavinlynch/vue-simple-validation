const {clone} = require('./util.js');

const initialFieldState = {
  // is the field's current different than it's initial value
  dirty: false,
  // has the field's value ever changed
  touched: false,
  valid: null,
  validationMethod: 'required'
};

/**
 * Simple container for fields tobe validated.
 * Field object: {
 *    id: {String},
 *    el: {DOM Node},
 *    value: {Mixed},
 *    validationMethod: {String}
 * }
 */
class FieldContainer {
  constructor() {
    this._fields = [];
  }

  /**
   * Add a new field to the collection, setting up default states.
   * Note: `field.value` is passed by-value vs reference.
   * @param {Object} obj New field object.
   */
  add(obj) {
    if (!this.has(obj.id) && this._isValidField(obj)) {
      // make sure to get value by-value vs reference via clone
      this._fields.push(Object.assign({}, initialFieldState, obj, {
        value: clone(obj.value),
        initialValue: clone(obj.value),
        validationMethod: obj.validationMethod || initialFieldState.validationMethod
      }));
    }
  }

  /**
   * Get the field object by ID.
   * @param {String} id The id of the field.
   * @return {Object} Field object.
   */
  get(id) {
    if (id) {
      return this._fields.find((f) => {
        return f.id === id;
      });
    }
  }

  /**
   * Get all field objects.
   * @param {String}/{Array} group A group name to filter fields from.
   * @return {Array} all fields.
   */
  all(group) {
    if (group) {
      return this._fields.filter((field) => {
        if (Array.isArray(field.group)) {
          return field.group.indexOf(group) > -1;
        }

        return field.group === group;
      });
    }

    return this._fields;
  }

  /**
   * Check if the collection has the field by id.
   * @param {String} id The field id.
   * @return {Boolean} does the collection have the field.
   */
  has(id) {
    return this._fields.filter((f) => f.id === id).length > 0;
  }

  /**
   * Check if the field object is in the proper format.
   * @param {Object} obj The field object to check.
   * @return {Boolean} is the field object properly formatted.
   */
  _isValidField(obj) {
    const valid = typeof obj === 'object' && obj.id && obj.el;
    if (!valid) {
      throw 'Not a valid field.';
    }
    return valid;
  }
}

module.exports = FieldContainer;
