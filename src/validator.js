const ValidationContainer = require('./src/validation-container.js');
const FieldContainer = require('./src/field-container.js');
const MessageContainer = require('./src/message-container.js');
const {clone} = require('./util.js');

/**
 * Simple validation class.
 */
class Validator {
  constructor(options = {}) {
    this.options = options;
    this.validationContainer = new ValidationContainer({fallback: options.fallbackValidation});
    this.fieldContainer = new FieldContainer();
    this.messageContainer = new MessageContainer();
  }

  /**
   * Setup a new field. Execute data function if present.
   * @param {Object} field The field object to register.
   */
  register(field) {
    const vObj = this.validationContainer.get(field.validationMethod);
    field.data = typeof vObj.data === 'function' ? vObj.data(field.value, field.el) : vObj.data;
    this.fieldContainer.add(field);
    this._validateField(this.fieldContainer.get(field.id), field.value);
    // show validation messages on initial render
    if (this.options.initialValidateAll && field.vnode.componentInstance) {
      field.vnode.componentInstance.$forceUpdate();
    }
  }

  /**
   * Determine the valid and dirty states of a given field.
   * @param {String} id The id of the field to validate.
   * @param {Mixed} value The value to validate.
   * @return {Boolean} Is the field valid?
   */
  validate(id, value) {
    if (id) {
      const field = this.fieldContainer.get(id);
      const vObj = this.validationContainer.get(field.validationMethod);

      // only validate if the field's value has comparison
      if (!vObj.comparison(value, field.value)) {
        return this._validateField(field, value);
      }
    } else {
      throw 'Unable to validate field without id.';
    }
  }

  /**
   * Return if the fields or field group are dirty, returning those that are.
   * @param {String}/{Array} If fields are using group names, limit to given name.
   * @return {Array} an array of dirty fields.
   */
  getDirty(group) {
    return this.fieldContainer.all(group).filter((field) => field.dirty);
  }

  /**
   * Return if the fields or field group are touched, returning those that are.
   * @param {String}/{Array} group If fields are using group names, limit to given name.
   * @return {Array} an array of dirty fields.
   */
  getTouched(group) {
    return this.fieldContainer.all(group).filter((field) => field.touched);
  }

  /**
   * Return any fields that have the matching state.
   * @param {String} state State to match in fields.
   * @param {String}/{Array} group If fields are using group names, limit to given name.
   * @return {Array} an array of dirty fields.
   */
  getStates(name, group) {
    return this.fieldContainer.all(group).filter((field) => field.states[name] === true);
  }

  /**
   * Validate all registered fields immediately.
   * @param {String}/{Array} group If fields are using group names, limit to given name.
   * @return {Boolean} are all fields valid?
   */
  validateAll(group, forceUpdate = false) {
    return this.fieldContainer.all(group).reduce((allValid, field) => {
      const isValid = this._validateField(field, field.value);
      // update component for anything acting on validation status in update() life-cycle method
      if (field.vnode.componentInstance && forceUpdate) {
        field.vnode.componentInstance.$forceUpdate();
      }
      return allValid && isValid;
    }, true);
  }

  /**
   * Reset all fields as not dirty.
   */
  reset() {
    this.fieldContainer.all().forEach((field) => {
      field.initialValue = field.value;
      this._validateField(field, field.value);
    });
  }

  /**
   * Validate a given field object with passed value.
   * @param {Object} field The field object to validate.
   * @param {Mixed} value The value to validate against the field.
   * @return {Boolean} Is the field valid?
   */
  _validateField(field, value) {
    const vObj = this.validationContainer.get(field.validationMethod);

    if (!field) {
      throw 'Unable to validate field: field not found.';
    }

    const changed = !vObj.comparison(field.initialValue, value);

    field = Object.assign(field, {
      value: clone(value),
      dirty: changed,
      touched: field.touched || changed,
      valid: vObj.validate(value),
      states: Object.keys(vObj.states).reduce((all, key) => {
        all[key] = vObj.states[key].validate(value, field.value, field.data);
        return all;
      }, {})
    });

    if (this.options.applyClasses) {
      !field.valid ? field.el.classList.add('invalid') : field.el.classList.remove('invalid');
      !field.dirty ? field.el.classList.add('pristine') : field.el.classList.remove('pristine');
    }

    this.messageContainer.reset(field.id);
    let messages = [];

    if (!field.valid) {
      messages.push({
        id: 'invalid',
        title: field.title,
        message: typeof vObj.message === 'function' ?
          vObj.message(value, field.value) : vObj.message
      });
    }

    // handle additional states besides valid and dirty
    Object.keys(field.states).forEach((key) => {
      // apply classes for active states
      if (this.options.applyClasses) {
        field.states[key] ? field.el.classList.add(key) : field.el.classList.remove(key);
      }

      // add messages for active states that have them
      if (field.states[key] && vObj.states[key].message) {
        messages.push({
          id: key,
          title: field.title,
          message: typeof vObj.states[key].message === 'function' ?
            vObj.states[key].message(value, field.value, field.data) : vObj.states[key].message
        });
      }
    });

    if (messages.length > 0) {
      messages.forEach((message) => {
        this.messageContainer.add(field.id, message);
      });
    }

    return field.valid;
  }
}

module.exports = Validator;
