/*global QUnit, module, Ember, asyncTest, ok, deepEqual, start, stop, Lawnchair*/

(function() {
  'use strict';
  QUnit.config.testTimeout = 1500;

  // Don't let RSVP eat all our errors!
  Ember.RSVP.configure('onerror', function(e) {
    throw e;
  });

  var PostModel;

  module('Ember.LawnchairAdapter', {
    setup: function() {
      stop();
      PostModel = Ember.Model.extend({
        id: Ember.attr(),
        title: Ember.attr()
      });
      PostModel.adapter = Ember.LawnchairAdapter.create();
      PostModel.url = 'posts';

      // Empty the IndexedDB:
      Lawnchair({name: PostModel.adapter.prefix + PostModel.url, adapter: PostModel.adapter.lawnchairAdapter}, function(store) {
        store.nuke(function() {
          start();
        });
      });
    },
    teardown: function() {
      PostModel = null;
    }
  });

  asyncTest('when a record is created with no ID an ID should be automatically set', function() {
    PostModel
      .create({title: 'Hello world'})
      .save().then(function(post) {
        ok(post.get('id'), 'ID is set');
        start();
      });
  });

  asyncTest('when a record is created with an ID that ID should be preserved', function() {
    var postJson = {id: 1, title: 'Hello world'};
    PostModel
      .create(postJson)
      .save().then(function(post) {
        ok(post.get('id'), 'ID is set');
        ok(post.get('id') === postJson.id, 'ID has same value as originally set.');
        start();
      });
  });

  asyncTest('when a record is created we should be able to find it by its id', function() {
    var postJson = {id: 1, title: 'Hello world'};
    PostModel.create(postJson)
      .save().then(function(savedPost) {

        var loadedPost = PostModel.find(postJson.id);
        Ember.loadPromise(loadedPost).then(function() {
          ok(loadedPost, 'a post is found');
          ok(loadedPost === savedPost, 'the loaded post is the same as the saved post');
          start();
        });
      });
  });

  asyncTest('when a record is created then deleted from the cache we should be still able to find it by its id', function() {
    var postJson = {id: 1, title: 'Hello world'};
    PostModel.create(postJson)
      .save().then(function(savedPost) {
        // Clear the cache so that ember-model is forced to load our object from the adapter.
        PostModel.clearCache();

        var loadedPost = PostModel.find(postJson.id);
        return Ember.loadPromise(loadedPost).then(function() {
          ok(loadedPost, 'a post is found');
          deepEqual(loadedPost.toJSON(), savedPost.toJSON(), 'the loaded post is the same as the saved post');
          start();
        });
      });
  });

  asyncTest('when a record is deleted it should be marked as deleted', function() {
    var postJson = {id: 1, title: 'Hello world'};
    PostModel.create(postJson)
      .save().then(function(savedPost) {
        savedPost.deleteRecord().then(function() {
          var loadedPost = PostModel.find(postJson.id);
          ok(loadedPost.isDeleted, 'The model isDeleted');
          start();
        });
      });
  });

  // The behaviour here is not what I would expect but seems to mirror other ember-model adapters
  // see https://github.com/ebryn/ember-model/issues/248
  asyncTest('when a record is deleted and cache is emptied nothing should be found', function() {
    var postJson = {id: 1, title: 'Hello world'};
    PostModel.create(postJson)
      .save().then(function(savedPost) {
        savedPost.deleteRecord().then(function() {
          PostModel.clearCache();
          var loadedPost = PostModel.find(postJson.id);
          return Ember.loadPromise(loadedPost).then(
            function() {
              // An empty record comes back which isn't what I would expect but the only thing I can think to test against
              // is that the title comes back empty
              ok(!loadedPost.get('title'), 'no title for the returned post');
              start();
            }
          );
        });
      });
  });

  asyncTest('when two records are created findAll should return both records', function() {
    PostModel.create({id:1, title:'Hello world'}).save()
      .then(function() {
        return PostModel.create({id:2, title:'Goodbye cruel world'}).save();
      }).then(function() {
        var records = PostModel.find();
        Ember.loadPromise(records).then(function(records) {
          equal(records.get('content').length, 2, 'There are two records');
          start();
        });
      });
  });

  asyncTest('when two records are created and one has been removed from cache findAll should return both records', function() {
    PostModel.create({id:1, title:'Hello world'}).save()
      .then(function() {
        PostModel.clearCache();
        return PostModel.create({id:2, title:'Goodbye cruel world'}).save();
      }).then(function() {
        var records = PostModel.find();
        Ember.loadPromise(records).then(function(records) {
          equal(records.get('content').length, 2, 'There are two records');
          start();
        });
      });
  });
})();
