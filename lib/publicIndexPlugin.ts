import { promises as fs } from "fs";
import type { Plugin } from "vite";
import { glob } from "glob";
import dedent from "dedent";

function extractHTMLTitle(html: string): string {
  const match = html.match(/<title>(.*?)<\/title>/);
  return match?.[1].trim() || "";
}

async function writeIfChanged(filePath: string | URL, content: string) {
  const current = await fs.readFile(filePath, "utf8").catch(() => null);
  if (current !== content) await fs.writeFile(filePath, content);
}

export function publicIndexPlugin(): Plugin {
  async function generateIndex() {
    const paths = [...(await glob("public/**/index.html"))];

    const entries = (
      await Promise.all(
        paths.map(async (path) => {
          const dirName = (() => {
            return path.replace(/\/index\.html$/, "").replace(/^public\//, "");
          })();

          const fileContent = await fs.readFile(
            new URL("../" + path, import.meta.url),
            "utf8"
          );

          // TODO: make the titles better
          // const title = extractHTMLTitle(fileContent) || dirName;
          const title = "";

          return [dirName, title];
        })
      )
    ).sort((a, b) => a[0].localeCompare(b[0]));

    // Build nested structure
    interface TreeNode {
      children: Map<string, TreeNode>;
      entry?: [string, string];
    }

    const root: TreeNode = { children: new Map() };

    for (const entry of entries) {
      const [dirName] = entry;
      const parts = dirName.split("/");
      let current = root;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!current.children.has(part)) {
          current.children.set(part, { children: new Map() });
        }
        current = current.children.get(part)!;

        // Store the entry at the final node
        if (i === parts.length - 1) {
          current.entry = entry as [string, string];
        }
      }
    }

    // Render nested lists
    function renderTree(node: TreeNode, indent: string = ""): string {
      const items: string[] = [];

      for (const [name, child] of node.children) {
        if (child.entry) {
          const [dirName, title] = child.entry;
          items.push(
            indent +
              dedent`
                <li>
                  <a href="/${dirName}/">${name}</a>
                  ${title && `- ${title}`}
                </li>
              `
          );
        } else {
          // Directory with children
          items.push(
            indent +
              `<li>${name}\n` +
              indent +
              `  <ul>\n` +
              renderTree(child, indent + "    ") +
              indent +
              `  </ul>\n` +
              indent +
              `</li>`
          );
        }
      }

      return items.join("\n");
    }

    const links = renderTree(root);

    const html = dedent`
      <!DOCTYPE html>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Index</title>
      <ul>
        ${links}
      </ul>
    `;

    const indexPath = new URL("../public/index.html", import.meta.url);

    await writeIfChanged(indexPath, html);
  }

  return {
    name: "vite-plugin-public-index",
    async buildStart() {
      await generateIndex();
    },
    async handleHotUpdate() {
      await generateIndex();
    },
  };
}
