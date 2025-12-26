from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os
from pathlib import Path
import pandas as pd
import numpy as np
from datetime import datetime
from scipy.stats import pearsonr
from card_database import get_card_info
import zipfile
import shutil
from werkzeug.utils import secure_filename
from supabase_client import get_supabase_client, is_supabase_configured
from run_parser import parse_run_file, batch_parse_runs

app = Flask(__name__)
CORS(app)

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max upload size
UPLOAD_FOLDER = Path(__file__).parent / 'uploads'
UPLOAD_FOLDER.mkdir(exist_ok=True)

# Path to runs directory
RUNS_DIR = Path(__file__).parent.parent / 'runs'

# Allowed characters/folders
ALLOWED_CHARACTERS = {'DEFECT', 'IRONCLAD', 'THE_SILENT', 'WATCHER', 'DAILY'}

# Base game characters (exclude modded characters)
BASE_GAME_CHARACTERS = {'DEFECT', 'IRONCLAD', 'THE_SILENT', 'WATCHER'}

def load_all_runs():
    """Load all runs from Supabase"""
    supabase = get_supabase_client()
    if not supabase:
        return []

    try:
        response = supabase.table('runs').select('raw_data').execute()
        # Extract raw_data (which contains the original .run file structure)
        runs = [row['raw_data'] for row in response.data]

        # Normalize field names for frontend compatibility
        # The raw data uses 'character_chosen' but frontend expects 'character'
        for run in runs:
            if 'character_chosen' in run and 'character' not in run:
                run['character'] = run['character_chosen']

        # Sort by timestamp
        runs.sort(key=lambda x: x.get('timestamp', 0))
        return runs
    except Exception as e:
        print(f"Error loading runs from Supabase: {e}")
        return []

def extract_features_for_correlation(runs):
    """Extract numerical features from runs for correlation analysis"""
    features = []

    for run in runs:
        feature_dict = {
            'victory': 1 if run.get('victory', False) else 0,
            'floor_reached': run.get('floor_reached', 0),
            'score': run.get('score', 0),
            'playtime': run.get('playtime', 0),
            'gold': run.get('gold', 0),
            'ascension_level': run.get('ascension_level', 0),
            'campfire_rested': run.get('campfire_rested', 0),
            'campfire_upgraded': run.get('campfire_upgraded', 0),
            'items_purged_count': len(run.get('items_purged', [])),
            'purchased_purges': run.get('purchased_purges', 0),
            'deck_size': len(run.get('master_deck', [])),
            'relic_count': len(run.get('relics', [])),
            'potions_used': len(run.get('potions_floor_usage', [])),
            'total_damage_taken': sum([d.get('damage', 0) for d in run.get('damage_taken', [])]),
            'battles_count': len(run.get('damage_taken', [])),
            'avg_damage_per_battle': sum([d.get('damage', 0) for d in run.get('damage_taken', [])]) / max(len(run.get('damage_taken', [])), 1),
            'cards_picked': len(run.get('card_choices', [])),
            'cards_skipped': sum([1 for c in run.get('card_choices', []) if c.get('picked') == 'SKIP']),
            'events_encountered': len(run.get('event_choices', [])),
            'items_purchased_count': len(run.get('items_purchased', [])),
            'max_hp_final': run.get('max_hp_per_floor', [0])[-1] if run.get('max_hp_per_floor') else 0,
            'current_hp_final': run.get('current_hp_per_floor', [0])[-1] if run.get('current_hp_per_floor') else 0,
            'is_defect': 1 if run.get('character') == 'DEFECT' else 0,
            'is_ironclad': 1 if run.get('character') == 'IRONCLAD' else 0,
            'is_silent': 1 if run.get('character') == 'THE_SILENT' else 0,
            'is_watcher': 1 if run.get('character') == 'WATCHER' else 0,
            'small_deck': 1 if len(run.get('master_deck', [])) <= 25 else 0,
            'medium_deck': 1 if 26 <= len(run.get('master_deck', [])) <= 40 else 0,
            'large_deck': 1 if len(run.get('master_deck', [])) > 40 else 0,
        }
        features.append(feature_dict)

    return pd.DataFrame(features)

@app.route('/api/runs')
def get_runs():
    """Get all runs with optional filtering"""
    runs = load_all_runs()

    # Apply filters
    filters = {
        'character': request.args.get('character'),
        'start_date': request.args.get('start_date'),
        'end_date': request.args.get('end_date'),
        'is_daily': request.args.get('is_daily'),
        'ignore_downfall': request.args.get('ignore_downfall')
    }

    filtered_runs = apply_filters(runs, filters)

    return jsonify(filtered_runs)

@app.route('/api/stats')
def get_stats():
    """Get aggregate statistics"""
    runs = load_all_runs()

    # Apply filters
    filters = {
        'character': request.args.get('character'),
        'start_date': request.args.get('start_date'),
        'end_date': request.args.get('end_date'),
        'is_daily': request.args.get('is_daily'),
        'ignore_downfall': request.args.get('ignore_downfall')
    }

    filtered_runs = apply_filters(runs, filters)

    if not filtered_runs:
        return jsonify({'error': 'No runs found'}), 404

    # Calculate stats
    total_runs = len(filtered_runs)
    victories = sum(1 for r in filtered_runs if r.get('victory', False))
    win_rate = victories / total_runs * 100 if total_runs > 0 else 0

    # Character distribution
    char_counts = {}
    for r in filtered_runs:
        char = r.get('character', 'Unknown')
        char_counts[char] = char_counts.get(char, 0) + 1

    # Average stats
    avg_floor = sum(r.get('floor_reached', 0) for r in filtered_runs) / total_runs
    avg_score = sum(r.get('score', 0) for r in filtered_runs) / total_runs
    avg_playtime = sum(r.get('playtime', 0) for r in filtered_runs) / total_runs

    # Highest scores
    highest_score = max((r.get('score', 0) for r in filtered_runs), default=0)
    deepest_floor = max((r.get('floor_reached', 0) for r in filtered_runs), default=0)

    # Win rate by character
    win_rate_by_char = {}
    for char in char_counts.keys():
        char_runs = [r for r in filtered_runs if r.get('character') == char]
        char_wins = sum(1 for r in char_runs if r.get('victory', False))
        win_rate_by_char[char] = {
            'wins': char_wins,
            'total': len(char_runs),
            'win_rate': char_wins / len(char_runs) * 100 if char_runs else 0
        }

    return jsonify({
        'total_runs': total_runs,
        'victories': victories,
        'win_rate': win_rate,
        'character_distribution': char_counts,
        'win_rate_by_character': win_rate_by_char,
        'avg_floor_reached': avg_floor,
        'avg_score': avg_score,
        'avg_playtime_seconds': avg_playtime,
        'highest_score': highest_score,
        'deepest_floor': deepest_floor
    })

@app.route('/api/correlation')
def get_correlation():
    """Get correlation matrix for all numerical features"""
    runs = load_all_runs()

    # Apply filters using the shared filter function
    filters = {
        'character': request.args.get('character'),
        'start_date': request.args.get('start_date'),
        'end_date': request.args.get('end_date'),
        'is_daily': request.args.get('is_daily'),
        'ignore_downfall': request.args.get('ignore_downfall')
    }

    filtered_runs = apply_filters(runs, filters)

    if not filtered_runs:
        return jsonify({'error': 'No runs found'}), 404

    # Extract features
    df = extract_features_for_correlation(filtered_runs)

    # Calculate correlation matrix
    corr_matrix = df.corr()

    # Convert to dict format for JSON
    result = {
        'features': list(corr_matrix.columns),
        'matrix': corr_matrix.values.tolist()
    }

    return jsonify(result)

@app.route('/api/correlation/top')
def get_top_correlations():
    """Get top correlations for specific target variables"""
    runs = load_all_runs()

    # Apply filters using the shared filter function
    filters = {
        'character': request.args.get('character'),
        'start_date': request.args.get('start_date'),
        'end_date': request.args.get('end_date'),
        'is_daily': request.args.get('is_daily'),
        'ignore_downfall': request.args.get('ignore_downfall')
    }

    filtered_runs = apply_filters(runs, filters)

    if not filtered_runs:
        return jsonify({'error': 'No runs found'}), 404

    # Extract features
    df = extract_features_for_correlation(filtered_runs)

    # Get top correlations for victory, floor_reached
    targets = ['victory', 'floor_reached', 'score']
    top_correlations = {}

    for target in targets:
        if target in df.columns:
            correlations = df.corr()[target].sort_values(ascending=False)
            # Remove self-correlation
            correlations = correlations[correlations.index != target]

            top_correlations[target] = {
                'positive': [
                    {'feature': feat, 'correlation': float(corr)}
                    for feat, corr in correlations.head(10).items()
                ],
                'negative': [
                    {'feature': feat, 'correlation': float(corr)}
                    for feat, corr in correlations.tail(10).items()
                ]
            }

    return jsonify(top_correlations)

def apply_filters(runs, filters):
    """Apply common filters to runs"""
    filtered = runs

    # Filter out modded characters if ignore_downfall is true
    if filters.get('ignore_downfall') is not None and filters.get('ignore_downfall') != '':
        ignore_downfall = filters['ignore_downfall'].lower() == 'true'
        if ignore_downfall:
            # Check both 'character' and 'character_chosen' fields for compatibility
            filtered = [r for r in filtered if r.get('character_chosen', r.get('character')) in BASE_GAME_CHARACTERS]

    if filters.get('character'):
        # Check both 'character' and 'character_chosen' fields for compatibility
        filtered = [r for r in filtered if r.get('character_chosen', r.get('character')) == filters['character']]

    if filters.get('start_date'):
        start_ts = int(datetime.fromisoformat(filters['start_date']).timestamp())
        filtered = [r for r in filtered if r.get('timestamp', 0) >= start_ts]

    if filters.get('end_date'):
        end_ts = int(datetime.fromisoformat(filters['end_date']).timestamp())
        filtered = [r for r in filtered if r.get('timestamp', 0) <= end_ts]

    if filters.get('ascension_level') is not None and filters.get('ascension_level') != '':
        asc = int(filters['ascension_level'])
        filtered = [r for r in filtered if r.get('ascension_level', 0) == asc]

    if filters.get('victory') is not None and filters.get('victory') != '':
        victory = filters['victory'].lower() == 'true'
        filtered = [r for r in filtered if r.get('victory', False) == victory]

    if filters.get('is_daily') is not None and filters.get('is_daily') != '':
        is_daily = filters['is_daily'].lower() == 'true'
        filtered = [r for r in filtered if r.get('is_daily', False) == is_daily]

    return filtered

@app.route('/api/cards')
def get_card_stats():
    """Get card statistics including pick rates, upgrade rates, and victory correlation"""
    runs = load_all_runs()

    filters = {
        'character': request.args.get('character'),
        'rarity': request.args.get('rarity'),
        'start_date': request.args.get('start_date'),
        'end_date': request.args.get('end_date'),
        'ascension_level': request.args.get('ascension_level'),
        'victory': request.args.get('victory'),
        'is_daily': request.args.get('is_daily'),
        'ignore_downfall': request.args.get('ignore_downfall')
    }

    filtered_runs = apply_filters(runs, filters)

    if not filtered_runs:
        return jsonify({'error': 'No runs found'}), 404

    card_stats = {}

    # Non-card options that can appear in card choices (relics, special events)
    NON_CARD_OPTIONS = {'Singing Bowl'}

    def get_base_card_name(card_name):
        """Strip upgrade suffix from card name"""
        if card_name.endswith('+1'):
            return card_name[:-2], True
        return card_name, False

    for run in filtered_runs:
        victory = run.get('victory', False)
        character = run.get('character', '')

        # Process card choices
        for choice in run.get('card_choices', []):
            picked = choice.get('picked')
            if picked and picked != 'SKIP' and picked not in NON_CARD_OPTIONS:
                base_card, is_upgraded = get_base_card_name(picked)

                if base_card not in card_stats:
                    card_stats[base_card] = {
                        'picks': 0,
                        'picked_upgraded': 0,
                        'victories': 0,
                        'skips_when_available': 0,
                        'times_available': 0,
                        'characters': set()
                    }
                card_stats[base_card]['picks'] += 1
                if is_upgraded:
                    card_stats[base_card]['picked_upgraded'] += 1
                card_stats[base_card]['characters'].add(character)
                if victory:
                    card_stats[base_card]['victories'] += 1

            # Track when cards were available but skipped
            for not_picked in choice.get('not_picked', []):
                if not_picked in NON_CARD_OPTIONS:
                    continue

                base_card, is_upgraded = get_base_card_name(not_picked)

                if base_card not in card_stats:
                    card_stats[base_card] = {
                        'picks': 0,
                        'picked_upgraded': 0,
                        'victories': 0,
                        'skips_when_available': 0,
                        'times_available': 0,
                        'characters': set()
                    }
                card_stats[base_card]['times_available'] += 1
                if picked == 'SKIP':
                    card_stats[base_card]['skips_when_available'] += 1

        # Process campfire upgrades
        for choice in run.get('campfire_choices', []):
            if choice.get('key') == 'SMITH':
                card = choice.get('data')
                if card:
                    base_card, _ = get_base_card_name(card)

                    if base_card not in card_stats:
                        card_stats[base_card] = {
                            'picks': 0,
                            'picked_upgraded': 0,
                            'victories': 0,
                            'campfire_upgrades': 0,
                            'skips_when_available': 0,
                            'times_available': 0,
                            'characters': set()
                        }
                    if 'campfire_upgrades' not in card_stats[base_card]:
                        card_stats[base_card]['campfire_upgrades'] = 0
                    card_stats[base_card]['campfire_upgrades'] += 1

    # Calculate rates and correlations
    result = []
    for card, stats in card_stats.items():
        picks = stats['picks']
        if picks > 0:
            # Get card metadata from database
            card_info = get_card_info(card)

            win_rate = (stats['victories'] / picks) * 100
            picked_upgraded = stats.get('picked_upgraded', 0)
            campfire_upgrades = stats.get('campfire_upgrades', 0)
            times_available = stats['times_available'] + picks
            pick_rate = (picks / times_available * 100) if times_available > 0 else 0

            result.append({
                'card': card_info['display_name'],  # Use proper display name
                'rarity': card_info['rarity'],
                'character': card_info['character'],
                'type': card_info['type'],
                'picks': picks,
                'pick_rate': pick_rate,
                'picked_upgraded': picked_upgraded,
                'campfire_upgrades': campfire_upgrades,
                'win_rate': win_rate,
                'victories': stats['victories'],
                'times_available': times_available,
                'characters': list(stats['characters'])
            })

    # Apply rarity filter
    rarity_filter = filters.get('rarity')
    if rarity_filter:
        result = [card for card in result if card['rarity'] == rarity_filter]

    # Filter out Downfall mod cards (if ignore_downfall is enabled)
    # Downfall cards have specific prefixes like "collector:", "hermit:", "slimebound:", etc.
    ignore_downfall = filters.get('ignore_downfall')
    if ignore_downfall and ignore_downfall.lower() == 'true':
        # List of known Downfall card prefixes
        downfall_prefixes = ['collector:', 'hermit:', 'slimebound:', 'guardian:', 'snecko:', 'gremlin:', 'champ:', 'automaton:', 'spirit:', 'bronze:']
        result = [card for card in result if not any(card.get('card', '').lower().startswith(prefix) for prefix in downfall_prefixes)]

    # Sort by picks descending
    result.sort(key=lambda x: x['picks'], reverse=True)

    return jsonify(result)

@app.route('/api/enemies')
def get_enemy_stats():
    """Get enemy statistics including encounters, defeat rates, and damage taken"""
    runs = load_all_runs()

    filters = {
        'character': request.args.get('character'),
        'start_date': request.args.get('start_date'),
        'end_date': request.args.get('end_date'),
        'ascension_level': request.args.get('ascension_level'),
        'victory': request.args.get('victory'),
        'is_daily': request.args.get('is_daily'),
        'ignore_downfall': request.args.get('ignore_downfall')
    }

    filtered_runs = apply_filters(runs, filters)

    if not filtered_runs:
        return jsonify({'error': 'No runs found'}), 404

    enemy_stats = {}

    for run in filtered_runs:
        victory = run.get('victory', False)
        killed_by = run.get('killed_by')

        for damage_event in run.get('damage_taken', []):
            enemy = damage_event.get('enemies')
            damage = damage_event.get('damage', 0)
            turns = damage_event.get('turns', 0)
            floor = damage_event.get('floor', 0)

            if enemy:
                if enemy not in enemy_stats:
                    enemy_stats[enemy] = {
                        'encounters': 0,
                        'total_damage': 0,
                        'total_turns': 0,
                        'defeats_player': 0,
                        'in_victories': 0,
                        'in_defeats': 0
                    }

                enemy_stats[enemy]['encounters'] += 1
                enemy_stats[enemy]['total_damage'] += damage
                enemy_stats[enemy]['total_turns'] += turns

                if victory:
                    enemy_stats[enemy]['in_victories'] += 1
                else:
                    enemy_stats[enemy]['in_defeats'] += 1

                if killed_by == enemy:
                    enemy_stats[enemy]['defeats_player'] += 1

    # Calculate averages
    result = []
    for enemy, stats in enemy_stats.items():
        encounters = stats['encounters']
        if encounters > 0:
            avg_damage = stats['total_damage'] / encounters
            avg_turns = stats['total_turns'] / encounters
            defeat_rate = (stats['defeats_player'] / encounters) * 100

            result.append({
                'enemy': enemy,
                'encounters': encounters,
                'avg_damage': avg_damage,
                'avg_turns': avg_turns,
                'defeats_player': stats['defeats_player'],
                'defeat_rate': defeat_rate,
                'in_victories': stats['in_victories'],
                'in_defeats': stats['in_defeats']
            })

    # Sort by encounters descending
    result.sort(key=lambda x: x['encounters'], reverse=True)

    return jsonify(result)

@app.route('/api/relics')
def get_relic_stats():
    """Get relic statistics including pick rates and victory correlation"""
    runs = load_all_runs()

    filters = {
        'character': request.args.get('character'),
        'start_date': request.args.get('start_date'),
        'end_date': request.args.get('end_date'),
        'ascension_level': request.args.get('ascension_level'),
        'victory': request.args.get('victory'),
        'is_daily': request.args.get('is_daily'),
        'ignore_downfall': request.args.get('ignore_downfall')
    }

    filtered_runs = apply_filters(runs, filters)

    if not filtered_runs:
        return jsonify({'error': 'No runs found'}), 404

    relic_stats = {}

    for run in filtered_runs:
        victory = run.get('victory', False)
        character = run.get('character', '')

        # Process relics obtained
        for relic_event in run.get('relics_obtained', []):
            relic = relic_event.get('key')
            if relic:
                if relic not in relic_stats:
                    relic_stats[relic] = {
                        'picks': 0,
                        'victories': 0,
                        'times_available': 0,
                        'characters': set()
                    }
                relic_stats[relic]['picks'] += 1
                relic_stats[relic]['characters'].add(character)
                if victory:
                    relic_stats[relic]['victories'] += 1

        # Process boss relics
        for boss_relic in run.get('boss_relics', []):
            picked = boss_relic.get('picked')
            if picked:
                if picked not in relic_stats:
                    relic_stats[picked] = {
                        'picks': 0,
                        'victories': 0,
                        'times_available': 0,
                        'characters': set()
                    }
                relic_stats[picked]['picks'] += 1
                relic_stats[picked]['characters'].add(character)
                if victory:
                    relic_stats[picked]['victories'] += 1

            # Track availability
            for not_picked in boss_relic.get('not_picked', []):
                if not_picked not in relic_stats:
                    relic_stats[not_picked] = {
                        'picks': 0,
                        'victories': 0,
                        'times_available': 0,
                        'characters': set()
                    }
                relic_stats[not_picked]['times_available'] += 1

        # Also count relics in final deck (some may be starter relics)
        for relic in run.get('relics', []):
            if relic not in relic_stats:
                relic_stats[relic] = {
                    'picks': 0,
                    'victories': 0,
                    'times_available': 0,
                    'characters': set()
                }
            # Only count if not already counted
            # This helps capture starter relics

    # Calculate rates
    result = []
    for relic, stats in relic_stats.items():
        picks = stats['picks']
        if picks > 0:
            win_rate = (stats['victories'] / picks) * 100

            result.append({
                'relic': relic,
                'picks': picks,
                'win_rate': win_rate,
                'victories': stats['victories'],
                'defeats': picks - stats['victories'],
                'characters': list(stats['characters'])
            })

    # Filter out Downfall mod relics (if ignore_downfall is enabled)
    # Downfall relics have specific prefixes like "collector:", "hermit:", "sneckomod:", etc.
    ignore_downfall = filters.get('ignore_downfall')
    if ignore_downfall and ignore_downfall.lower() == 'true':
        # List of known Downfall relic prefixes
        downfall_prefixes = ['collector:', 'hermit:', 'slimebound:', 'guardian:', 'snecko:', 'sneckomod:', 'gremlin:', 'champ:', 'automaton:', 'spirit:', 'bronze:']
        result = [relic for relic in result if not any(relic.get('relic', '').lower().startswith(prefix) for prefix in downfall_prefixes)]

    # Sort by picks descending
    result.sort(key=lambda x: x['picks'], reverse=True)

    return jsonify(result)

@app.route('/api/upload-runs', methods=['POST'])
def upload_runs():
    """
    Unified upload endpoint for Supabase
    Accepts both ZIP files and individual .run files
    """
    if not is_supabase_configured():
        return jsonify({'error': 'Supabase is not configured. Please set SUPABASE_URL and SUPABASE_KEY in .env'}), 503

    supabase = get_supabase_client()
    if not supabase:
        return jsonify({'error': 'Failed to connect to Supabase'}), 500

    # Check password
    upload_password = os.getenv('UPLOAD_PASSWORD')
    provided_password = request.form.get('password')

    if not upload_password:
        return jsonify({'error': 'Upload password not configured on server'}), 500

    if not provided_password or provided_password != upload_password:
        return jsonify({'error': 'Invalid password'}), 401

    # Check if files were uploaded
    if 'files' not in request.files:
        return jsonify({'error': 'No files provided'}), 400

    files = request.files.getlist('files')

    if len(files) == 0:
        return jsonify({'error': 'No files selected'}), 400

    try:
        # Collect all .run file contents
        file_contents = []
        temp_extracts = []

        for file in files:
            if file.filename.endswith('.zip'):
                # Handle ZIP file
                filename = secure_filename(file.filename)
                upload_path = UPLOAD_FOLDER / filename
                file.save(upload_path)

                # Extract ZIP
                extract_dir = UPLOAD_FOLDER / f'temp_extract_{filename}'
                if extract_dir.exists():
                    shutil.rmtree(extract_dir)
                extract_dir.mkdir()
                temp_extracts.append((upload_path, extract_dir))

                with zipfile.ZipFile(upload_path, 'r') as zip_ref:
                    zip_ref.extractall(extract_dir)

                # Find all .run files recursively
                for run_file in extract_dir.rglob('*.run'):
                    with open(run_file, 'r', encoding='utf-8') as f:
                        content = f.read()
                        file_contents.append((content, run_file.name))

            elif file.filename.endswith('.run'):
                # Handle individual .run file
                content = file.read().decode('utf-8')
                file_contents.append((content, file.filename))
            else:
                # Skip unsupported file types
                continue

        if len(file_contents) == 0:
            return jsonify({'error': 'No valid .run or .zip files provided'}), 400

        # Parse all runs
        parsed_runs = batch_parse_runs(file_contents)

        if len(parsed_runs) == 0:
            return jsonify({'error': 'Failed to parse any run files'}), 400

        # Check for duplicates in Supabase
        run_identifiers = [run['run_identifier'] for run in parsed_runs]

        try:
            # Query existing runs
            existing_response = supabase.table('runs').select('run_identifier').in_('run_identifier', run_identifiers).execute()
            existing_identifiers = {row['run_identifier'] for row in existing_response.data}
        except Exception as e:
            return jsonify({'error': f'Error checking for duplicates: {str(e)}'}), 500

        # Separate new runs from duplicates
        new_runs = [run for run in parsed_runs if run['run_identifier'] not in existing_identifiers]
        duplicate_count = len(parsed_runs) - len(new_runs)

        # Upload new runs to Supabase
        uploaded_count = 0
        errors = []

        for run in new_runs:
            try:
                supabase.table('runs').insert(run).execute()
                uploaded_count += 1
            except Exception as e:
                errors.append(f"Failed to upload run {run['play_id']}: {str(e)}")

        # Cleanup temp files
        for upload_path, extract_dir in temp_extracts:
            if extract_dir.exists():
                shutil.rmtree(extract_dir)
            if upload_path.exists():
                os.remove(upload_path)

        return jsonify({
            'success': True,
            'total_files': len(files),
            'parsed_runs': len(parsed_runs),
            'new_runs': uploaded_count,
            'duplicate_runs': duplicate_count,
            'errors': errors if errors else None
        })

    except zipfile.BadZipFile:
        return jsonify({'error': 'Invalid ZIP file'}), 400
    except Exception as e:
        # Cleanup on error
        for upload_path, extract_dir in temp_extracts:
            if extract_dir.exists():
                shutil.rmtree(extract_dir)
            if upload_path.exists():
                os.remove(upload_path)
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500


@app.route('/api/supabase/status')
def supabase_status():
    """Check if Supabase is configured and accessible"""
    configured = is_supabase_configured()

    if not configured:
        return jsonify({
            'configured': False,
            'message': 'Supabase credentials not found in .env file'
        })

    # Try to connect
    supabase = get_supabase_client()
    if not supabase:
        return jsonify({
            'configured': True,
            'connected': False,
            'message': 'Failed to create Supabase client'
        })

    # Try a simple query to test connection
    try:
        supabase.table('runs').select('count', count='exact').limit(0).execute()
        return jsonify({
            'configured': True,
            'connected': True,
            'asleep': False,
            'message': 'Supabase is connected and ready'
        })
    except Exception as e:
        error_msg = str(e).lower()
        # Check if error indicates database is sleeping/paused
        is_asleep = any(keyword in error_msg for keyword in ['paused', 'sleeping', 'inactive', 'hibernat'])

        return jsonify({
            'configured': True,
            'connected': False,
            'asleep': is_asleep,
            'message': f'Connection test failed: {str(e)}'
        })

@app.route('/api/supabase/wake', methods=['POST'])
def supabase_wake():
    """Wake up a sleeping Supabase database"""
    if not is_supabase_configured():
        return jsonify({'error': 'Supabase is not configured'}), 503

    supabase = get_supabase_client()
    if not supabase:
        return jsonify({'error': 'Failed to create Supabase client'}), 500

    try:
        # Make a simple query to wake up the database
        supabase.table('runs').select('count', count='exact').limit(0).execute()
        return jsonify({
            'success': True,
            'message': 'Database is now awake'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to wake database: {str(e)}'
        }), 500

@app.route('/api/runs-supabase')
def get_runs_supabase():
    """Get all runs from Supabase with optional filtering"""
    if not is_supabase_configured():
        return jsonify({'error': 'Supabase is not configured'}), 503

    supabase = get_supabase_client()
    if not supabase:
        return jsonify({'error': 'Failed to connect to Supabase'}), 500

    try:
        # Build query
        query = supabase.table('runs').select('*')

        # Apply filters
        character = request.args.get('character')
        if character:
            query = query.eq('character', character)

        victory = request.args.get('victory')
        if victory is not None and victory != '':
            victory_bool = victory.lower() == 'true'
            query = query.eq('victory', victory_bool)

        ascension_level = request.args.get('ascension_level')
        if ascension_level is not None and ascension_level != '':
            query = query.eq('ascension_level', int(ascension_level))

        is_daily = request.args.get('is_daily')
        if is_daily is not None and is_daily != '':
            is_daily_bool = is_daily.lower() == 'true'
            query = query.eq('is_daily', is_daily_bool)

        # Execute query
        response = query.execute()
        return jsonify(response.data)

    except Exception as e:
        return jsonify({'error': f'Failed to fetch runs: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
