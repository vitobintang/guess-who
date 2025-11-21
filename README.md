# Guess Who App

An AI-powered interactive game application built with Vite, Gemini API, and Supabase.

## Features

- 🤖 **AI Integration** - Powered by Google's Gemini API
- 🗄️ **Real-time Database** - Supabase backend for data management
- ⚡ **Fast Development** - Built with Vite for optimal performance
- 🎮 **Interactive Gameplay** - Engaging user experience

## Tech Stack

- **Frontend:** Vite
- **AI:** Google Gemini API
- **Backend:** Supabase
- **Runtime:** Node.js

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Configure Supabase credentials in [.env.local](.env.local)
4. Run the app:
   `npm run dev`

## Environment Variables

Create a `.env.local` file with the following:

```
GEMINI_API_KEY=your_gemini_api_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_KEY=your_supabase_key
```

## Project Structure

- `/src` - Application source code
- `/.env.local` - Environment configuration (not committed)
- `/vite.config.js` - Vite configuration

## Support

For issues or questions, please open an issue in the repository.
