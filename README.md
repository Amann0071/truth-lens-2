# TruthLens - Fake News Detector

## Files
- `index.html` : page structure and icons
- `style.css`  : glass design (colours, fonts, layout)
- `script.js`  : analysis logic, result panel and animated background
<!-- - `app.py`     : Python backend (optional, for connecting a model) -->

## Run it in VS Code
1. Open the `truth lens` folder with File > Open Folder.
2. Install the **Live Server** extension.
3. Right-click `index.html` and choose **Open with Live Server**.

Demo mode works straight away, nothing else to install.

## Connect your Python model
1. Terminal: `pip install flask`
2. Put your model inside `predict()` in `app.py`.
3. Terminal: `python app.py`
4. In `script.js`, set `USE_API = true`.
5. Refresh the page.

## Where to change things
- Colours: the `:root { ... }` block at the top of `style.css`
- Demo rules: `CLICKBAIT` and `demoAnalyze()` in `script.js`
- Contact email: the `hello@truthlens.example` line in `index.html`
