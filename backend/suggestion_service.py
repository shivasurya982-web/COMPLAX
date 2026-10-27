import os
import re
import difflib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, '..', 'dataset', 'complaint_priority_dataset.csv')
APPROVED_DATASETS_DIR = os.path.join(BASE_DIR, 'datasets', 'approved')
PENDING_DATASETS_DIR = os.path.join(BASE_DIR, 'datasets', 'pending')

def detect_category_from_text(text):
    t = str(text).lower()
    if any(k in t for k in ['water', 'pipe', 'tap', 'leak', 'drain', 'flush', 'basin', 'shower', 'sewage', 'flood', 'geyser', 'bucket', 'tank']):
        return "Water Supply & Plumbing"
    if any(k in t for k in ['spark', 'switch', 'socket', 'wire', 'power', 'fuse', 'panel', 'circuit', 'bulb', 'tube light', 'fan', 'voltage', 'charging', 'regulator', 'outage']):
        return "Electrical & Power"
    if any(k in t for k in ['door', 'lock', 'key', 'handle', 'latch', 'window', 'glass', 'railing', 'hinge', 'stopper']):
        return "Doors, Windows & Hardware"
    if any(k in t for k in ['lift', 'elevator', 'escalator']):
        return "Elevator & Lift"
    if any(k in t for k in ['garbage', 'dust', 'dirty', 'clean', 'washroom', 'toilet', 'odor', 'smell', 'pest', 'mosquito', 'insect', 'cockroach']):
        return "Sanitation & Housekeeping"
    if any(k in t for k in ['bed', 'mattress', 'chair', 'table', 'wardrobe', 'cupboard', 'mirror', 'desk', 'cushion', 'hanger', 'curtain']):
        return "Furniture & Fixtures"
    if any(k in t for k in ['fire', 'smoke', 'alarm', 'extinguisher', 'security', 'guard', 'theft', 'hazard', 'emergency', 'plaster', 'slab']):
        return "Safety & Infrastructure"
    if any(k in t for k in ['wifi', 'wi-fi', 'internet', 'router', 'network', 'connection']):
        return "Internet & Network"
    return "General Maintenance"

def clean_display_text(text):
    clean = re.sub(r'^(Please report:\s*|Urgent:\s*|Reporting an issue:\s*|Kindly note:\s*|Complaint:\s*|Request for\s*)', '', str(text), flags=re.IGNORECASE)
    return clean.strip(' .')

def normalize_text(text):
    text = str(text).lower()
    text = re.sub(r'[\'’]', '', text)
    text = re.sub(r'wi-fi', 'wifi', text)
    text = re.sub(r'r/o', 'ro', text)
    text = re.sub(r'a/c', 'ac', text)
    text = re.sub(r'^(please report:\s*|urgent:\s*|reporting an issue:\s*|kindly note:\s*|complaint:\s*|request for\s*)', '', text)
    text = re.sub(r'[^a-z0-9\s]', ' ', text)

    synonyms = {
        'leaking': 'leak', 'leaks': 'leak', 'leaked': 'leak',
        'bursting': 'burst', 'bursted': 'burst',
        'breaking': 'broken', 'breaks': 'broken', 'broke': 'broken',
        'damaged': 'broken', 'damaging': 'broken',
        'sparking': 'spark', 'sparks': 'spark',
        'disconnecting': 'disconnect', 'disconnected': 'disconnect', 'disconnects': 'disconnect',
        'stopping': 'stop', 'stopped': 'stop', 'stops': 'stop',
        'stuck': 'stuck', 'jammed': 'stuck',
        'smelling': 'smell', 'smells': 'smell',
        'overflowing': 'overflow', 'overflows': 'overflow',
        'working': 'work', 'works': 'work',
        'coming': 'come', 'comes': 'come',
        'flooding': 'flood', 'flooded': 'flood',
        'falling': 'fall', 'fallen': 'fall',
        'staining': 'stain', 'stained': 'stain', 'stains': 'stain',
        'switches': 'switch', 'sockets': 'socket',
        'lights': 'light', 'pipes': 'pipe', 'taps': 'tap',
        'fans': 'fan', 'doors': 'door', 'locks': 'lock',
        'windows': 'window', 'tiles': 'tile', 'rooms': 'room',
        'cables': 'cable', 'elevators': 'elevator', 'lifts': 'lift',
        'supplies': 'supply'
    }

    words = text.split()
    stemmed = []
    for w in words:
        if w in synonyms:
            stemmed.append(synonyms[w])
        elif w.endswith('ing') and len(w) > 5:
            stemmed.append(w[:-3])
        elif w.endswith('ed') and len(w) > 4:
            stemmed.append(w[:-2])
        elif w.endswith('s') and len(w) > 3 and not w.endswith('ss'):
            stemmed.append(w[:-1])
        else:
            stemmed.append(w)

    return ' '.join(stemmed)


class ComplaintSuggestionService:
    def __init__(self, dataset_path=DATASET_PATH):
        self.dataset_path = dataset_path
        self.records = []
        self.record_by_id = {}
        self.vectorizer = None
        self.X_tfidf = None
        self.load_and_index()

    def load_and_index(self):
        raw_rows = []

        # 1. Load primary dataset
        if os.path.exists(self.dataset_path):
            try:
                df = pd.read_csv(self.dataset_path)
                if 'complaint' in df.columns and 'priority' in df.columns:
                    for _, row in df.iterrows():
                        raw_rows.append({
                            'complaint': str(row['complaint']).strip(),
                            'priority': str(row['priority']).strip().capitalize(),
                            'category': str(row.get('category')).strip() if 'category' in row and pd.notna(row['category']) else None,
                            'orgId': 'global',
                            'source': 'complaint_priority_dataset.csv'
                        })
            except Exception as e:
                print(f"[COMPLAX] Error loading primary dataset: {e}")

        # 2. Base templates from dataset_manager
        try:
            from dataset_manager import generate_initial_dataset
            base_templates = {
                "High": [
                    "Lift is stuck between floors with people inside",
                    "Elevator is stopped and doors will not open",
                    "Elevator cable making strange noise and vibrating heavily",
                    "Lift is stuck and not responding to buttons",
                    "Fire alarm is not working in Block A",
                    "Major water pipe has burst in the parking area",
                    "Water is not coming in the entire block",
                    "No water supply in the entire hostel building",
                    "Electrical short circuit in room 302",
                    "Main electrical panel is sparking and smelling like burnt plastic",
                    "Security gate is broken and unauthorized people are entering",
                    "Severe gas leak detected in the kitchen",
                    "Ceiling slab fell in the common room",
                    "Medical emergency, ambulance access blocked",
                    "Transformer blast near office building",
                    "Flood in the basement storage",
                    "Total power outage in the ICU wing",
                    "Fire extinguisher is empty and fire started in trash bin"
                ],
                "Medium": [
                    "Lift is making strange grinding noise when moving",
                    "Room fan is not working since morning",
                    "Bathroom tap is leaking continuously",
                    "Water pressure is low in the bathroom",
                    "Water is not coming on this floor",
                    "WiFi is unstable in the library area",
                    "Tube light is damaged in the hallway",
                    "Door lock is difficult to operate and needs oiling",
                    "AC is not cooling properly in the conference room",
                    "Kitchen sink is clogged",
                    "Window pane is cracked",
                    "Pest problem in the cafeteria",
                    "Intercom not working in flat 102",
                    "Water heater not working in bathroom 2",
                    "Printer is jammed in the office",
                    "Carpeting is torn and causing tripping hazard",
                    "Staircase lighting is very dim",
                    "Gym equipment is broken"
                ],
                "Low": [
                    "Lift interior display screen is flickering",
                    "Room cleaning required for room 205",
                    "Garbage has not been collected from the lobby",
                    "Common area needs cleaning after the event",
                    "Minor furniture damage on the study table",
                    "Light brightness is low in the balcony",
                    "Curtains need washing",
                    "Garden grass needs cutting",
                    "Wall paint is peeling off in the corner",
                    "Clock in the lobby is showing wrong time",
                    "Water cooler needs refilling",
                    "Notice board is messy",
                    "Plants in the office need watering",
                    "Dust on the server racks",
                    "Bicycle stand is disorganized",
                    "Empty water bottles scattered in the parking"
                ]
            }
            for prio, complaints in base_templates.items():
                for c in complaints:
                    raw_rows.append({
                        'complaint': c,
                        'priority': prio,
                        'category': detect_category_from_text(c),
                        'orgId': 'global',
                        'source': 'dataset_manager.py'
                    })
        except Exception as e:
            pass

        # 3. Load approved organization datasets
        if os.path.exists(APPROVED_DATASETS_DIR):
            try:
                for fname in os.listdir(APPROVED_DATASETS_DIR):
                    if fname.endswith('.csv'):
                        fpath = os.path.join(APPROVED_DATASETS_DIR, fname)
                        org_file_id = fname[:-4]
                        df_app = pd.read_csv(fpath)
                        if 'complaint' in df_app.columns and 'priority' in df_app.columns:
                            for _, row in df_app.iterrows():
                                raw_rows.append({
                                    'complaint': str(row['complaint']).strip(),
                                    'priority': str(row['priority']).strip().capitalize(),
                                    'category': str(row.get('category')).strip() if 'category' in row and pd.notna(row['category']) else None,
                                    'orgId': org_file_id,
                                    'source': fname
                                })
            except Exception as e:
                print(f"[COMPLAX] Error loading approved datasets: {e}")

        records = []
        seen_canonical = set()

        for idx, item in enumerate(raw_rows):
            comp = item['complaint']
            prio = item['priority']
            if prio not in ['High', 'Medium', 'Low']:
                continue

            norm = normalize_text(comp)
            disp = clean_display_text(comp)
            cat = item['category'] or detect_category_from_text(comp)

            base_key = (comp.lower(), prio, item['orgId'])

            if base_key not in seen_canonical:
                seen_canonical.add(base_key)
                rec_id = f"ds_{len(records) + 1:04d}"
                record = {
                    'recordId': rec_id,
                    'complaint': comp,
                    'displayText': disp,
                    'normalized': norm,
                    'category': cat,
                    'priority': prio,
                    'orgId': item['orgId'],
                    'source': item['source']
                }
                records.append(record)

        self.records = records
        self.record_by_id = {r['recordId']: r for r in records}

        if self.records:
            self.vectorizer = TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True)
            self.X_tfidf = self.vectorizer.fit_transform([r['normalized'] for r in self.records if r['normalized']])
            print(f"[COMPLAX] Live Suggestion Service indexed {len(self.records)} dataset complaint records.")
        else:
            self.vectorizer = None
            self.X_tfidf = None

    def get_suggestions(self, query, org_id=None, limit=10):
        if not query or not str(query).strip():
            return []

        q_raw = str(query).strip()
        q_lower = q_raw.lower()
        q_tokens = [w for w in re.split(r'\s+', q_lower) if w]
        if not q_tokens:
            return []

        resolved_org_id = None
        if org_id and str(org_id).strip().lower() not in ['default', 'none', 'null']:
            try:
                from ml_model import resolve_approved_org_id
                resolved_org_id = resolve_approved_org_id(org_id)
            except Exception:
                resolved_org_id = str(org_id).strip()

        scored_matches = []

        for idx, rec in enumerate(self.records):
            rec_org = rec.get('orgId')

            # Filter out other organizations' private datasets
            if resolved_org_id and rec_org and rec_org != 'global' and rec_org != resolved_org_id:
                if rec_org.upper().replace('O', '0') != resolved_org_id.upper().replace('O', '0'):
                    continue

            comp_orig = rec['complaint']
            comp_disp = rec['displayText']
            comp_lower = comp_orig.lower()
            disp_lower = comp_disp.lower()

            score = 0.0

            # 1. Direct Substring Match (Highest Priority)
            if q_lower in comp_lower or q_lower in disp_lower:
                score += 30.0
                if comp_lower.startswith(q_lower) or disp_lower.startswith(q_lower):
                    score += 10.0

            # 2. Phrase Fuzzy Match (Catches typos like 'c block' <-> 'c bolck')
            comp_prefix = comp_lower[:max(len(q_lower) + 12, 20)]
            fuzzy_ratio = difflib.SequenceMatcher(None, q_lower, comp_prefix).ratio()
            if fuzzy_ratio >= 0.4:
                score += fuzzy_ratio * 15.0

            # 3. Individual Word & Prefix Token Matching
            words = re.findall(r'[a-z0-9]+', comp_lower)
            matched_count = 0

            for q_tok in q_tokens:
                tok_matched = False
                for w in words:
                    if len(q_tok) == 1:
                        if w == q_tok:
                            score += 4.0
                            tok_matched = True
                        elif w.startswith(q_tok):
                            score += 1.0
                            tok_matched = True
                    else:
                        if w == q_tok:
                            score += 5.0
                            tok_matched = True
                        elif w.startswith(q_tok):
                            score += 3.5
                            tok_matched = True
                        elif q_tok in w:
                            score += 1.5
                            tok_matched = True

                if tok_matched:
                    matched_count += 1

            if matched_count > 0:
                score += matched_count * 2.0

            # 4. Organization Boost
            if resolved_org_id and rec_org == resolved_org_id:
                score += 3.0

            # Include if score > 0.5
            if score > 0.5:
                matched_terms = [t for t in q_tokens if t in comp_lower]
                scored_matches.append((score, rec, matched_terms))

        scored_matches.sort(key=lambda x: x[0], reverse=True)

        suggestions = []
        seen_texts = set()

        for score, rec, matched in scored_matches:
            text_key = rec['displayText'].lower()
            if text_key in seen_texts:
                continue
            seen_texts.add(text_key)

            suggestions.append({
                'recordId': rec['recordId'],
                'complaint': rec['complaint'],
                'displayText': rec['displayText'],
                'category': rec['category'],
                'priority': rec['priority'],
                'score': round(score, 3),
                'matchedTerms': matched
            })

            if len(suggestions) >= limit:
                break

        return suggestions

    def validate_record(self, record_id):
        return self.record_by_id.get(record_id)


_suggestion_service = None

def get_suggestion_service(force_reload=False):
    global _suggestion_service
    if _suggestion_service is None or force_reload:
        _suggestion_service = ComplaintSuggestionService()
    return _suggestion_service
