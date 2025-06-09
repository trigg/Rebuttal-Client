const path = require("path");

module.exports = {
    mode: "production",
    entry: {
        browser: path.resolve(__dirname, "src/browser.ts"),
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].bundle.js",
    },
};