/*global Ember, Lawnchair*/

(function() {
  'use strict';

  // A private lawn to put all of our lawnchairs (one per model type) on...
  var lawn = {};

  // Lawnchair insists on using a key called "key" and adding it to our object. This swaps it back into the proper
  // primaryKey selected for the object
  var swapIds = function(klass, data) {
    var primaryKey = Ember.get(klass, 'primaryKey');
    if (primaryKey !== 'key') {
      data[primaryKey] = data.key;
      delete data.key;
    }
    return data;
  };

  var prepareForSave = function(klass, record) {
    var serialisedRecord = record.toJSON();
    // Lawnchair expects a field called "key" as the primary key so massage our data to fit...
    var primaryKey = Ember.get(klass, 'primaryKey');
    Ember.assert('You cannot use a field named "key" in your object unless it is the primary key',
      !serialisedRecord.key || primaryKey === 'key');
    serialisedRecord.key = record.get(primaryKey);
    return serialisedRecord;
  };

  Ember.LawnchairAdapter = Ember.Adapter.extend({
    // Desired Lawnchair adapter(s) to use - see http://brian.io/lawnchair/adapters/
    lawnchairAdapter: ['indexed-db'],
    // a prefix for the names of the lawnchairs in storage to avoid naming collisions with other stuff in storage
    prefix: 'em_',
    createRecord: function(record) {
      var klass = record.constructor;
      return this._initStore(this._getRecordType(klass)).then(function(store) {
        return new Ember.RSVP.Promise(function(resolve, reject) {
          store.save(prepareForSave(klass, record), function(data) {
            swapIds(klass, data);
            record.load(data[Ember.get(klass, 'primaryKey')], data);
            record.didCreateRecord();
            resolve(record);
          });
        });
      });
    },
    saveRecord: function(record) {
      var klass = record.constructor;
      return this._initStore(this._getRecordType(klass)).then(function(store) {
        return new Ember.RSVP.Promise(function(resolve, reject) {
          store.save(prepareForSave(klass, record), function(data) {
            swapIds(klass, data);
            record.didSaveRecord();
            resolve(record);
          });
        });
      });
    },
    deleteRecord: function(record) {
      var klass = record.constructor;
      return this._initStore(this._getRecordType(klass)).then(function(store) {
        return new Ember.RSVP.Promise(function(resolve, reject) {
          store.remove(record.get(Ember.get(klass, 'primaryKey')), function() {
            record.didDeleteRecord();
            resolve(record);
          });
        });
      });
    },
    find: function(record, id) {
      var klass = record.constructor;
      return this._initStore(this._getRecordType(klass)).then(function(store) {
        return new Ember.RSVP.Promise(function(resolve, reject) {
          store.get(id, function(loadedData) {
            if (loadedData) {
              swapIds(klass, loadedData);
            } else {
              // Weird behaviour but seems similar to what's implemented in current ember-model classes
              // see https://github.com/ebryn/ember-model/issues/248
              loadedData = {};
            }
            record.load(id, loadedData);
            resolve(record);
          });
        });
      });
    },
    findQuery: function(klass, records, params) {
      return this._initStore(this._getRecordType(klass)).then(function(store) {
        return new Ember.RSVP.Promise(function(resolve, reject) {
          var paramKeys = Object.keys(params);
          store.all(function(loadedData) {
            var found = loadedData.filter(function(item) {
              var isMatch = true;
              paramKeys.forEach(function(key) {
                var param = params[key];
                var value = item[key];
                if (Ember.typeOf(param) === 'regexp') {
                  if (!value.match(param)) {
                    isMatch = false;
                  }
                } else {
                  if (value !== param) {
                    isMatch = false;
                  }
                }
              });
              return isMatch;
            });
            found.forEach(function(data) {
              return swapIds(klass, data);
            });
            records.load(klass, found);
            resolve(records);
          });
        });
      });
    },
    findMany: function(klass, records, ids) {
      return this._initStore(this._getRecordType(klass)).then(function(store) {
        return new Ember.RSVP.Promise(function(resolve, reject) {
          store.get(ids, function(data) {
            data.forEach(function(item) {
              swapIds(klass, item);
            });
            records.load(klass, data);
            resolve(records);
          });
        });
      });
    },
    findAll: function(klass, records) {
      return this._initStore(this._getRecordType(klass)).then(function(store) {
          return new Ember.RSVP.Promise(function(resolve, reject) {
            store.all(function(data) {
              data.forEach(function(item) {
                swapIds(klass, item);
              });
              records.load(klass, data);
              resolve(records);
            });
          });
      });
    },
    _initStore: function(type) {
      var storeName = this.prefix + type;
      var adapter = this.lawnchairAdapter;
      return new Ember.RSVP.Promise(function(resolve, reject) {
        if (!lawn[storeName]) {
          new Lawnchair({name: storeName, adapter: adapter}, function(store) {
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