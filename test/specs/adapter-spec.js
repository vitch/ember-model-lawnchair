QUnit.config.testTimeout = 5000;

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
  var postJson = {id: 1, title: 'Hello world'}
  PostModel
    .create(postJson)
    .save().then(function(post) {
      ok(post.get('id'), 'ID is set');
      ok(post.get('id') === postJson.id, 'ID has same value as originally set.')
      start();
    });
});

// TODO: Also need to test this when the object isn't in the cache so that it is asynchronously loaded and the data is repopulated.
  asyncTest('when a record is created we should be able to find it by its id', function() {
    var postJson = {id: 1, title: 'Hello world'}
    PostModel
      .create(postJson)
      .save().then(function(savedPost) {

        var loadedPost = PostModel.find(postJson.id);
        Ember.loadPromise(loadedPost).then(function() {
          ok(loadedPost, 'a post is found');
          ok(loadedPost === savedPost, 'the loaded post is the same as the saved post');
          start();
        });
      });
  });