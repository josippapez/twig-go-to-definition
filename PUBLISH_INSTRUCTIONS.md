# Publishing Commands for Josip Papež

## Step 1: Login to vsce

```bash
vsce login YOUR_PUBLISHER_NAME
```

Enter your Personal Access Token when prompted.

## Step 2: Publish the extension

```bash
vsce publish
```

## Alternative: Publish with version bump

```bash
vsce publish patch  # Bumps version to 0.0.2
vsce publish minor  # Bumps version to 0.1.0
vsce publish major  # Bumps version to 1.0.0
```

## Step 3: Verify publication

After publishing, your extension will be available at:
<https://marketplace.visualstudio.com/items?itemName=YOUR_PUBLISHER_NAME.twig-go-to-definition>

## Important Notes

1. Replace YOUR_PUBLISHER_NAME with your actual publisher name
2. Repository is already configured for: <https://github.com/josippapez/twig-go-to-definition>
3. Make sure to push your code to the GitHub repository before publishing
4. The extension name "twig-go-to-definition" must be unique in the marketplace
