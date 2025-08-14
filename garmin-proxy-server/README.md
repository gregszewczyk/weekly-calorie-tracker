# Garmin Connect Proxy Server

This Node.js server acts as a proxy between your React Native app and Garmin Connect, bypassing the React Native compatibility issues with the garmin-connect library.

## Setup

1. **Install dependencies:**
   ```bash
   cd garmin-proxy-server
   npm install
   ```

2. **Run the server:**
   ```bash
   # Development mode (with auto-restart)
   npm run dev
   
   # Production mode
   npm start
   ```

3. **Test the server:**
   ```bash
   curl http://localhost:3001/health
   ```

## API Endpoints

- `GET /health` - Health check
- `POST /api/garmin/login` - Login with username/password
- `GET /api/garmin/activities/:sessionId?days=7` - Get activities
- `GET /api/garmin/profile/:sessionId` - Get user profile
- `POST /api/garmin/logout/:sessionId` - Logout

## Deployment Options

### Vercel (Serverless)
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts

### Railway
1. Connect your GitHub repo to Railway
2. Deploy from the `garmin-proxy-server` directory

### Heroku
1. Create a Heroku app
2. Set buildpack to Node.js
3. Deploy the `garmin-proxy-server` directory

### Self-hosted VPS
1. Copy files to your server
2. Install Node.js
3. Run with PM2: `pm2 start server.js`

## Environment Variables

- `PORT` - Server port (default: 3001)