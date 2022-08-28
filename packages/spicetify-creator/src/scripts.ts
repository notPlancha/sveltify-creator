import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import type { ICustomAppSettings, IExtensionSettings } from './helpers/models.js'
import buildCustomApp from './buildCustomApp.js'
import buildExtension from './buildExtension.js'
import sveltePlugin from "esbuild-svelte";
import sveltePreprocess from "svelte-preprocess";
import postCssPlugin from "esbuild-plugin-postcss2/dist/index.js";
import autoprefixer from "autoprefixer";
import {exec} from "child_process";
import { externalGlobalPlugin } from 'esbuild-plugin-external-global';

const promisifiedExec = promisify(exec);

const build = async (watch: boolean, minify: boolean, outDirectory?: string) => {
  const settings: ICustomAppSettings & IExtensionSettings = JSON.parse(fs.readFileSync("./src/settings.json", 'utf-8'));
  const isExtension = !Object.keys(settings).includes("icon");
  const id = settings.nameId.replace(/-/g, 'D');

  if (isExtension) {
    console.log("Extension detected");
  } else {
    console.log("Custom App detected");
  }

  if (!outDirectory) {
    const spicetifyDirectory = await promisifiedExec("spicetify -c").then((o: any) => path.dirname(o.stdout.trim()));
    if (isExtension) {
      outDirectory = path.join(spicetifyDirectory, "Extensions");
    } else {
      outDirectory = path.join(spicetifyDirectory, "CustomApps", settings.nameId);
    }
  }

  // Create outDirectory if it doesn't exist
  if (!fs.existsSync(outDirectory)){
    fs.mkdirSync(outDirectory, { recursive: true });
  }

  const esbuildOptions = {
    platform: 'browser',
    external: ['react', 'react-dom'],
    mainFields: ["svelte", "browser", "module", "main"],

    bundle: true,
    globalName: id,
    plugins: [
      postCssPlugin.default({
        plugins: [autoprefixer],
        modules: {
          generateScopedName: `[name]__[local]___[hash:base64:5]_${id}`
        },
      }),
      sveltePlugin({
        preprocess: sveltePreprocess()
      }),
      externalGlobalPlugin({
        'react': 'Spicetify.React',
        'react-dom': 'Spicetify.ReactDOM',
      }),
      sveltePlugin({
        preprocess: sveltePreprocess()
      })
    ],
  }

  if (isExtension) {
    buildExtension(settings, outDirectory, watch, esbuildOptions, minify);
  } else {
    buildCustomApp(settings, outDirectory, watch, esbuildOptions, minify); //todo make app too
  }


  if (watch) {
    console.log('Watching...');
  }
};

export { build };
