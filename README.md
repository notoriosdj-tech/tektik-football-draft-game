# TEK-Tik Football Draft Game

## Current baseline

- Stable gameplay baseline: **V2.0**
- AI integration target: **V2.1**

The visual design is locked. Future changes should preserve the current Game Boy Color design, field layout, card styling, picker, match timeline, and match flow.

## AI-powered gameplay

V2.1 adds optional AI support for:

- CPU draft picks
- Referee decision-making
- Match analysis and match minutes

Players do **not** need a ChatGPT account. The frontend calls a secure backend endpoint, and the backend calls OpenAI using the server-side API key.

```text
Player browser
→ TEK-Tik frontend
→ /api/cpu-pick or /api/referee
→ OpenAI API using server key
→ validated result returned to the game
```

The OpenAI API key must never be placed in frontend code.

## Backend endpoints

The repository includes Vercel-compatible serverless endpoints:

```text
api/cpu-pick.js
api/referee.js
```

### `/api/cpu-pick`

Used when the CPU needs to draft a player.

If the endpoint fails, the game uses the local V2.0 CPU engine.

### `/api/referee`

Used when the user clicks **GO TO REFEREE**.

If the endpoint fails, the game uses the local V2.0 referee engine.

## Environment variables

Set these variables on the backend deployment platform, for example Vercel:

```text
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4.1-mini
ALLOWED_ORIGIN=*
```

`OPENAI_MODEL` is optional. The default is `gpt-4.1-mini`.

For production, `ALLOWED_ORIGIN` can be set to the game domain instead of `*`.

## Frontend environment variables

If the frontend and backend are deployed on the same Vercel project, no frontend variable is required because the game calls:

```text
/api/cpu-pick
/api/referee
```

If the frontend remains on GitHub Pages and the backend is on Vercel, set one of these in the frontend build environment:

```text
VITE_AI_BASE_URL=https://your-vercel-app.vercel.app
```

Or set endpoint-specific URLs:

```text
VITE_AI_CPU_PICK_URL=https://your-vercel-app.vercel.app/api/cpu-pick
VITE_AI_REFEREE_URL=https://your-vercel-app.vercel.app/api/referee
```

## Fallback behavior

The game is designed to keep working even when AI is unavailable.

```text
AI CPU fails → local CPU engine picks
AI referee fails → local referee engine decides
```

This means users can still play even if:

- OpenAI is unavailable
- the API key is missing
- the backend is not deployed
- the request times out
- the AI response is invalid

## Deployment recommendation

Recommended deployment:

1. Deploy the repository to Vercel.
2. Add `OPENAI_API_KEY` in Vercel project settings.
3. Set `OPENAI_MODEL` if needed.
4. If using GitHub Pages for the frontend, set `VITE_AI_BASE_URL` to your Vercel backend URL.
5. Rebuild the frontend.

## Locked game flow

Preserve this flow:

```text
Team name
→ Difficulty
→ Formation
→ Draft
→ Field review
→ GO TO REFEREE
→ Match result
→ PLAY NEXT GAME or SERIES RESULT
→ Series end
→ START NEXT SERIES
```

Do not skip the permission steps.
