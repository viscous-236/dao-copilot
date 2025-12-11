const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  entry: {
    "content-script/injectPanel": "./src/content-script/injectPanel.tsx",
    "injected/pageScript": "./src/injected/pageScript.ts",
    "background/listener": "./src/background/listener.ts",
    "popup/Popup": "./src/popup/Popup.tsx",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".jsx"],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "[name].css",
    }),
    new CopyPlugin({
      patterns: [
        { from: "src/injected/walletBridge.js", to: "injected/walletBridge.js" },
        { from: "src/manifest.json", to: "manifest.json" },
        { from: "public", to: "." },
      ],
    }),
  ],
  mode: process.env.NODE_ENV === "production" ? "production" : "development",
  devtool: "cheap-module-source-map",
};
