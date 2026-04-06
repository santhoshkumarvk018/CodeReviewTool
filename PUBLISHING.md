# Publishing the AI Code Reviewer Extension

To publish your extension to the [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/), follow these steps.

## Prerequisites

1. **Install `vsce`**: The "Visual Studio Code Extensions" CLI tool is required for packaging and publishing.

   ```powershell
   npm install -g @vscode/vsce
   ```

1. **Personal Access Token (PAT)**:

   - Go to [Azure DevOps](https://dev.azure.com/).
   - Create an organization if you don't have one.
   - Go to **User settings** > **Personal access tokens**.
   - Create a new token with **Scopes**: `Marketplace (Publish)`.
   - **Important**: Copy this token; you won't see it again!

1. **Publisher Account**:

   - Go to the [Marketplace Management Portal](https://marketplace.visualstudio.com/manage).
   - Create a new Publisher. Note the "ID" you choose; it must match the `"publisher"` field in your `package.json`.

---

## Step 1: Prepare `package.json`

Open `extension/package.json` and ensure the following fields are correct:

- `publisher`: Your Marketplace Publisher ID.
- `version`: Update this each time you publish (e.g., `0.0.2`).
- `repository`: The URL of your source code repository.
- `icon`: Path to a 128x128px PNG icon (optional but recommended).

---

## Step 2: Login and Verify

Run the following command in the `extension/` directory to login:

```powershell
vsce login your-publisher-name
```

It will prompt you for your Personal Access Token.

---

## Step 3: Package and Publish

### Packaging (Optional)

To test the package locally before publishing, run:

```powershell
vsce package
```

This generates a `.vsix` file which you can install via VS Code's "Install from VSIX" command.

### Publishing

To publish directly to the marketplace:

```powershell
vsce publish
```

---

## Tips for Success

- **README**: The content of your `README.md` will be the description on the extension page. Make sure it looks professional!
- **Changelog**: Maintain a `CHANGELOG.md` file to show users what's new.
- **Images**: Add screenshots or GIFs to your README to show how the extension works. Use `https:` URLs for images.

For more details, visit the [official VS Code Publishing guide](https://code.visualstudio.com/api/working-with-extensions/publishing-extension).
