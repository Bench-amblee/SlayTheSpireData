"""
Parser for Slay the Spire .run files
Extracts relevant data for database storage
"""
import json
import hashlib
from datetime import datetime
from pathlib import Path

def create_unique_run_identifier(run_data):
    """
    Create a unique identifier for a run using multiple fields
    Combines play_id + timestamp + seed for maximum uniqueness
    """
    play_id = run_data.get('play_id', '')
    timestamp = run_data.get('seed_source_timestamp', 0)
    seed = run_data.get('seed_played', '')

    # Create a hash of these combined values for extra uniqueness
    identifier_string = f"{play_id}_{timestamp}_{seed}"

    # Use SHA256 hash of the identifier for consistency
    hash_object = hashlib.sha256(identifier_string.encode())
    return f"{play_id}_{hash_object.hexdigest()[:16]}"

def parse_run_file(file_content, filename=None):
    """
    Parse a .run file and extract structured data

    Args:
        file_content: String content of the .run file (JSON)
        filename: Optional filename for error reporting

    Returns:
        dict: Structured run data ready for database insertion
        None: If parsing fails
    """
    try:
        # Parse JSON
        if isinstance(file_content, str):
            run_data = json.loads(file_content)
        else:
            run_data = file_content

        # Extract basic info
        play_id = run_data.get('play_id', '')
        if not play_id:
            print(f"Warning: Run file {filename} has no play_id")
            return None

        # Create unique identifier
        run_identifier = create_unique_run_identifier(run_data)

        # Extract character name
        character = run_data.get('character_chosen', 'UNKNOWN')

        # Extract stats
        floor_reached = run_data.get('floor_reached', 0)
        victory = run_data.get('victory', False)
        score = run_data.get('score', 0)
        ascension_level = run_data.get('ascension_level', 0)
        is_ascension_mode = run_data.get('is_ascension_mode', False)
        is_daily = run_data.get('is_daily', False)

        # Extract timing
        playtime = run_data.get('playtime', 0)
        timestamp = run_data.get('seed_source_timestamp', 0)
        local_time = run_data.get('local_time', '')

        # Extract seed info
        seed_played = run_data.get('seed_played', '')
        seed_source_timestamp = run_data.get('seed_source_timestamp', 0)

        # Extract gold and HP
        gold_per_floor = run_data.get('gold_per_floor', [])
        gold = gold_per_floor[-1] if gold_per_floor else 0

        current_hp_per_floor = run_data.get('current_hp_per_floor', [])
        max_hp_per_floor = run_data.get('max_hp_per_floor', [])
        current_hp_final = current_hp_per_floor[-1] if current_hp_per_floor else 0
        max_hp_final = max_hp_per_floor[-1] if max_hp_per_floor else 0

        # Extract deck and relic info
        master_deck = run_data.get('master_deck', [])
        deck_size = len(master_deck)

        relics = run_data.get('relics', [])
        relic_count = len(relics)

        # Extract choice counts
        card_choices = run_data.get('card_choices', [])
        cards_picked = len(card_choices)

        campfire_choices = run_data.get('campfire_choices', [])
        campfire_rested = sum(1 for c in campfire_choices if c.get('key') == 'REST')
        campfire_upgraded = sum(1 for c in campfire_choices if c.get('key') == 'SMITH')

        items_purged = run_data.get('items_purged', [])
        items_purged_count = len(items_purged)

        # Extract death/victory info
        killed_by = run_data.get('killed_by', None)

        # Extract Neow bonus
        neow_bonus = run_data.get('neow_bonus', None)
        neow_cost = run_data.get('neow_cost', None)
        chose_neow_reward = run_data.get('chose_neow_reward', None)

        # Build structured data
        parsed_data = {
            'run_identifier': run_identifier,
            'play_id': play_id,
            'seed_played': seed_played,
            'seed_source_timestamp': seed_source_timestamp,
            'user_id': 'default_user',  # Can be customized later
            'character': character,
            'floor_reached': floor_reached,
            'victory': victory,
            'score': score,
            'ascension_level': ascension_level,
            'is_ascension_mode': is_ascension_mode,
            'is_daily': is_daily,
            'playtime': playtime,
            'timestamp': timestamp,
            'local_time': local_time,
            'gold': gold,
            'max_hp_final': max_hp_final,
            'current_hp_final': current_hp_final,
            'deck_size': deck_size,
            'relic_count': relic_count,
            'cards_picked': cards_picked,
            'campfire_rested': campfire_rested,
            'campfire_upgraded': campfire_upgraded,
            'items_purged_count': items_purged_count,
            'killed_by': killed_by,
            'neow_bonus': neow_bonus,
            'neow_cost': neow_cost,
            'chose_neow_reward': chose_neow_reward,
            'raw_data': run_data  # Store complete JSON
        }

        return parsed_data

    except json.JSONDecodeError as e:
        print(f"Error parsing JSON in {filename}: {e}")
        return None
    except Exception as e:
        print(f"Error parsing run file {filename}: {e}")
        return None

def parse_run_file_from_path(file_path):
    """
    Parse a .run file from a file path

    Args:
        file_path: Path to the .run file

    Returns:
        dict: Structured run data ready for database insertion
        None: If parsing fails
    """
    try:
        path = Path(file_path)
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        return parse_run_file(content, filename=path.name)
    except Exception as e:
        print(f"Error reading file {file_path}: {e}")
        return None

def batch_parse_runs(file_contents_list):
    """
    Parse multiple run files at once

    Args:
        file_contents_list: List of tuples (content, filename)

    Returns:
        list: List of parsed run data dicts
    """
    parsed_runs = []
    for content, filename in file_contents_list:
        parsed = parse_run_file(content, filename)
        if parsed:
            parsed_runs.append(parsed)
    return parsed_runs
