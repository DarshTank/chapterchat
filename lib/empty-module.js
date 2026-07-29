const dummyPath = {
  parse: function (p) {
    return { root: '', dir: '', base: p || '', ext: '', name: p || '' };
  },
  dirname: function (p) { return p || ''; },
  basename: function (p) { return p || ''; },
  extname: function (p) { return ''; },
  join: function () {
    const args = Array.prototype.slice.call(arguments);
    return args.join('/');
  },
  resolve: function (p) { return p || ''; },
  isAbsolute: function () { return false; },
  sep: '/',
  delimiter: ':',
  readFile: function (p, cb) { if (typeof cb === 'function') cb(null, new Uint8Array()); },
  readFileSync: function () { return new Uint8Array(); },
  existsSync: function () { return false; },
  statSync: function () { return { isDirectory: function() { return false; } }; },
};

dummyPath.posix = dummyPath;
dummyPath.win32 = dummyPath;
dummyPath.default = dummyPath;

module.exports = dummyPath;
