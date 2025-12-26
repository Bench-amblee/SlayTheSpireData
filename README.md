# Slay the Spire Run Analyzer

A comprehensive web application for analyzing Slay the Spire game runs with statistical analysis and correlation insights.

## Features

### 1. All Runs Page
- Chronological list of all runs
- Detailed information for each run (date, character, result, floor reached, score, etc.)
- Filter by character, date range, ascension level, and win/loss

### 2. Dashboard Page
- High-level aggregate statistics
- Win rate by character
- Average floor reached, score, and playtime
- Character distribution visualizations
- Interactive filtering by character and date

### 3. Cards Analysis Page
- Comprehensive card statistics
- Most picked cards and pick rates
- Card upgrade frequency
- Win rate correlation for each card
- Sortable columns for deep analysis
- Filter by character, ascension level, win/loss, and date range

### 4. Enemies Analysis Page
- Enemy encounter statistics
- Average damage taken per enemy
- Average turns to defeat each enemy
- Which enemies defeat the player most often
- Defeat rates for each enemy type
- Filter by character, ascension level, win/loss, and date range

### 5. Relics Analysis Page
- Relic pick rates
- Win rate correlation for each relic
- Identify which relics lead to victory most often
- Sortable by picks, win rate, victories
- Filter by character, ascension level, win/loss, and date range

### 6. Advanced Analytics Page
- Interactive correlation heatmap
- Shows correlations between all game variables
- Top positive and negative correlations for key metrics (victory, floor reached, score)
- Variable selection to customize heatmap view
- Filter by character and date range

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the Flask backend:
   ```bash
   python app.py
   ```

   The backend will run on http://localhost:5000

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

   The frontend will run on http://localhost:3000

## Usage

### Quick Start (Windows)
1. Double-click `start-backend.bat` to start the backend server
2. Double-click `start-frontend.bat` to start the frontend server
3. Open your browser to http://localhost:3000

### Manual Start
1. Start both the backend and frontend servers (see Setup Instructions above)
2. Open your browser to http://localhost:3000
3. Navigate between pages using the navigation bar
4. Use filters to analyze specific subsets of your data

## Data Insights

The application can help answer questions like:

**Cards:**
- Which cards are picked most often?
- Which cards have the highest win rate?
- Which cards are upgraded most frequently?

**Enemies:**
- Which enemies are encountered most often?
- Which enemies deal the most damage on average?
- Which enemies defeat the player most frequently?
- Which enemies are defeated fastest?

**Relics:**
- Which relics have the highest win rate?
- Which relics are picked most often?
- Which relics correlate strongest with victory?

**Overall Correlation:**
- What correlates most with winning?
- What correlates most with reaching higher floors?
- Which factors negatively impact run success?
- How do different characters perform?

## Technology Stack

- **Frontend**: React, Vite, Recharts, React Router
- **Backend**: Flask, Pandas, NumPy, SciPy
- **Data Source**: Slay the Spire run files (.run format)
