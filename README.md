# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Optionally set `VITE_BASE_PATH` to configure the base URL when deploying (e.g., `VITE_BASE_PATH=/myapp/` for GitHub Pages)
4. Run the app:
   `npm run dev`
