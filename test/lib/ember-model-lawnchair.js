/*! ember-model-lawnchair 0.1.0 (dev) 2013-09-21 */
(function() {
    "use strict";
    var lawn = {};
    var swapIds = function(klass, data) {
        var primaryKey = Ember.get(klass, "primaryKey");
        if (primaryKey !== "key") {
            data[primaryKey] = data.key;
            delete data.key;
        }
        return data;
    };
    var prepareForSave = function(klass, record) {
        var serialisedRecord = record.toJSON();
        var primaryKey = Ember.get(klass, "primaryKey");
        Ember.assert('You cannot use a field named "key" in your object unless it is the primary key', !serialisedRecord.key || primaryKey === "key");
        serialisedRecord.key = record.get(primaryKey);
        delete serialisedRecord[primaryKey];
        return serialisedRecord;
    };
    Ember.LawnchairAdapter = Ember.Adapter.extend({
        lawnchairAdapter: [ "indexed-db" ],
        prefix: "em_",
        createRecord: function(record) {
            var klass = record.constructor;
            return this._initStore(this._getRecordType(klass)).then(function(store) {
                var promise = Ember.Deferred.create();
                store.save(prepareForSave(klass, record), function(data) {
                    swapIds(klass, data);
                    record.load(data[Ember.get(klass, "primaryKey")], data);
                    record.didCreateRecord();
                    promise.resolve(record);
                });
                return promise;
            });
        },
        saveRecord: function(record) {
            var klass = record.constructor;
            return this._initStore(this._getRecordType(klass)).then(function(store) {
                var promise = Ember.Deferred.create();
                store.save(prepareForSave(klass, record), function(data) {
                    swapIds(klass, data);
                    record.didSaveRecord();
                    promise.resolve(record);
                });
                return promise;
            });
        },
        deleteRecord: function(record) {
            var klass = record.constructor;
            return this._initStore(this._getRecordType(klass)).then(function(store) {
                var promise = Ember.Deferred.create();
                store.remove(record.get(Ember.get(klass, "primaryKey")), function() {
                    record.didDeleteRecord();
                    promise.resolve(record);
                });
                return promise;
            });
        },
        find: function(record, id) {
            var klass = record.constructor;
            return this._initStore(this._getRecordType(klass)).then(function(store) {
                var promise = Ember.Deferred.create();
                store.get(id, function(loadedData) {
                    if (loadedData) {
                        swapIds(klass, loadedData);
                    } else {
                        loadedData = {};
                    }
                    record.load(id, loadedData);
                    promise.resolve(record);
                });
                return promise;
            });
        },
        findQuery: function(klass, records, params) {
            return this._initStore(this._getRecordType(klass)).then(function(store) {
                var promise = Ember.Deferred.create();
                var paramKeys = Object.keys(params);
                store.all(function(loadedData) {
                    var found = loadedData.filter(function(item) {
                        var isMatch = true;
                        paramKeys.forEach(function(key) {
                            var param = params[key];
                            var value = item[key];
                            if (Ember.typeOf(param) === "regexp") {
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
                    promise.resolve(records);
                });
                return promise;
            });
        },
        findMany: function(klass, records, ids) {
            return this._initStore(this._getRecordType(klass)).then(function(store) {
                var promise = Ember.Deferred.create();
                store.get(ids, function(data) {
                    data.forEach(function(item) {
                        swapIds(klass, item);
                    });
                    records.load(klass, data);
                    promise.resolve(records);
                });
                return promise;
            });
        },
        findAll: function(klass, records) {
            return this._initStore(this._getRecordType(klass)).then(function(store) {
                var promise = Ember.Deferred.create();
                store.all(function(data) {
                    data.forEach(function(item) {
                        swapIds(klass, item);
                    });
                    records.load(klass, data);
                    promise.resolve(records);
                });
                return promise;
            });
        },
        _initStore: function(type) {
            var storeName = this.prefix + type;
            var promise = Ember.Deferred.create();
            if (!lawn[storeName]) {
                new Lawnchair({
                    name: storeName,
                    adapter: this.lawnchairAdapter
                }, function(store) {
                    lawn[storeName] = store;
                    promise.resolve(store);
                });
            } else {
                promise.resolve(lawn[storeName]);
            }
            return promise;
        },
        _getRecordType: function(klass) {
            var type = Ember.get(klass, "url");
            Ember.assert('Ember.LawnchairAdapter requires a "url" property to be set on your models. The name is a little ' + 'misleading but a named key is neccesary and the name "url" makes it easier to switch between this and the ' + "RESTAdapter", type);
            return type;
        }
    });
})();