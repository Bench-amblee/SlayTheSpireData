# Supabase Setup Guide

This guide will walk you through setting up Supabase for your Slay the Spire stats visualization app.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up (it's free!)
2. Click "New Project"
3. Fill in:
   - **Project name**: `slay-the-spire-stats` (or whatever you prefer)
   - **Database password**: Choose a strong password (save this!)
   - **Region**: Choose the closest region to you
4. Click "Create new project" and wait ~2 minutes for it to provision

## Step 2: Create the Database Table

1. In your Supabase dashboard, click on the **SQL Editor** icon in the left sidebar
2. Click "New Query"
3. Copy the entire contents of `backend/supabase_schema.sql` and paste it into the SQL editor
4. Click "Run" or press `Ctrl+Enter`
5. You should see "Success. No rows returned" - this means the table was created!

## Step 3: Get Your API Credentials

1. In your Supabase dashboard, click on the **Settings** icon (gear) in the left sidebar
2. Click on **API** in the Settings menu
3. You'll see two important values:
   - **Project URL**: Something like `https://abcdefghijk.supabase.co`
   - **anon public key**: A long string starting with `eyJ...`
4. Keep this page open - you'll need these values in the next step

## Step 4: Configure Your Backend

1. Navigate to the `backend` folder in your project
2. Create a new file called `.env` (copy from `.env.example`):
   ```bash
   # In the backend folder
   cp .env.example .env
   ```
3. Open `.env` in a text editor and fill in your credentials:
   ```env
   SUPABASE_URL=https://your-project-url.supabase.co
   SUPABASE_KEY=your-anon-key-here
   ```
   Replace with the actual values from Step 3

## Step 5: Install Python Dependencies

1. Make sure you're in the `backend` folder
2. Activate your virtual environment:
   ```bash
   # Windows
   venv\Scripts\activate

   # Mac/Linux
   source venv/bin/activate
   ```
3. Install the new dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Step 6: Test the Connection

1. Start your Flask backend:
   ```bash
   python app.py
   ```
2. In a browser, visit: `http://localhost:5000/api/supabase/status`
3. You should see:
   ```json
   {
     "configured": true,
     "connected": true,
     "message": "Supabase is connected and ready"
   }
   ```

If you see this, congratulations! Supabase is configured correctly! 🎉

## Step 7: Upload Your First Runs

### Option A: Upload Individual .run Files

1. Navigate to your Slay the Spire runs folder:
   - **Windows**: `C:\Users\[YourUsername]\AppData\LocalLow\Megacrit\SlayTheSpire\runs`
   - **Steam Deck/Linux**: Usually in Steam's userdata folder
   - **Android**: `Internal Storage/Android/data/com.humble.SlayTheSpire/files/runs/`

2. Go to the Upload page in your app
3. Select **Supabase (.run files)** mode
4. Drag and drop .run files or use the file picker
5. Click "Upload to Supabase"

### Option B: Use the Existing Data

If you want to upload your existing runs from the `runs` folder to Supabase, you can create a migration script:

```python
# In backend folder, create: migrate_to_supabase.py
import json
from pathlib import Path
from supabase_client import get_supabase_client
from run_parser import parse_run_file_from_path

supabase = get_supabase_client()
runs_dir = Path(__file__).parent.parent / 'runs'

uploaded = 0
skipped = 0

for char_folder in runs_dir.iterdir():
    if char_folder.is_dir():
        for run_file in char_folder.glob('*.run'):
            parsed = parse_run_file_from_path(run_file)
            if parsed:
                try:
                    # Check if exists
                    existing = supabase.table('runs').select('run_identifier').eq('run_identifier', parsed['run_identifier']).execute()

                    if len(existing.data) == 0:
                        supabase.table('runs').insert(parsed).execute()
                        uploaded += 1
                        print(f"✓ Uploaded: {run_file.name}")
                    else:
                        skipped += 1
                        print(f"⊘ Skipped (duplicate): {run_file.name}")
                except Exception as e:
                    print(f"✗ Error uploading {run_file.name}: {e}")

print(f"\n✓ Uploaded: {uploaded}")
print(f"⊘ Skipped: {skipped}")
```

Then run it:
```bash
python migrate_to_supabase.py
```

## Troubleshooting

### "Supabase is not configured"
- Make sure the `.env` file exists in the `backend` folder
- Check that the environment variables are set correctly
- Restart your Flask server after creating/modifying `.env`

### "Connection test failed"
- Verify your `SUPABASE_URL` is correct
- Verify your `SUPABASE_KEY` is the **anon public** key (not the service role key)
- Check that you created the `runs` table using the SQL schema
- Make sure your Supabase project is active (not paused due to inactivity)

### "Failed to upload run"
- Check that the `runs` table was created successfully
- Verify the run file is valid JSON
- Check the Supabase dashboard → Table Editor → runs to see if data is there

### Row Level Security (RLS) Issues
If you're having permission issues:
1. Go to Supabase Dashboard → Authentication → Policies
2. Make sure the policies exist for the `runs` table
3. The schema creates permissive policies by default, but you can adjust them later

## Next Steps

### Enable Visualizations to Use Supabase Data

Currently, your visualizations pull from the local `runs` folder. To make them pull from Supabase instead, you'll need to:

1. Update the frontend to call `/api/runs-supabase` instead of `/api/runs`
2. Add a toggle in your dashboard to switch between data sources
3. Implement the stats/correlation/cards/enemies/relics endpoints to work with Supabase

This is already partially implemented in the backend - you just need to wire up the frontend!

## Benefits of Using Supabase

✅ **Cloud Storage**: Access your stats from any device
✅ **Multi-User Support**: Easy to add user authentication later
✅ **No Duplicate Uploads**: Automatic duplicate detection
✅ **Scalable**: Can handle thousands of runs
✅ **Real-time**: Can add real-time features later
✅ **Free Tier**: 500MB database, plenty for run data

## Security Note

🔒 The `.env` file contains sensitive credentials. **Never** commit it to Git!

The `.gitignore` should include:
```
backend/.env
```

The `.env.example` file is safe to commit as it contains no real credentials.
