var pkg = require('./package.json');
var loader = {};
Object.keys(pkg.dependencies).forEach(function (key) {
  if (/^(.*)-loader$/.test(key)) loader[RegExp.$1] = require.resolve(key);
});


var autoprefixer = require('autoprefixer');
var ExtractTextPlugin;
var styleBase = {
  extract: loader.css + '?sourceMap&{cssQuery}!' + loader.postcss + '?sourceMap',
  inline: loader.css + '?sourceMap&camelCase&{cssQuery}!' + loader.postcss + '?sourceMap'
};

/**
 * [exports description]
 * @param  {Object} wpc    webpack config
 * @param  {Object} env    包含 DEV、TEST 和 BUILD 两个 boolean 值
 * @param  {Object} config
 * @return {Object}
 */
module.exports = function buildStylesLoader(wpc, env, config) {
  wpc.module = wpc.module || {};
  var loaders = wpc.module.loaders = wpc.module.loaders || [];
  var plugins = wpc.plugins = wpc.plugins || [];

  config = Object.assign({
    cssFileName: env.BUILD ? '[name].[chunkHash:8].css' : '[name].bundle.css',
    cssLocalName: env.BUILD ? '[hash:base64:8]' : '[name]__[local]__[hash:base64:3]',
    isServerSide: false,
    inlineFileSize: 4096,
    browsers: ['last 5 version', 'ie >= 8'],
    postcss: [],
    sass: {},
    less: {},
    css: {}
  }, config);

  if (!config.ExtractTextPlugin) {
    throw new Error('需要传入 ExtractTextPlugin 属性，来自于模块 extract-text-webpack-plugin');
  }

  wpc.postcss = config.postcss || [];
  wpc.postcss.push(autoprefixer({browsers: config.browsers}));

  ExtractTextPlugin = config.ExtractTextPlugin;

  if (config.isServerSide) {
    loader.style = loader['isomorphic-style'];
  }

  if (!('localIdentName' in config.css)) config.css.localIdentName = config.cssLocalName;
  if (!('camelCase' in config.css)) config.css.camelCase = true;

  loaders.push(
    {
      test: /\.json$/,
      loader: loaders.json5
    },
    {
      test: /\.ya?ml$/,
      loader: loader.json5 + '!' + loader.yaml
    },
    {
      test: /\.(png|jpg|jpeg)$/,
      loader: loader.url + '?limit=' + config.inlineFileSize
    },
    {
      test: /\.(gif|svg|woff|woff2|ttf|eot|otf)$/,
      loader: loader.file
    }
  );

  var styleLoaders = [
    {
      key: 'css',
      test: /\.css$/
    },
    {
      key: 'sass',
      test: /\.s(a|c)ss$/
    },
    {
      key: 'less',
      test: /\.less$/
    }
  ];

  // extract or inline css code
  ['extract', 'inline'].forEach(function (location) {

    // make css className local or global
    ['local', 'global'].forEach(function (declaration) {

      styleLoaders.forEach(function (loaderConfig) {
        var loader = makeStyleLoader(location, declaration, loaderConfig, config);
        if (loader) loaders.push(loader);
      });

    });
  });


  // Extract css files
  // Disabled when in test mode or not in build mode
  plugins.push(new ExtractTextPlugin(config.cssFileName, {disable: env.TEST || !env.BUILD}));

  return wpc;
};


function makeStyleLoader(location, declaration, loaderConfig, config) {
  var result = {};
  var key = loaderConfig.key;

  var cssModules = declaration === 'local' ? {modules: true} : {};
  var appendDeclaration = function (prefix) {
    return declaration === 'local' ? (prefix || '') + declaration : '';
  };

  result.loader = styleBase[location]
    .replace('{cssQuery}', makeLoaderQuery(cssModules, config.css))
    // append sass or less loader
    + (key === 'css' ? '' : '!' + loader[key] + '?sourceMap&' + makeLoaderQuery(config[key]));

  if (location === 'extract') {
    result.test = appendToRegexp(loaderConfig.test, appendDeclaration('?'));
    result.loader = ExtractTextPlugin.extract(loader.style, result.loader);
  } else {
    result.test = appendToRegexp(loaderConfig.test, '?inline' + appendDeclaration('&'));
  }
  return result;
}


function makeLoaderQuery(custom, defaultConf) {
  var query = Object.assign({}, defaultConf, custom);
  return Object.keys(query).map(function (key) {
    return key + '=' + query[key];
  }).join('&');
}

function appendToRegexp(reg, append) {
  if (!append) return reg;
  return new RegExp(regexpToString(reg).replace(/(\$)?$/, regexpEscape(append) + '$1'));
}

function regexpToString(reg) {
  return reg.toString()
    .replace(/^\/|\/\w*$/g, '');
}

function regexpEscape(str) {
  return str.replace(/[-.*+?^${}()|[\]\/\\]/g, '\\$&');
}


