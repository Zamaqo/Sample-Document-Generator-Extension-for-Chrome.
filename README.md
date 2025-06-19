# Sample Document Generator Chrome Extension

This Chrome extension helps generate sample document images for testing purposes. It can create sample images of:
- Dummy sample of ID Cards
- Dummy sample of Passports
- Dummy sample of College Degrees


Each generated image includes:
- Current date
- Document type
- Sample information

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Usage

1. Click the extension icon in your Chrome toolbar
2. Select the type of document you want to generate
3. The image will automatically download to your Downloads folder

## Customization

To add your company logo:
1. Place your logo image in the `icons` folder
2. Update the `generateAndDownloadDocument` function in `popup.js` to include your logo

## Note

This extension is designed for testing purposes only. Generated documents are clearly marked as samples and should not be used for any official purposes. 
