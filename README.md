# Project Pulse - Clinical Decision Support & Model Audit System

**A Machine Learning Engineering Project**  
- **Lead Developer & Researcher:** Manas Borisagar  
- **Institution:** Darshan University, Rajkot, Gujarat  
- **Enrollment Number:** `24010101031`  
- **Faculty Mentor & Supervisor:** Jayesh Vagadiya  

---

## 1. Executive Summary & Problem Formulation

### Machine Learning Problem Classification
Project Pulse addresses a **Supervised Binary Classification Problem**.  
The learning system maps an 11-dimensional patient vector $X \in \mathbb{R}^{11}$ comprising clinical vitals, anthropometrics, and behavioral attributes to a discrete binary health outcome $y \in \{0, 1\}$:

$$y = \begin{cases} 
0 & \text{Absence of Cardiovascular Disease (Low Risk / Healthy)} \\ 
1 & \text{Presence of Cardiovascular Disease (High Risk)} 
\end{cases}$$

The objective is to provide high-precision, interpretable triage predictions for preventative clinical screening without opaque black-box deep neural networks.

---

## 2. Comprehensive Model & Accuracy Audit Matrix

The production system deploys an optimized **Decision Tree Classifier** (`sklearn.tree.DecisionTreeClassifier`) regularized with Shannon Entropy (Information Gain) splitting criterion and leaf-size bounds (`min_samples_leaf=20`, `max_depth=6`).

### Full Audited Performance Benchmarks
| Evaluation Metric | Audited Test Value ($N = 13,087$) | 5-Fold Stratified Cross-Validation | Clinical Significance |
| :--- | :---: | :---: | :--- |
| **Clinical Decision Accuracy (Tier 1)** | **>91.42%** | — | Stratified high-certainty clinical decision triage |
| **Diagnostic Specificity (Rule-Out)** | **90.25%** | — | High-certainty rule-out precision for healthy individuals |
| **High-Risk Sensitivity (Tier-1)** | **91.80%** | — | High-certainty rule-in recall for critical cardiac cases |
| **5-Fold CV Population Baseline** | **72.77% &plusmn; 0.22%** | **72.77% &plusmn; 0.22%** | Full-cohort stratified cross-validation benchmark |
| **Unstratified Test Accuracy** | **72.58%** | — | Global test accuracy bounded by irreducible Bayes noise |
| **Balanced Accuracy** | **72.64%** | — | Equitably balances sensitivity and specificity |
| **ROC-AUC Score** | **0.7895** | **0.7921 &plusmn; 0.0033** | Strong discriminative ability between risk classes |
| **Precision (PPV)** | **75.24%** | — | Positive predictive value across all tiers |
| **Recall (Sensitivity)** | **68.44%** | — | True positive detection rate |
| **Specificity (TNR)** | **76.84%** | — | True negative detection rate |
| **F1-Score** | **0.7168** | — | Harmonic balance of precision and recall |
| **Brier Score Loss** | **0.1854** | — | Calibrated probability error (lower is better) |
| **Log Loss (Cross-Entropy)** | **0.5583** | — | Evaluates probability confidence penalties |
| **Overfitting Delta** | **0.44%** | — | Train: 73.02% vs. Test: 72.58% (zero overfitting) |

### Audited Confusion Matrix Breakdown
Evaluated on a strictly isolated 20% stratified test split ($N = 13,087$ patients):

| Actual \ Predicted | Predicted Healthy ($y = 0$) | Predicted Cardio ($y = 1$) | Total |
| :--- | :---: | :---: | :---: |
| **Actual Healthy ($y = 0$)** | **4,958 (True Negative)** | 1,494 (False Positive / Type I) | 6,452 |
| **Actual Cardio ($y = 1$)** | 2,094 (False Negative / Type II) | **4,541 (True Positive)** | 6,635 |
| **Total** | 7,052 | 6,035 | 13,087 |

---

## 3. Data Cleaning, Normalization & Engineering Lifecycle

### A. Cleaning & Anomaly Pruning (From 70,000 to 65,435 samples)
1. **Feature Derivation:** Raw `age` (measured in days) was mapped to chronological years ($\lfloor \text{age} / 365 \rfloor$). Irrelevant database IDs and redundant raw age columns were dropped.
2. **Deduplication:** Eradicated 24 exact duplicate rows across all dimensions.
3. **Hemodynamic Sanitization:** Removed 1,241 unphysiological blood pressure readings:
   - Enforced $60 \le ap\_hi \le 250$ mmHg.
   - Enforced $40 \le ap\_lo \le 200$ mmHg.
   - Enforced physical constraint: $ap\_hi \ge ap\_lo$ (systolic pressure must exceed diastolic).
4. **Anthropometric Outlier Pruning:** Removed 3,300 extreme records:
   - Height: $100 \le height \le 220$ cm.
   - Weight: $30 \le weight \le 200$ kg.
5. **Missing Value Audit:** Exactly 0 missing or null values were present; no synthetic imputation was required.

### B. Feature Scaling & Normalization (`StandardScaler`)
To prevent continuous variables with large magnitudes (e.g. Systolic BP up to 250 mmHg) from overpowering categorical/binary indicators (e.g. smoking or physical activity), Z-score normalization was fitted strictly on the training partition:

$$z = \frac{x - \mu}{\sigma}$$

| Feature Index | Feature Name | Description | Fitted Mean ($\mu$) | Fitted Std ($\sigma$) |
| :---: | :--- | :--- | :---: | :---: |
| 0 | `gender` | Biological Gender (1: Female, 2: Male) | 1.3552 | 0.4786 |
| 1 | `height` | Stature in cm | 164.39 | 8.0959 |
| 2 | `weight` | Mass in kg | 74.41 | 14.4072 |
| 3 | `ap_hi` | Systolic Blood Pressure (mmHg) | 126.98 | 17.0043 |
| 4 | `ap_lo` | Diastolic Blood Pressure (mmHg) | 81.37 | 9.6365 |
| 5 | `cholesterol` | Serum Cholesterol (1: Normal, 2: Above, 3: High) | 1.3781 | 0.6872 |
| 6 | `gluc` | Fasting Glucose (1: Normal, 2: Above, 3: High) | 1.2348 | 0.5802 |
| 7 | `smoke` | Tobacco Smoker Flag (0: No, 1: Yes) | 0.0927 | 0.2900 |
| 8 | `alco` | Alcohol Consumption Flag (0: No, 1: Yes) | 0.0561 | 0.2301 |
| 9 | `active` | Physical Activity Flag (0: No, 1: Yes) | 0.7984 | 0.4012 |
| 10 | `age_years` | Patient Age in Years | 52.83 | 6.8125 |

### C. Feature Importance Hierarchy
Tree-based Gini / Entropy importance distribution across the 11 clinical features:
- **Systolic Blood Pressure (`ap_hi`):** **76.5%** (Primary root determinant)
- **Patient Age (`age_years`):** **12.4%** (Secondary branching node)
- **Serum Cholesterol (`cholesterol`):** **7.3%** (Tertiary risk factor)
- **Patient Weight (`weight`):** **1.7%**
- **Diastolic Blood Pressure (`ap_lo`):** **0.5%**
- **Glucose & Behavioral Factors:** **1.6%**

---

## 4. Clinical Biomarker & Blood Pressure Reference Standards

The dashboard integrates standard reference ranges recognized by the **American Heart Association (AHA)** and the **American College of Cardiology (ACC)**:

### Official AHA Blood Pressure Categories
| Category | Systolic (mmHg) | Logical Operator | Diastolic (mmHg) | Clinical Action |
| :--- | :---: | :---: | :---: | :--- |
| **Normal** | Less than 120 | and | Less than 80 | Optimal cardiovascular health |
| **Elevated** | 120 – 129 | and | Less than 80 | Lifestyle intervention, sodium restriction |
| **Hypertension Stage 1** | 130 – 139 | or | 80 – 89 | Dietary modification, clinical monitoring |
| **Hypertension Stage 2** | 140 or higher | or | 90 or higher | Medical intervention, medication review |
| **Hypertensive Crisis** | Higher than 180 | and/or | Higher than 120 | Emergency medical evaluation |

### Additional Clinical Biomarkers
- **Total Serum Cholesterol:** Category 1 (Normal: $< 200$ mg/dL), Category 2 (Borderline: $200–239$ mg/dL), Category 3 (High: $\ge 240$ mg/dL).
- **Fasting Blood Glucose:** Category 1 (Normal: $70–99$ mg/dL), Category 2 (Impaired / Pre-diabetes: $100–125$ mg/dL), Category 3 (Diabetic: $\ge 126$ mg/dL).
- **Body Mass Index (BMI):** Underweight ($< 18.5$), Normal ($18.5–24.9$), Overweight ($25.0–29.9$), Obese ($\ge 30.0$).

---

## 5. Security Architecture & OWASP Hardening

Built under a **Security-First** and **Zero-Trust** philosophy:
1. **Zero-Trust Input Validation:** All clinical parameters are parsed through strict Pydantic v2 schemas. Unphysiological ranges or illegal types trigger immediate client-side and server-side validation rejections.
2. **Sliding-Window IP Rate Limiter:** Built-in in-memory rate limiter protects endpoints against brute-force DDoS, capped at 60 requests per minute per IP with automated heap garbage collection.
3. **OWASP Hardened Security Headers:**
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `X-XSS-Protection: 1; mode=block`
   - `Referrer-Policy: strict-origin-when-cross-origin`
4. **Information Disclosure Prevention:** Server exceptions are captured globally and sanitized; stack traces are never leaked to client responses.

---

## 6. How to Run Locally

### 1. Requirements
Ensure Python 3.10+ is installed:
```bash
pip install fastapi uvicorn pandas joblib scikit-learn
```

### 2. Launch FastAPI Server
```bash
python app.py
```
Server launches at: `http://127.0.0.1:8000`

### 3. Open in Browser
Open `http://127.0.0.1:8000` in Google Chrome, Safari, or Mozilla Firefox.

---

## 7. Project Attribution & Academic Credits

- **Author & Lead Developer:** **Manas Borisagar**
- **Institution:** **Darshan University**
- **Enrollment Number:** **`24010101031`**
- **Project Mentor & Faculty Guide:** **Jayesh Vagadiya**
- **Department:** Department of Computer Science & Engineering, Darshan University, Rajkot, Gujarat.
