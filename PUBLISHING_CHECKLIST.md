# Pre-Publishing Checklist for Josip Papež

## ✅ Required Actions Before Publishing

### 1. Update package.json

- [x] ~~Replace `YOUR_PUBLISHER_NAME` with your actual publisher name~~
- [x] ~~Replace `YOUR_USERNAME` with your GitHub username~~ ✅ Done (josippapez)
- [x] ~~Update repository URLs to point to your actual repository~~ ✅ Done
- [x] Ensure extension name is unique in marketplace

### 2. Publisher Account Setup

- [ ] Create publisher account at <https://marketplace.visualstudio.com/manage>
- [ ] Get Personal Access Token from <https://dev.azure.com/>
- [ ] Login to vsce: `vsce login YOUR_PUBLISHER_NAME`

### 3. GitHub Repository

- [ ] Push code to GitHub repository: <https://github.com/josippapez/twig-go-to-definition>
- [ ] Ensure repository is public
- [ ] Add a good README.md to the repository

### 4. Optional Improvements

- [ ] Create and add icon.png (128x128 pixels) or remove icon field
- [ ] Test the extension thoroughly
- [ ] Consider adding screenshots to README.md

### 5. Final Steps

- [ ] Run `vsce package` to test packaging
- [ ] Run `vsce publish` to publish to marketplace
- [ ] Verify extension appears in marketplace

## 🔧 Quick Commands

```bash
# Login (replace with your publisher name)
vsce login YOUR_PUBLISHER_NAME

# Package for testing
vsce package

# Publish to marketplace
vsce publish

# Publish with version bump
vsce publish patch
```

## 📝 Notes

- Extension names must be unique across the entire marketplace
- It may take a few minutes for the extension to appear after publishing
- You can update the extension by publishing a new version
- Consider starting with version 0.1.0 instead of 0.0.1 for initial release
