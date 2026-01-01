# carousel-gen

Generate carousel slides from reference images and bulk text using OpenAI.

## Features
- Upload 1–5 reference images
- Paste bulk text (Title/Description per line)
- Generate design tokens, base CSS, layouts, and slides
- Edit per-slide layouts and overrides
- Download combined HTML/CSS

## Setup
```bash
npm install
```

Create a `.env.local` file with your OpenAI API key:
```
OPENAI_API_KEY=your_key_here
```

Run the dev server:
```bash
npm run dev
```

Open http://localhost:3000

## Deploy to Vercel
1. Push the repo to GitHub.
2. Import the repo in Vercel.
3. Add the `OPENAI_API_KEY` environment variable in Vercel project settings.
4. Deploy.

## Notes
- The generator uses the OpenAI Responses API with a JSON schema enforced response.
- The HTML export bundles all slides and base CSS into a single file.
