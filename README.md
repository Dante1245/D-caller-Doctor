# VoiceConnect Pro

A production-ready communication platform combining traditional phone calling with modern WebRTC technology, featuring real-time TTS voice injection and comprehensive messaging.

## Features

- **Dual Calling System**: WebRTC peer-to-peer video calls and Twilio phone calls to any number worldwide
- **AI Voice Injection**: Real-time TTS voice generation using ElevenLabs during live calls
- **Real-time Messaging**: Multimedia messaging with Socket.IO for instant delivery
- **Contact Management**: Friend requests, contact organization, and status tracking
- **Secure Authentication**: Enterprise-grade security with OAuth integration
- **Responsive Design**: Professional futuristic UI that adapts to all devices

## Quick Deploy to Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Dante1245/VoiceConnect-Pro)

## Environment Variables

Set these environment variables in your Render dashboard:

```
DATABASE_URL=postgresql://...
ELEVENLABS_API_KEY=your_elevenlabs_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890
SESSION_SECRET=your_session_secret
REPL_ID=your_app_id
ISSUER_URL=https://replit.com/oidc
REPLIT_DOMAINS=your_render_domain.onrender.com
```

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, Socket.IO
- **Database**: PostgreSQL with Drizzle ORM
- **External APIs**: Twilio, ElevenLabs
- **Real-time**: WebRTC, Socket.IO

## Local Development

1. Clone the repository:
```bash
git clone https://github.com/Dante1245/VoiceConnect-Pro.git
cd VoiceConnect-Pro
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables in `.env`

4. Initialize database:
```bash
npm run db:push
```

5. Start development server:
```bash
npm run dev
```

## Architecture

- **Client**: React application with WebRTC integration
- **Server**: Express API with Socket.IO for real-time features
- **Database**: PostgreSQL for persistent data storage
- **External Services**: Twilio for telephony, ElevenLabs for voice synthesis

## API Endpoints

- `POST /api/calls` - Initiate WebRTC call
- `POST /api/calls/twilio` - Make phone call via Twilio
- `POST /api/tts/inject` - Inject TTS audio into active call
- `GET /api/voices` - Fetch available ElevenLabs voices
- `GET /api/messages` - Retrieve message history
- `POST /api/messages` - Send new message
- `GET /api/contacts` - Get user contacts

## License

MIT License - see LICENSE file for details