# build-styles-loader

每次写 webpack 配置，都需要写 style, css, sass, less, yaml, json, file, url 等这些 loader，
而且在不同的环境写配置还不一样，感觉有点麻烦。所以我写了此插件，你只需要这样配置 webpack.config.js 文件

```js
var buildStylesLoader = require('build-styles-loader');

// 环境变量，buildStylesLoader 需要，它会根据不同的环境生成不同的配置
var nodeEnv = process.env.NODE_ENV || 'development';
var env = {
  DEV: /dev/i.test(nodeEnv),
  BUILD: /(build|prod)/i.test(nodeEnv),
  TEST: /test/i.test(nodeEnv),
};

var webpackConfig = {
  // ...
};

// loaders 需要的一些配置
var config = {
  ExtractTextPlugin: require('extract-text-webpack-plugin'), // 必传的一个属性
  cssFileName: 'xxx.css',  // 使用 `extract-text-webpack-plugin` 生成的 css 文件的名称
  cssLocalName: '', // 指定 local 的名称，如果不配置会使用默认的配置
  isServerSide: false, // 如果是服务端渲染，则不需要生成 css，只需要 css local 名称即可
  inlineFileSize: 4096, // 如果图片文件小于指定的大小，会内嵌在样式中
  browsers: ['last 5 version', 'ie >= 8'], // 传给 autoprefixer 用的
  postcss: [], // postcss 的插件，默认会添加 autoprefixer
  sass: {}, // sass-loader 需要的配置
  less: {}, // less-loader 需要的配置
  css: {} // css-loader 需要的配置
};

module.exports = buildStylesLoader(webpackConfig, env, config);
```

上面的配置文件会生成几种不同类型的 loader，这里以 sass 为例（css 和 less 也一样）

```
// 样式是全局的，并在 BUILD 模式下样式会抽取成一个单独的文件
require('foo.scss');

// 样式是局部的，在 BUILD 模式下也会抽取成一个单独的文件
var local = require('foo.scss?local');

// 样式是全局的，在 BUILD 模式下样式不会抽取成一个单独的文件
require('foo.scss?inline');

// 样式是局部的，在 BUILD 模式下样式不会抽取成一个单独的文件
require('foo.scss?inline&local');
```



