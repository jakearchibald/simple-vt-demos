import { promises as fs } from "fs";
import path from "path";
import { Plugin } from "vite";

export function publicIndexPlugin({
  publicDir = "public",
  indexFile = "index.html",
} = {}): Plugin {
  let resolvedPublicDir: string;

  async function generateIndex() {
    const dirs = await fs.readdir(resolvedPublicDir, { withFileTypes: true });
    const links = dirs
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => `<li><a href="/${dirent.name}/">${dirent.name}</a></li>`) // link to directory
      .join("\n");

    const html = `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Index</title>
      </head>
      <body>
        <ul>
          ${links}
        </ul>
      </body>
      </html>`;

    const indexPath = path.join(resolvedPublicDir, indexFile);

    let current;

    try {
      current = await fs.readFile(indexPath, "utf8");
    } catch (e: any) {
      if (e.code !== "ENOENT") throw e;
      current = null;
    }

    if (current === html) return;
    await fs.writeFile(indexPath, html);
  }

  return {
    name: "vite-plugin-public-index",
    configResolved(config) {
      resolvedPublicDir = path.resolve(config.root, publicDir);
    },
    async buildStart() {
      await generateIndex();
    },
    async handleHotUpdate() {
      await generateIndex();
    },
  };
}
