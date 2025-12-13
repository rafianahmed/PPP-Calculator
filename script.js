const calcType = document.getElementById("calcType");
const formArea = document.getElementById("formArea");
const output = document.getElementById("output");
const btnCompute = document.getElementById("btnCompute");
const btnReset = document.getElementById("btnReset");

const domLabelEl = document.getElementById("domLabel");
const forLabelEl = document.getElementById("forLabel");
const quoteModeEl = document.getElementById("quoteMode");

function domLabel(){ return (domLabelEl.value || "DOM").trim(); }
function forLabel(){ return (forLabelEl.value || "FOR").trim(); }
function quoteMode(){ return quoteModeEl.value; } // DOM_PER_FOR or FOR_PER_DOM

// Internal convention: E_dpf = Domestic per 1 Foreign
function toDPF(E_user){
  if (!isFinite(E_user) || E_user === 0) return NaN;
  return quoteMode() === "DOM_PER_FOR" ? E_user : (1 / E_user);
}
function fromDPF(E_dpf){
  if (!isFinite(E_dpf) || E_dpf === 0) return NaN;
  return quoteMode() === "DOM_PER_FOR" ? E_dpf : (1 / E_dpf);
}

function fmt(x, d = 6){
  if (!isFinite(x)) return "—";
  return Number(x).toLocaleString(undefined, { maximumFractionDigits: d });
}
function pct(x, d = 3){
  if (!isFinite(x)) return "—";
  return `${Number(x).toLocaleString(undefined, { maximumFractionDigits: d })}%`;
}
function getNum(id){
  const el = document.getElementById(id);
  if (!el) return NaN;
  return Number(el.value);
}
function getText(id){
  const el = document.getElementById(id);
  if (!el) return "";
  return (el.value || "").trim();
}
function tag(text, cls){ return `<span class="tag ${cls}">${text}</span>`; }

function asDecFromPercent(p){ return p / 100; }
function validRateOnePlus(xDec){ return isFinite(xDec) && (1 + xDec) > 0; }

function quoteExample(){
  return quoteMode() === "DOM_PER_FOR"
    ? `${domLabel()}/${forLabel()}`
    : `${forLabel()}/${domLabel()}`;
}

function renderForm(type){
  let html = "";

  // helper for period
  const periodField = `
    <div class="row">
      <label>Time horizon (years) <span class="mono">T</span></label>
      <input id="T" type="number" step="any" value="1" />
      <div class="help">Use <span class="mono">T=1</span> for “1 year later”. The calculator compounds if T > 1.</div>
    </div>
  `;

  if (type === "ppp_forward_test") {
    html = `
      <div class="row">
        <label>Spot rate <span class="mono">S0</span> (${quoteExample()})</label>
        <input id="S0" type="number" step="any" placeholder="e.g., 1.25" />
        <div class="help">Example: <span class="mono">S0 = 1.25 $/€</span> means $1.25 per €1 (if you chose Domestic/Foreign).</div>
      </div>

      <div class="row">
        <label>Domestic inflation <span class="mono">π_dom</span> (%)</label>
        <input id="pi_dom" type="number" step="any" placeholder="e.g., 3" />
        <div class="help">Inflation in the “domestic” country (numerator currency of the quote).</div>
      </div>

      <div class="row">
        <label>Foreign inflation <span class="mono">π_for</span> (%)</label>
        <input id="pi_for" type="number" step="any" placeholder="e.g., 5" />
        <div class="help">Inflation in the “foreign” country (denominator currency of the quote).</div>
      </div>

      ${periodField}

      <div class="help">
        Relative PPP (for <span class="mono">Domestic per Foreign</span> quotes):
        <span class="mono">S1 = S0 × [(1+π_dom)/(1+π_for)]^T</span><br/>
        Forward discount/premium: <span class="mono">(S1 − S0)/S0</span>
      </div>
    `;
  }

  if (type === "ppp_single_good") {
    html = `
      <div class="row">
        <label>Domestic price <span class="mono">P_dom</span> (in ${domLabel()})</label>
        <input id="P_dom" type="number" step="any" placeholder="e.g., 4.33" />
        <div class="help">Price of the same good/basket in the domestic country.</div>
      </div>

      <div class="row">
        <label>Foreign price <span class="mono">P_for</span> (in ${forLabel()})</label>
        <input id="P_for" type="number" step="any" placeholder="e.g., 3.58" />
        <div class="help">Price of the same good/basket in the foreign country.</div>
      </div>

      <div class="help">
        Absolute PPP (single-good version): internal quote <span class="mono">E = P_dom / P_for</span> (Domestic per Foreign).<br/>
        We’ll output it in your selected quote format: <span class="mono">${quoteExample()}</span>.
      </div>
    `;
  }

  if (type === "misvaluation") {
    html = `
      <div class="row">
        <label>PPP-implied rate <span class="mono">E_PPP</span> (${quoteExample()})</label>
        <input id="E_ppp" type="number" step="any" placeholder="e.g., 1.21" />
        <div class="help">The “fair” rate from PPP (e.g., Big Mac / basket / CPI-based).</div>
      </div>

      <div class="row">
        <label>Actual market rate <span class="mono">E_actual</span> (${quoteExample()})</label>
        <input id="E_act" type="number" step="any" placeholder="e.g., 1.00" />
        <div class="help">The real spot rate observed in markets.</div>
      </div>

      <div class="help">
        We compute the PPP gap in the internal convention (Domestic per Foreign):<br/>
        <span class="mono">% gap = (E_PPP − E_actual) / E_actual × 100</span><br/>
        Then we interpret “domestic/foreign under/over valuation” clearly.
      </div>
    `;
  }

  if (type === "real_fx_level") {
    html = `
      <div class="row">
        <label>Nominal FX rate <span class="mono">E</span> (${quoteExample()})</label>
        <input id="E0" type="number" step="any" placeholder="e.g., 1.25" />
        <div class="help">Nominal spot exchange rate.</div>
      </div>

      <div class="row">
        <label>Domestic price level <span class="mono">P</span> (index)</label>
        <input id="P_level" type="number" step="any" placeholder="e.g., 105" />
        <div class="help">CPI (or basket index) for domestic country.</div>
      </div>

      <div class="row">
        <label>Foreign price level <span class="mono">P*</span> (index)</label>
        <input id="P_star" type="number" step="any" placeholder="e.g., 103.5" />
        <div class="help">CPI (or basket index) for foreign country.</div>
      </div>

      <div class="help">
        Real exchange rate (standard): <span class="mono">q = E_dpf × (P*) / P</span> (using Domestic per Foreign internally).<br/>
        Slide interpretation: <span class="mono">q &lt; 1</span> → competitiveness improves; <span class="mono">q &gt; 1</span> → competitiveness deteriorates.
      </div>
    `;
  }

  if (type === "real_fx_slide") {
    html = `
      <div class="row">
        <label>Domestic inflation <span class="mono">π_dom</span> (%)</label>
        <input id="r_pi_dom" type="number" step="any" placeholder="e.g., 5" />
        <div class="help">Inflation in domestic country (numerator currency).</div>
      </div>

      <div class="row">
        <label>Foreign inflation <span class="mono">π_for</span> (%)</label>
        <input id="r_pi_for" type="number" step="any" placeholder="e.g., 3.5" />
        <div class="help">Inflation in foreign country (denominator currency).</div>
      </div>

      <div class="row">
        <label>Nominal FX change <span class="mono">e</span> (%)</label>
        <input id="e_change" type="number" step="any" placeholder="e.g., 4.5" />
        <div class="help">
          % change in the nominal rate (in Domestic-per-Foreign terms). Example: “£ up 4.5% in $/£” means <span class="mono">e = +4.5%</span>.
        </div>
      </div>

      <div class="help">
        Slide-style competitiveness measure:<br/>
        <span class="mono">q ≈ (1+π_dom) / [(1+e)(1+π_for)]</span><br/>
        If <span class="mono">q &lt; 1</span> → competitiveness improves (matches your slide).
      </div>
    `;
  }

  if (type === "irp_forward") {
    html = `
      <div class="row">
        <label>Spot rate <span class="mono">S0</span> (${quoteExample()})</label>
        <input id="irp_S0" type="number" step="any" placeholder="e.g., 1.25" />
        <div class="help">Current spot rate.</div>
      </div>

      <div class="row">
        <label>Domestic interest <span class="mono">i_dom</span> (%)</label>
        <input id="i_dom" type="number" step="any" placeholder="e.g., 4" />
        <div class="help">Nominal interest rate in domestic country.</div>
      </div>

      <div class="row">
        <label>Foreign interest <span class="mono">i_for</span> (%)</label>
        <input id="i_for" type="number" step="any" placeholder="e.g., 2" />
        <div class="help">Nominal interest rate in foreign country.</div>
      </div>

      ${periodField}

      <div class="help">
        IRP: <span class="mono">F = S0 × [(1+i_dom)/(1+i_for)]^T</span> (Domestic per Foreign internally).<br/>
        Forward premium/discount: <span class="mono">(F − S0)/S0</span>
      </div>
    `;
  }

  if (type === "ppp_irp_check") {
    html = `
      <div class="row">
        <label>Domestic inflation <span class="mono">π_dom</span> (%)</label>
        <input id="c_pi_dom" type="number" step="any" placeholder="e.g., 3" />
      </div>

      <div class="row">
        <label>Foreign inflation <span class="mono">π_for</span> (%)</label>
        <input id="c_pi_for" type="number" step="any" placeholder="e.g., 5" />
      </div>

      <div class="row">
        <label>Domestic interest <span class="mono">i_dom</span> (%)</label>
        <input id="c_i_dom" type="number" step="any" placeholder="e.g., 4" />
      </div>

      <div class="row">
        <label>Foreign interest <span class="mono">i_for</span> (%)</label>
        <input id="c_i_for" type="number" step="any" placeholder="e.g., 2" />
      </div>

      ${periodField}

      <div class="help">
        PPP predicts <span class="mono">F/S ≈ [(1+π_dom)/(1+π_for)]^T</span><br/>
        IRP predicts <span class="mono">F/S = [(1+i_dom)/(1+i_for)]^T</span><br/>
        If both held perfectly, inflation differential ≈ interest differential (via Fisher logic).
      </div>
    `;
  }

  if (type === "exp_change_infl") {
    html = `
      <div class="row">
        <label>Domestic inflation <span class="mono">π_dom</span> (%)</label>
        <input id="x_pi_dom" type="number" step="any" placeholder="e.g., 5" />
      </div>
      <div class="row">
        <label>Foreign inflation <span class="mono">π_for</span> (%)</label>
        <input id="x_pi_for" type="number" step="any" placeholder="e.g., 3.5" />
      </div>
      ${periodField}
      <div class="help">
        Exact: <span class="mono">ΔE/E = [(1+π_dom)/(1+π_for)]^T − 1</span><br/>
        Approx: <span class="mono">ΔE/E ≈ (π_dom − π_for) × T</span>
      </div>
    `;
  }

  if (type === "exp_change_int") {
    html = `
      <div class="row">
        <label>Domestic interest <span class="mono">i_dom</span> (%)</label>
        <input id="y_i_dom" type="number" step="any" placeholder="e.g., 5" />
      </div>
      <div class="row">
        <label>Foreign interest <span class="mono">i_for</span> (%)</label>
        <input id="y_i_for" type="number" step="any" placeholder="e.g., 3.5" />
      </div>
      ${periodField}
      <div class="help">
        Exact: <span class="mono">ΔE/E = [(1+i_dom)/(1+i_for)]^T − 1</span><br/>
        Approx: <span class="mono">ΔE/E ≈ (i_dom − i_for) × T</span>
      </div>
    `;
  }

  if (type === "fisher") {
    html = `
      <div class="row">
        <label>Real rate <span class="mono">ρ</span> (%)</label>
        <input id="rho" type="number" step="any" placeholder="e.g., 2" />
        <div class="help">Real interest rate (purchasing power growth).</div>
      </div>
      <div class="row">
        <label>Expected inflation <span class="mono">E[π]</span> (%)</label>
        <input id="pi_e" type="number" step="any" placeholder="e.g., 3" />
        <div class="help">Expected inflation over the period.</div>
      </div>
      <div class="help">
        Exact Fisher: <span class="mono">1+i = (1+ρ)(1+E[π])</span><br/>
        Approx: <span class="mono">i ≈ ρ + E[π]</span>
      </div>
    `;
  }

  if (type === "ife") {
    html = `
      <div class="row">
        <label>Domestic interest <span class="mono">i_dom</span> (%)</label>
        <input id="ife_i_dom" type="number" step="any" placeholder="e.g., 5" />
        <div class="help">Nominal interest rate domestic.</div>
      </div>
      <div class="row">
        <label>Foreign interest <span class="mono">i_for</span> (%)</label>
        <input id="ife_i_for" type="number" step="any" placeholder="e.g., 3.5" />
        <div class="help">Nominal interest rate foreign.</div>
      </div>
      ${periodField}
      <div class="help">
        IFE expectation: <span class="mono">E[ΔE/E] ≈ (i_dom − i_for) × T</span><br/>
        Exact ratio version: <span class="mono">[(1+i_dom)/(1+i_for)]^T − 1</span>
      </div>
    `;
  }

  if (type === "ppp_gdp") {
    html = `
      <div class="row">
        <label>Local GDP (in ${domLabel()})</label>
        <input id="gdp_local" type="number" step="any" placeholder="e.g., 1500000000" />
        <div class="help">GDP expressed in the local/domestic currency.</div>
      </div>

      <div class="row">
        <label>PPP exchange rate (Local per 1 USD)</label>
        <input id="ppp_local_per_usd" type="number" step="any" placeholder="e.g., 50" />
        <div class="help">
          If it takes 50 local currency units to buy the same basket as $1 in the U.S., then PPP rate = 50 (Local/USD).
        </div>
      </div>

      <div class="help">
        PPP GDP (USD): <span class="mono">GDP_PPP_USD = GDP_local / PPP_rate(Local per USD)</span><br/>
        This is why PPP GDP compares real living standards better than market-rate GDP.
      </div>
    `;
  }

  formArea.innerHTML = html;
  output.innerHTML = `<span class="muted">Enter values and click Compute.</span>`;
}

function compute(){
  const type = calcType.value;

  const T = Math.max(0, getNum("T") || 1); // default 1

  // --- 1) Relative PPP “Test” + forward discount/premium
  if (type === "ppp_forward_test"){
    const S0u = getNum("S0");
    const piD = asDecFromPercent(getNum("pi_dom"));
    const piF = asDecFromPercent(getNum("pi_for"));

    if (!isFinite(S0u) || S0u <= 0 || !validRateOnePlus(piD) || !validRateOnePlus(piF) || !isFinite(T)){
      output.innerHTML = `${tag("Input error","bad")} Enter S0>0 and valid inflation rates.`;
      return;
    }

    const S0 = toDPF(S0u);
    const ratio = Math.pow((1+piD)/(1+piF), T);
    const S1 = S0 * ratio;

    const S1u = fromDPF(S1);
    const prem = ((S1u - S0u) / S0u) * 100; // in user's quote terms

    let fxComment = tag("Neutral", "neutral");
    let text = "Small difference between spot and PPP-implied forward.";

    // Interpretation in Domestic-per-Foreign: if S1 < S0 -> foreign currency at forward discount
    const discountDPF = (S1 < S0);
    if (Math.abs(prem) >= 0.5){
      if (discountDPF){
        fxComment = tag(`${forLabel()} at forward DISCOUNT`, "good");
        text = `Foreign inflation > domestic inflation tends to imply foreign currency depreciates (spot quote falls) under PPP logic.`;
      } else {
        fxComment = tag(`${forLabel()} at forward PREMIUM`, "bad");
        text = `Domestic inflation > foreign inflation tends to imply domestic currency depreciates (spot quote rises) under PPP logic.`;
      }
    }

    output.innerHTML = `
      ${tag("Relative PPP Test", "neutral")} ${fxComment}
      <div><strong>Expected rate (PPP) S1:</strong> <span class="mono">${fmt(S1u, 6)} ${quoteExample()}</span></div>
      <div class="muted">Formula: <span class="mono">S1 = S0 × [(1+π_dom)/(1+π_for)]^T</span></div>
      <hr class="sep"/>
      <div><strong>Forward ratio (PPP):</strong> <span class="mono">S1/S0 = ${fmt(ratio, 6)}</span></div>
      <div><strong>Forward premium/discount:</strong> <span class="mono">${pct(prem, 3)}</span></div>
      <div class="muted">${text}</div>
      <hr class="sep"/>
      <div><strong>Quick meaning:</strong> PPP is a long-run anchor. Short-run FX can deviate due to rates, risk, flows, and policy.</div>
    `;
    return;
  }

  // --- 2) PPP exchange rate (single-good / Big Mac style)
  if (type === "ppp_single_good"){
    const Pdom = getNum("P_dom");
    const Pfor = getNum("P_for");
    if (!isFinite(Pdom) || !isFinite(Pfor) || Pdom <= 0 || Pfor <= 0){
      output.innerHTML = `${tag("Input error","bad")} Enter positive prices.`;
      return;
    }

    const E_dpf = Pdom / Pfor; // Domestic per Foreign
    const E_user = fromDPF(E_dpf);

    output.innerHTML = `
      ${tag("PPP Exchange Rate", "neutral")}
      <div><strong>Implied PPP rate:</strong> <span class="mono">${fmt(E_user, 6)} ${quoteExample()}</span></div>
      <div class="muted">Internal formula (Domestic per Foreign): <span class="mono">E = P_dom / P_for</span></div>
      <hr class="sep"/>
      <div><strong>Comment:</strong> Great for intuition (Big Mac / basket), but taxes, rents, wages, and non-tradables cause deviations.</div>
    `;
    return;
  }

  // --- 3) Misvaluation vs PPP
  if (type === "misvaluation"){
    const Eppp_u = getNum("E_ppp");
    const Eact_u = getNum("E_act");
    if (!isFinite(Eppp_u) || !isFinite(Eact_u) || Eppp_u <= 0 || Eact_u <= 0){
      output.innerHTML = `${tag("Input error","bad")} Enter positive exchange rates.`;
      return;
    }

    // Interpret using internal Domestic-per-Foreign conversion
    const Eppp = toDPF(Eppp_u);
    const Eact = toDPF(Eact_u);

    const gap = ((Eppp - Eact) / Eact) * 100;

    let cls = "neutral";
    let label = "Close to PPP";
    let expl = "PPP-implied and market rates are close (by this measure).";

    if (gap > 10){
      cls = "bad";
      label = `${domLabel()} OVERVALUED ( ${forLabel()} UNDERVALUED )`;
      expl = `Market says foreign currency is cheaper than PPP implies (domestic stronger than PPP benchmark).`;
    } else if (gap < -10){
      cls = "good";
      label = `${domLabel()} UNDERVALUED ( ${forLabel()} OVERVALUED )`;
      expl = `Market says foreign currency is more expensive than PPP implies (domestic weaker than PPP benchmark).`;
    }

    output.innerHTML = `
      ${tag("PPP Misvaluation", "neutral")} ${tag(label, cls)}
      <div><strong>PPP gap:</strong> <span class="mono">${pct(gap, 2)}</span></div>
      <div class="muted">Computed in internal convention (Domestic per Foreign): <span class="mono">(E_PPP − E_actual)/E_actual</span></div>
      <div class="muted">${expl}</div>
      <hr class="sep"/>
      <div><strong>How people use this (general):</strong></div>
      <ul class="bullets">
        <li>Sanity check for FX “cheap vs expensive” relative to prices.</li>
        <li>Macro discussion: competitiveness and long-run reversion stories.</li>
        <li>Not a standalone trading signal (deviations can last years).</li>
      </ul>
    `;
    return;
  }

  // --- 4) Real exchange rate q (level)
  if (type === "real_fx_level"){
    const Eu = getNum("E0");
    const P = getNum("P_level");
    const Pstar = getNum("P_star");

    if (!isFinite(Eu) || Eu <= 0 || !isFinite(P) || P <= 0 || !isFinite(Pstar) || Pstar <= 0){
      output.innerHTML = `${tag("Input error","bad")} Enter positive E, P, and P*.`;
      return;
    }

    const E = toDPF(Eu);
    const q = (E * Pstar) / P;

    let cls = "neutral";
    let label = "Neutral";
    if (q < 1) { cls = "good"; label = "q < 1 → competitiveness improves"; }
    else if (q > 1) { cls = "bad"; label = "q > 1 → competitiveness deteriorates"; }

    output.innerHTML = `
      ${tag("Real Exchange Rate q", "neutral")} ${tag(label, cls)}
      <div><strong>q:</strong> <span class="mono">${fmt(q, 6)}</span></div>
      <div class="muted">Formula: <span class="mono">q = E_dpf × P* / P</span></div>
      <hr class="sep"/>
      <div class="muted">Interpretation: compares foreign vs domestic price levels after FX conversion (competitiveness story).</div>
    `;
    return;
  }

  // --- 5) Real exchange rate (slide style)
  if (type === "real_fx_slide"){
    const piD = asDecFromPercent(getNum("r_pi_dom"));
    const piF = asDecFromPercent(getNum("r_pi_for"));
    const e = asDecFromPercent(getNum("e_change"));

    if (!validRateOnePlus(piD) || !validRateOnePlus(piF) || !validRateOnePlus(e)){
      output.innerHTML = `${tag("Input error","bad")} Enter valid rates (must keep 1+rate > 0).`;
      return;
    }

    const q = (1+piD) / ((1+e)*(1+piF));

    let cls = "neutral";
    let label = "Neutral";
    if (q < 1) { cls = "good"; label = "q < 1 → competitiveness improves"; }
    else if (q > 1) { cls = "bad"; label = "q > 1 → competitiveness deteriorates"; }

    output.innerHTML = `
      ${tag("Real FX (slide style)", "neutral")} ${tag(label, cls)}
      <div><strong>q:</strong> <span class="mono">${fmt(q, 6)}</span></div>
      <div class="muted">Formula: <span class="mono">q ≈ (1+π_dom)/[(1+e)(1+π_for)]</span></div>
      <hr class="sep"/>
      <div class="muted">
        If FX moves more than PPP would suggest, competitiveness changes (that’s what q is tracking).
      </div>
    `;
    return;
  }

  // --- 6) IRP forward + premium/discount
  if (type === "irp_forward"){
    const S0u = getNum("irp_S0");
    const iD = asDecFromPercent(getNum("i_dom"));
    const iF = asDecFromPercent(getNum("i_for"));

    if (!isFinite(S0u) || S0u <= 0 || !validRateOnePlus(iD) || !validRateOnePlus(iF) || !isFinite(T)){
      output.innerHTML = `${tag("Input error","bad")} Enter S0>0 and valid interest rates.`;
      return;
    }

    const S0 = toDPF(S0u);
    const ratio = Math.pow((1+iD)/(1+iF), T);
    const F = S0 * ratio;

    const Fu = fromDPF(F);
    const prem = ((Fu - S0u) / S0u) * 100;

    const atDiscount = (F < S0);
    let cls = "neutral", label = "Neutral", expl = "Small difference between forward and spot.";
    if (Math.abs(prem) >= 0.5){
      if (atDiscount){
        cls = "good"; label = `${forLabel()} at forward DISCOUNT`; expl = "Domestic interest < foreign interest tends to imply forward < spot in domestic/foreign quotes.";
      } else {
        cls = "bad"; label = `${forLabel()} at forward PREMIUM`; expl = "Domestic interest > foreign interest tends to imply forward > spot in domestic/foreign quotes.";
      }
    }

    output.innerHTML = `
      ${tag("IRP Forward", "neutral")} ${tag(label, cls)}
      <div><strong>Forward rate F:</strong> <span class="mono">${fmt(Fu, 6)} ${quoteExample()}</span></div>
      <div class="muted">Formula: <span class="mono">F = S0 × [(1+i_dom)/(1+i_for)]^T</span></div>
      <hr class="sep"/>
      <div><strong>Forward premium/discount:</strong> <span class="mono">${pct(prem, 3)}</span></div>
      <div class="muted">${expl}</div>
      <hr class="sep"/>
      <div class="muted">IRP is a “no-arbitrage” benchmark; in liquid markets it often holds tightly (after costs).</div>
    `;
    return;
  }

  // --- 7) PPP vs IRP consistency check
  if (type === "ppp_irp_check"){
    const piD = asDecFromPercent(getNum("c_pi_dom"));
    const piF = asDecFromPercent(getNum("c_pi_for"));
    const iD = asDecFromPercent(getNum("c_i_dom"));
    const iF = asDecFromPercent(getNum("c_i_for"));

    if (!validRateOnePlus(piD) || !validRateOnePlus(piF) || !validRateOnePlus(iD) || !validRateOnePlus(iF) || !isFinite(T)){
      output.innerHTML = `${tag("Input error","bad")} Enter valid inflation/interest rates.`;
      return;
    }

    const pppRatio = Math.pow((1+piD)/(1+piF), T);
    const irpRatio = Math.pow((1+iD)/(1+iF), T);

    const gap = (pppRatio - irpRatio) * 100;

    let cls = "neutral";
    let label = "PPP and IRP close";
    let expl = "Inflation and interest differentials imply similar forward/spot ratios.";

    if (Math.abs(gap) > 1){
      cls = "bad";
      label = "PPP vs IRP mismatch";
      expl = "In practice, PPP is looser than IRP; risk premia, expectations, and frictions can create gaps.";
    }

    output.innerHTML = `
      ${tag("PPP vs IRP Check", "neutral")} ${tag(label, cls)}
      <div><strong>PPP implied (F/S):</strong> <span class="mono">${fmt(pppRatio, 6)}</span></div>
      <div><strong>IRP implied (F/S):</strong> <span class="mono">${fmt(irpRatio, 6)}</span></div>
      <div><strong>Difference (PPP − IRP):</strong> <span class="mono">${pct(gap, 3)}</span></div>
      <hr class="sep"/>
      <div class="muted">${expl}</div>
      <div class="muted">If Fisher holds similarly across countries, then inflation gaps ≈ interest gaps in the long run.</div>
    `;
    return;
  }

  // --- 8) Expected FX change from inflation differential
  if (type === "exp_change_infl"){
    const piD = asDecFromPercent(getNum("x_pi_dom"));
    const piF = asDecFromPercent(getNum("x_pi_for"));
    if (!validRateOnePlus(piD) || !validRateOnePlus(piF) || !isFinite(T)){
      output.innerHTML = `${tag("Input error","bad")} Enter valid inflation rates.`;
      return;
    }

    const exact = Math.pow((1+piD)/(1+piF), T) - 1;
    const approx = (piD - piF) * T;

    output.innerHTML = `
      ${tag("Inflation Differential", "neutral")}
      <div><strong>Exact expected % change:</strong> <span class="mono">${pct(exact*100, 3)}</span></div>
      <div><strong>Approx expected % change:</strong> <span class="mono">${pct(approx*100, 3)}</span></div>
      <hr class="sep"/>
      <div class="muted">This matches your derivation: <span class="mono">(F−S)/S ≈ π_dom − π_for</span> when rates are small.</div>
    `;
    return;
  }

  // --- 9) Expected FX change from interest differential
  if (type === "exp_change_int"){
    const iD = asDecFromPercent(getNum("y_i_dom"));
    const iF = asDecFromPercent(getNum("y_i_for"));
    if (!validRateOnePlus(iD) || !validRateOnePlus(iF) || !isFinite(T)){
      output.innerHTML = `${tag("Input error","bad")} Enter valid interest rates.`;
      return;
    }

    const exact = Math.pow((1+iD)/(1+iF), T) - 1;
    const approx = (iD - iF) * T;

    output.innerHTML = `
      ${tag("Interest Differential", "neutral")}
      <div><strong>Exact expected % change:</strong> <span class="mono">${pct(exact*100, 3)}</span></div>
      <div><strong>Approx expected % change:</strong> <span class="mono">${pct(approx*100, 3)}</span></div>
      <hr class="sep"/>
      <div class="muted">This matches IRP/derivation: <span class="mono">(F−S)/S ≈ i_dom − i_for</span> when rates are small.</div>
    `;
    return;
  }

  // --- 10) Fisher effect
  if (type === "fisher"){
    const rho = asDecFromPercent(getNum("rho"));
    const piE = asDecFromPercent(getNum("pi_e"));

    if (!validRateOnePlus(rho) || !validRateOnePlus(piE)){
      output.innerHTML = `${tag("Input error","bad")} Enter valid real rate and expected inflation.`;
      return;
    }

    const iExact = (1+rho)*(1+piE) - 1;
    const iApprox = rho + piE;

    output.innerHTML = `
      ${tag("Fisher Effect", "neutral")}
      <div><strong>Nominal rate (exact):</strong> <span class="mono">${pct(iExact*100, 3)}</span></div>
      <div><strong>Nominal rate (approx):</strong> <span class="mono">${pct(iApprox*100, 3)}</span></div>
      <hr class="sep"/>
      <div class="muted">Exact: <span class="mono">1+i = (1+ρ)(1+E[π])</span> | Approx: <span class="mono">i ≈ ρ + E[π]</span></div>
    `;
    return;
  }

  // --- 11) International Fisher Effect (expected FX change from interest gap)
  if (type === "ife"){
    const iD = asDecFromPercent(getNum("ife_i_dom"));
    const iF = asDecFromPercent(getNum("ife_i_for"));

    if (!validRateOnePlus(iD) || !validRateOnePlus(iF) || !isFinite(T)){
      output.innerHTML = `${tag("Input error","bad")} Enter valid interest rates.`;
      return;
    }

    const exact = Math.pow((1+iD)/(1+iF), T) - 1;
    const approx = (iD - iF) * T;

    output.innerHTML = `
      ${tag("International Fisher Effect", "neutral")}
      <div><strong>Expected % change (exact ratio):</strong> <span class="mono">${pct(exact*100, 3)}</span></div>
      <div><strong>Expected % change (approx):</strong> <span class="mono">${pct(approx*100, 3)}</span></div>
      <hr class="sep"/>
      <div class="muted">
        Intuition: if real rates equalize, nominal interest gaps mostly reflect inflation gaps → expected FX moves accordingly.
      </div>
    `;
    return;
  }

  // --- 12) PPP GDP conversion
  if (type === "ppp_gdp"){
    const gdp = getNum("gdp_local");
    const pppLocalPerUsd = getNum("ppp_local_per_usd");

    if (!isFinite(gdp) || gdp <= 0 || !isFinite(pppLocalPerUsd) || pppLocalPerUsd <= 0){
      output.innerHTML = `${tag("Input error","bad")} Enter positive GDP and PPP rate.`;
      return;
    }

    const gdpPppUsd = gdp / pppLocalPerUsd;

    output.innerHTML = `
      ${tag("PPP GDP", "neutral")}
      <div><strong>PPP GDP (USD):</strong> <span class="mono">${fmt(gdpPppUsd, 2)} USD</span></div>
      <div class="muted">Formula: <span class="mono">GDP_PPP_USD = GDP_local / PPP_rate(Local per USD)</span></div>
      <hr class="sep"/>
      <div class="muted">
        Why this matters: market FX can be distorted by flows/crises/controls, while PPP adjusts by what money buys domestically.
      </div>
    `;
    return;
  }

  output.innerHTML = `${tag("Not implemented","bad")} Something went wrong — select a valid calculation.`;
}

function resetAll(){
  renderForm(calcType.value);
}

calcType.addEventListener("change", () => renderForm(calcType.value));
btnCompute.addEventListener("click", compute);
btnReset.addEventListener("click", resetAll);

// Re-render the current form when settings change (so labels update)
[domLabelEl, forLabelEl, quoteModeEl].forEach(el => {
  el.addEventListener("change", () => renderForm(calcType.value));
  el.addEventListener("input", () => renderForm(calcType.value));
});

// initial render
renderForm(calcType.value);
