var gulp    = require('gulp');
var config  = require('btpoe-elixir').config;
var _       = require('underscore');


/*
 |----------------------------------------------------------------
 | Automated Testing
 |----------------------------------------------------------------
 |
 | This task will setup a watcher to run your automated tests on
 | every file change you make. You will get notified of the
 | result of the test suite each time tests are executed.
 |
 */

gulp.task('tdd', function() {
    var srcPaths = config.watchers.tdd;
    var tasksToRun = _.intersection(config.tasks, _.keys(srcPaths));

    tasksToRun.forEach(function(task) {
        gulp.watch(srcPaths[task], [task]);
    });

    gulp.watch(config.srcDir + '/**/*.php', tasksToRun);
});
