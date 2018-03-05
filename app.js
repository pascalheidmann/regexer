var fs = require('fs');
var program = require('commander');
var path = require('path');

program
    .version('1.0.0')
    .option('-s, --search <term>', 'Searchterm')
    .option('-r, --replace <term>', 'Replace with')
    .option('-p, --preview', 'Preview new file names')
    .option('-R, --recursive [n]', 'Search folder and subfolders, optional to given max level', parseInt)
    .option('-e, --extended', 'Enable regular expressions')
    .option('-f, --folder <folder>', 'Starting folder')
    .option('-d, --debug', 'Show debug messages')
    .parse(process.argv);

if (!program.search) {
    console.error('\nERROR: Missing search term!');
    program.help();
}

if (typeof program.folder === 'undefined') {
    program.folder = __dirname;
}

var walk = (dir, depth, done, filter) => {
    var results = [];
    if (typeof depth === 'number') {
        if (depth <= 0) {
            return done(null, results);
        }
        depth--;
    }

    fs.readdir(dir, (err, list) => {
        if (err) {
            return done(err);
        }
        var pending = list.length;
        if (!pending) {
            return done(null, results);
        }
        list.forEach((file) => {
            file = path.resolve(dir, file);
            fs.stat(file, (err, stat) => {
                if (stat && stat.isDirectory() && (typeof depth !== 'undefined')) {
                    walk(file, depth, (err, res) => {
                        results = results.concat(res);
                        if (!--pending) {
                            done(null, results);
                        }
                    }, filter);
                } else {
                    if (filter(file)) {
                        results.push(file);
                    }
                    if (!--pending) {
                        done(null, results);
                    }
                }
            });
        });
    });
};

walk(path.resolve(program.folder), program.recursive, (err, results) => {
    if (err) {
        throw err;
    }
    results.forEach(file => {
        if (!program.replace) {
            console.log(file);
        } else {
            console.log(file, '=>', file.replace(program.search, program.replace));
            if (!program.preview) {
                fs.rename(file, file.replace(program.search, program.replace), function (err) {
                    if (err) {
                        console.log('ERROR: ' + err);
                    }
                });
            }
        }
    });
}, file => {
    return file.match(program.search)
});

//console.log(program.search, program.replace, program.preview, program.recursive, program.extended, path.resolve(program.folder));