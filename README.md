# PPP (Purchasing Power Parity) Calculator

A simple web-based calculator for common PPP-related calculations used in international finance:

- PPP exchange rate (single-good / Big Mac style)
- % misvaluation vs USD (under/over valuation)
- Absolute PPP (price level / basket)
- Relative PPP (inflation differentials)

**Live quote convention used:** `E = FC per 1 USD` (foreign currency per 1 USD).  
If your course uses `USD per FC`, take the reciprocal: `1/E`.

---

## Formulas

### 1) PPP Exchange Rate (single-good / Big Mac style)
Implied PPP rate:
\[
E_{PPP} = \frac{P_F}{P_{US}}
\]
Where:
- `P_US` = US price in USD  
- `P_F` = foreign price in local currency  
- Output: `FC per 1 USD`

---

### 2) % Misvaluation vs USD
\[
\% \text{misvaluation} = \frac{E_{PPP} - E_{actual}}{E_{actual}} \times 100
\]

Interpretation (with `FC per USD`):
- Negative → foreign currency **undervalued** vs USD
- Positive → foreign currency **overvalued** vs USD

---

### 3) Absolute PPP (price levels / basket)
\[
E_{PPP} = \frac{P_F}{P_{US}}
\]
Same structure, but `P_US` and `P_F` are price *levels* (e.g., CPI or a basket cost).

---

### 4) Relative PPP (inflation differentials)
\[
E_1 = E_0 \times \frac{(1+\pi_F)}{(1+\pi_{US})}
\]
Where:
- `E0` = current spot rate
- `π_US`, `π_F` = inflation rates over the period

---

## How to run locally
Just open `index.html` in your browser.

---

## Deploy on GitHub Pages
1. Push the repo with `index.html`, `style.css`, `script.js`
2. Go to **Settings → Pages**
3. Set source: `main` branch, root folder
4. Your site will be available at: `https://YOUR_USERNAME.github.io/REPO_NAME/`

---

## Disclaimer
Educational tool only. PPP can be a long-run benchmark, but exchange rates can deviate for long periods due to
interest rates, risk premia, policy, capital flows, trade frictions, and non-tradables.
