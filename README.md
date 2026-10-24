# PG Grand Diwali Lucky Draw 🪔

MERN stack lucky draw system for ~900 employees, 3 groups, 9 rounds.

## Project Structure
```
diwali-lucky-draw/
├── backend/          # Node/Express/MongoDB/Socket.IO
│   ├── models/       # Employee, Prize, Winner, GameState
│   ├── routes/       # auth, employees, prizes, game
│   ├── middleware/   # JWT auth
│   └── server.js
└── frontend/         # React/Vite/Tailwind/Ant Design
    └── src/
        ├── pages/    # AdminLogin, AdminPanel, LiveDraw
        └── hooks/    # useSocket, useAudio
```

## Setup

### Backend
```bash
cd backend
npm install
cp .env.example .env    # edit credentials
npm run dev             # runs on :5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev             # runs on :5173 (proxied to :5000)
```

## URLs
- `/live` — Live draw screen (project on big screen)
- `/admin/login` — Admin login
- `/admin` — Admin panel

## Default Credentials
- Username: `admin`
- Password: `pg@diwali2024`
(Change in backend/.env)

## CSV Format
```
Name,EmployeeId,Department,Designation
Rahul Sharma,EMP001,Production,Manager
...
```
Upload 1 to ~900 rows. Serial numbers assigned 1-N automatically.
Groups split equally: 1-300 → Group A, 301-600 → Group B, 601-900 → Group C.

## Game Flow
1. Admin uploads CSV
2. Admin configures prizes for all 9 rounds
3. Admin clicks **Start Game**
4. For each round: Admin clicks **SPIN** → drum rolls 6s → winner revealed on live screen
5. Admin clicks **Next Round →** to proceed
6. Repeat for all 9 rounds (3 per group)
