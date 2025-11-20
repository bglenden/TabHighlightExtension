const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const packageJson = require("./package.json");

module.exports = {
  entry: {
    content: "./src/content.ts",
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  devtool: "cheap-module-source-map", // CSP-compatible source maps
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: "manifest.json",
          to: "manifest.json",
          transform(content) {
            // Inject version from package.json into manifest.json
            const manifest = JSON.parse(content.toString());
            manifest.version = packageJson.version;
            return JSON.stringify(manifest, null, 2);
          },
        },
        { from: "icons", to: "icons" },
      ],
    }),
  ],
};
