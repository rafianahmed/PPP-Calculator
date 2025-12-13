// PPP Calculator
// Convention used: E = FC per 1 USD (foreign currency per 1 USD).
// If you need USD per FC, take reciprocal (1/E).

const calcType = document.getElementById("calcType");
const formArea = document.getElementById("formArea");
const output = document.getElementById("output");
const btnCompute = document.getElementById("btnCompute");
const btnReset = document.getElementById("btnReset");

function fmt(x, d = 4) {
  if (!isFinite(x)) return "—";
  return Number(x).toLocaleString(undefined, { maximumFractionDigits: d });
}

function pct(x, d = 2) {
  if (!isFinite(x)) return "—";
  return `${fmt(x, d)}%`;
}

function getNum(id) {
  const el = document.getElementById(id);
  if (!el) return NaN;
  const v = Number(el.value);
  return v;
}

function asInflationDecimal(vPercent) {
  // user inputs percent, e.g. 3.5 => 0.035
  return vPercent / 100;
}

function renderForm(type) {
  let html = "";

  if (type === "ppp_rate") {
    html = `
      <div class="row">
        <label>US price (USD) <span class="mono">P_US</span></label>
        <input id="p_us" type="number" step="any" placeholder="e.g., 4.33" />
      </div>
      <div class="row">
        <label>Foreign price (local currency) <span class="mono">P_F</span></label>
        <input id="p_f" type="number" step="any" placeholder="e.g., 37 (pesos)" />
      </div>
      <div class="note">
        Formula (Big Mac / single-good PPP): 
        <span class="mono">E_PPP = P_F / P_US</span>  → FC per 1 USD
      </div>
    `;
  }

  if (type === "misvaluation") {
    html = `
      <div class="row">
        <label>Implied PPP rate <span class="mono">E_PPP</span> (FC per USD)</label>
        <input id="e_ppp" type="number" step="any" placeholder="e.g., 8.55" />
      </div>
      <div class="row">
        <label>Actual spot rate <span class="mono">E_actual</span> (FC per USD)</label>
        <input id="e_actual" type="number" step="any" placeholder="e.g., 13.69" />
      </div>
      <div class="note">
        Formula: <span class="mono">% misvaluation = (E_PPP - E_actual) / E_actual × 100</span>
      </div>
    `;
  }

  if (type === "absolute_ppp") {
    html = `
      <div class="row">
        <label>US price level (index or basket cost) <span class="mono">P_US</span></label>
        <input id="abs_p_us" type="number" step="any" placeholder="e.g., 120 (CPI) or 4.33" />
      </div>
      <div class="row">
        <label>Foreign price level (index or basket cost) <span class="mono">P_F</span></label>
        <input id="abs_p_f" type="number" step="any" placeholder="e.g., 240 (CPI) or 37" />
      </div>
      <div class="note">
        Absolute PPP (levels, our convention): 
        <span class="mono">E_PPP = P_F / P_US</span>  → FC per 1 USD
      </div>
    `;
  }

  if (type === "relative_ppp") {
    html = `
      <div class="row">
        <label>Current spot rate <span class="mono">E0</span> (FC per USD)</label>
        <input id="e0" type="number" step="any" placeholder="e.g., 13.69" />
      </div>
      <div class="row">
        <label>US inflation over period <span class="mono">π_US</span> (%)</label>
        <input id="pi_us" type="number" step="any" placeholder="e.g., 2.5" />
      </div>
      <div class="row">
        <label>Foreign inflation over period <span class="mono">π_F</span> (%)</label>
        <input id="pi_f" type="number" step="any" placeholder="e.g., 8.0" />
      </div>
      <div class="note">
        Relative PPP (inflation-based, our convention): 
        <span class="mono">E1 = E0 × (1+π_F)/(1+π_US)</span>
      </div>
    `;
  }

  formArea.innerHTML = html;
  output.innerHTML = `<span class="muted">Enter values, then click Compute.</span>`;
}

function tag(html, cls) {
  return `<span class="tag ${cls}">${html}</span>`;
}

function compute() {
  const type = calcType.value;

  // Helper for validation
  const mustPositive = (x) => isFinite(x) && x > 0;

  if (type === "ppp_rate") {
    const PUS = getNum("p_us");
    const PF = getNum("p_f");

    if (!mustPositive(PUS) || !mustPositive(PF)) {
      output.innerHTML = `${tag("Input error", "bad")} Please enter positive numbers for both prices.`;
      return;
    }

    const Eppp = PF / PUS;

    output.innerHTML = `
      ${tag("PPP Exchange Rate", "neutral")}
      <div><strong>Implied PPP rate:</strong> <span class="mono">E_PPP = P_F / P_US</span> = <strong>${fmt(Eppp, 4)}</strong> FC per 1 USD</div>
      <div class="muted">Meaning: if the exchange rate equaled ${fmt(Eppp, 4)}, the good/basket would cost the same in both countries.</div>
      <hr class="sep"/>
      <div><strong>Practical note:</strong> Single-good PPP (Big Mac) is a quick benchmark, not a perfect model (taxes, rents, wages differ).</div>
    `;
    return;
  }

  if (type === "misvaluation") {
    const Eppp = getNum("e_ppp");
    const Eact = getNum("e_actual");

    if (!mustPositive(Eppp) || !mustPositive(Eact)) {
      output.innerHTML = `${tag("Input error", "bad")} Enter positive values for both exchange rates.`;
      return;
    }

    const mis = ((Eppp - Eact) / Eact) * 100;

    let cls = "neutral";
    let label = "Fairly valued (close)";
    let expl = "PPP and market rate are close.";

    if (mis > 10) {
      cls = "bad";
      label = "Foreign currency OVERVALUED vs USD";
      expl = "PPP suggests USD should buy MORE foreign currency than it currently does (E_PPP > E_actual).";
    } else if (mis < -10) {
      cls = "good";
      label = "Foreign currency UNDERVALUED vs USD";
      expl = "PPP suggests USD should buy LESS foreign currency than it currently does (E_PPP < E_actual).";
    }

    const actionNote = `
      <div><strong>What people usually do with this info (general):</strong></div>
      <ul class="bullets">
        <li><strong>Travel/consumption:</strong> undervalued FX often feels “cheaper” to spend in; overvalued feels “expensive”.</li>
        <li><strong>Firms (import/export):</strong> may review pricing and hedging because FX levels can affect competitiveness.</li>
        <li><strong>Investors:</strong> treat PPP as a long-run anchor; short-run can deviate for years.</li>
      </ul>
      <div class="muted">Not a trading signal by itself — risk, rates, flows, and policy matter.</div>
    `;

    output.innerHTML = `
      ${tag("% Misvaluation", "neutral")} ${tag(label, cls)}
      <div><strong>Misvaluation:</strong> <span class="mono">(E_PPP - E_actual)/E_actual × 100</span> = <strong>${pct(mis)}</strong></div>
      <div class="muted">${expl}</div>
      <div class="muted">Rule of thumb: within ±10% is often treated as “close”.</div>
      <hr class="sep"/>
      ${actionNote}
    `;
    return;
  }

  if (type === "absolute_ppp") {
    const PUS = getNum("abs_p_us");
    const PF = getNum("abs_p_f");

    if (!mustPositive(PUS) || !mustPositive(PF)) {
      output.innerHTML = `${tag("Input error", "bad")} Enter positive price levels/costs.`;
      return;
    }

    const Eppp = PF / PUS;

    output.innerHTML = `
      ${tag("Absolute PPP", "neutral")}
      <div><strong>Implied PPP spot rate:</strong> <span class="mono">E_PPP = P_F / P_US</span> = <strong>${fmt(Eppp, 4)}</strong> FC per 1 USD</div>
      <div class="muted">Interpretation: equalizes purchasing power of a representative basket (CPI-style).</div>
      <hr class="sep"/>
      <div><strong>Practical note:</strong> Absolute PPP often fails due to non-tradables (rent/services), taxes, transport costs, and different consumption baskets.</div>
    `;
    return;
  }

  if (type === "relative_ppp") {
    const E0 = getNum("e0");
    const piUSp = getNum("pi_us");
    const piFp = getNum("pi_f");

    if (!mustPositive(E0) || !isFinite(piUSp) || !isFinite(piFp)) {
      output.innerHTML = `${tag("Input error", "bad")} Enter E0 > 0 and inflation rates (can be 0 or negative).`;
      return;
    }

    const piUS = asInflationDecimal(piUSp);
    const piF = asInflationDecimal(piFp);

    const E1 = E0 * ((1 + piF) / (1 + piUS));
    const expectedChange = ((E1 / E0) - 1) * 100;

    // Interpretation (with our quote: FC per USD)
    // If E increases => USD appreciates (buys more FC) / foreign depreciates
    let cls = "neutral";
    let label = "Small expected change";
    let expl = "Inflation differentials imply a modest FX move.";

    if (expectedChange > 1) {
      cls = "bad";
      label = "USD expected to appreciate (foreign depreciate)";
      expl = "Foreign inflation is higher than US inflation → FC weakens vs USD in PPP logic.";
    } else if (expectedChange < -1) {
      cls = "good";
      label = "USD expected to depreciate (foreign appreciate)";
      expl = "US inflation is higher than foreign inflation → USD weakens vs FC in PPP logic.";
    }

    output.innerHTML = `
      ${tag("Relative PPP", "neutral")} ${tag(label, cls)}
      <div><strong>Predicted future rate:</strong> <span class="mono">E1 = E0 × (1+π_F)/(1+π_US)</span></div>
      <div><strong>E1:</strong> ${fmt(E1, 6)} FC per 1 USD</div>
      <div><strong>Expected % change (PPP-based):</strong> ${pct(expectedChange)}</div>
      <div class="muted">${expl}</div>
      <hr class="sep"/>
      <div><strong>What people use Relative PPP for (general):</strong></div>
      <ul class="bullets">
        <li>Long-run FX expectations and macro sanity checks.</li>
        <li>Scenario analysis: “If inflation diverges, what pressure on FX?”</li>
        <li>Budgeting / planning for international revenues & costs.</li>
      </ul>
      <div class="muted">PPP works better over longer horizons; short-run FX can be driven by interest rates, risk sentiment, capital flows, and policy.</div>
    `;
    return;
  }
}

function resetAll() {
  renderForm(calcType.value);
}

calcType.addEventListener("change", () => renderForm(calcType.value));
btnCompute.addEventListener("click", compute);
btnReset.addEventListener("click", resetAll);

// initial render
renderForm(calcType.value);

// Small HR styling via JS injection (keeps CSS clean)
const style = document.createElement("style");
style.innerHTML = `.sep{ border:none; border-top:1px solid rgba(34,48,71,0.7); margin:12px 0; }`;
document.head.appendChild(style);
