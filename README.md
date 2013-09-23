#ember-model-lawnchair

A simple adapter for [ember-model](https://github.com/ebryn/ember-model) so that it can load and save data to
[Lawnchair](http://brian.io/lawnchair).

My main motivation for building this is to be able to save data using Lawnchair's
[IndexedDB](https://developer.mozilla.org/en-US/docs/IndexedDB) adapter so that is what is tested. I could have built an
adapter directly for IndexedDB and may do so but I thought there would be more value-add in a Lawnchair adapter which
can fall back on other storage mechanisms when IndexedDB isn't available.

##Use

Just include the relevant files in your HTML (after ember and ember-model but before your app):

    <script src="lib/lawnchair/lawnchair.js"></script>
    <script src="lib/lawnchair/indexed-db.js"></script>
    <script src="lib/ember-model-lawnchair.js"></script>


Then set your `Ember.Model.Adapter` to `Ember.Lawnchair.create()` and set a URL property like so:

    PostModel = Ember.Model.extend({
      id: Ember.attr(),
      title: Ember.attr()
    });
    PostModel.adapter = Ember.LawnchairAdapter.create();
    PostModel.url = 'posts';

> The URL property is used to name the table for this model in IndexedDB. It could be named `table` or something more
> obvious but leaving it as `url` makes it quicker and easier to switch between this adapter and the `RESTAdapter`
> packaged with ember-model.

##Todo

There seems to be some issues with relationships which are preventing me from writing the tests for them. I've
asked for help [on the ember-model repo](https://github.com/ebryn/ember-model/pull/249) and will finish up once that is
resolved.

##Build

The library is built with [grunt](http://gruntjs.com). Make you have installed `grunt-cli` (npm install -g grunt-cli`)
then install all npm dependencies for this project (`npm install`).

Now there are a few targets available:

    grunt dist # build a release version in /dist
    grunt develop # watch for changes to the files and allow running of tests in the browser (at http://0.0.0.0:8000/)
    grunt # lint then build a test version and run tests in PhantomJS (see below)

**Note** that since IndexedDB is [not yet available](https://github.com/ariya/phantomjs/issues/10992) in PhantomJS and
I haven't added fallback Lawnchair adapters the tests don't currently run from the Grunt build. They pass in the
browser however.