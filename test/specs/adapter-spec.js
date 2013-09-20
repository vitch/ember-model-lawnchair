/*global QUnit, module, Ember, asyncTest, ok, start*/

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
      PostModel = Ember.Model.extend({
        id: Ember.attr(),
        title: Ember.attr()
      });
      PostModel.adapter = Ember.LawnchairAdapter.create();
      PostModel.url = 'posts';
    },
    teardown: function() {

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
          ok(loadedPost === savedPost, 'the loaded post is the same as the saved post');
          start();
        });
      });
  });

  asyncTest('when a record is created then deleted from the cache we should be still able to find it by its id', function() {
    var postJson = {id: 1, title: 'Hello world'};
    var createdPost = PostModel.create(postJson);
    createdPost.on('didCreateRecord', function() {
      PostModel.clearCache();

      var loadedPost = PostModel.find(postJson.id);
      Ember.loadPromise(loadedPost).then(function() {
        ok(loadedPost, 'a post is found');
        ok(loadedPost === createdPost, 'the loaded post is the same as the saved post');
        start();
      });
    });
    createdPost.save();
  });
})();
