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
      ok(post.id, 'ID is set');
      start();
    });
});

asyncTest('when a record is created with an ID that ID should be preserved', function() {
  var postJson = {id: 1, title: 'Hello world'}
  PostModel
    .create(postJson)
    .save().then(function(post) {
      ok(post.id, 'ID is set');
      ok(post.id === postJson.id, 'ID has same value as originally set.')
      start();
    });
});