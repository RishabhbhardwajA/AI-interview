# 🚀 AI Interview Platform

An intelligent, adaptive platform for technical interview preparation. Built to help students and professionals practice, evaluate, and improve their technical skills through AI-driven interviews and gamified challenges.

## ✨ Features

- **🧠 Adaptive AI Interviews**: Simulates real-world technical interviews that adapt to your skill level using the Groq AI engine.
- **🏆 Gamified Challenge Arena**: Complete coding and theoretical challenges, climb the leaderboard, and earn badges.
- **🔐 Secure Authentication**: Custom JWT-based authentication system with password strength validation and session management.
- **🎨 Glassmorphism UI**: A stunning, modern, and highly responsive user interface featuring glassmorphism and smooth animations.
- **📊 Readiness & Analytics**: Track your progress over time with detailed charts, resume analysis, and skill gap identification.
- **🛡️ Role-based Access Control**: Separate dashboards for Students, Mentors, and Administrators.

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS, Framer Motion (Animations), Recharts
- **Backend**: Next.js App Router API Routes
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT, bcryptjs
- **AI Integration**: Groq SDK

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) and [MongoDB](https://www.mongodb.com/) installed on your machine.

### 1. Clone the repository
```bash
git clone https://github.com/RishabhbhardwajA/AI-interview.git
cd AI-interview
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up Environment Variables
Create a `.env.local` file in the root directory and add the following variables:

```env
MONGODB_URI=mongodb://localhost:27017/ai-interview-platform
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
GROQ_API_KEY=your-groq-api-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
> **Note**: To get a `GROQ_API_KEY`, visit the [Groq Cloud Console](https://console.groq.com/).

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📁 Project Structure

- `/src/app`: Next.js App Router pages and API endpoints.
- `/src/components`: Reusable UI components (Navbar, Guards, etc).
- `/src/context`: React Context providers (AuthContext).
- `/src/models`: MongoDB Mongoose schemas (User, Session, Challenge, etc).
- `/src/lib`: Utility functions and database connection logic.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📜 License

This project is licensed under the ISC License.
