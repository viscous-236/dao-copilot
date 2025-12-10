const path = require("path");

module.exports = {
  entry: {
    "content-script/injectPanel": "./src/content-script/injectPanel.tsx",
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
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".jsx"],
  },
  mode: process.env.NODE_ENV === "production" ? "production" : "development",
  devtool: "cheap-module-source-map",
};
