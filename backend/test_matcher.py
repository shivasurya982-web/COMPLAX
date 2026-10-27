import pandas as pd
import re
import difflib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

DATASET_PATH = 'c:/COMPLAX/dataset/complaint_priority_dataset.csv'
df = pd.read_csv(DATASET_PATH)

# Basic rule-based stemmer / normalizer to avoid heavy external dependencies like nltk
def normalize_tokens(text):
    text = text.lower()
    text = re.sub(r'[\'’]', '', text)
    text = re.sub(r'wi-fi', 'wifi', text)
    text = re.sub(r'r/o', 'ro', text)
    text = re.sub(r'a/c', 'ac', text)
    # Remove prefix phrases
    text = re.sub(r'^(please report:\s*|urgent:\s*|reporting an issue:\s*|kindly note:\s*|complaint:\s*|request for\s*)', '', text)
    # Replace non-alphanumeric with spaces
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    
    # Simple stemmer
    words = text.split()
    stemmed = []
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

df['normalized'] = df['complaint'].apply(normalize_tokens)

# Strip standard location suffixes for cleaner display
def get_clean_display(text):
    clean = re.sub(r'^(Please report:\s*|Urgent:\s*|Reporting an issue:\s*|Kindly note:\s*|Complaint:\s*|Request for\s*)', '', str(text), flags=re.IGNORECASE)
    return clean.strip(' .')

df['display_text'] = df['complaint'].apply(get_clean_display)

# Detect category
def detect_category(text):
    t = text.lower()
    if any(k in t for k in ['water', 'pipe', 'tap', 'leak', 'drain', 'flush', 'basin', 'shower', 'sewage', 'flood', 'geyser', 'bucket']):
        return "Water Supply & Plumbing"
    if any(k in t for k in ['spark', 'switch', 'socket', 'wire', 'power', 'fuse', 'panel', 'circuit', 'bulb', 'tube light', 'fan', 'voltage', 'charging', 'regulator']):
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

df['category'] = df['complaint'].apply(detect_category)

# Group dataset into distinct unique base complaints with their stable authoritative records
unique_records = []
seen_keys = set()

for idx, row in df.iterrows():
    # Use normalized text + priority as canonical key
    norm = row['normalized']
    prio = row['priority']
    disp = row['display_text']
    cat = row['category']
    
    # We want representative records
    key = (re.sub(r'\s+(in my room|in the hostel block|on my floor|near my room|near the room)$', '', norm), prio)
    if key not in seen_keys:
        seen_keys.add(key)
        unique_records.append({
            'record_id': f"ds_{len(unique_records) + 1}",
            'raw_index': idx,
            'complaint': row['complaint'],
            'display_text': disp,
            'normalized': norm,
            'category': cat,
            'priority': prio
        })

df_unique = pd.DataFrame(unique_records)
print(f"Total rows: {len(df)} -> Canonical unique suggestions: {len(df_unique)}")

vectorizer = TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True)
X_tfidf = vectorizer.fit_transform(df_unique['normalized'])

def search(query, top_k=5):
    q_norm = normalize_tokens(query)
    q_tokens = set(q_norm.split())
    if not q_tokens:
        return []
        
    q_vec = vectorizer.transform([q_norm])
    cos_sims = cosine_similarity(q_vec, X_tfidf).flatten()
    
    scored = []
    for idx, row in df_unique.iterrows():
        tfidf_s = float(cos_sims[idx])
        c_tokens = set(row['normalized'].split())
        
        # Exact token overlap ratio
        overlap = len(q_tokens & c_tokens) / max(len(q_tokens), 1)
        
        # Substring bonus if query is directly in normalized string
        sub_bonus = 0.25 if q_norm in row['normalized'] else 0.0
        
        # Fuzzy character match for misspellings
        fuzzy = difflib.SequenceMatcher(None, q_norm, row['normalized'][:len(q_norm) * 2]).ratio()
        
        composite = 0.45 * tfidf_s + 0.30 * overlap + 0.15 * sub_bonus + 0.10 * fuzzy
        if composite >= 0.22 or overlap >= 0.5:
            scored.append((composite, row))
            
    scored.sort(key=lambda x: x[0], reverse=True)
    return [r.to_dict() for s, r in scored[:top_k]]

queries = [
    'water is not coming',
    'tap leak',
    'sparks from switch',
    'ceeling fan not working',
    'wifi disconnect',
    'door lock broken',
    'smoke from socket',
    'toilet flush',
    'broken window glass',
    'garbage blocking entrance'
]

for q in queries:
    print(f"\nQuery: '{q}'")
    for r in search(q):
        print(f"  [{r['priority']:6}] [{r['category']:25}] {r['display_text']}")
