/*! ember-model-lawnchair 0.1.0 (dev) 2013-09-20 */
(function() {
    "use strict";
    var lawn = {};
    Ember.LawnchairAdapter = Ember.Adapter.extend({
        lawnchairAdapter: [ "indexed-db" ],
        prefix: "em_",
        createRecord: function(record) {
            var klass = record.constructor;
            var swapIds = this._swapIds;
            return this._initStore(this._getRecordType(klass)).then(function(store) {
                return new Ember.RSVP.Promise(function(resolve, reject) {
                    var serialisedRecord = record.toJSON();
                    var primaryKey = Ember.get(klass, "primaryKey");
                    Ember.assert('You cannot use a field named "key" in your object unless it is the primary key', !serialisedRecord.key || primaryKey === "key");
                    serialisedRecord.key = record.get(primaryKey);
                    store.save(serialisedRecord, function(data) {
                        swapIds(klass, data);
                        record.load(data[primaryKey], data);
                        record.didCreateRecord();
                        resolve(record);
                    });
                });
            });
        },
        deleteRecord: function(record) {
            var klass = record.constructor;
            return this._initStore(this._getRecordType(klass)).then(function(store) {
                return new Ember.RSVP.Promise(function(resolve, reject) {
                    store.remove(record.get(Ember.get(klass, "primaryKey")), function() {
                        record.didDeleteRecord();
                        resolve(record);
                    });
                });
            });
        },
        find: function(record, id) {
            var klass = record.constructor;
            var swapIds = this._swapIds;
            return this._initStore(this._getRecordType(klass)).then(function(store) {
                return new Ember.RSVP.Promise(function(resolve, reject) {
                    store.get(id, function(loadedData) {
                        if (loadedData) {
                            swapIds(klass, loadedData);
                        } else {
                            loadedData = {};
                        }
                        record.load(id, loadedData);
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
                    Lawnchair({
                        name: storeName,
                        adapter: adapter
                    }, function(store) {
                        lawn[storeName] = store;
                        resolve(store);
                    });
                } else {
                    resolve(lawn[storeName]);
                }
            });
        },
        _getRecordType: function(klass) {
            var type = Ember.get(klass, "url");
            Ember.assert('Ember.LawnchairAdapter requires a "url" property to be set on your models. The name is a little ' + 'misleading but a named key is neccesary and the name "url" makes it easier to switch between this and the ' + "RESTAdapter", type);
            return type;
        },
        _swapIds: function(klass, data) {
            var primaryKey = Ember.get(klass, "primaryKey");
            if (primaryKey !== "key") {
                data[primaryKey] = data.key;
                delete data.key;
            }
            return data;
        }
    });
})();