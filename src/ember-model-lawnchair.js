/*global Ember, Lawnchair*/

(function() {
  'use strict';

  // A private lawn to put all of our lawnchairs (one per model type) on...
  var lawn = {};

  Ember.LawnchairAdapter = Ember.Adapter.extend({
    // Desired Lawnchair adapter(s) to use - see http://brian.io/lawnchair/adapters/
    lawnchairAdapter: ['indexed-db'],
    // a prefix for the names of the lawnchairs in storage to avoid naming collisions with other stuff in storage
    prefix: 'em_',
    createRecord: function(record) {
      var klass = record.constructor;
      var initStore = this._initStore(this._getRecordType(klass));
      return new Ember.RSVP.Promise(function(resolve, reject) {
        initStore.then(function(store) {
          var serialisedRecord = record.toJSON();
          // Lawnchair expects a field called "key" as the primary key so massage our data to fit...
          var primaryKey = Ember.get(klass, 'primaryKey');
          Ember.assert('You cannot use a field named "key" in your object unless it is the primary key',
            !serialisedRecord.key || primaryKey === 'key');
          serialisedRecord.key = record.get(primaryKey);
          store.save(serialisedRecord, function(data) {
            if (primaryKey !== 'key') {
              data[primaryKey] = data.key;
              delete data.key;
            }
            record.load(data[primaryKey], data);
            record.didCreateRecord();
            resolve(record);
          });
        });
      });
    },
    _initStore: function(type) {
      var storeName = this.prefix + type;
      var adapter = this.lawnchairAdapter;
      return new Ember.RSVP.Promise(function(resolve, reject) {
        if (!lawn[storeName]) {
          Lawnchair({name: storeName, adapter: adapter}, function(store) {
            lawn[storeName] = store;
            resolve(store);
          });
        } else {
          resolve(lawn[storeName]);
        }
      });
    },
    _getRecordType: function(klass) {
      var type = Ember.get(klass, 'url');
      Ember.assert('Ember.LawnchairAdapter requires a "url" property to be set on your models. The name is a little ' +
        'misleading but a named key is neccesary and the name "url" makes it easier to switch between this and the ' +
        'RESTAdapter', type);
      return type;
    }
  });
})();