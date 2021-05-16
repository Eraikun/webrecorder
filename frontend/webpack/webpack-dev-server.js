import Express from 'express';
import webpack from 'webpack';

import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';

import webpackConfig from './webpack.config.client.development';


const compiler = webpack(webpackConfig);

const host = process.env.APP_HOST || '127.0.0.1';
const port = (Number(process.env.FRONTEND_PORT) + 1) || 8096;

const serverOptions = {
  contentBase: `http://${host}:${port}`,
  quiet: true,
  noInfo: true,
  inline: true,
  publicPath: webpackConfig.output.publicPath,
  headers: { 'Access-Control-Allow-Origin': '*' },
  stats: { colors: true },
  watchOptions: {
    aggregateTimeout: 300,
    poll: 1000
  }
};

const app = new Express();

//app.use(require('webpack-dev-middleware')(compiler, serverOptions));
//app.use(require('webpack-hot-middleware')(compiler));

app.use(webpackDevMiddleware(compiler, {stats: { colors: true },headers: { 'Access-Control-Allow-Origin': '*' },contentBase: `http://${host}:${port}`,publicPath:webpackConfig.output.publicPath,serverSideRender:true}));
app.use(webpackHotMiddleware(compiler));
app.listen(port, (err) => {
  if (err) {
    console.error(err);
  } else {
    console.info('==> 🚧  My HotReload Webpack development server listening on port %s', port);
  }
});
