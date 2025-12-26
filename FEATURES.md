# Slay the Spire Run Analyzer - Features Summary

## Overview
This application provides comprehensive analysis of Slay the Spire runs with 6 main pages, advanced filtering, and correlation analysis.

## Pages

### 1. All Runs
**URL:** `/`

**Features:**
- Complete chronological list of all runs
- Columns: Date, Character, Result, Floor, Score, Playtime, Ascension, Deck Size, Relics, Gold
- Color-coded results (green for victory, red for defeat)
- Character badges with distinct colors

**Filters:**
- Character (All, Defect, Ironclad, The Silent)
- Start Date
- End Date

### 2. Dashboard
**URL:** `/dashboard`

**Features:**
- 8 High-level stat cards:
  - Total Runs
  - Victories
  - Win Rate
  - Average Floor Reached
  - Average Score
  - Highest Score
  - Deepest Floor
  - Average Playtime
- Pie chart: Character Distribution
- Bar chart: Win Rate by Character
- Detailed win rate breakdown by character

**Filters:**
- Character
- Start Date
- End Date

### 3. Cards Analysis
**URL:** `/cards`

**Features:**
- Comprehensive card statistics table
- Columns:
  - Card name
  - Picks (total times picked)
  - Pick Rate % (how often picked when available)
  - Upgrades (times upgraded at campfire)
  - Win Rate % (correlation with victory)
  - Victories (total wins with this card)
  - Times Available
- Sortable by any column (click headers)
- Color-coded win rates (green >50%, red <30%)

**Filters:**
- Character
- Ascension Level (0-20)
- Result (All Runs, Victories Only, Defeats Only)
- Start Date
- End Date

**Insights:**
- Which cards are picked most often?
- Which cards have the highest win correlation?
- Which cards are upgraded most frequently?

### 4. Enemies Analysis
**URL:** `/enemies`

**Features:**
- Enemy encounter statistics table
- Columns:
  - Enemy name
  - Encounters (total times fought)
  - Avg Damage (average damage taken per fight)
  - Avg Turns (average combat length)
  - Player Defeats (times this enemy killed the player)
  - Defeat Rate % (how often this enemy kills the player)
  - In Victories (encounters in winning runs)
  - In Defeats (encounters in losing runs)
- Sortable by any column
- Color-coded defeat counts and rates

**Filters:**
- Character
- Ascension Level
- Result
- Start Date
- End Date

**Insights:**
- Which enemies are most common?
- Which enemies are most dangerous?
- Which enemies are defeated fastest?
- Which enemies cause the most player deaths?

### 5. Relics Analysis
**URL:** `/relics`

**Features:**
- Relic statistics table
- Columns:
  - Relic name
  - Picks (times obtained)
  - Win Rate % (correlation with victory)
  - Victories (wins with this relic)
  - Defeats (losses with this relic)
- Sortable by any column
- Color-coded win rates

**Filters:**
- Character
- Ascension Level
- Result
- Start Date
- End Date

**Insights:**
- Which relics have the highest win rate?
- Which relics are obtained most often?
- Which relics correlate most with success?

### 6. Advanced Analytics
**URL:** `/advanced`

**Features:**
- Interactive correlation heatmap
  - All numerical game variables
  - Color-coded (green = positive, red = negative)
  - Hover for exact values
  - Sticky headers for easy navigation
- Variable selection
  - Click chips to show/hide variables
  - Select All / Deselect All buttons
- Top correlations panels
  - Victory correlations (top positive & negative)
  - Floor Reached correlations
  - Score correlations
- Insights guide explaining correlation values

**Filters:**
- Character
- Start Date
- End Date

**Variables Analyzed:**
- victory, floor_reached, score, playtime
- gold, ascension_level, campfire_rested, campfire_upgraded
- items_purged_count, purchased_purges, deck_size, relic_count
- potions_used, total_damage_taken, battles_count, avg_damage_per_battle
- cards_picked, cards_skipped, events_encountered, items_purchased_count
- max_hp_final, current_hp_final
- Character indicators (is_defect, is_ironclad, is_silent)

## Design

### Light Mode Theme
- Clean white backgrounds with subtle shadows
- Professional color palette:
  - Primary: #667eea (purple/blue)
  - Success: #10b981 (green)
  - Danger: #ef4444 (red)
  - Text: #2d3748 (dark gray)
  - Secondary text: #718096 (medium gray)
  - Borders: #e2e8f0 (light gray)
  - Background: #f5f7fa (very light gray)

### Character Colors
- Defect: Blue (#60a5fa)
- Ironclad: Red (#f87171)
- The Silent: Green (#4ade80)

### Interactive Elements
- Sortable table columns (click headers to sort)
- Hoverable tooltips on charts and heatmap
- Clickable variable chips for heatmap filtering
- Responsive buttons with hover effects
- Focus states on form inputs

## Technical Features

### Backend (Flask)
- 7 API endpoints:
  - `/api/runs` - All runs with filters
  - `/api/stats` - Aggregate statistics
  - `/api/correlation` - Full correlation matrix
  - `/api/correlation/top` - Top correlations
  - `/api/cards` - Card statistics
  - `/api/enemies` - Enemy statistics
  - `/api/relics` - Relic statistics
- Advanced filtering system supporting:
  - Character
  - Date ranges
  - Ascension level
  - Victory/defeat
- Correlation analysis using Pandas and SciPy
- Processes 238 runs across 3 characters

### Frontend (React)
- 6 pages with React Router
- Axios for API calls
- Recharts for visualizations (Pie, Bar charts)
- Responsive design
- Client-side sorting
- Filter state management

## Data Source
- Slay the Spire .run files
- Characters: Defect, Ironclad, The Silent
- Excludes DAILY runs (as requested)
- 238 total runs analyzed
