/**
 * Project Pulse - Clinical Decision Support & Model Audit System
 * Project by: Manas Borisagar (Darshan University, Enrollment: 24010101031)
 * Under Guidance of: Jayesh Vagadiya
 */

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    // ----------------------------------------------------
    // 1. LIGHT / DARK THEME CONTROLLER
    // ----------------------------------------------------
    const themeToggleBtn = document.getElementById("theme-toggle");
    const themeIcon = document.getElementById("theme-icon");
    const themeText = document.getElementById("theme-text");

    function getPreferredTheme() {
        const storedTheme = localStorage.getItem("cardioguard_theme");
        if (storedTheme) return storedTheme;
        return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("cardioguard_theme", theme);

        if (theme === "light") {
            if (themeIcon) themeIcon.className = "fa-solid fa-sun";
            if (themeText) themeText.textContent = "Light";
        } else {
            if (themeIcon) themeIcon.className = "fa-solid fa-moon";
            if (themeText) themeText.textContent = "Dark";
        }
    }

    const currentTheme = getPreferredTheme();
    applyTheme(currentTheme);

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", () => {
            const activeTheme = document.documentElement.getAttribute("data-theme") || "dark";
            const newTheme = activeTheme === "dark" ? "light" : "dark";
            applyTheme(newTheme);
        });
    }


    // ----------------------------------------------------
    // 2. TAB NAVIGATION & HERO CTA SWITCHER
    // ----------------------------------------------------
    const tabs = document.querySelectorAll(".nav-tab");
    const panels = document.querySelectorAll(".tab-panel");

    function switchTab(targetTab) {
        if (!targetTab) return;

        tabs.forEach(t => {
            t.classList.remove("active");
            t.setAttribute("aria-selected", "false");
            t.setAttribute("tabindex", "-1");
        });

        panels.forEach(p => {
            p.classList.remove("active");
            p.setAttribute("hidden", "true");
        });

        targetTab.classList.add("active");
        targetTab.setAttribute("aria-selected", "true");
        targetTab.setAttribute("tabindex", "0");

        const targetPanelId = targetTab.getAttribute("aria-controls");
        const targetPanel = document.getElementById(targetPanelId);
        if (targetPanel) {
            targetPanel.classList.add("active");
            targetPanel.removeAttribute("hidden");
            if (typeof window.renderMathInElement === "function") {
                try {
                    window.renderMathInElement(targetPanel, {
                        delimiters: [
                            {left: '$$', right: '$$', display: true},
                            {left: '$', right: '$', display: false}
                        ]
                    });
                } catch (e) {
                    console.warn("KaTeX render notice:", e);
                }
            }
        }
    }

    function switchTabById(tabId) {
        const targetTab = document.getElementById(tabId);
        if (targetTab) {
            switchTab(targetTab);
            targetTab.focus();
        }
    }

    tabs.forEach(tab => {
        tab.addEventListener("click", () => switchTab(tab));
    });

    // Hero CTA button switchers (e.g. data-target="tab-analyzer")
    const tabSwitchers = document.querySelectorAll(".tab-switcher-btn");
    tabSwitchers.forEach(btn => {
        btn.addEventListener("click", () => {
            const targetId = btn.getAttribute("data-target");
            if (targetId) {
                switchTabById(targetId);
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
        });
    });

    const tabList = document.querySelector('[role="tablist"]');
    if (tabList) {
        tabList.addEventListener("keydown", (e) => {
            const tabsArray = Array.from(tabs);
            let index = tabsArray.indexOf(document.activeElement);

            if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault();
                index = (index + 1) % tabsArray.length;
                tabsArray[index].focus();
                switchTab(tabsArray[index]);
            } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault();
                index = (index - 1 + tabsArray.length) % tabsArray.length;
                tabsArray[index].focus();
                switchTab(tabsArray[index]);
            } else if (e.key === "Home") {
                e.preventDefault();
                tabsArray[0].focus();
                switchTab(tabsArray[0]);
            } else if (e.key === "End") {
                e.preventDefault();
                tabsArray[tabsArray.length - 1].focus();
                switchTab(tabsArray[tabsArray.length - 1]);
            }
        });
    }


    // ----------------------------------------------------
    // 3. DUAL INPUT SYNCHRONIZATION (SLIDER + MANUAL NUMBER)
    // ----------------------------------------------------
    const heightSlider = document.getElementById("height");
    const heightNum = document.getElementById("height_num");
    const weightSlider = document.getElementById("weight");
    const weightNum = document.getElementById("weight_num");
    const liveBmiValue = document.getElementById("live-bmi-value");
    const liveBmiStatus = document.getElementById("live-bmi-status");

    function calculateLiveBMI() {
        const heightCm = parseFloat(heightNum ? heightNum.value : (heightSlider ? heightSlider.value : 165));
        const weightKg = parseFloat(weightNum ? weightNum.value : (weightSlider ? weightSlider.value : 70));

        if (isNaN(heightCm) || isNaN(weightKg) || heightCm <= 0) return "25.0";

        const heightMeters = heightCm / 100;
        const bmi = (weightKg / (heightMeters * heightMeters)).toFixed(1);
        const bmiNum = parseFloat(bmi);

        if (liveBmiValue) {
            liveBmiValue.textContent = `${bmi} kg/m²`;
        }

        if (liveBmiStatus) {
            liveBmiStatus.className = "live-bmi-badge";
            if (bmiNum < 18.5) {
                liveBmiStatus.textContent = "Underweight";
                liveBmiStatus.classList.add("status-underweight");
            } else if (bmiNum < 25.0) {
                liveBmiStatus.textContent = "Normal Weight";
                liveBmiStatus.classList.add("status-normal");
            } else if (bmiNum < 30.0) {
                liveBmiStatus.textContent = "Overweight";
                liveBmiStatus.classList.add("status-overweight");
            } else {
                liveBmiStatus.textContent = "Obese";
                liveBmiStatus.classList.add("status-obese");
            }
        }

        return bmi;
    }

    // Synchronize Height: Slider <--> Manual Number Input
    if (heightSlider && heightNum) {
        heightSlider.addEventListener("input", (e) => {
            heightNum.value = e.target.value;
            calculateLiveBMI();
        });

        heightNum.addEventListener("input", (e) => {
            let val = parseFloat(e.target.value);
            if (!isNaN(val)) {
                if (val >= 100 && val <= 220) {
                    heightSlider.value = val;
                }
                calculateLiveBMI();
            }
        });
    }

    // Synchronize Weight: Slider <--> Manual Number Input
    if (weightSlider && weightNum) {
        weightSlider.addEventListener("input", (e) => {
            weightNum.value = e.target.value;
            calculateLiveBMI();
        });

        weightNum.addEventListener("input", (e) => {
            let val = parseFloat(e.target.value);
            if (!isNaN(val)) {
                if (val >= 30 && val <= 200) {
                    weightSlider.value = val;
                }
                calculateLiveBMI();
            }
        });
    }

    calculateLiveBMI();


    // ----------------------------------------------------
    // 4. AHA BLOOD PRESSURE CLASSIFIER
    // ----------------------------------------------------
    const apHiInput = document.getElementById("ap_hi");
    const apLoInput = document.getElementById("ap_lo");
    const liveBpStatus = document.getElementById("live-bp-status");

    function classifyBloodPressure(sys, dia) {
        if (isNaN(sys) || isNaN(dia) || sys <= 0 || dia <= 0) {
            return { category: "Pending Input", badgeClass: "pill-elevated" };
        }

        if (sys > 180 || dia > 120) {
            return { category: "Hypertensive Crisis (Emergency)", badgeClass: "pill-crisis" };
        }
        if (sys >= 140 || dia >= 90) {
            return { category: "Hypertension Stage 2", badgeClass: "pill-stage2" };
        }
        if ((sys >= 130 && sys <= 139) || (dia >= 80 && dia <= 89)) {
            return { category: "Hypertension Stage 1", badgeClass: "pill-stage1" };
        }
        if (sys >= 120 && sys <= 129 && dia < 80) {
            return { category: "Elevated Blood Pressure", badgeClass: "pill-elevated" };
        }
        if (sys < 120 && dia < 80) {
            return { category: "Normal Blood Pressure", badgeClass: "pill-normal" };
        }

        return { category: "Borderline Blood Pressure", badgeClass: "pill-stage1" };
    }

    function updateLiveBPBadge() {
        const sys = parseInt(apHiInput.value, 10);
        const dia = parseInt(apLoInput.value, 10);

        if (!liveBpStatus) return;

        if (isNaN(sys) || isNaN(dia)) {
            liveBpStatus.textContent = "Awaiting BP Input";
            liveBpStatus.className = "aha-badge pill-elevated";
            return;
        }

        const classification = classifyBloodPressure(sys, dia);
        liveBpStatus.textContent = classification.category;
        liveBpStatus.className = `aha-badge ${classification.badgeClass}`;
    }

    if (apHiInput && apLoInput) {
        apHiInput.addEventListener("input", updateLiveBPBadge);
        apLoInput.addEventListener("input", updateLiveBPBadge);
    }


    // ----------------------------------------------------
    // 5. INTERACTIVE BP PLOTTER (TAB 2)
    // ----------------------------------------------------
    const plotterSys = document.getElementById("plotter-sys");
    const plotterDia = document.getElementById("plotter-dia");
    const btnPlotBp = document.getElementById("btn-plot-bp");
    const plotterClassification = document.getElementById("plotter-classification");
    const plotterBanner = document.getElementById("plotter-banner");

    function executePlotter() {
        const sys = parseInt(plotterSys.value, 10);
        const dia = parseInt(plotterDia.value, 10);

        if (isNaN(sys) || isNaN(dia) || sys < 60 || dia < 40) {
            showToast("Please enter realistic clinical values for Systolic and Diastolic BP.", "warning");
            return;
        }

        if (sys < dia) {
            showToast("Systolic pressure cannot be lower than Diastolic pressure.", "danger");
            return;
        }

        const res = classifyBloodPressure(sys, dia);
        if (plotterClassification && plotterBanner) {
            plotterClassification.textContent = res.category;
            plotterBanner.innerHTML = `
                <span>Tested: <strong>${sys}/${dia} mmHg</strong> — AHA Classification: <strong>${res.category}</strong></span>
            `;
        }
    }

    if (btnPlotBp) {
        btnPlotBp.addEventListener("click", executePlotter);
    }


    // ----------------------------------------------------
    // 6. QUICK PRESETS BAR (1-CLICK EVALUATION)
    // ----------------------------------------------------
    const presetHealthy = document.getElementById("preset-healthy");
    const presetBorderline = document.getElementById("preset-borderline");
    const presetHighRisk = document.getElementById("preset-highrisk");

    function applyPreset(preset) {
        const patientNameInp = document.getElementById("patient_name");
        if (patientNameInp && preset.patientName) {
            patientNameInp.value = preset.patientName;
        }

        document.getElementById("age_years").value = preset.age;
        if (preset.gender === 1) {
            document.getElementById("gender-female").checked = true;
        } else {
            document.getElementById("gender-male").checked = true;
        }

        // Dual inputs
        if (heightSlider) heightSlider.value = preset.height;
        if (heightNum) heightNum.value = preset.height;
        if (weightSlider) weightSlider.value = preset.weight;
        if (weightNum) weightNum.value = preset.weight;
        calculateLiveBMI();

        apHiInput.value = preset.ap_hi;
        apLoInput.value = preset.ap_lo;
        updateLiveBPBadge();

        const cholRadio = document.querySelector(`input[name="cholesterol"][value="${preset.cholesterol}"]`);
        if (cholRadio) cholRadio.checked = true;

        const glucRadio = document.querySelector(`input[name="gluc"][value="${preset.gluc}"]`);
        if (glucRadio) glucRadio.checked = true;

        document.getElementById("smoke").checked = preset.smoke === 1;
        document.getElementById("alco").checked = preset.alco === 1;
        document.getElementById("active").checked = preset.active === 1;

        clearValidationErrors();
        showToast(`Preset Profile Loaded: "${preset.name}"`, "info");
    }

    if (presetHealthy) {
        presetHealthy.addEventListener("click", () => {
            applyPreset({
                name: "Healthy Athlete Profile",
                patientName: "Alex Miller (Athlete)",
                age: 29,
                gender: 1,
                height: 168,
                weight: 58,
                ap_hi: 112,
                ap_lo: 74,
                cholesterol: 1,
                gluc: 1,
                smoke: 0,
                alco: 0,
                active: 1
            });
        });
    }

    if (presetBorderline) {
        presetBorderline.addEventListener("click", () => {
            applyPreset({
                name: "Borderline Risk Profile",
                patientName: "Jordan Reed (Borderline)",
                age: 52,
                gender: 2,
                height: 174,
                weight: 84,
                ap_hi: 132,
                ap_lo: 86,
                cholesterol: 2,
                gluc: 1,
                smoke: 0,
                alco: 1,
                active: 1
            });
        });
    }

    if (presetHighRisk) {
        presetHighRisk.addEventListener("click", () => {
            applyPreset({
                name: "High-Risk Hypertensive Profile",
                patientName: "Arthur Pendelton (High Risk)",
                age: 62,
                gender: 2,
                height: 168,
                weight: 96,
                ap_hi: 165,
                ap_lo: 104,
                cholesterol: 3,
                gluc: 2,
                smoke: 1,
                alco: 1,
                active: 0
            });
        });
    }


    // ----------------------------------------------------
    // 7. FORM VALIDATION & EXECUTION
    // ----------------------------------------------------
    const form = document.getElementById("analyzer-form");
    const ageInput = document.getElementById("age_years");
    const errorAge = document.getElementById("error-age");
    const errorApHi = document.getElementById("error-ap-hi");
    const errorApLo = document.getElementById("error-ap-lo");
    const errorBpRelation = document.getElementById("error-bp-relation");

    const submitBtn = document.getElementById("submit-btn");
    const btnText = submitBtn ? submitBtn.querySelector(".btn-text") : null;
    const btnLoader = submitBtn ? submitBtn.querySelector(".btn-loader") : null;

    const placeholderResult = document.getElementById("placeholder-result");
    const cardResult = document.getElementById("card-result");
    const riskScoreText = document.getElementById("risk-score");
    const riskStatusBadge = document.getElementById("risk-status");
    const riskSummaryText = document.getElementById("risk-summary-text");
    const progressIndicator = document.getElementById("progress-indicator");
    const adviceContainer = document.getElementById("advice-container");
    const resetBtn = document.getElementById("reset-btn");

    const snapBp = document.getElementById("snap-bp");
    const snapBmi = document.getElementById("snap-bmi");
    const snapChol = document.getElementById("snap-chol");
    const snapGluc = document.getElementById("snap-gluc");

    // Circular Gauge geometry (radius = 84)
    const ringRadius = 84;
    const ringCircumference = 2 * Math.PI * ringRadius;

    if (progressIndicator) {
        progressIndicator.style.strokeDasharray = `${ringCircumference} ${ringCircumference}`;
        progressIndicator.style.strokeDashoffset = ringCircumference;
    }

    function setGaugeProgress(percent, color) {
        if (!progressIndicator) return;
        const clamped = Math.max(0, Math.min(100, percent));
        const offset = ringCircumference - (clamped / 100) * ringCircumference;
        progressIndicator.style.strokeDashoffset = offset;
        if (color) {
            progressIndicator.style.stroke = color;
        }
    }

    function clearValidationErrors() {
        if (errorAge) errorAge.textContent = "";
        if (errorApHi) errorApHi.textContent = "";
        if (errorApLo) errorApLo.textContent = "";
        if (errorBpRelation) errorBpRelation.textContent = "";
    }

    function validateInputs() {
        clearValidationErrors();
        let isValid = true;

        const age = parseInt(ageInput.value, 10);
        if (isNaN(age) || age < 18 || age > 100) {
            errorAge.textContent = "Please specify a valid adult age between 18 and 100 years.";
            isValid = false;
        }

        const heightVal = parseFloat(heightNum ? heightNum.value : heightSlider.value);
        if (isNaN(heightVal) || heightVal < 100 || heightVal > 220) {
            showToast("Height must be between 100 and 220 cm.", "warning");
            isValid = false;
        }

        const weightVal = parseFloat(weightNum ? weightNum.value : weightSlider.value);
        if (isNaN(weightVal) || weightVal < 30 || weightVal > 200) {
            showToast("Weight must be between 30 and 200 kg.", "warning");
            isValid = false;
        }

        const apHi = parseInt(apHiInput.value, 10);
        if (isNaN(apHi) || apHi < 60 || apHi > 250) {
            errorApHi.textContent = "Systolic BP must be between 60 and 250 mmHg.";
            isValid = false;
        }

        const apLo = parseInt(apLoInput.value, 10);
        if (isNaN(apLo) || apLo < 40 || apLo > 200) {
            errorApLo.textContent = "Diastolic BP must be between 40 and 200 mmHg.";
            isValid = false;
        }

        if (isValid && apHi < apLo) {
            errorBpRelation.textContent = "Physiological Conflict: Systolic pressure (ap_hi) cannot be lower than Diastolic pressure (ap_lo).";
            isValid = false;
        }

        return isValid;
    }

    [ageInput, apHiInput, apLoInput].forEach(inp => {
        if (inp) {
            inp.addEventListener("input", () => {
                if (errorBpRelation.textContent || errorAge.textContent || errorApHi.textContent || errorApLo.textContent) {
                    validateInputs();
                }
            });
        }
    });

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            if (!validateInputs()) {
                return;
            }

            submitBtn.disabled = true;
            if (btnText) btnText.classList.add("hidden");
            if (btnLoader) btnLoader.classList.remove("hidden");

            const formData = new FormData(form);
            const heightFinal = parseFloat(heightNum ? heightNum.value : formData.get("height"));
            const weightFinal = parseFloat(weightNum ? weightNum.value : formData.get("weight"));
            const patientNameInp = document.getElementById("patient_name");
            const patientNameVal = patientNameInp ? patientNameInp.value.trim() : "";

            const payload = {
                patient_name: patientNameVal || undefined,
                gender: parseInt(formData.get("gender"), 10),
                height: heightFinal,
                weight: weightFinal,
                ap_hi: parseInt(formData.get("ap_hi"), 10),
                ap_lo: parseInt(formData.get("ap_lo"), 10),
                cholesterol: parseInt(formData.get("cholesterol"), 10),
                gluc: parseInt(formData.get("gluc"), 10),
                smoke: document.getElementById("smoke").checked ? 1 : 0,
                alco: document.getElementById("alco").checked ? 1 : 0,
                active: document.getElementById("active").checked ? 1 : 0,
                age_years: parseInt(formData.get("age_years"), 10)
            };

            try {
                const isLocalFile = window.location.protocol === "file:";
                const apiUrl = isLocalFile ? "http://127.0.0.1:8000/api/predict" : "/api/predict";

                const response = await fetch(apiUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                });

                if (response.status === 429) {
                    throw new Error("Rate limit exceeded. Please wait one minute before analyzing again.");
                }

                if (!response.ok) {
                    const errPayload = await response.json().catch(() => ({}));
                    throw new Error(errPayload.detail || "Server failed to process risk assessment.");
                }

                const result = await response.json();
                renderAssessmentReport(result, payload);
                saveAssessmentToHistory(payload, result);
                showToast("Clinical inference executed successfully and logged.", "safe");

            } catch (err) {
                errorBpRelation.textContent = `Alert: ${err.message}`;
                showToast(err.message, "danger");
            } finally {
                submitBtn.disabled = false;
                if (btnText) btnText.classList.remove("hidden");
                if (btnLoader) btnLoader.classList.add("hidden");
            }
        });
    }


    // ----------------------------------------------------
    // 8. RENDER ASSESSMENT REPORT
    // ----------------------------------------------------
    function renderAssessmentReport(result, inputs) {
        if (!placeholderResult || !cardResult) return;

        placeholderResult.classList.add("hidden");
        cardResult.classList.remove("hidden");

        // Personalize Patient Title
        const reportPatientName = document.getElementById("report-patient-name");
        if (reportPatientName) {
            reportPatientName.textContent = result.patient_name || inputs.patient_name || "Anonymous Patient";
        }

        const riskPercent = Math.round(result.risk_probability * 100);
        if (riskScoreText) riskScoreText.textContent = `${riskPercent}%`;

        riskStatusBadge.className = "severity-badge";
        let gaugeColor = "var(--status-safe)";

        if (riskPercent >= 60) {
            riskStatusBadge.textContent = "High Risk";
            riskStatusBadge.classList.add("risk-high");
            gaugeColor = "var(--status-danger)";
            if (riskSummaryText) riskSummaryText.textContent = "High probability of cardiovascular disease. Immediate clinical evaluation strongly advised.";
        } else if (riskPercent >= 30) {
            riskStatusBadge.textContent = "Moderate Risk";
            riskStatusBadge.classList.add("risk-moderate");
            gaugeColor = "var(--status-warning)";
            if (riskSummaryText) riskSummaryText.textContent = "Elevated risk markers observed. Preventative lifestyle adjustments recommended.";
        } else {
            riskStatusBadge.textContent = "Low Risk";
            riskStatusBadge.classList.add("risk-low");
            gaugeColor = "var(--status-safe)";
            if (riskSummaryText) riskSummaryText.textContent = "Patient vitals indicate low cardiovascular disease propensity.";
        }

        setGaugeProgress(riskPercent, gaugeColor);

        // Stratified Accuracy & Clinical Certainty Card
        const reportAccBadge = document.getElementById("report-acc-badge");
        const reportAccTitle = document.getElementById("report-acc-title");
        const reportAccDesc = document.getElementById("report-acc-desc");

        if (reportAccBadge) {
            reportAccBadge.textContent = result.decision_accuracy_rate || ">91.4% Clinical Decision Accuracy";
        }
        if (reportAccTitle) {
            reportAccTitle.textContent = result.decision_accuracy_band || "Tier 1: High-Certainty Diagnostic Decision";
        }
        if (reportAccDesc) {
            if (result.risk_probability <= 0.12 || result.risk_probability >= 0.88) {
                reportAccDesc.textContent = "High-certainty diagnostic zone: Model operates with >91.4% empirical decision accuracy (90.25% specificity) on this decisive hemodynamic profile.";
            } else if (result.risk_probability <= 0.22 || result.risk_probability >= 0.78) {
                reportAccDesc.textContent = "Strong indicative confidence: Model demonstrates 85.8% precision. Recommended for high-priority lifestyle and clinical intervention.";
            } else {
                reportAccDesc.textContent = "Intermediate screening tier (72.8% cohort baseline). Non-invasive markers suggest secondary diagnostic testing (ECG, Lipid Profile, Echocardiogram).";
            }
        }

        const heightM = inputs.height / 100;
        const bmi = (inputs.weight / (heightM * heightM)).toFixed(1);
        if (snapBp) snapBp.textContent = `${inputs.ap_hi}/${inputs.ap_lo} mmHg`;
        if (snapBmi) snapBmi.textContent = `${bmi} kg/m²`;
        if (snapChol) snapChol.textContent = inputs.cholesterol === 1 ? "Normal (<200)" : (inputs.cholesterol === 2 ? "Above Normal" : "Well Above (≥240)");
        if (snapGluc) snapGluc.textContent = inputs.gluc === 1 ? "Normal (70-99)" : (inputs.gluc === 2 ? "Impaired (100-125)" : "Diabetic (≥126)");

        generateClinicalAdvice(inputs, bmi);

        // Smooth scroll to diagnostic report on mobile devices
        if (window.innerWidth <= 992 && cardResult) {
            setTimeout(() => {
                cardResult.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 100);
        }
    }

    function generateClinicalAdvice(inputs, bmi) {
        if (!adviceContainer) return;
        adviceContainer.innerHTML = "";

        const adviceList = [];

        if (inputs.ap_hi >= 140 || inputs.ap_lo >= 90) {
            adviceList.push({
                icon: "fa-solid fa-triangle-exclamation",
                text: `<strong>Hypertension Stage 2 (${inputs.ap_hi}/${inputs.ap_lo} mmHg):</strong> Sustained pressure strains arterial walls. Prompt consultation with a physician is indicated.`
            });
        } else if (inputs.ap_hi >= 130 || inputs.ap_lo >= 80) {
            adviceList.push({
                icon: "fa-solid fa-circle-exclamation",
                text: `<strong>Hypertension Stage 1 (${inputs.ap_hi}/${inputs.ap_lo} mmHg):</strong> Elevated peripheral resistance. Dietary sodium restriction and periodic clinical monitoring advised.`
            });
        } else if (inputs.ap_hi >= 120) {
            adviceList.push({
                icon: "fa-solid fa-arrow-trend-up",
                text: `<strong>Elevated BP (${inputs.ap_hi}/${inputs.ap_lo} mmHg):</strong> Systolic pressure is marginally elevated. Aerobic exercise and stress management are recommended.`
            });
        } else {
            adviceList.push({
                icon: "fa-solid fa-circle-check",
                text: `<strong>Optimal Blood Pressure (${inputs.ap_hi}/${inputs.ap_lo} mmHg):</strong> Hemodynamics are well within the American Heart Association normal range.`
            });
        }

        const bmiVal = parseFloat(bmi);
        if (bmiVal >= 30.0) {
            adviceList.push({
                icon: "fa-solid fa-weight-scale",
                text: `<strong>Obese BMI Category (${bmi} kg/m²):</strong> Visceral adiposity increases myocardial strain. A structured dietary plan targeting gradual weight reduction is recommended.`
            });
        } else if (bmiVal >= 25.0) {
            adviceList.push({
                icon: "fa-solid fa-weight-scale",
                text: `<strong>Overweight Category (${bmi} kg/m²):</strong> Mildly elevated body mass index. Routine caloric expenditure can decrease vascular resistance.`
            });
        } else {
            adviceList.push({
                icon: "fa-solid fa-circle-check",
                text: `<strong>Healthy BMI (${bmi} kg/m²):</strong> Body weight is well-proportioned for height, maintaining balanced cardiac workload.`
            });
        }

        if (inputs.cholesterol > 1) {
            adviceList.push({
                icon: "fa-solid fa-droplet",
                text: `<strong>Elevated Cholesterol:</strong> Serum lipid levels exceed optimal parameters. Reduce saturated fat intake and request a full lipid profile (LDL/HDL).`
            });
        }
        if (inputs.gluc > 1) {
            adviceList.push({
                icon: "fa-solid fa-cubes-stacked",
                text: `<strong>Elevated Fasting Glucose:</strong> Screen for insulin resistance and avoid refined carbohydrates to lower glycemic stress.`
            });
        }

        if (inputs.smoke === 1) {
            adviceList.push({
                icon: "fa-solid fa-ban-smoking",
                text: `<strong>Tobacco Use:</strong> Smoking causes endothelial dysfunction. Complete smoking cessation drastically lowers cardiovascular mortality.`
            });
        }
        if (inputs.alco === 1) {
            adviceList.push({
                icon: "fa-solid fa-wine-glass",
                text: `<strong>Alcohol Intake:</strong> Regular heavy consumption elevates blood pressure. Restrict or abstain.`
            });
        }
        if (inputs.active === 0) {
            adviceList.push({
                icon: "fa-solid fa-person-running",
                text: `<strong>Physical Inactivity:</strong> Inactivity is an independent risk factor. Aim for at least 150 minutes of moderate aerobic exercise weekly.`
            });
        }

        adviceList.forEach(item => {
            const li = document.createElement("li");
            li.innerHTML = `<i class="${item.icon}"></i> <div>${item.text}</div>`;
            adviceContainer.appendChild(li);
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            if (form) form.reset();
            const pNameInp = document.getElementById("patient_name");
            if (pNameInp) pNameInp.value = "";

            if (heightSlider) heightSlider.value = "165";
            if (heightNum) heightNum.value = "165";
            if (weightSlider) weightSlider.value = "70";
            if (weightNum) weightNum.value = "70";
            calculateLiveBMI();
            updateLiveBPBadge();
            clearValidationErrors();

            cardResult.classList.add("hidden");
            placeholderResult.classList.remove("hidden");
            setGaugeProgress(0);
            showToast("Diagnostic form reset.", "info");
        });
    }


    // ----------------------------------------------------
    // 9. LOCALSTORAGE ASSESSMENT HISTORY & AUDIT TRAIL
    // ----------------------------------------------------
    const STORAGE_KEY = "cardioguard_assessment_history";
    const historyTableBody = document.getElementById("history-table-body");
    const historyEmpty = document.getElementById("history-empty");
    const btnClearHistory = document.getElementById("btn-clear-history");
    const btnExportHistory = document.getElementById("btn-export-history");

    function getHistory() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error("Could not parse assessment history:", e);
            return [];
        }
    }

    function saveAssessmentToHistory(payload, result) {
        const heightM = payload.height / 100;
        const bmi = (payload.weight / (heightM * heightM)).toFixed(1);
        const riskPercent = Math.round(result.risk_probability * 100);

        const record = {
            id: Date.now(),
            timestamp: new Date().toLocaleString(),
            patient_name: result.patient_name || payload.patient_name || "Anonymous Patient",
            age: payload.age_years,
            gender: payload.gender === 1 ? "Female" : "Male",
            height: payload.height,
            weight: payload.weight,
            bp: `${payload.ap_hi}/${payload.ap_lo} mmHg`,
            ap_hi: payload.ap_hi,
            ap_lo: payload.ap_lo,
            bmi: `${bmi} kg/m²`,
            cholesterol: payload.cholesterol,
            gluc: payload.gluc,
            smoke: payload.smoke,
            alco: payload.alco,
            active: payload.active,
            risk_score: riskPercent,
            risk_tier: result.risk_tier,
            accuracy_band: result.decision_accuracy_rate || ">90.4% High Certainty",
            payload: payload
        };

        const history = getHistory();
        history.unshift(record);

        // Cap at 30 items to avoid localStorage bloat
        if (history.length > 30) {
            history.pop();
        }

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
            renderHistoryTable();
        } catch (e) {
            console.error("Failed to persist assessment to localStorage:", e);
        }
    }

    function renderHistoryTable() {
        if (!historyTableBody) return;
        historyTableBody.innerHTML = "";

        const history = getHistory();

        if (history.length === 0) {
            if (historyEmpty) historyEmpty.classList.remove("hidden");
            return;
        }

        if (historyEmpty) historyEmpty.classList.add("hidden");

        // Safe DOM creation to prevent Stored XSS
        history.forEach(item => {
            const tr = document.createElement("tr");

            // Timestamp
            const tdTime = document.createElement("td");
            tdTime.className = "font-mono text-sm";
            tdTime.textContent = item.timestamp;
            tr.appendChild(tdTime);

            // Patient Identifier (Safe textContent injection)
            const tdPatient = document.createElement("td");
            tdPatient.className = "font-medium text-primary";
            tdPatient.textContent = item.patient_name || "Anonymous Patient";
            tr.appendChild(tdPatient);

            // Demographics
            const tdDemo = document.createElement("td");
            tdDemo.textContent = `${item.age} yrs • ${item.gender}`;
            tr.appendChild(tdDemo);

            // Blood Pressure
            const tdBP = document.createElement("td");
            tdBP.className = "font-mono";
            tdBP.textContent = item.bp;
            tr.appendChild(tdBP);

            // BMI
            const tdBMI = document.createElement("td");
            tdBMI.className = "font-mono";
            tdBMI.textContent = item.bmi;
            tr.appendChild(tdBMI);

            // Risk Probability
            const tdRisk = document.createElement("td");
            tdRisk.className = "font-mono";
            tdRisk.textContent = `${item.risk_score}%`;
            tr.appendChild(tdRisk);

            // Tier Badge
            const tdTier = document.createElement("td");
            const spanTier = document.createElement("span");
            spanTier.className = "status-pill";
            if (item.risk_score >= 60) {
                spanTier.classList.add("pill-crisis");
                spanTier.textContent = "High Risk";
            } else if (item.risk_score >= 30) {
                spanTier.classList.add("pill-elevated");
                spanTier.textContent = "Moderate";
            } else {
                spanTier.classList.add("pill-normal");
                spanTier.textContent = "Low Risk";
            }
            tdTier.appendChild(spanTier);
            tr.appendChild(tdTier);

            // Action: Reload into form
            const tdAction = document.createElement("td");
            const reloadBtn = document.createElement("button");
            reloadBtn.type = "button";
            reloadBtn.className = "btn-history-reload";
            reloadBtn.innerHTML = `<i class="fa-solid fa-arrow-rotate-left"></i> Reload`;
            reloadBtn.addEventListener("click", () => {
                reloadHistoryIntoForm(item);
            });
            tdAction.appendChild(reloadBtn);
            tr.appendChild(tdAction);

            historyTableBody.appendChild(tr);
        });
    }

    function reloadHistoryIntoForm(item) {
        if (!item || !item.payload) return;
        const p = item.payload;

        const patientNameInp = document.getElementById("patient_name");
        if (patientNameInp) {
            patientNameInp.value = (item.patient_name && item.patient_name !== "Anonymous Patient") ? item.patient_name : "";
        }

        document.getElementById("age_years").value = p.age_years;
        if (p.gender === 1) {
            document.getElementById("gender-female").checked = true;
        } else {
            document.getElementById("gender-male").checked = true;
        }

        if (heightSlider) heightSlider.value = p.height;
        if (heightNum) heightNum.value = p.height;
        if (weightSlider) weightSlider.value = p.weight;
        if (weightNum) weightNum.value = p.weight;
        calculateLiveBMI();

        apHiInput.value = p.ap_hi;
        apLoInput.value = p.ap_lo;
        updateLiveBPBadge();

        const cholRadio = document.querySelector(`input[name="cholesterol"][value="${p.cholesterol}"]`);
        if (cholRadio) cholRadio.checked = true;

        const glucRadio = document.querySelector(`input[name="gluc"][value="${p.gluc}"]`);
        if (glucRadio) glucRadio.checked = true;

        document.getElementById("smoke").checked = p.smoke === 1;
        document.getElementById("alco").checked = p.alco === 1;
        document.getElementById("active").checked = p.active === 1;

        clearValidationErrors();
        switchTabById("tab-analyzer");
        window.scrollTo({ top: 0, behavior: "smooth" });
        showToast(`Loaded patient record from ${item.timestamp}`, "info");
    }

    if (btnClearHistory) {
        btnClearHistory.addEventListener("click", () => {
            if (confirm("Are you sure you want to erase all locally stored assessment records?")) {
                localStorage.removeItem(STORAGE_KEY);
                renderHistoryTable();
                showToast("All historical assessment records cleared.", "info");
            }
        });
    }

    if (btnExportHistory) {
        btnExportHistory.addEventListener("click", () => {
            const history = getHistory();
            if (history.length === 0) {
                showToast("No assessment records available to export.", "warning");
                return;
            }

            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
            const downloadAnchor = document.createElement("a");
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", `project_pulse_assessment_history_${Date.now()}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
            showToast("Assessment history exported successfully.", "safe");
        });
    }

    // Render history on page load
    renderHistoryTable();


    // ----------------------------------------------------
    // 10. TOAST NOTIFICATION SYSTEM
    // ----------------------------------------------------
    function showToast(message, type = "info") {
        const container = document.getElementById("toast-container");
        if (!container) return;

        const toast = document.createElement("div");
        toast.className = "toast";

        let icon = "fa-solid fa-info-circle";
        if (type === "safe") icon = "fa-solid fa-circle-check";
        if (type === "warning") icon = "fa-solid fa-triangle-exclamation";
        if (type === "danger") icon = "fa-solid fa-circle-xmark";

        toast.innerHTML = `<i class="${icon}"></i> <span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transition = "opacity 0.25s ease";
            setTimeout(() => toast.remove(), 250);
        }, 3500);
    }


    // ----------------------------------------------------
    // 11. LIVE ANIMATED ECG MONITOR CANVAS
    // ----------------------------------------------------
    function initECGMonitor() {
        const canvas = document.getElementById("hero-ecg-canvas");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let width = canvas.width;
        let height = canvas.height;
        const midY = height / 2;

        let x = 0;
        const points = [];
        const maxPoints = Math.floor(width);

        function getECGY(t) {
            const phase = t % 100;
            if (phase < 15) return 0; // baseline
            if (phase >= 15 && phase < 25) {
                // P Wave (gentle atrium depolarization)
                return -Math.sin(((phase - 15) / 10) * Math.PI) * 7;
            }
            if (phase >= 25 && phase < 35) return 0; // PR segment
            if (phase >= 35 && phase < 38) {
                // Q dip
                return 4;
            }
            if (phase >= 38 && phase < 45) {
                // R tall ventricular spike
                const p = (phase - 38) / 7;
                return p < 0.5 ? -p * 2 * 46 : -(1 - p) * 2 * 46;
            }
            if (phase >= 45 && phase < 48) {
                // S deep dip
                return 10;
            }
            if (phase >= 48 && phase < 58) return 0; // ST segment
            if (phase >= 58 && phase < 74) {
                // T Wave (ventricular repolarization)
                return -Math.sin(((phase - 58) / 16) * Math.PI) * 11;
            }
            return 0; // baseline
        }

        let timeStep = 0;

        function renderFrame() {
            ctx.fillStyle = "rgba(9, 10, 15, 0.16)";
            ctx.fillRect(0, 0, width, height);

            timeStep += 1;
            const yOffset = getECGY(timeStep);
            points.push({ x: x, y: midY + yOffset });

            if (points.length > maxPoints) {
                points.shift();
            }

            // Draw glowing laser line
            ctx.beginPath();
            ctx.lineWidth = 2.2;
            ctx.strokeStyle = "#22c55e";
            ctx.shadowColor = "#22c55e";
            ctx.shadowBlur = 8;

            for (let i = 0; i < points.length; i++) {
                const pt = points[i];
                if (i === 0) {
                    ctx.moveTo(pt.x, pt.y);
                } else {
                    ctx.lineTo(pt.x, pt.y);
                }
            }
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Sweeping beam head
            if (points.length > 0) {
                const last = points[points.length - 1];
                ctx.beginPath();
                ctx.arc(last.x, last.y, 3.5, 0, Math.PI * 2);
                ctx.fillStyle = "#ffffff";
                ctx.shadowColor = "#22c55e";
                ctx.shadowBlur = 12;
                ctx.fill();
                ctx.shadowBlur = 0;
            }

            x = (x + 2) % width;
            if (x === 0) {
                points.length = 0;
            }

            requestAnimationFrame(renderFrame);
        }

        renderFrame();

        // Realistic rhythmic variation
        const liveBpmText = document.getElementById("live-bpm-text");
        setInterval(() => {
            if (liveBpmText) {
                const bpm = 72 + Math.floor(Math.random() * 5);
                liveBpmText.textContent = `${bpm} BPM • SINUS RHYTHM`;
            }
        }, 3200);
    }


    // ----------------------------------------------------
    // 12. 1-CLICK QUICK VITALS SIMULATOR ON LANDING PAGE
    // ----------------------------------------------------
    function initQuickSimulator() {
        const simBtns = document.querySelectorAll(".sim-profile-btn");
        const simProb = document.getElementById("sim-preview-prob");
        const simTier = document.getElementById("sim-preview-tier");
        const simDesc = document.getElementById("sim-preview-desc");
        const simMeterFill = document.getElementById("sim-meter-fill");
        const simCertainty = document.getElementById("sim-certainty-tier");
        const simBp = document.getElementById("sim-vital-bp");
        const simChol = document.getElementById("sim-vital-chol");
        const simGluc = document.getElementById("sim-vital-gluc");
        const simBmi = document.getElementById("sim-vital-bmi");
        const btnTransfer = document.getElementById("btn-transfer-sim");

        const simProfiles = {
            healthy: {
                prob: "8.8%",
                tier: "Low Risk",
                tierBadgeClass: "badge-safe",
                meterClass: "fill-safe",
                meterWidth: "8.8%",
                certainty: "Tier 1 (>90.4%)",
                bp: "112 / 74 mmHg",
                chol: "Normal (1)",
                gluc: "Normal (1)",
                bmi: "21.8 • Active",
                desc: "Optimal hemodynamics with balanced lifestyle markers. Classified into the Tier 1 high-certainty healthy cohort.",
                action: () => presetHealthy && presetHealthy.click()
            },
            borderline: {
                prob: "38.5%",
                tier: "Moderate Risk",
                tierBadgeClass: "badge-warning",
                meterClass: "fill-warning",
                meterWidth: "38.5%",
                certainty: "Tier 3 Baseline",
                bp: "132 / 86 mmHg",
                chol: "Above Normal (2)",
                gluc: "Normal (1)",
                bmi: "27.4 • Inactive",
                desc: "Pre-hypertensive blood pressure with elevated lipid levels. Falls into screening ambiguity tier — secondary clinical workup advised.",
                action: () => presetBorderline && presetBorderline.click()
            },
            highrisk: {
                prob: "87.2%",
                tier: "High Risk",
                tierBadgeClass: "badge-danger",
                meterClass: "fill-danger",
                meterWidth: "87.2%",
                certainty: "Tier 1 (>91.4%)",
                bp: "165 / 104 mmHg",
                chol: "Critical (3)",
                gluc: "Elevated (2)",
                bmi: "31.2 • Inactive",
                desc: "Stage 2 severe hypertension with dyslipidemia. Classified into decisive high-risk cohort requiring prompt medical intervention.",
                action: () => presetHighRisk && presetHighRisk.click()
            }
        };

        let activeSimKey = "healthy";

        simBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                simBtns.forEach(b => {
                    b.classList.remove("active");
                    b.setAttribute("aria-selected", "false");
                });
                btn.classList.add("active");
                btn.setAttribute("aria-selected", "true");

                const profKey = btn.getAttribute("data-profile");
                const data = simProfiles[profKey];
                if (!data) return;

                activeSimKey = profKey;

                if (simProb) simProb.textContent = data.prob;
                if (simTier) {
                    simTier.textContent = data.tier;
                    simTier.className = `sim-tier-badge ${data.tierBadgeClass}`;
                }
                if (simMeterFill) {
                    simMeterFill.style.width = data.meterWidth;
                    simMeterFill.className = `sim-meter-fill ${data.meterClass}`;
                }
                if (simCertainty) simCertainty.textContent = data.certainty;
                if (simBp) simBp.textContent = data.bp;
                if (simChol) simChol.textContent = data.chol;
                if (simGluc) simGluc.textContent = data.gluc;
                if (simBmi) simBmi.textContent = data.bmi;
                if (simDesc) simDesc.textContent = data.desc;
            });
        });

        if (btnTransfer) {
            btnTransfer.addEventListener("click", () => {
                const data = simProfiles[activeSimKey];
                if (data && data.action) {
                    data.action();
                }
                switchTabById("tab-analyzer");
                window.scrollTo({ top: 0, behavior: "smooth" });
                showToast(`Transferred ${data.tier} profile to Clinical Diagnostic Engine`, "info");
            });
        }
    }


    // ----------------------------------------------------
    // 13. INTERACTIVE FAQ ACCORDION CONTROLLER
    // ----------------------------------------------------
    function initFAQAccordion() {
        const faqItems = document.querySelectorAll(".faq-item");
        faqItems.forEach(item => {
            const trigger = item.querySelector(".faq-trigger");
            if (!trigger) return;

            trigger.addEventListener("click", () => {
                const isCurrentlyActive = item.classList.contains("active");

                // Accordion behavior: close other open items
                faqItems.forEach(other => {
                    other.classList.remove("active");
                    const otherTrig = other.querySelector(".faq-trigger");
                    if (otherTrig) otherTrig.setAttribute("aria-expanded", "false");
                });

                if (!isCurrentlyActive) {
                    item.classList.add("active");
                    trigger.setAttribute("aria-expanded", "true");
                }
            });
        });
    }


    // ----------------------------------------------------
    // 14. ANIMATED NUMBER COUNTERS
    // ----------------------------------------------------
    function initNumberCounters() {
        const counters = document.querySelectorAll(".counter-anim");
        counters.forEach(counter => {
            const targetVal = parseFloat(counter.getAttribute("data-target"));
            if (isNaN(targetVal)) return;

            const isInt = Number.isInteger(targetVal);
            const hasPrefix = counter.getAttribute("data-prefix") === ">";
            const duration = 1400;
            const startTime = performance.now();

            function updateCounter(now) {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                // Ease out cubic
                const ease = 1 - Math.pow(1 - progress, 3);
                const current = targetVal * ease;

                if (isInt) {
                    counter.textContent = Math.round(current).toLocaleString();
                } else if (hasPrefix) {
                    counter.textContent = `>${current.toFixed(1)}%`;
                } else {
                    counter.textContent = `${current.toFixed(2)}%`;
                }

                if (progress < 1) {
                    requestAnimationFrame(updateCounter);
                } else {
                    if (isInt) {
                        counter.textContent = targetVal.toLocaleString();
                    } else if (hasPrefix) {
                        counter.textContent = `>${targetVal.toFixed(1)}%`;
                    } else {
                        counter.textContent = `${targetVal.toFixed(2)}%`;
                    }
                }
            }

            requestAnimationFrame(updateCounter);
        });
    }


    // ----------------------------------------------------
    // 15. DYNAMIC HERO CODE TERMINAL TYPEWRITER ANIMATION
    // ----------------------------------------------------
    function initHeroTypewriter() {
        const typewriterEl = document.getElementById("typewriter-text");
        if (!typewriterEl) return;

        const phrases = [
            '">91.4% Stratified High-Certainty"',
            '"90.25% Diagnostic Specificity"',
            '"65,435 Validated Patient Cohort"',
            '"Manas Borisagar (24010101031)"',
            '"Prof. Jayesh Vagadiya (Darshan Univ)"',
            '"Audited Shannon Entropy Tree"'
        ];

        let phraseIndex = 0;
        let charIndex = phrases[0].length;
        let isDeleting = true; // start deleting initial phrase after pause

        function tick() {
            const currentPhrase = phrases[phraseIndex];

            if (isDeleting) {
                charIndex = Math.max(0, charIndex - 1);
                typewriterEl.textContent = currentPhrase.substring(0, charIndex);
            } else {
                charIndex = Math.min(currentPhrase.length, charIndex + 1);
                typewriterEl.textContent = currentPhrase.substring(0, charIndex);
            }

            let delta = isDeleting ? 28 : 55;

            if (!isDeleting && charIndex === currentPhrase.length) {
                delta = 2400; // Pause at end of typed phrase
                isDeleting = true;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                phraseIndex = (phraseIndex + 1) % phrases.length;
                delta = 450; // Pause before typing new phrase
            }

            setTimeout(tick, delta);
        }

        // Initial pause before typing rotation begins
        setTimeout(tick, 2200);
    }

    // Initialize all landing page animations and interactive controllers
    initECGMonitor();
    initQuickSimulator();
    initFAQAccordion();
    initNumberCounters();
    initHeroTypewriter();
});