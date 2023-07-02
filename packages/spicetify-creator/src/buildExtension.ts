import glob from 'glob'
import chalk from 'chalk';
import fs from 'fs'
import path from 'path'
import type { IExtensionSettings } from './helpers/models.js'
import { minifyCSS, minifyFile, minifyFolder } from './helpers/minify';
import esbuild from "esbuild";

export default async (settings: IExtensionSettings, outDirectory: string, watch: boolean, esbuildOptions: any, minify: boolean) => {
  // const extension = path.join("./src/", "app.tsx")
  // const extensionName = path.basename(extension.substring(0, extension.lastIndexOf(".")));
  const compiledExtension = path.join(outDirectory, `${settings.nameId}.js`);
  const compiledExtensionCSS = path.join(outDirectory, `${settings.nameId}.css`);

  const appPath = path.resolve(await glob.sync('./src/*(app.ts|app.tsx|app.js|app.jsx|app.svelte)')[0]);
  const __dirname = path.resolve();
  const tempFolder = path.join(__dirname,`./temp/`);
  const indexPath = path.join(tempFolder,`index.jsx`);

  if (!fs.existsSync(tempFolder))
    fs.mkdirSync(tempFolder)
  fs.writeFileSync(indexPath, `
import main from \'${appPath.replace(/\\/g, "/")}\'

(async () => {
  await main()
})();
  `.trim())

  esbuild.build({
    entryPoints: [indexPath],
    outfile: compiledExtension,
    ...esbuildOptions,
    watch: (watch ? {
      async onRebuild(error: any, result: any) {
        if (error)
          console.error(error)
        else {
          await afterBundle();
        }
      },
    } : undefined),
  }).then(async (r: any) => {
    await afterBundle();
    return r;
  })

  const afterBundle = async () => {
    if (fs.existsSync(compiledExtensionCSS)) {
      console.log("Bundling css and js...");

      let css = fs.readFileSync(compiledExtensionCSS, "utf-8");
      if (minify) {
        css = await minifyCSS(css);
      }

      fs.rmSync(compiledExtensionCSS);
      fs.appendFileSync(compiledExtension, `
  
  (async () => {
    if (!document.getElementById(\`${esbuildOptions.globalName}\`)) {
      var el = document.createElement('style');
      el.id = \`${esbuildOptions.globalName}\`;
      el.textContent = (String.raw\`
  ${css}
      \`).trim();
      document.head.appendChild(el);
    }
  })()
  
      `.trim());
    }

    if (minify) {
      console.log("Minifying...");
      await minifyFile(compiledExtension);
    }

    console.log(chalk.green('Build succeeded.'));
    if (fs.existsSync(tempFolder)){
      fs.rmSync(tempFolder, {recursive: true})
    }
  }
}
