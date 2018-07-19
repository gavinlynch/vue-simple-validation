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

module.exports = MessageContainer;
