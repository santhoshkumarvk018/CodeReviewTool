"""
ML Model for Code Risk Prediction.
Trains a TF-IDF + RandomForest classifier on accumulated MongoDB scan data.
Predicts: severity distribution (high_risk: bool) for new code.
"""
import os
import logging
import joblib
import numpy as np
from pathlib import Path

logger = logging.getLogger(__name__)

# Paths
MODEL_DIR  = Path(__file__).resolve().parent / "ml_artifacts"
MODEL_PATH = MODEL_DIR / "risk_classifier.joblib"
VECT_PATH  = MODEL_DIR / "tfidf_vectorizer.joblib"

MODEL_DIR.mkdir(exist_ok=True)

def _get_training_data(mongo_db):
    """Pull code samples + labels from MongoDB history."""
    collection = mongo_db['analysis_results']
    docs = list(collection.find({"code_content": {"$exists": True}}).limit(5000))

    X, y = [], []
    for doc in docs:
        code = doc.get("code_content", "")
        issues = doc.get("results", [])
        if not code.strip():
            continue

        # Label: 1 = high risk (has CRITICAL or HIGH issue), 0 = low risk
        has_high_risk = any(
            i.get("severity", "").upper() in ("CRITICAL", "HIGH") for i in issues
        )
        X.append(code)
        y.append(1 if has_high_risk else 0)

    return X, y


def train_model(mongo_db):
    """
    Train TF-IDF + RandomForest on accumulated scan data.
    Returns a dict with training stats.
    """
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import classification_report, accuracy_score

    X, y = _get_training_data(mongo_db)

    if len(X) < 10:
        return {
            "success": False,
            "message": f"Not enough training data. Found {len(X)} samples, need at least 10.",
            "samples": len(X)
        }

    # TF-IDF vectorization on code tokens
    vectorizer = TfidfVectorizer(
        analyzer='word',
        token_pattern=r'[a-zA-Z_][a-zA-Z0-9_]*',  # code identifiers
        ngram_range=(1, 2),
        max_features=3000,
        sublinear_tf=True
    )
    X_vec = vectorizer.fit_transform(X)

    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X_vec, y, test_size=0.2, random_state=42, stratify=y if len(set(y)) > 1 else None
    )

    # RandomForest Classifier
    clf = RandomForestClassifier(
        n_estimators=150,
        max_depth=12,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1
    )
    clf.fit(X_train, y_train)

    # Evaluate
    y_pred = clf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, target_names=["Low Risk", "High Risk"], output_dict=True)

    # Persist
    joblib.dump(clf, MODEL_PATH)
    joblib.dump(vectorizer, VECT_PATH)
    logger.info(f"ML model trained. Accuracy: {acc:.2%} on {len(X)} samples.")

    return {
        "success": True,
        "samples": len(X),
        "accuracy": round(acc * 100, 2),
        "precision_high_risk": round(report.get("High Risk", {}).get("precision", 0) * 100, 2),
        "recall_high_risk":    round(report.get("High Risk", {}).get("recall",    0) * 100, 2),
        "f1_high_risk":        round(report.get("High Risk", {}).get("f1-score",  0) * 100, 2),
        "message": f"Model trained on {len(X)} samples with {acc:.1%} accuracy."
    }


def predict_risk(code: str) -> dict:
    """
    Use the trained model to predict whether code is high-risk.
    Returns prediction dict. Falls back gracefully if model not trained yet.
    """
    if not MODEL_PATH.exists() or not VECT_PATH.exists():
        return {"available": False, "prediction": None}

    try:
        clf = joblib.load(MODEL_PATH)
        vectorizer = joblib.load(VECT_PATH)

        X_vec = vectorizer.transform([code])
        pred = clf.predict(X_vec)[0]
        proba = clf.predict_proba(X_vec)[0]

        return {
            "available": True,
            "prediction": "High Risk" if pred == 1 else "Low Risk",
            "confidence": round(float(np.max(proba)) * 100, 1),
            "high_risk_probability": round(float(proba[1] if len(proba) > 1 else proba[0]) * 100, 1)
        }
    except Exception as e:
        logger.error(f"ML predict error: {e}")
        return {"available": False, "prediction": None}
