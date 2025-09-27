<div align="center">
  <img width="1200" height="475" alt="HealthCall Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# HealthCall - Patient Queue Management System

HealthCall is a modern, real-time patient queue and calling system designed for clinics and hospitals. It allows staff to manage a patient waiting list, call patients to specific rooms, and display the calls on a public screen, complete with voice announcements.

## ✨ Features

-   **Patient Management:** Add, edit, and remove patients from the waiting queue.
-   **Status Tracking:** Track patient status from "Aguardando" (Waiting) to "Em Atendimento" (In Service) and "Atendimento Finalizado" (Finished).
-   **Real-time Calling:** Call patients to specific destinations.
-   **Public Display:** A dedicated display view (`/display`) shows the latest called patient in real-time.
-   **Voice Synthesis:** Announces the patient's name and destination on the display page.
-   **Authentication:** Secure login for staff members.
-   **Filtering and Searching:** Easily find patients in the queue.
-   **Persistent State:** User preferences and queue state are saved.

## 🛠️ Tech Stack

-   **Frontend:** React, TypeScript, Vite
-   **Backend & Database:** Supabase (PostgreSQL, Auth, Realtime)
-   **Styling:** Tailwind CSS
-   **Routing:** React Router DOM

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:
-   [Node.js](https://nodejs.org/) (v18 or later recommended)
-   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

## 🚀 Getting Started

Follow these steps to get the project up and running on your local machine.

### 1. Clone the Repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd healthcall
```

### 2. Install Dependencies

Install the required npm packages.

```bash
npm install
```

### 3. Set up Supabase

This project requires a Supabase backend for authentication, database, and real-time features.

#### a. Create a Supabase Project

-   Go to [supabase.com](https://supabase.com/) and create a new project.
-   Save your **Project URL** and **`anon` (public) key**.

#### b. Set up Environment Variables

Create a file named `.env.local` in the root of the project and add your Supabase credentials:

```
VITE_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

#### c. Database Schema

You need to create the necessary tables in your Supabase database. Go to the **SQL Editor** in your Supabase dashboard and run the following queries:

**`patients` table:**
```sql
CREATE TABLE patients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    destination text NOT NULL,
    status text DEFAULT 'Aguardando'::text NOT NULL,
    "callCount" integer DEFAULT 0 NOT NULL,
    "lastCalled" boolean DEFAULT false
);
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
```

**`calls` table:**
```sql
CREATE TABLE calls (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    patient_id uuid,
    location text
);
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
```

**`profiles` table (for user settings):**
```sql
CREATE TABLE profiles (
    id uuid NOT NULL,
    updated_at timestamp with time zone,
    default_destination text
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

*Note: You will also need to set up Row Level Security (RLS) policies to allow authenticated users to read and write data.*

### 4. Run the Application

Once the dependencies are installed and the environment variables are set, you can run the development server.

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

## 📂 Project Structure

Here is an overview of the key directories in this project:

```
/
├── public/              # Static assets
├── src/
│   ├── actions/         # Functions for data fetching and mutations (Supabase)
│   ├── components/      # Reusable React components
│   ├── constants/       # Global constants
│   ├── contexts/        # React contexts (e.g., Auth)
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Library initializations (e.g., Supabase client)
│   ├── pages/           # Top-level page components
│   ├── styles/          # Global styles
│   ├── types/           # TypeScript type definitions
│   ├── App.tsx          # Main application component with routing
│   └── main.tsx         # Application entry point
├── .env.local           # Local environment variables (untracked)
├── package.json         # Project dependencies and scripts
└── README.md            # This file
```

## 📜 Available Scripts

-   `npm run dev`: Starts the development server.
-   `npm run build`: Builds the application for production.
-   `npm run preview`: Serves the production build locally for preview.
-   `npm run lint`: Lints the codebase using ESLint.