var gulp = require('gulp');
var config = require('laravel-elixir').config;
var Notification = require('./Notification');
var plugins = require('gulp-load-plugins')();
var utilities = require('./Utilities');
var merge = require('merge-stream');
var browserSync = require('browser-sync');

/**
 * Trigger preprocessor compilation.
 *
 * @param {mixed}  src
 * @param {object} options
 */
var triggerCompiler = function(src, options) {
    var compiler = plugins[options.plugin];
    var pluginOptions = options.pluginOptions;
    var toMaps = plugins.if(
        config.sourcemaps, plugins.sourcemaps.init()
    );

    // If we're using the Ruby version of Sass, then we need to
    // trigger the Gulp task in a slightly different manner.

    if (options.plugin == 'gulp-ruby-sass') {
        var rubySass = require('gulp-ruby-sass')(src, pluginOptions);

        stream = rubySass.pipe(toMaps);
    } else {
        stream = gulp.src(src).pipe(toMaps).pipe(compiler(pluginOptions));
    }

    return stream.on('error', function(e) {
        var message = options.compiler + ' Compilation Failed!';

        new Notification().error(e, message);

        this.emit('end');
    });
};


/**
 * Build the Gulp task.
 *
 * @param {string} name
 * @param {string} watchPath
 */
var buildTask = function(name, watchPath) {
    gulp.task(name, function() {
        var dataSet = config.collections['compile'+name];
        return merge.apply(this, dataSet.map(function(data) {
        //return merge.apply(this, config.compile[name].map(function(data) {
            var src = data.src;
            var options = data.options;


            utilities.logTask("Running " + options.compiler, data.src);

            //return triggerCompiler(data.src, options)
            return triggerCompiler(src, options)
	            .pipe(plugins.if(
                    config.autoprefix,
                    plugins.autoprefixer(config.autoprefixerOptions)
                ))
		        .pipe(plugins.pixrem.apply(this, options.pluginOptions.pixrem))
		        .pipe(plugins.if(config.sourcemaps, plugins.sourcemaps.write('.')))
		        .pipe(gulp.dest(options.output || config.cssOutput))
		        .pipe(plugins.filter('**/*.css'))
		        .pipe(browserSync.reload({stream: true}))
		        .pipe(plugins.rename(function (currentPath) {
			        if (currentPath.basename.indexOf('.min') === -1) {
				        currentPath.basename += '.min';
			        }
		        }))
		        .pipe(plugins.if(config.sourcemaps, plugins.sourcemaps.init()))
		        .pipe(plugins.minifyCss())
		        .pipe(gulp.dest(options.output || config.cssOutput))
		        .pipe(new Notification().message(options.compiler + ' Compiled!'));
        }));
    });

    return config
        .registerWatcher(name, watchPath)
        .queueTask(name);
};


module.exports = function(options) {
    var name = options.compiler.toLowerCase();
    var dir = config.assetsDir + name;
    var watchPath = dir + '/' + options.search;

    config.saveTask('compile' + name, {
        src: utilities.buildGulpSrc(options.src, dir, options.search),
        options: options
    });

    return buildTask(name, watchPath);
};
