# Simple Validation for Vue

A simple Vue.js validation plugin by gavin.b.lynch@gmail.com

## Setup

```
import Validation from './plugins/validation.js';

Vue.use(Validation, options);

Validation.add({
  customValidation: {
    message: 'Message when invalid.',
    comparison: (newer, older) => older === newer,
    validate: function (value) {
      return value === myConditions;
    },
    // optional additional states
    states: {
      pending: {
        message: 'Something is pending, please wait...',
        validate: function (value) {
          return value.isPending;
        }
      }
    }
  }
})
```

All validation states can be applied as classes (by default, can be turned off). Default classes applied are `invalid` and `pristine`.
All optional states are also applied as classes, using the key of the state as the classname.

## Usage

```
<my-component id="unique-id" v-model="myValue" v-validation="customValidation"></my-component>
```


You can optionally group fields together:

```
<my-component id="unique-id" v-model="myValue" v-validation="customValidation" data-validation-group="GroupName"></my-component>
```

## TODO
More docs
