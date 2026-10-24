const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const htmlSource = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const cssSource = fs.readFileSync(path.join(rootDir, 'css', 'styles.css'), 'utf8');
const parsersBundle = fs.readFileSync(path.join(rootDir, 'dist', 'parsers.bundle.js'), 'utf8');
const parsersJs = fs.readFileSync(path.join(rootDir, 'js', 'parsers.js'), 'utf8');
const appJs = fs.readFileSync(path.join(rootDir, 'js', 'app.js'), 'utf8');

// Replace external CSS link with inline <style>
let standaloneHtml = htmlSource.replace(
  '<link rel="stylesheet" href="css/styles.css">',
  `<style>\n${cssSource}\n</style>`
);

// Replace external script tags with inlined scripts
const scriptsBlock = `
  <!-- Inlined Standalone Parsers & App Controller -->
  <script>
${parsersBundle}
  </script>
  <script>
${parsersJs}
  </script>
  <script>
${appJs}
  </script>
`;

standaloneHtml = standaloneHtml.replace(
  /<!-- Standalone Parsers Bundle[\s\S]*?<script src="js\/app\.js"><\/script>/,
  scriptsBlock
);

const outPath = path.join(rootDir, 'prompter-standalone.html');
fs.writeFileSync(outPath, standaloneHtml, 'utf8');
console.log(`Successfully generated standalone HTML: ${outPath} (${(fs.statSync(outPath).size / 1024).toFixed(1)} KB)`);
