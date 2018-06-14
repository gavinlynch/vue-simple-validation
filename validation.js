// poor man's deep clone..
const clone = (obj) => {
  obj = typeof obj !== 'undefined' ? obj : '';
  return JSON.parse(JSON.stringify(obj));
};

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

/**
 * Simple Message container.
 * Messages are sorted by an object with field-name keys,
 * containing arrays of messages objects whose ID's are the
 * name of the validation method that failed.
 *
 * Message object format:
 * {
 *   id: {String},
 *   messageId: {String},
 *   message: {String}
 * }
 */
class MessageContainer {
  constructor() {
    this._messages = {};
  }

  /**
   * Add an message to the container.
   * @param {String} fieldId The id of the field.
   * @param {Object} obj The message object to add.
   */
  add(fieldId, obj) {
    this._messages[fieldId] = this._messages[fieldId] || [];
    this._messages[fieldId].push({
      id: obj.id,
      title: obj.title,
      message: obj.message
    });
  }

  /**
   * Reset the messages for a given field.
   * @param {String} fieldId The id of the field.
   */
  reset(fieldId) {
    this._messages[fieldId] = [];
  }

  /**
   * Get the first message that occured validating the given field.
   * @param {String} fieldId The id of the field.
   * @param {String} name The the name of the state in the field.
   * @return {Object} An message object.
   */
  get(fieldId, name) {
    if (this._messages[fieldId]) {
      return this._messages[fieldId].find((m) => m.id === name);
    }
  }

  /**
   * Get the first message that occured validating the given field.
   * @param {String} fieldId The id of the field.
   * @return {Object} An message object.
   */
  first(fieldId) {
    return this._messages[fieldId] ? this._messages[fieldId][0] : undefined;
  }

  /**
   * Get all messages.
   * @return {Object} all messages.
   */
  all() {
    return Object.keys(this._messages).reduce((all, key) => {
      if (this._messages[key] instanceof Array && this._messages[key].length > 0) {
        all[key] = this._messages[key];
      }
      return all;
    }, {});
  }
}

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
    this._validateField(validator.fieldContainer.get(field.id), field.value);
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

const getDirectiveValue = function (vnode) {
  // if a component is bound with a v-model
  if (vnode.data.model) {
    return vnode.data.model.value;
  // a non-component
  } else if (vnode.data.domProps) {
    return vnode.data.domProps.value;
  }
};

const canValidateField = function (field) {
  // false validationMethod property is a way to cancel validation attempt
  // from calling component/element
  return field.id && field.validationMethod !== false;
};

/**
 * Marry the validator with Vue.js Directives.
 */
const Directive = {
  /**
   * Add fields to validator when directives are first bound
   */
  bind: function (el, binding, vnode) {
    const field = {
      id: el.getAttribute('id') || vnode.data.attrs['data-validation-id'],
      title: vnode.data.attrs['data-validation-title'],
      el: el,
      value: getDirectiveValue(vnode),
      validationMethod: binding.value,
      vnode: vnode,
      group: vnode.data.attrs['data-validation-group']
    };

    if (canValidateField(field)) {
      validator.register(field);
    }
  },

  /**
   * As field values update, re-validate
   */
  componentUpdated: function (el, binding, vnode) {
    const id = el.getAttribute('id') || vnode.data.attrs['data-validation-id'],
          value = getDirectiveValue(vnode);

    if (validator.fieldContainer.has(id)) {
      validator.validate(id, value);
    }
  }
};

/**
 * Vue Plugin instance for Validation.
 * Use as:
 *  import Validation from './plugins/validation.js';
 *  Vue.use(Validation, options);
 *  Validation.add({
 *    customValidation: {
 *      message: 'Message when invalid.',
 *      comparison: (newer, older) => older === newer,
 *      validate: function (value) {
 *        return value === myConditions;
 *      },
 *      // optional additional states
 *      states: {
 *        pending: {
 *          message: 'Something is pending, please wait...',
 *          validate: function (value) {
 *            return value.isPending;
 *          }
 *        }
 *      }
 *    }
 *  });
 *
 *  <my-component v-model="myValue" v-validation="customValidation"
 *      :data-validation-id="unique-id"></my-component>
 *
 *  can optionally group fields together:
 *
 *  <my-component v-model="myValue" v-validation="customValidation"
 *      :data-validation-id="unique-id" data-validation-group="GroupName"></my-component>
 */

let validator;

const defaultValidationMethods = {
  required: {
    message: 'This field is required.',
    comparison: (newer, older) => {
      if (typeof older === 'object') {
        // This is kind of hacky, but true object equality is hard to determine,
        // so comparison of the serialized properties is a shortcut for our purposes.
        return JSON.stringify(older) === JSON.stringify(newer);
      } else {
        return older === newer;
      }
    },
    validate: function (val) {
      if (typeof val === 'string') {
        return val.trim() !== '';
      } else if (Array.isArray(val)) {
        return val.length > 0;
      } else if (typeof val === 'object') {
        return Object.keys(val).length > 0;
      }
      return !!val;
    }
  }
};

const defaultOptions = {
  applyClasses: true,
  initialValidateAll: false,
  fallbackValidation: defaultValidationMethods.required
};

const Plugin = {
  install(Vue, options = {}) {
    // create validator and set up defaults
    validator = validator || new Validator(Object.assign(defaultOptions, options));
    validator.validationContainer.add(defaultValidationMethods);
    // set up directive
    Vue.directive('validation', Directive);
    // set up instance methods
    Vue.prototype.$validation = {
      validate: (f, v) => validator.validate(f, v),
      validateAll: (group, force) => validator.validateAll(group, force),
      getDirty: (group) => validator.getDirty(group),
      getTouched: (group) => validator.getTouched(group),
      getStates: (state, group) => validator.getStates(state, group),
      reset: () => validator.reset(),
      fields: {
        get: (id) => validator.fieldContainer.get(id),
        all: (group) => validator.fieldContainer.all(group),
      },
      messages: {
        get: (id, name) => validator.messageContainer.get(id, name),
        first: (id) => validator.messageContainer.first(id),
        all: (group) => validator.messageContainer.all(group)
      }
    };
  },

  add(toAdd) {
    validator.validationContainer.add(toAdd);
  },

  config(options) {
    Object.assign(validator.options, options);
  }
};

export default Plugin;
