/*! ember-model-lawnchair 0.1.0 (dev) 2013-09-19 */
(function() {
    var lawn = {};
    Ember.LawnchairAdapter = Ember.Adapter.extend({
        lawnchairAdapter: [ "indexed-db" ],
        prefix: "em_",
        createRecord: function(record) {
            var klass = record.constructor;
            var initStore = this._initStore(this._getRecordType(klass));
            return new Ember.RSVP.Promise(function(resolve, reject) {
                initStore.then(function(store) {
                    var serialisedRecord = record.toJSON();
                    var primaryKey = Ember.get(klass, "primaryKey");
                    Ember.assert('You cannot use a field named "key" in your object unless it is the primary key', !serialisedRecord.key || primaryKey === "key");
                    serialisedRecord.key = record.get(primaryKey);
                    store.save(serialisedRecord, function(savedObject) {
                        if (primaryKey != "key") {
                            savedObject[primaryKey] = savedObject.key;
                            delete savedObject.key;
                        }
                        resolve(savedObject);
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
        }
    });
})();