const Validator = require('./src/validator.js');

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

const defaultOptions = {
  applyClasses: true,
  initialValidateAll: false,
  fallbackValidation: defaultValidationMethods.required
};

/**
 * Plugin interface to add validators and access validation properties.
 */
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

module.exports = Plugin;
