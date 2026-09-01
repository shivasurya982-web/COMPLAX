import pandas as pd
import joblib
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from dataset_manager import load_dataset

MODELS_DIR = os.path.join(os.path.dirname(__file__), 'models')
DEFAULT_MODEL_DIR = os.path.join(MODELS_DIR, 'default')

# Global cache to keep models in memory for fast prediction
MODEL_CACHE = {}

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

        if dataset_path:
            df = pd.read_csv(dataset_path)
        else:
            df = load_dataset()

        X = df['complaint']
        y = df['priority']

        self.vectorizer = TfidfVectorizer(stop_words='english')
        X_vec = self.vectorizer.fit_transform(X)

        X_train, X_test, y_train, y_test = train_test_split(X_vec, y, test_size=0.2, random_state=42)

        self.model = DecisionTreeClassifier()
        self.model.fit(X_train, y_train)

        y_pred = self.model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)

        joblib.dump(self.vectorizer, self.vectorizer_path)
        joblib.dump(self.model, self.model_path)

        # Update cache after training
        MODEL_CACHE[self.org_id] = self

        return accuracy

    def load(self):
        if os.path.exists(self.vectorizer_path) and os.path.exists(self.model_path):
            self.vectorizer = joblib.load(self.vectorizer_path)
            self.model = joblib.load(self.model_path)
            return True
        return False

    def predict(self, complaint_text):
        if not self.model or not self.vectorizer:
            if not self.load():
                # Fallback to default model if org-specific model fails to load
                if self.org_id != 'default':
                    default_ml = get_model_for_org('default')
                    return default_ml.predict(complaint_text)
                else:
                    self.train()

        X_vec = self.vectorizer.transform([complaint_text])
        prediction = self.model.predict(X_vec)[0]

        # Get confidence if possible
        try:
            probs = self.model.predict_proba(X_vec)[0]
            confidence = float(max(probs))
        except:
            confidence = 1.0

        return prediction, confidence

def get_model_for_org(org_id):
    # Check if model is already in memory
    if org_id in MODEL_CACHE:
        return MODEL_CACHE[org_id]

    model = MLModel(org_id)
    if model.load():
        MODEL_CACHE[org_id] = model
        return model

    # If it's the first time loading the default model
    if org_id == 'default':
        model.train()
        MODEL_CACHE['default'] = model
        return model

    # Fallback to cached default
    return get_model_for_org('default')
