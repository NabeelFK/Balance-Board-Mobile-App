🧠 Balance Board

A Smart Decision-Making Companion

Balance is an AI-powered decision-making assistant designed to help users navigate complex choices with clarity and confidence. The app guides users through structured questioning, helps the user perform SWOT analysis, predicts possible outcomes, and rewards thoughtful decision-making with an XP-based progression system.

Built as a modern mobile-first experience using React Native and Supabase.


🚀 What Problem Does It Solve?

Making decisions can be overwhelming, especially when options feel equally compelling or risky. Balance helps users:

Break down confusing decisions into structured analysis

Reflect on consequences before committing

Visualize strengths, weaknesses, opportunities, and threats

Understand likely outcomes of each option

Track growth through a gamified XP system


🌟 Core Features
💬 Interactive Decision Flow

Users input a problem (e.g., “Should I switch majors?”), and the app:

Asks a series of adaptive clarification questions

Paint a clear, broad picture about the situation

Gathers context before analysis

📊 SWOT Analysis Engine

For each decision path, the system generates probing questions that help the user assert their:

Strengths

Weaknesses

Opportunities

Threats

This structured breakdown helps users think critically rather than emotionally.

🔮 Outcome Prediction

The app presents possible outcomes for each option, including:

Likely consequences

Probability of happening

Users can then choose their preferred outcome correspond to an original decision.

🎮 XP & Progress System

Once a user commits to a decision:

XP is awarded 

Progress is tracked

Gamification encourages thoughtful reflection rather than impulsive choices


📜 Decision History

Users can revisit past decisions, see their analysis, and reflect on growth over time.


🏗 Architecture Overview
📱 Frontend

React Native (Expo)

TypeScript

Custom navigation (Stack + Tabs)

Chat-style UI for guided questioning

🧠 Decision Engine

Finite state machine decision model for each session

LLM parsing + validation layer

Typed outcome objects (safe state handling)

Context-aware question flow

🗄 Backend / Database

Supabase

Clerk authentication

Profile persistence (XP, coins, history, personal context)

Secure session storage


🧩 How It Works (Flow)

User enters a problem and a set of decisions

App asks structured follow-up questions

Context is parsed and analyzed

SWOT analysis is used for outcome prediction

Final choices are presented to the user

User is the one with the agency to decide their problem

XP is awarded based

Session stored in history


🛠 Getting Started
1️⃣ Clone the Repository
git clone https://github.com/yourusername/balance.git
cd balance-board-app

2️⃣ Install Dependencies
npm install

3️⃣ Configure Environment Variables
Create a .env file in the project root:
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_OPENAI_API_KEY=SK-******** (your actual openai API key)
Then restart Expo:
npx expo start -c
4️⃣ Run the App
npx expo start
Open with:
Expo Go
iOS simulator
Android emulator

🧠 Technical Highlights
Typed decision outcome validation (safe handling of invalid states using zod)
Using NFA to model workflow per session to support hesitation + backtrack
Custom LLM parsing logic
Gamified engagement loop
Secure Clerk + Supabase integration
Modular navigation architecture (Tabs + Stack)

📈 Future Improvements
Visual decision-tree diagram rendering
Collaborative decision sessions
Enhanced confidence modeling
Emotional bias detection
More advanced outcome simulation
Long-term decision tracking & analytics

🎯 Vision
Balance Board is a structured thinking tool rather than any chatbot.
Our goal is to help users build better decision making habits through guided analysis, logical thinking, and self-reflection.
