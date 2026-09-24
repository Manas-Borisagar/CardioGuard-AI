import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import (
    RandomForestClassifier,
    GradientBoostingClassifier,
    HistGradientBoostingClassifier,
    VotingClassifier,
    StackingClassifier
)
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, roc_auc_score, precision_score, recall_score, f1_score
import time

def load_and_clean_data(filepath='cardio_train.csv'):
    # Load dataset
    sep = ';' if ';' in open(filepath).readline() else ','
    df = pd.read_csv(filepath, sep=sep)
    
    # Feature engineering: age in years
    if 'age' in df.columns:
        df['age_years'] = (df['age'] / 365.25).astype(float)
        df.drop(columns=['id', 'age'], inplace=True, errors='ignore')
    
    # Cleaning physiological anomalies
    # 1. Blood Pressure: SBP between 70 and 240, DBP between 40 and 160, and SBP > DBP
    df = df[(df['ap_hi'] >= 70) & (df['ap_hi'] <= 240)]
    df = df[(df['ap_lo'] >= 40) & (df['ap_lo'] <= 160)]
    df = df[df['ap_hi'] > df['ap_lo']]
    
    # 2. Height & Weight
    df = df[(df['height'] >= 120) & (df['height'] <= 220)]
    df = df[(df['weight'] >= 30) & (df['weight'] <= 200)]
    
    # 3. Deduplication
    df = df.drop_duplicates()
    
    return df

def add_advanced_features(df):
    df = df.copy()
    # Hemodynamic biomarkers
    df['pulse_pressure'] = df['ap_hi'] - df['ap_lo']
    df['map'] = df['ap_lo'] + (df['pulse_pressure'] / 3.0)
    
    # Anthropometric biomarker
    height_m = df['height'] / 100.0
    df['bmi'] = df['weight'] / (height_m ** 2)
    
    # Non-linear interaction: vascular pressure * cholesterol
    df['bp_chol_interaction'] = (df['ap_hi'] / 100.0) * df['cholesterol']
    
    # Metabolic syndrome indicator: BMI >= 30, SBP >= 130 or DBP >= 85, elevated chol, elevated gluc
    df['metabolic_risk_score'] = (
        (df['bmi'] >= 30).astype(int) +
        ((df['ap_hi'] >= 130) | (df['ap_lo'] >= 85)).astype(int) +
        (df['cholesterol'] > 1).astype(int) +
        (df['gluc'] > 1).astype(int) +
        df['smoke'] + df['alco'] - df['active']
    )
    
    return df

print('Cleaning dataset...')
df_clean = load_and_clean_data()
print(f'Clean dataset shape: {df_clean.shape}')

df_feat = add_advanced_features(df_clean)
print(f'Engineered features: {df_feat.columns.tolist()}')

# Prepare train/test split
X_base = df_clean.drop(columns=['cardio'])
y = df_clean['cardio']

X_feat = df_feat.drop(columns=['cardio'])

X_train_b, X_test_b, y_train, y_test = train_test_split(X_base, y, test_size=0.2, random_state=42, stratify=y)
X_train_f, X_test_f, _, _ = train_test_split(X_feat, y, test_size=0.2, random_state=42, stratify=y)

scaler_b = StandardScaler()
X_train_b_s = scaler_b.fit_transform(X_train_b)
X_test_b_s = scaler_b.transform(X_test_b)

scaler_f = StandardScaler()
X_train_f_s = scaler_f.fit_transform(X_train_f)
X_test_f_s = scaler_f.transform(X_test_f)

print(f'Training set: {len(X_train_b)}, Test set: {len(X_test_b)}')

# Compare algorithms
models = {
    'DecisionTree (Current)': (DecisionTreeClassifier(criterion='entropy', max_depth=6, min_samples_leaf=20, random_state=42), X_train_b_s, X_test_b_s),
    'RandomForest (150 trees)': (RandomForestClassifier(n_estimators=150, max_depth=10, min_samples_leaf=15, random_state=42, n_jobs=-1), X_train_b_s, X_test_b_s),
    'HistGradientBoosting': (HistGradientBoostingClassifier(max_iter=150, max_depth=6, l2_regularization=1.5, random_state=42), X_train_b_s, X_test_b_s),
    'HistGradientBoosting + FeatureEngineering': (HistGradientBoostingClassifier(max_iter=200, max_depth=6, learning_rate=0.08, l2_regularization=2.0, random_state=42), X_train_f_s, X_test_f_s),
    'RandomForest + FeatureEngineering': (RandomForestClassifier(n_estimators=200, max_depth=12, min_samples_leaf=10, random_state=42, n_jobs=-1), X_train_f_s, X_test_f_s)
}

# Check if xgboost is available
try:
    from xgboost import XGBClassifier
    models['XGBoost + FeatureEngineering'] = (XGBClassifier(n_estimators=150, max_depth=5, learning_rate=0.05, subsample=0.8, colsample_bytree=0.8, random_state=42, eval_metric='logloss'), X_train_f_s, X_test_f_s)
except ImportError:
    pass

# Check if lightgbm is available
try:
    from lightgbm import LGBMClassifier
    models['LightGBM + FeatureEngineering'] = (LGBMClassifier(n_estimators=150, max_depth=6, learning_rate=0.05, num_leaves=31, random_state=42, verbose=-1), X_train_f_s, X_test_f_s)
except ImportError:
    pass

results = []

for name, (clf, xtr, xte) in models.items():
    t0 = time.time()
    clf.fit(xtr, y_train)
    t_fit = time.time() - t0
    
    y_pred = clf.predict(xte)
    y_prob = clf.predict_proba(xte)[:, 1] if hasattr(clf, 'predict_proba') else None
    
    train_acc = accuracy_score(y_train, clf.predict(xtr))
    test_acc = accuracy_score(y_test, y_pred)
    roc_auc = roc_auc_score(y_test, y_prob) if y_prob is not None else 0
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    
    # Selective classification (high certainty: P <= 0.15 or P >= 0.85)
    if y_prob is not None:
        high_cert_mask = (y_prob <= 0.15) | (y_prob >= 0.85)
        high_cert_acc = accuracy_score(y_test[high_cert_mask], y_pred[high_cert_mask]) if high_cert_mask.sum() > 0 else 0
        high_cert_cov = high_cert_mask.mean() * 100
        
        # Rule out specificity (P <= 0.10)
        low_risk_mask = (y_prob <= 0.10)
        low_risk_spec = (y_test[low_risk_mask] == 0).mean() if low_risk_mask.sum() > 0 else 0
    else:
        high_cert_acc = 0
        high_cert_cov = 0
        low_risk_spec = 0
    
    results.append({
        'Model': name,
        'Train Acc': f'{train_acc*100:.2f}%',
        'Test Acc': f'{test_acc*100:.2f}%',
        'ROC-AUC': f'{roc_auc:.4f}',
        'Precision': f'{prec*100:.2f}%',
        'Recall': f'{rec*100:.2f}%',
        'High-Certainty Acc': f'{high_cert_acc*100:.2f}% (cov: {high_cert_cov:.1f}%)',
        'Rule-Out Spec': f'{low_risk_spec*100:.2f}%',
        'Fit Time': f'{t_fit:.2f}s'
    })

res_df = pd.DataFrame(results)
print('\n================ MODEL BENCHMARK RESULTS ================')
print(res_df.to_string(index=False))
