/* eslint-disable no-undef */
const path = require('path');
const meta = require("./package.json");

//const babel = require("rollup-plugin-babel");
const {eslint} = require("rollup-plugin-eslint");
const resolve = require("rollup-plugin-node-resolve");
const commonjs = require("rollup-plugin-commonjs");
const replace = require("rollup-plugin-replace");
const {terser} = require("rollup-plugin-terser");
const sass = require("rollup-plugin-sass");
const serve = require("rollup-plugin-serve");
const livereload = require("rollup-plugin-livereload");
const json = require("rollup-plugin-json");
const visualizer = require("rollup-plugin-visualizer");
const trash = require("rollup-plugin-delete");
const copy = require("rollup-plugin-copy");

const copyright = `// ${meta.homepage} v${meta.version} Copyright ${(new Date).getFullYear()} ${meta.author.name}`;

module.exports = ((chartName, chartNameLower, dirName, dir) => ({
  input: {
    [chartNameLower || meta.name]: path.resolve(__dirname,'src/index.js')
  },
  output: {
    name: chartName || meta.name,
    dir: (dir || "build"),
    format: "umd",
    banner: copyright,
    sourcemap: true
  },
  external: ["mobx", "Vizabi", "VizabiSharedComponents"],
  plugins: [
    !dir && trash({
      targets: ['build/*']
    }),
    copy({
      targets: [{
        src: [path.resolve(__dirname,"src/assets")],
        dest: dir || "build"
      }]
    }),
    resolve(),
    (process.env.NODE_ENV === "production" && eslint()),
    // babel({
    //   exclude: "node_modules/**"
    // }),
    commonjs(),
    sass({
      include: path.resolve(__dirname,"src/**/*.scss"),
      output: (dir || "build") + "/" + (chartNameLower || meta.name) + ".css",
    }),
    json(),
    replace({
      ENV: JSON.stringify(process.env.NODE_ENV || "development")
    }),
    (process.env.NODE_ENV === "production" && terser({output: {preamble: copyright}})),
    (process.env.NODE_ENV === "devserver" && serve("build")),
    (process.env.NODE_ENV === "devserver" && livereload("build")),
    visualizer({
      filename: "./build/stats.html"
    }),
  ]
})).bind(null, 'BarrankChart', 'barrankchart', __dirname);
