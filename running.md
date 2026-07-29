# Running the Habits Tracker

To run the habits tracker website locally, you'll need to use your terminal. Follow these steps:

## First-time setup (or after pulling new changes)

If this is your first time running the project, or if you've recently pulled new dependencies or database changes, run these two commands:

1. **Install dependencies:**
   ```bash
   script/bootstrap
   ```
   This script installs all necessary Python (backend) and Node.js (frontend) dependencies.

2. **Set up the database and environment:**
   ```bash
   script/setup
   ```
   This creates your local `.env` file, sets up the PostgreSQL database, and runs any necessary database migrations.

## Starting the Application

Once your environment is set up, you can start the development servers:

```bash
script/server
```

This single command will start:
- The Flask backend server on `http://localhost:5000`
- The Vite frontend server on `http://localhost:5173`

Once running, you can access the frontend in your web browser at `http://localhost:5173`. When you're done, you can stop the server by pressing `Ctrl + C` in your terminal.
