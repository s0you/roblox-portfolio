# M4G1C Roblox Portfolio

A responsive Roblox developer portfolio with light and dark themes, project filters, and image galleries. Built with HTML, CSS, JavaScript, and a Node.js static server.

## Requirements

- Node.js 20 or newer.
- npm (included with Node.js).

The application has no runtime dependencies.

## Run locally

```sh
npm start
```

Open `http://localhost:3000`. The server prints its running port and local URL after it starts. Stop it with `Ctrl+C`. `npm run dev` runs the same server.

To select another port:

```sh
npm start -- --port 8080
```

You can also set the `PORT` environment variable, which takes priority over `--port`. Port `0` selects an available port automatically. The server listens on all IPv4 interfaces.

## Validate and build

```sh
npm run check
npm run build
```

The checks validate JavaScript syntax, project metadata, and referenced local images. The build validates the project data and copies `public/` to `dist/`.

To serve the build in PowerShell:

```powershell
$env:NODE_ENV = 'production'
npm start
```

In a POSIX shell:

```sh
NODE_ENV=production npm start
```

## Add or edit projects

Manage your portfolio projects in [`public/data/projects.json`](public/data/projects.json). The page loads this file to generate project cards, category filters, and galleries automatically.

1. Add your project images to `public/images/my-project/`.
2. Copy an existing object in the JSON file's `projects` array and edit its content, or use the example below.
3. Give the project a unique `id` and set `category` to an ID from the `categories` array, such as `world`, `systems`, or `ui`.
4. Run `npm run check` to validate the data and image paths, then refresh the page. If you serve the production build, run `npm run build` again.

Example project object to add to the `projects` array:

```json
{
  "id": "my-project",
  "title": "My Project",
  "subtitle": "A short description of the project.",
  "category": "systems",
  "label": "GAMEPLAY / SYSTEM",
  "type": "DEVELOPER",
  "tags": ["Animation", "UI"],
  "intro": "Describe the project and your contribution.",
  "details": ["A feature you built.", "Another contribution."],
  "note": "Role: Developer / Scripter.",
  "link": "https://www.roblox.com/games/1234567890",
  "thumbnail": "/images/my-project/cover.jpg",
  "thumbnailAlt": "My Project cover",
  "images": [
    {
      "src": "/images/my-project/cover.jpg",
      "alt": "My Project gameplay",
      "caption": "A screenshot of the project."
    }
  ]
}
```

Replace the example image paths and link with your own. Local image paths start with `/images/`, without the `public` prefix. IDs must start with a lowercase letter and contain only lowercase letters, numbers, or hyphens. Keep IDs unique within each array; the category ID `all` is reserved.

The `note`, `link`, and `images` fields are optional. Links must use HTTPS. If you omit `images` or leave it empty, the gallery uses the thumbnail. To add a category, add an object with a unique `id` and a display `name` to `categories`, then use that ID in your projects. Its filter appears once a project uses it.

## Customization and credit

You are free to edit and customize this portfolio, including its layout, colors, content, and project data. As a gesture of respect for the original creator, please keep the existing M4G1C credit visible in the footer:

> © [current year] M4G1C. Made with ❤️.

The year updates automatically. You may add your own attribution alongside the original credit, but please do not remove, hide, or replace it.

## Project structure

- `public/index.html`: page content and layout.
- `public/*.css`: page styles, themes, and animations.
- `public/app.js`: project filters, galleries, navigation, and theme controls.
- `public/loader.js`: loading screen behavior.
- `public/data/projects.json`: project descriptions, categories, and image references.
- `public/images/`: portfolio images.
- `server.mjs`: static server and startup logging.
- `scripts/`: validation and build scripts.

Keep project names, image paths, and brand names consistent when editing the content. Formatting settings are in `.prettierrc.json`. Generated files in `dist/` and dependencies in `node_modules/` are excluded from Git.
