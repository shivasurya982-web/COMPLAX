import pandas as pd
import joblib
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from dataset_manager import load_dataset

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, 'models')
APPROVED_DATASETS_DIR = os.path.join(BASE_DIR, 'datasets', 'approved')
PENDING_DATASETS_DIR = os.path.join(BASE_DIR, 'datasets', 'pending')
DEFAULT_MODEL_DIR = os.path.join(MODELS_DIR, 'default')

# Global cache to keep models in memory for fast prediction
MODEL_CACHE = {}

def normalize_org_id(id_str):
    if not id_str:
        return 'default'
    return str(id_str).strip().upper().replace('O', '0')

def resolve_approved_org_id(target_id):
    """
    Finds the exact org_id or approved dataset filename for a given target_id.
    Handles 'O' vs '0' ambiguity, dataset_requests matching, and organization matching.
    """
    if not target_id or str(target_id).strip().lower() in ['default', 'none', 'null']:
        return 'default'

    target_clean = str(target_id).strip()
    target_norm = normalize_org_id(target_clean)

    # 1. Direct model or dataset file check
    if os.path.exists(os.path.join(MODELS_DIR, target_clean)) or os.path.exists(os.path.join(APPROVED_DATASETS_DIR, f"{target_clean}.csv")):
        return target_clean

    # 2. Check approved datasets directory for normalized match
    if os.path.exists(APPROVED_DATASETS_DIR):
        for fname in os.listdir(APPROVED_DATASETS_DIR):
            if fname.endswith('.csv'):
                fname_id = fname[:-4]
                if fname_id == target_clean or normalize_org_id(fname_id) == target_norm:
                    return fname_id

    # 3. Check pending datasets directory for normalized match
    if os.path.exists(PENDING_DATASETS_DIR):
        for fname in os.listdir(PENDING_DATASETS_DIR):
            if fname.endswith('.csv'):
                fname_id = fname[:-4]
                if fname_id == target_clean or normalize_org_id(fname_id) == target_norm:
                    return fname_id

    # 4. Check dataset_requests database for approved dataset
    try:
        from utils.helpers import read_json
        from config import DATASET_REQUESTS_FILE, ORGANIZATIONS_FILE

        requests = read_json(DATASET_REQUESTS_FILE)
        for r in requests:
            if r.get('status') == 'APPROVED':
                r_org_id = r.get('organizationId', '')
                r_name = r.get('organizationName', '').strip().lower()
                r_req_id = r.get('requestId', '')

                if (r_org_id and (r_org_id == target_clean or normalize_org_id(r_org_id) == target_norm)) or \
                   (r_req_id and (r_req_id == target_clean or normalize_org_id(r_req_id) == target_norm)) or \
                   (r_name and r_name == target_clean.lower()):
                    base_name = r.get('datasetName', f"{r_org_id}.csv").replace('.csv', '')
                    if os.path.exists(os.path.join(APPROVED_DATASETS_DIR, f"{base_name}.csv")):
                        return base_name
                    if os.path.exists(os.path.join(APPROVED_DATASETS_DIR, f"{r_org_id}.csv")):
                        return r_org_id

        # 5. Check organizations list
        orgs = read_json(ORGANIZATIONS_FILE)
        for o in orgs:
            o_id = o.get('organizationId', '')
            o_name = o.get('name', '').strip().lower()
            if (o_id and (o_id == target_clean or normalize_org_id(o_id) == target_norm)) or \
               (o_name and o_name == target_clean.lower()):
                if o_id and os.path.exists(os.path.join(APPROVED_DATASETS_DIR, f"{o_id}.csv")):
                    return o_id
    except Exception as e:
        print(f"[COMPLAX] Error resolving approved dataset for '{target_id}': {e}")

    return target_clean

class MLModel:
    def __init__(self, org_id='default'):
        self.org_id = org_id
        self.model_dir = os.path.join(MODELS_DIR, org_id)
        self.vectorizer_path = os.path.join(self.model_dir, 'tfidf_vectorizer.pkl')
        self.model_path = os.path.join(self.model_dir, 'priority_model.pkl')
        self.vectorizer = None
        self.model = None

    def train(self, dataset_path=None):
        os.makedirs(self.model_dir, exist_ok=True)

        if dataset_path and os.path.exists(dataset_path):
            df = pd.read_csv(dataset_path)
        else:
            df = load_dataset()

        if 'complaint' not in df.columns or 'priority' not in df.columns:
            raise ValueError(f"Dataset at {dataset_path} missing 'complaint' or 'priority' columns.")

        X = df['complaint'].astype(str)
        y = df['priority'].astype(str).str.strip().str.capitalize()

        self.vectorizer = TfidfVectorizer(stop_words='english')
        X_vec = self.vectorizer.fit_transform(X)

        if len(y.unique()) > 1:
            X_train, X_test, y_train, y_test = train_test_split(X_vec, y, test_size=0.2, random_state=42)
            self.model = DecisionTreeClassifier()
            self.model.fit(X_train, y_train)
            y_pred = self.model.predict(X_test)
            accuracy = accuracy_score(y_test, y_pred)
        else:
            self.model = DecisionTreeClassifier()
            self.model.fit(X_vec, y)
            accuracy = 1.0

        joblib.dump(self.vectorizer, self.vectorizer_path)
        joblib.dump(self.model, self.model_path)

        MODEL_CACHE[self.org_id] = self
        print(f"[COMPLAX] Trained MLModel for org '{self.org_id}' ({len(df)} records). Accuracy: {accuracy:.2f}")

        return accuracy

    def load(self):
        if os.path.exists(self.vectorizer_path) and os.path.exists(self.model_path):
            try:
                self.vectorizer = joblib.load(self.vectorizer_path)
                self.model = joblib.load(self.model_path)
                return True
            except Exception as e:
                print(f"[COMPLAX] Failed loading model for '{self.org_id}': {e}")
                return False
        return False

    def predict(self, complaint_text):
        if not complaint_text or not str(complaint_text).strip():
            return "Medium", 0.5

        try:
            if not self.model or not self.vectorizer:
                if not self.load():
                    if self.org_id != 'default':
                        default_ml = get_model_for_org('default')
                        return default_ml.predict(complaint_text)
                    else:
                        self.train()

            X_vec = self.vectorizer.transform([str(complaint_text).strip()])
            raw_pred = self.model.predict(X_vec)[0]
            prediction = str(raw_pred).strip().capitalize()
            if prediction not in ['High', 'Medium', 'Low']:
                prediction = 'Medium'

            try:
                probs = self.model.predict_proba(X_vec)[0]
                confidence = float(max(probs))
            except Exception:
                confidence = 0.85

            return prediction, confidence
        except Exception as e:
            print(f"[COMPLAX] Prediction error for '{self.org_id}': {e}")
            return "Medium", 0.5


def get_model_for_org(org_id):
    if not org_id or str(org_id).strip().lower() in ['default', 'none', 'null']:
        org_id = 'default'

    resolved_id = resolve_approved_org_id(org_id)

    if resolved_id in MODEL_CACHE:
        return MODEL_CACHE[resolved_id]
    if org_id in MODEL_CACHE:
        return MODEL_CACHE[org_id]

    model = MLModel(resolved_id)
    if model.load():
        MODEL_CACHE[resolved_id] = model
        MODEL_CACHE[org_id] = model
        return model

    approved_csv = os.path.join(APPROVED_DATASETS_DIR, f"{resolved_id}.csv")
    if os.path.exists(approved_csv):
        try:
            model.train(approved_csv)
            MODEL_CACHE[resolved_id] = model
            MODEL_CACHE[org_id] = model
            return model
        except Exception as e:
            print(f"[COMPLAX] Failed training model for '{resolved_id}': {e}")

    pending_csv = os.path.join(PENDING_DATASETS_DIR, f"{resolved_id}.csv")
    if os.path.exists(pending_csv):
        try:
            model.train(pending_csv)
            MODEL_CACHE[resolved_id] = model
            MODEL_CACHE[org_id] = model
            return model
        except Exception as e:
            pass

    if resolved_id == 'default' or org_id == 'default':
        default_model = MLModel('default')
        if not default_model.load():
            default_model.train()
        MODEL_CACHE['default'] = default_model
        return default_model

    return get_model_for_org('default')
