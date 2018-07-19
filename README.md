# Simple Validation for Vue

A simple Vue.js validation plugin by gavin.b.lynch@gmail.com

## Installation

```bash
npm install --save vuejs-validation
```

## Setup

```javascript

/**
 * <input type="text" maxlength="${n}"> validation.
 */
const text = {
  // Messages can be retrieved from Validation by validation group, or by individual validation id.
  message: 'Please enter some text.',
  // Valid if validate method returns true.
  validate: (value) => value.length > 0,
  // Get element's maxlength attribute when validator is registered.
  // Data method is xecuted once, when this validator is 'registered'/added to the Validation.
  data: (value, el) => {
    return { maxLength: el.querySelector('input').maxLength };
  },
  // Validation state is updated any time the validator is triggered.
  states: {
    characterlimit: {
      message: (value, old, data) => `${data.maxLength - value.length} characters remaining.`,
      validate: (value, old, data) => value.length <= data.maxLength
    }
  }
};

// set up validation
import Validation from './plugins/validation.js';
Vue.use(Validation);
Validation.add({ textarea });
```

All validation states can be applied as classes (by default, can be turned off). Default classes applied are `invalid` and `pristine`.
All optional states are also applied as classes, using the key of the state as the classname.

## Usage

```html
<my-component id="unique-id" v-model="myValue" v-validation="customValidation"></my-component>
```

You can optionally group fields together:

```html
<my-component id="unique-id" v-model="myValue" v-validation="customValidation" data-validation-group="GroupName"></my-component>
```

## TODO
More docs
