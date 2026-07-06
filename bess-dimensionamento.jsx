import { useState, useCallback, useMemo, useRef } from "react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell
} from "recharts";

// ─── Paleta ───────────────────────────────────────────────────────────────
const C = {
  bg:"#0F1923", panel:"#162330", border:"#1E3448",
  accent:"#00C4FF", amber:"#F59E0B", green:"#22C55E",
  red:"#EF4444", muted:"#4A6278", text:"#CBD5E1", heading:"#E2E8F0",
  purple:"#A78BFA", cyan:"#06B6D4", orange:"#F97316",
};

const APPS_META = {
  peak_shaving:   { label:"Peak Shaving",       icon:"⚡", color:C.amber,  desc:"Corte de picos de demanda" },
  load_shifting:  { label:"Load Shifting",       icon:"🔄", color:C.accent, desc:"Arbitragem temporal de carga" },
  arbitragem:     { label:"Arbitragem Tarifária",icon:"💱", color:C.green,  desc:"Compra barata / venda cara" },
  backup_ups:     { label:"Backup / UPS",        icon:"🛡", color:C.purple, desc:"Continuidade de fornecimento" },
  autoconsumption:{ label:"Autoconsumo Solar",   icon:"☀️", color:C.orange, desc:"Maximizar uso de energia FV" },
  freq_regulation:{ label:"Regulação de Freq.",  icon:"📡", color:C.cyan,   desc:"Serviços ancilares à rede" },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Inter:wght@400;500;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:${C.bg};color:${C.text};font-family:'Inter',sans-serif;}
  ::-webkit-scrollbar{width:6px;}::-webkit-scrollbar-track{background:${C.panel};}
  ::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px;}

  .app{display:flex;min-height:100vh;flex-direction:column;}
  .topbar{background:${C.panel};border-bottom:1px solid ${C.border};padding:0 24px;
    display:flex;align-items:center;gap:16px;height:52px;}
  .topbar-logo{font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:600;
    color:${C.accent};letter-spacing:2px;}
  .topbar-tag{font-size:11px;color:${C.muted};border:1px solid ${C.border};padding:2px 8px;border-radius:2px;}
  .topbar-run{margin-left:auto;background:${C.accent};color:#000;border:none;
    padding:7px 20px;font-size:13px;font-weight:700;border-radius:3px;cursor:pointer;
    font-family:'Inter',sans-serif;transition:opacity .15s;}
  .topbar-run:hover{opacity:.85;}

  .layout{display:flex;flex:1;}
  .sidebar{width:290px;min-width:290px;background:${C.panel};border-right:1px solid ${C.border};
    padding:16px;overflow-y:auto;}
  .main{flex:1;padding:20px;overflow-y:auto;}

  .section-label{font-size:10px;font-weight:700;letter-spacing:1.5px;color:${C.muted};
    text-transform:uppercase;margin-bottom:10px;margin-top:18px;
    border-bottom:1px solid ${C.border};padding-bottom:6px;}
  .section-label:first-child{margin-top:0;}

  .field{margin-bottom:10px;}
  .field label{display:flex;justify-content:space-between;font-size:12px;color:${C.text};margin-bottom:4px;}
  .field label span{color:${C.muted};font-family:'JetBrains Mono',monospace;font-size:11px;}
  .field input[type=range]{width:100%;accent-color:${C.accent};cursor:pointer;}
  .field input[type=number]{width:100%;background:${C.bg};border:1px solid ${C.border};
    color:${C.heading};padding:5px 8px;font-size:12px;border-radius:3px;
    font-family:'JetBrains Mono',monospace;}
  .field select{width:100%;background:${C.bg};border:1px solid ${C.border};
    color:${C.heading};padding:5px 8px;font-size:12px;border-radius:3px;}

  .kpi-row{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;}
  .kpi{background:${C.panel};border:1px solid ${C.border};border-radius:4px;padding:14px 16px;
    position:relative;overflow:hidden;}
  .kpi::before{content:'';position:absolute;top:0;left:0;width:3px;height:100%;
    background:var(--accent-color,${C.accent});}
  .kpi-val{font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:600;color:${C.heading};}
  .kpi-unit{font-size:11px;color:${C.muted};margin-left:4px;}
  .kpi-label{font-size:11px;color:${C.muted};margin-top:4px;}

  .card{background:${C.panel};border:1px solid ${C.border};border-radius:4px;padding:16px;margin-bottom:16px;}
  .card-title{font-size:11px;font-weight:700;letter-spacing:1px;color:${C.muted};
    text-transform:uppercase;margin-bottom:14px;}
  .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
  .grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;}

  .badge{display:inline-block;font-size:10px;padding:2px 8px;border-radius:2px;
    font-weight:700;font-family:'JetBrains Mono',monospace;}
  .badge-ok{background:#052e16;color:${C.green};border:1px solid ${C.green}33;}
  .badge-warn{background:#451a03;color:${C.amber};border:1px solid ${C.amber}33;}
  .badge-blue{background:#0c2233;color:${C.accent};border:1px solid ${C.accent}33;}
  .badge-purple{background:#1e1333;color:${C.purple};border:1px solid ${C.purple}33;}

  .results-table{width:100%;border-collapse:collapse;font-size:12px;}
  .results-table th{text-align:left;color:${C.muted};font-weight:600;font-size:10px;
    letter-spacing:1px;text-transform:uppercase;padding:6px 8px;border-bottom:1px solid ${C.border};}
  .results-table td{padding:7px 8px;border-bottom:1px solid ${C.border}22;color:${C.text};
    font-family:'JetBrains Mono',monospace;font-size:12px;}
  .results-table tr:hover td{background:${C.bg}55;}

  .tab-row{display:flex;gap:2px;margin-bottom:16px;border-bottom:1px solid ${C.border};}
  .tab{padding:8px 16px;font-size:12px;cursor:pointer;color:${C.muted};
    border-bottom:2px solid transparent;font-weight:500;transition:all .15s;}
  .tab:hover{color:${C.text};}
  .tab.active{color:${C.accent};border-bottom-color:${C.accent};}
  .tab-new{position:relative;}
  .tab-new::after{content:'NEW';position:absolute;top:4px;right:2px;
    font-size:8px;background:${C.amber};color:#000;padding:1px 4px;
    border-radius:2px;font-weight:700;font-family:'JetBrains Mono',monospace;}

  .status-bar{background:${C.panel};border-top:1px solid ${C.border};padding:4px 24px;
    display:flex;gap:24px;font-size:11px;color:${C.muted};}
  .status-bar span b{color:${C.text};font-family:'JetBrains Mono',monospace;}

  /* ── FATURA ── */
  .fatura-zone{border:2px dashed ${C.border};border-radius:6px;padding:18px 12px;
    text-align:center;cursor:pointer;transition:all .2s;margin-bottom:12px;position:relative;}
  .fatura-zone:hover,.fatura-zone.drag{border-color:${C.accent};background:${C.accent}08;}
  .fatura-zone input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;}
  .fatura-zone-icon{font-size:22px;margin-bottom:6px;}
  .fatura-zone-label{font-size:11px;color:${C.muted};line-height:1.4;}
  .fatura-zone-label b{color:${C.accent};}
  .fatura-preview{border:1px solid ${C.border};border-radius:4px;overflow:hidden;margin-bottom:10px;}
  .fatura-preview img{width:100%;display:block;max-height:140px;object-fit:cover;object-position:top;}
  .fatura-preview-name{font-size:10px;color:${C.muted};padding:5px 8px;
    font-family:'JetBrains Mono',monospace;background:${C.bg};
    display:flex;justify-content:space-between;align-items:center;}
  .fatura-preview-name button{background:none;border:none;color:${C.red};cursor:pointer;font-size:11px;}
  .btn-analisar{width:100%;background:linear-gradient(135deg,${C.accent},#0080aa);
    color:#000;border:none;padding:9px;font-size:12px;font-weight:700;border-radius:4px;
    cursor:pointer;font-family:'Inter',sans-serif;transition:opacity .15s;margin-bottom:10px;}
  .btn-analisar:hover{opacity:.85;}
  .btn-analisar:disabled{opacity:.4;cursor:not-allowed;}
  .fatura-status{border-radius:4px;padding:10px 12px;font-size:11px;margin-bottom:10px;}
  .fatura-status.loading{background:#0c2233;border:1px solid ${C.accent}33;color:${C.accent};}
  .fatura-status.success{background:#052e16;border:1px solid ${C.green}33;color:${C.green};}
  .fatura-status.error{background:#1c0a0a;border:1px solid ${C.red}33;color:${C.red};}
  .fatura-fields{background:${C.bg};border:1px solid ${C.border};border-radius:4px;padding:10px;margin-bottom:10px;}
  .fatura-field-row{display:flex;justify-content:space-between;align-items:center;
    padding:4px 0;border-bottom:1px solid ${C.border}22;font-size:11px;}
  .fatura-field-row:last-child{border-bottom:none;}
  .fatura-field-key{color:${C.muted};}
  .fatura-field-val{color:${C.green};font-family:'JetBrains Mono',monospace;font-weight:600;}
  .pulse{animation:pulse 1.4s ease-in-out infinite;}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  .fatura-btn-apply{width:100%;background:${C.green}22;color:${C.green};
    border:1px solid ${C.green}44;padding:8px;font-size:12px;font-weight:700;
    border-radius:4px;cursor:pointer;font-family:'Inter',sans-serif;transition:all .15s;margin-top:8px;}
  .fatura-btn-apply:hover{background:${C.green}33;}
  .confidence-bar{height:3px;background:${C.border};border-radius:2px;margin-top:6px;}
  .confidence-fill{height:100%;border-radius:2px;transition:width .6s ease;}

  /* ── APLICAÇÕES ── */
  .app-card{background:${C.bg};border:1px solid ${C.border};border-radius:6px;
    padding:14px;margin-bottom:10px;transition:border-color .2s;position:relative;overflow:hidden;}
  .app-card.rank-1{border-color:${C.amber}66;}
  .app-card.rank-2{border-color:${C.accent}44;}
  .app-card.rank-3{border-color:${C.green}33;}
  .app-card-header{display:flex;align-items:center;gap:10px;margin-bottom:10px;}
  .app-card-icon{font-size:20px;line-height:1;}
  .app-card-name{font-size:13px;font-weight:700;color:${C.heading};}
  .app-card-desc{font-size:10px;color:${C.muted};margin-top:1px;}
  .app-card-rank{margin-left:auto;font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:700;}
  .score-bar-wrap{margin-bottom:6px;}
  .score-bar-label{display:flex;justify-content:space-between;font-size:10px;
    color:${C.muted};margin-bottom:3px;}
  .score-bar-label span:last-child{font-family:'JetBrains Mono',monospace;color:${C.text};}
  .score-bar-bg{height:5px;background:${C.border};border-radius:3px;}
  .score-bar-fill{height:100%;border-radius:3px;transition:width .8s ease;}
  .app-tag-row{display:flex;gap:4px;flex-wrap:wrap;margin-top:8px;}
  .app-tag{font-size:9px;padding:2px 7px;border-radius:2px;font-weight:600;
    font-family:'JetBrains Mono',monospace;border:1px solid;}
  .app-justificativa{font-size:11px;color:${C.text};line-height:1.55;margin-top:8px;
    padding-top:8px;border-top:1px solid ${C.border}33;}
  .app-loading{text-align:center;padding:30px;color:${C.muted};}
  .app-loading-icon{font-size:32px;margin-bottom:10px;display:block;}
  .rec-banner{background:linear-gradient(135deg,${C.amber}18,${C.amber}05);
    border:1px solid ${C.amber}44;border-radius:6px;padding:14px 16px;margin-bottom:14px;
    display:flex;gap:12px;align-items:flex-start;}
  .rec-banner-icon{font-size:24px;line-height:1;flex-shrink:0;}
  .rec-banner-title{font-size:13px;font-weight:700;color:${C.amber};margin-bottom:3px;}
  .rec-banner-sub{font-size:11px;color:${C.text};line-height:1.5;}
  .criterio-row{display:flex;justify-content:space-between;align-items:center;
    padding:6px 0;border-bottom:1px solid ${C.border}22;font-size:11px;}
  .criterio-row:last-child{border-bottom:none;}
  .criterio-key{color:${C.muted};display:flex;align-items:center;gap:6px;}
  .criterio-val{font-family:'JetBrains Mono',monospace;font-weight:600;}
  .dot-ok{width:6px;height:6px;border-radius:50%;background:${C.green};display:inline-block;}
  .dot-warn{width:6px;height:6px;border-radius:50%;background:${C.amber};display:inline-block;}
  .dot-no{width:6px;height:6px;border-radius:50%;background:${C.red};display:inline-block;}

  /* ── HUAWEI TAB ── */
  .hw-hero{background:linear-gradient(135deg,#0a1628 0%,#0d2137 50%,#0a1a2e 100%);
    border:1px solid #c8000022;border-radius:8px;padding:24px 28px;margin-bottom:20px;
    display:flex;align-items:center;gap:24px;position:relative;overflow:hidden;}
  .hw-hero::before{content:'';position:absolute;top:-40px;right:-40px;width:200px;height:200px;
    border-radius:50%;background:radial-gradient(circle,#c8000015 0%,transparent 70%);}
  .hw-hero-logo{font-size:38px;line-height:1;flex-shrink:0;}
  .hw-hero-title{font-size:22px;font-weight:700;color:#fff;letter-spacing:-.3px;}
  .hw-hero-sub{font-size:12px;color:${C.muted};margin-top:4px;line-height:1.5;}
  .hw-hero-badge{margin-left:auto;text-align:center;flex-shrink:0;}
  .hw-hero-badge-val{font-family:'JetBrains Mono',monospace;font-size:32px;font-weight:700;color:#c80000;}
  .hw-hero-badge-label{font-size:10px;color:${C.muted};text-align:center;}

  .hw-vantagem{background:${C.bg};border:1px solid ${C.border};border-radius:6px;
    padding:16px;display:flex;gap:14px;align-items:flex-start;transition:border-color .2s;}
  .hw-vantagem:hover{border-color:#c8000033;}
  .hw-vantagem-icon{font-size:24px;line-height:1;flex-shrink:0;margin-top:2px;}
  .hw-vantagem-title{font-size:13px;font-weight:700;color:${C.heading};margin-bottom:4px;}
  .hw-vantagem-desc{font-size:11px;color:${C.text};line-height:1.6;}
  .hw-vantagem-metric{margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;}
  .hw-metric-pill{font-size:10px;font-family:'JetBrains Mono',monospace;font-weight:700;
    padding:2px 8px;border-radius:2px;background:#c8000015;color:#ff4444;border:1px solid #c8000033;}
  .hw-metric-pill.green{background:${C.green}15;color:${C.green};border-color:${C.green}33;}
  .hw-metric-pill.amber{background:${C.amber}15;color:${C.amber};border-color:${C.amber}33;}
  .hw-metric-pill.blue{background:${C.accent}15;color:${C.accent};border-color:${C.accent}33;}

  .comp-header{display:flex;align-items:center;gap:10px;padding:10px 12px;
    border-bottom:1px solid ${C.border};background:${C.bg};}
  .comp-header-logo{font-size:18px;}
  .comp-header-name{font-size:13px;font-weight:700;color:${C.heading};}
  .comp-header-sub{font-size:10px;color:${C.muted};}
  .comp-winner{background:#c8000018;border-color:#c8000033 !important;}
  .comp-winner .comp-header{background:#c8000010;}

  .spec-row{display:flex;justify-content:space-between;align-items:center;
    padding:5px 12px;border-bottom:1px solid ${C.border}11;font-size:11px;}
  .spec-row:last-child{border-bottom:none;}
  .spec-key{color:${C.muted};}
  .spec-val{font-family:'JetBrains Mono',monospace;font-weight:600;color:${C.text};}
  .spec-val.best{color:${C.green};}
  .spec-val.red{color:#ff4444;}

  .hw-section-title{font-size:10px;font-weight:700;letter-spacing:1.5px;color:#c80000;
    text-transform:uppercase;margin-bottom:12px;display:flex;align-items:center;gap:8px;}
  .hw-section-title::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,#c8000033,transparent);}

  .cert-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:4px;}
  .cert-item{background:${C.bg};border:1px solid ${C.border};border-radius:4px;
    padding:10px 8px;text-align:center;}
  .cert-item-icon{font-size:18px;margin-bottom:4px;}
  .cert-item-name{font-size:10px;font-weight:700;color:${C.heading};}
  .cert-item-sub{font-size:9px;color:${C.muted};margin-top:2px;}

  .hw-table{width:100%;border-collapse:collapse;font-size:11px;}
  .hw-table th{background:${C.bg};padding:7px 10px;text-align:left;
    color:${C.muted};font-size:10px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;
    border-bottom:2px solid ${C.border};position:sticky;top:0;}
  .hw-table th.hw-col{background:#0d1e2e;color:#ff4444;}
  .hw-table td{padding:7px 10px;border-bottom:1px solid ${C.border}22;vertical-align:middle;}
  .hw-table tr:hover td{background:${C.bg}88;}
  .hw-table td.hw-col{background:#c8000008;font-weight:700;}
  .hw-win{color:${C.green};font-family:'JetBrains Mono',monospace;font-weight:700;}
  .hw-neutral{color:${C.text};font-family:'JetBrains Mono',monospace;}
  .hw-lose{color:${C.muted};font-family:'JetBrains Mono',monospace;}
  .hw-best-badge{display:inline-flex;align-items:center;gap:3px;font-size:9px;
    background:${C.green}15;color:${C.green};border:1px solid ${C.green}33;
    padding:1px 5px;border-radius:2px;font-weight:700;white-space:nowrap;}
`;

// ─── Simulação BESS ───────────────────────────────────────────────────────
function gerarPerfilCarga(peakLoad, tipo) {
  const perfis = {
    residencial:[.45,.4,.38,.37,.36,.38,.52,.72,.85,.88,.9,.88,.85,.82,.86,.9,.94,.98,1,1,.92,.8,.65,.52],
    comercial:  [.3,.28,.26,.25,.25,.27,.4,.62,.82,.92,.95,.94,.9,.93,.95,.96,.92,.85,.7,.55,.45,.38,.33,.3],
    industrial: [.65,.62,.6,.6,.6,.63,.72,.82,.9,.93,.95,.95,.92,.93,.95,.95,.92,.9,.85,.78,.74,.71,.68,.66],
  };
  const p = perfis[tipo]||perfis.residencial;
  return Array.from({length:24},(_,h)=>({hora:`${String(h).padStart(2,"0")}:00`,carga:parseFloat((p[h]*peakLoad).toFixed(2)),h}));
}
function gerarPerfilSolar(kWp) {
  const irrad=[0,0,0,0,0,.02,.12,.28,.48,.65,.78,.87,.9,.85,.72,.55,.35,.15,.04,.01,0,0,0,0];
  return irrad.map(v=>parseFloat((v*kWp*0.85).toFixed(2)));
}
function simularBESS(params) {
  const{peakLoad,tipoConsumidor,potenciaSolar,capacidadeBESS,potenciaBESS,
    socMin,socMax,eficiencia,tarifaPonta,tarifaForaPonta,horasPonta,geracaoDiesel,potenciaDiesel}=params;
  const carga24=gerarPerfilCarga(peakLoad,tipoConsumidor), solar24=gerarPerfilSolar(potenciaSolar);
  const ef=eficiencia/100,socMinV=socMin/100,socMaxV=socMax/100;
  let soc=(socMinV+socMaxV)/2,energiaGrid=0,energiaDiesel=0,energiaSolar=0;
  let energiaCarregada=0,energiaDescarregada=0,custoPonta=0,custoForaPonta=0,socMin24=1,socMax24=0;
  const timeline=carga24.map(({hora,carga,h})=>{
    const solar=solar24[h],emPonta=horasPonta.includes(h),tarifa=emPonta?tarifaPonta:tarifaForaPonta;
    let balanco=solar-carga,gridUsado=0,dieselUsado=0,batCarga=0,batDescarga=0;
    if(balanco>=0){const cb=Math.min(balanco*ef,(socMaxV-soc)*capacidadeBESS,potenciaBESS);soc+=cb/capacidadeBESS;batCarga=cb;energiaCarregada+=cb;}
    else{const deficit=-balanco,desc=Math.min(deficit,(soc-socMinV)*capacidadeBESS*ef,potenciaBESS);
      soc-=desc/(capacidadeBESS*ef);batDescarga=desc;energiaDescarregada+=desc;
      const restante=deficit-desc;if(restante>0){const dc=geracaoDiesel?Math.min(restante,potenciaDiesel):0;
        dieselUsado=dc;energiaDiesel+=dc;gridUsado=Math.max(0,restante-dc);
        emPonta?(custoPonta+=gridUsado*tarifa):(custoForaPonta+=gridUsado*tarifa);energiaGrid+=gridUsado;}}
    energiaSolar+=solar;soc=Math.max(socMinV,Math.min(socMaxV,soc));
    socMin24=Math.min(socMin24,soc);socMax24=Math.max(socMax24,soc);
    return{hora,carga,solar,soc:parseFloat((soc*100).toFixed(1)),
      grid:parseFloat(gridUsado.toFixed(2)),diesel:parseFloat(dieselUsado.toFixed(2)),
      batCarga:parseFloat(batCarga.toFixed(2)),batDescarga:parseFloat(batDescarga.toFixed(2)),emPonta};
  });
  const energiaTotalCarga=carga24.reduce((a,b)=>a+b.carga,0);
  return{timeline,kpis:{
    fcBESS:parseFloat(((energiaDescarregada/energiaTotalCarga)*100).toFixed(1)),
    autossuficiencia:Math.max(0,parseFloat((Math.min(100,((energiaSolar+energiaDescarregada-energiaCarregada)/energiaTotalCarga)*100)).toFixed(1))),
    energiaGrid:parseFloat(energiaGrid.toFixed(1)),energiaSolar:parseFloat(energiaSolar.toFixed(1)),
    energiaDiesel:parseFloat(energiaDiesel.toFixed(1)),
    custoTotal:parseFloat((custoPonta+custoForaPonta).toFixed(2)),
    custoPonta:parseFloat(custoPonta.toFixed(2)),custoForaPonta:parseFloat(custoForaPonta.toFixed(2)),
    socMin24:parseFloat((socMin24*100).toFixed(1)),socMax24:parseFloat((socMax24*100).toFixed(1)),
  }};
}
function calcEconomia(params,kpis){
  const{capacidadeBESS,custoKWhBESS,potenciaSolar,custoKWpSolar,tarifaPonta,vidaUtil,tma}=params;
  const custoBESS=capacidadeBESS*custoKWhBESS,custoSolar=potenciaSolar*custoKWpSolar,investTotal=custoBESS+custoSolar;
  const economiaAnual=kpis.energiaSolar*tarifaPonta*365*0.85;
  const payback=investTotal/economiaAnual;
  const fluxos=Array.from({length:vidaUtil},(_,i)=>economiaAnual/Math.pow(1+tma/100,i+1));
  const vpl=fluxos.reduce((a,b)=>a+b,0)-investTotal;
  let r=0.1;for(let i=0;i<100;i++){
    let npv=-investTotal+Array.from({length:vidaUtil},(_,k)=>economiaAnual/Math.pow(1+r,k+1)).reduce((a,b)=>a+b,0);
    let dnpv=Array.from({length:vidaUtil},(_,k)=>-(k+1)*economiaAnual/Math.pow(1+r,k+2)).reduce((a,b)=>a+b,0);
    const nr=r-npv/dnpv;if(Math.abs(nr-r)<1e-6){r=nr;break;}r=nr;}
  return{investTotal,custoBESS,custoSolar,economiaAnual,payback,vpl,tir:parseFloat((r*100).toFixed(1)),
    lcoe:investTotal/(capacidadeBESS*365*vidaUtil*0.8)};
}

// ─── Prompts para Claude API ──────────────────────────────────────────────
const PROMPT_FATURA = `Você é especialista em faturas de energia elétrica brasileiras.
Analise esta fatura e extraia as informações no JSON. Se um campo não estiver disponível, use null.
Responda SOMENTE com JSON válido, sem texto antes ou depois, sem markdown.
{
  "distribuidora":string,"cnpj_cpf_cliente":string,"nome_cliente":string,"numero_uc":string,
  "mes_referencia":string,"classe_consumidor":string,"subgrupo_tensao":string,"modalidade_tarifaria":string,
  "consumo_kwh_mes":number,"consumo_kwh_ponta":number,"consumo_kwh_fora_ponta":number,
  "demanda_kw_medida":number,"demanda_kw_contratada":number,"demanda_kw_ponta":number,"demanda_kw_fora_ponta":number,
  "tarifa_kwh_ponta":number,"tarifa_kwh_fora_ponta":number,"tarifa_kwh_convencional":number,
  "tarifa_demanda_ponta":number,"tarifa_demanda_fora_ponta":number,
  "valor_total_fatura":number,"valor_energia":number,"valor_demanda":number,"valor_icms":number,"valor_pis_cofins":number,
  "fator_potencia":number,"tensao_atendimento":string,
  "horario_ponta_inicio":string,"horario_ponta_fim":string,
  "numero_dias_faturados":number,
  "historico_consumo":[{"mes":string,"kwh":number}],
  "observacoes":string,
  "confianca_extracao":number
}`;

const PROMPT_APLICACOES = (fatura) => `Você é um especialista sênior em sistemas de armazenamento de energia (BESS) com profundo conhecimento do mercado elétrico brasileiro.

Com base nos dados desta fatura de energia elétrica, analise e recomende as melhores aplicações de BESS para este consumidor.
Dados da fatura:
${JSON.stringify(fatura, null, 2)}

Avalie CADA UMA das 6 aplicações abaixo e retorne um JSON. Responda SOMENTE com JSON válido, sem markdown.

As aplicações a avaliar são:
1. peak_shaving - Corte de picos de demanda para reduzir encargo de demanda na fatura
2. load_shifting - Deslocamento temporal de carga (carregar bateria fora de ponta, usar na ponta)
3. arbitragem - Arbitragem tarifária entre horários de tarifa baixa e alta
4. backup_ups - Backup de energia / UPS para continuidade de fornecimento
5. autoconsumption - Maximização do autoconsumo de geração solar fotovoltaica
6. freq_regulation - Regulação de frequência e serviços ancilares para a rede elétrica

Para cada aplicação, avalie os critérios relevantes com scores de 0 a 100. Retorne:
{
  "aplicacoes": [
    {
      "id": "peak_shaving",
      "score_geral": número 0-100,
      "viavel": true|false,
      "prioridade": 1-6 (1=melhor),
      "scores_criterios": {
        "potencial_economia": número 0-100,
        "adequacao_tarifaria": número 0-100,
        "complexidade_impl": número 0-100,
        "retorno_investimento": número 0-100,
        "risco_regulatorio": número 0-100
      },
      "tags": ["array de tags curtas relevantes, ex: 'Alta demanda', 'TOU Verde', 'Redução TUSD'"],
      "justificativa": "Explicação técnica detalhada em 2-3 frases de por que esta aplicação é ou não viável para este consumidor específico, citando dados da fatura",
      "economia_estimada_mensal_reais": número ou null,
      "requisito_potencia_kw": número ou null,
      "requisito_energia_kwh": número ou null
    }
  ],
  "recomendacao_principal": "id da aplicação mais recomendada",
  "estrategia_combinada": "Descrição em 2-3 frases da estratégia ótima combinando múltiplas aplicações para este perfil de consumo",
  "alerta": "Algum alerta importante sobre a fatura ou perfil do consumidor (fator de potência baixo, demanda alta, etc.) ou null"
}`;

async function analisarFatura(base64Data, mediaType) {
  const isImg = mediaType.startsWith("image/");
  const contentItem = isImg
    ? {type:"image",source:{type:"base64",media_type:mediaType,data:base64Data}}
    : {type:"document",source:{type:"base64",media_type:"application/pdf",data:base64Data}};
  const resp = await fetch("https://api.anthropic.com/v1/messages",{
    method:"POST", headers:{"Content-Type":"application/json"},
    body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1500,
      messages:[{role:"user",content:[contentItem,{type:"text",text:PROMPT_FATURA}]}]})
  });
  if(!resp.ok) throw new Error(`API error ${resp.status}`);
  const data=await resp.json();
  const text=data.content.map(b=>b.text||"").join("");
  return JSON.parse(text.replace(/```json|```/g,"").trim());
}

async function analisarAplicacoes(faturaData) {
  const resp = await fetch("https://api.anthropic.com/v1/messages",{
    method:"POST", headers:{"Content-Type":"application/json"},
    body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:2500,
      messages:[{role:"user",content:PROMPT_APLICACOES(faturaData)}]})
  });
  if(!resp.ok) throw new Error(`API error ${resp.status}`);
  const data=await resp.json();
  const text=data.content.map(b=>b.text||"").join("");
  return JSON.parse(text.replace(/```json|```/g,"").trim());
}

// ─── UI Components ────────────────────────────────────────────────────────
const CustomTooltip=({active,payload,label})=>{
  if(!active||!payload?.length) return null;
  return(
    <div style={{background:C.panel,border:`1px solid ${C.border}`,padding:"10px 14px",fontSize:11,borderRadius:3}}>
      <div style={{color:C.muted,marginBottom:6,fontFamily:"'JetBrains Mono',monospace"}}>{label}</div>
      {payload.map((p,i)=>(
        <div key={i} style={{color:p.color,display:"flex",justifyContent:"space-between",gap:16}}>
          <span>{p.name}</span><b style={{fontFamily:"'JetBrains Mono',monospace"}}>{p.value}</b>
        </div>
      ))}
    </div>
  );
};
function KPI({label,value,unit,color="#00C4FF",sub}){
  return(
    <div className="kpi" style={{"--accent-color":color}}>
      <div><span className="kpi-val">{value}</span><span className="kpi-unit">{unit}</span></div>
      <div className="kpi-label">{label}</div>
      {sub&&<div style={{fontSize:10,color:C.muted,marginTop:2}}>{sub}</div>}
    </div>
  );
}
function Field({label,unit,value,min,max,step=1,onChange,type="range"}){
  return(
    <div className="field">
      <label>{label}<span>{value}{unit}</span></label>
      {type==="range"
        ?<input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}/>
        :<input type="number" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}/>
      }
    </div>
  );
}

// ─── ScoreBar ─────────────────────────────────────────────────────────────
function ScoreBar({label, score, color}){
  return(
    <div className="score-bar-wrap">
      <div className="score-bar-label"><span>{label}</span><span>{score}/100</span></div>
      <div className="score-bar-bg">
        <div className="score-bar-fill" style={{width:`${score}%`,background:color}}/>
      </div>
    </div>
  );
}

// ─── ApplicationCard ──────────────────────────────────────────────────────
function ApplicationCard({app, rank}){
  const meta = APPS_META[app.id] || {label:app.id,icon:"◎",color:C.muted,desc:""};
  const rankClass = rank===1?"rank-1":rank===2?"rank-2":rank===3?"rank-3":"";
  const criterios = Object.entries(app.scores_criterios||{});
  return(
    <div className={`app-card ${rankClass}`}>
      {rank<=3&&(
        <div style={{position:"absolute",top:10,right:12,fontSize:10,fontFamily:"'JetBrains Mono',monospace",
          color:rank===1?C.amber:rank===2?C.accent:C.green,fontWeight:700}}>
          {rank===1?"★ MELHOR":rank===2?"▲ 2º":rank===3?"▲ 3º":""}
        </div>
      )}
      <div className="app-card-header">
        <span className="app-card-icon">{meta.icon}</span>
        <div>
          <div className="app-card-name">{meta.label}</div>
          <div className="app-card-desc">{meta.desc}</div>
        </div>
        <div className="app-card-rank" style={{color:app.score_geral>=70?C.green:app.score_geral>=45?C.amber:C.red}}>
          {app.score_geral}
        </div>
      </div>

      {criterios.map(([k,v])=>(
        <ScoreBar key={k}
          label={{potencial_economia:"Potencial de Economia",adequacao_tarifaria:"Adequação Tarifária",
            complexidade_impl:"Facilidade de Impl.",retorno_investimento:"Retorno Investimento",
            risco_regulatorio:"Baixo Risco Reg."}[k]||k}
          score={v} color={meta.color}/>
      ))}

      {app.tags?.length>0&&(
        <div className="app-tag-row">
          {app.tags.map(t=>(
            <span key={t} className="app-tag" style={{color:meta.color,borderColor:`${meta.color}44`,background:`${meta.color}11`}}>{t}</span>
          ))}
          <span className={`app-tag ${app.viavel?"badge-ok":"badge-warn"}`} style={{fontSize:9}}>
            {app.viavel?"✓ Viável":"⚠ Limitado"}
          </span>
        </div>
      )}

      {app.requisito_potencia_kw&&(
        <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
          {app.requisito_potencia_kw&&<span style={{fontSize:10,color:C.muted}}>Pot.: <b style={{color:meta.color,fontFamily:"'JetBrains Mono',monospace"}}>{app.requisito_potencia_kw} kW</b></span>}
          {app.requisito_energia_kwh&&<span style={{fontSize:10,color:C.muted}}>Cap.: <b style={{color:meta.color,fontFamily:"'JetBrains Mono',monospace"}}>{app.requisito_energia_kwh} kWh</b></span>}
          {app.economia_estimada_mensal_reais&&<span style={{fontSize:10,color:C.muted}}>Econ.: <b style={{color:C.green,fontFamily:"'JetBrains Mono',monospace"}}>R$ {app.economia_estimada_mensal_reais?.toLocaleString("pt-BR")}/mês</b></span>}
        </div>
      )}

      <div className="app-justificativa">{app.justificativa}</div>
    </div>
  );
}

// ─── Aba Aplicações ───────────────────────────────────────────────────────
function AbaAplicacoes({analise, faturaData}){
  if(!faturaData){
    return(
      <div style={{textAlign:"center",padding:"60px 20px",color:C.muted}}>
        <div style={{fontSize:48,marginBottom:16}}>📄</div>
        <div style={{fontSize:14,marginBottom:8,color:C.text}}>Nenhuma fatura analisada</div>
        <div style={{fontSize:12}}>Anexe uma fatura de energia no painel lateral para receber<br/>a análise de aplicações BESS recomendadas para seu perfil.</div>
      </div>
    );
  }
  if(!analise){
    return(
      <div className="app-loading">
        <span className="app-loading-icon pulse">⚡</span>
        <div style={{fontSize:13,color:C.text,marginBottom:6}}>Analisando aplicações BESS...</div>
        <div style={{fontSize:11}}>Claude está avaliando 6 estratégias com base nos dados da sua fatura</div>
      </div>
    );
  }

  const appsOrdenadas = [...(analise.aplicacoes||[])].sort((a,b)=>a.prioridade-b.prioridade);
  const principal = APPS_META[analise.recomendacao_principal]||{};

  const radarData = appsOrdenadas.map(a=>({
    app:APPS_META[a.id]?.label||a.id, score:a.score_geral,
  }));

  return(
    <>
      {/* Banner principal */}
      <div className="rec-banner">
        <span className="rec-banner-icon">{principal.icon||"⭐"}</span>
        <div>
          <div className="rec-banner-title">Aplicação Recomendada: {principal.label||analise.recomendacao_principal}</div>
          <div className="rec-banner-sub">{analise.estrategia_combinada}</div>
        </div>
      </div>

      {analise.alerta&&(
        <div style={{background:"#1c0f00",border:`1px solid ${C.amber}44`,borderRadius:4,
          padding:"10px 14px",marginBottom:14,fontSize:11,color:C.amber,display:"flex",gap:8}}>
          <span>⚠</span><span>{analise.alerta}</span>
        </div>
      )}

      <div className="grid-2">
        <div>
          {appsOrdenadas.slice(0,3).map((a,i)=>(
            <ApplicationCard key={a.id} app={a} rank={i+1}/>
          ))}
        </div>
        <div>
          {/* Radar */}
          <div className="card">
            <div className="card-title">Score por Aplicação</div>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke={C.border}/>
                <PolarAngleAxis dataKey="app" tick={{fill:C.muted,fontSize:9}}/>
                <PolarRadiusAxis angle={30} domain={[0,100]} tick={{fill:C.muted,fontSize:8}}/>
                <Radar dataKey="score" stroke={C.amber} fill={C.amber} fillOpacity={0.15} strokeWidth={2}/>
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Critérios da melhor aplicação */}
          {appsOrdenadas[0]&&(
            <div className="card">
              <div className="card-title">Critérios — {APPS_META[appsOrdenadas[0].id]?.label}</div>
              {Object.entries(appsOrdenadas[0].scores_criterios||{}).map(([k,v])=>{
                const labels={potencial_economia:"Potencial de Economia",adequacao_tarifaria:"Adequação Tarifária",
                  complexidade_impl:"Facilidade de Implementação",retorno_investimento:"Retorno sobre Investimento",
                  risco_regulatorio:"Baixo Risco Regulatório"};
                const dot=v>=70?"dot-ok":v>=45?"dot-warn":"dot-no";
                return(
                  <div key={k} className="criterio-row">
                    <span className="criterio-key"><span className={dot}/>{labels[k]||k}</span>
                    <span className="criterio-val" style={{color:v>=70?C.green:v>=45?C.amber:C.red}}>{v}/100</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Comparativo barras */}
          <div className="card">
            <div className="card-title">Ranking Geral de Aplicações</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={appsOrdenadas.map(a=>({name:APPS_META[a.id]?.icon+" "+(APPS_META[a.id]?.label||a.id).split(" ")[0],score:a.score_geral,color:APPS_META[a.id]?.color||C.muted}))}
                margin={{top:5,right:10,left:0,bottom:30}} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false}/>
                <XAxis type="number" domain={[0,100]} tick={{fill:C.muted,fontSize:10}}/>
                <YAxis type="category" dataKey="name" tick={{fill:C.muted,fontSize:10}} width={80}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Bar dataKey="score" name="Score" radius={[0,3,3,0]}>
                  {appsOrdenadas.map((a,i)=>(
                    <rect key={i} fill={APPS_META[a.id]?.color||C.muted}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Cards 4-6 */}
      <div style={{marginTop:4}}>
        <div style={{fontSize:10,color:C.muted,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Demais Aplicações Avaliadas</div>
        <div className="grid-3">
          {appsOrdenadas.slice(3).map((a,i)=>(
            <ApplicationCard key={a.id} app={a} rank={i+4}/>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Componente Fatura Upload ─────────────────────────────────────────────
function FaturaUpload({onApply, onFaturaLida}){
  const [file,setFile]=useState(null);
  const [preview,setPreview]=useState(null);
  const [status,setStatus]=useState(null);
  const [result,setResult]=useState(null);
  const [errorMsg,setErrorMsg]=useState("");
  const [drag,setDrag]=useState(false);
  const inputRef=useRef();

  const handleFile=useCallback((f)=>{
    if(!f) return;
    const allowed=["image/jpeg","image/png","image/webp","image/gif","application/pdf"];
    if(!allowed.includes(f.type)){setErrorMsg("Formato não suportado. Use JPG, PNG, WEBP ou PDF.");setStatus("error");return;}
    setFile(f);setStatus(null);setResult(null);
    if(f.type.startsWith("image/")){setPreview(URL.createObjectURL(f));}else{setPreview(null);}
  },[]);

  const analisar=useCallback(async()=>{
    if(!file) return;
    setStatus("loading");setResult(null);
    try{
      const b64=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(",")[1]);r.onerror=()=>rej(new Error("Falha ao ler"));r.readAsDataURL(file);});
      const data=await analisarFatura(b64,file.type);
      setResult(data);setStatus("success");
      // Dispara análise de aplicações em paralelo
      onFaturaLida(data);
    }catch(e){setErrorMsg(e.message||"Erro ao analisar fatura");setStatus("error");}
  },[file,onFaturaLida]);

  const aplicar=useCallback(()=>{
    if(!result) return;
    const u={};
    if(result.demanda_kw_medida) u.peakLoad=Math.round(result.demanda_kw_medida);
    else if(result.demanda_kw_contratada) u.peakLoad=Math.round(result.demanda_kw_contratada);
    if(result.tarifa_kwh_ponta) u.tarifaPonta=parseFloat(result.tarifa_kwh_ponta.toFixed(4));
    if(result.tarifa_kwh_fora_ponta) u.tarifaForaPonta=parseFloat(result.tarifa_kwh_fora_ponta.toFixed(4));
    if(result.tarifa_kwh_convencional&&!result.tarifa_kwh_ponta){u.tarifaPonta=parseFloat(result.tarifa_kwh_convencional.toFixed(4));u.tarifaForaPonta=parseFloat((result.tarifa_kwh_convencional*0.6).toFixed(4));}
    if(result.classe_consumidor){const c=result.classe_consumidor.toLowerCase();
      if(c.includes("resid")) u.tipoConsumidor="residencial";
      else if(c.includes("comerc")) u.tipoConsumidor="comercial";
      else if(c.includes("indust")) u.tipoConsumidor="industrial";}
    if(result.horario_ponta_inicio&&result.horario_ponta_fim){
      const hi=parseInt(result.horario_ponta_inicio.split(":")[0]),hf=parseInt(result.horario_ponta_fim.split(":")[0]);
      const hrs=[];for(let h=hi;h<hf;h++) hrs.push(h);if(hrs.length) u.horasPonta=hrs;}
    onApply(u);
  },[result,onApply]);

  const campos=result?[
    {k:"Distribuidora",v:result.distribuidora},{k:"Cliente",v:result.nome_cliente},
    {k:"Mês Ref.",v:result.mes_referencia},{k:"Classe",v:result.classe_consumidor},
    {k:"Subgrupo",v:result.subgrupo_tensao},{k:"Modalidade",v:result.modalidade_tarifaria},
    {k:"Consumo",v:result.consumo_kwh_mes?`${result.consumo_kwh_mes?.toLocaleString("pt-BR")} kWh`:null},
    {k:"Demanda medida",v:result.demanda_kw_medida?`${result.demanda_kw_medida} kW`:null},
    {k:"Demanda contrat.",v:result.demanda_kw_contratada?`${result.demanda_kw_contratada} kW`:null},
    {k:"Tarifa Ponta",v:result.tarifa_kwh_ponta?`R$ ${result.tarifa_kwh_ponta?.toFixed(4)}/kWh`:null},
    {k:"Tarifa F-Ponta",v:result.tarifa_kwh_fora_ponta?`R$ ${result.tarifa_kwh_fora_ponta?.toFixed(4)}/kWh`:null},
    {k:"Valor Total",v:result.valor_total_fatura?`R$ ${result.valor_total_fatura?.toLocaleString("pt-BR",{minimumFractionDigits:2})}`:null},
    {k:"H.Ponta",v:result.horario_ponta_inicio?`${result.horario_ponta_inicio}–${result.horario_ponta_fim}`:null},
    {k:"F.Potência",v:result.fator_potencia},{k:"Tensão",v:result.tensao_atendimento},
  ].filter(x=>x.v!=null):[];

  const conf=result?.confianca_extracao??0;
  return(
    <div>
      <div className="section-label">📄 Fatura de Energia</div>
      {!file?(
        <div className={`fatura-zone ${drag?"drag":""}`}
          onDragOver={e=>{e.preventDefault();setDrag(true)}}
          onDragLeave={()=>setDrag(false)}
          onDrop={e=>{e.preventDefault();setDrag(false);handleFile(e.dataTransfer.files[0])}}>
          <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={e=>handleFile(e.target.files[0])}/>
          <div className="fatura-zone-icon">⚡</div>
          <div className="fatura-zone-label"><b>Clique ou arraste</b> sua fatura<br/>JPG, PNG, WEBP ou PDF</div>
        </div>
      ):(
        <>
          <div className="fatura-preview">
            {preview?<img src={preview} alt="Fatura"/>:<div style={{background:C.bg,padding:"20px",textAlign:"center",fontSize:28}}>📄</div>}
            <div className="fatura-preview-name">
              <span>{file.name.length>28?file.name.slice(0,25)+"...":file.name}</span>
              <button onClick={()=>{setFile(null);setPreview(null);setStatus(null);setResult(null);}}>✕ remover</button>
            </div>
          </div>
          <button className="btn-analisar" onClick={analisar} disabled={status==="loading"}>
            {status==="loading"?"⟳ Analisando fatura...":"🔍 Analisar com IA"}
          </button>
        </>
      )}

      {status==="loading"&&(
        <div className="fatura-status loading">
          <span className="pulse">◉</span> Lendo fatura + avaliando aplicações BESS...<br/>
          <span style={{fontSize:10,opacity:.7}}>Isso pode levar alguns segundos</span>
        </div>
      )}
      {status==="error"&&<div className="fatura-status error">⚠ {errorMsg}</div>}
      {status==="success"&&result&&(
        <>
          <div className="fatura-status success">
            ✓ Fatura lida · análise de aplicações em andamento
            <div className="confidence-bar" style={{marginTop:6}}>
              <div className="confidence-fill" style={{width:`${conf}%`,background:conf>80?C.green:conf>60?C.amber:C.red}}/>
            </div>
            <div style={{fontSize:10,marginTop:3,display:"flex",justifyContent:"space-between"}}>
              <span>Confiança da extração</span><span>{conf}%</span>
            </div>
          </div>
          <div className="fatura-fields">
            {campos.map(({k,v})=>(
              <div key={k} className="fatura-field-row">
                <span className="fatura-field-key">{k}</span>
                <span className="fatura-field-val">{v}</span>
              </div>
            ))}
          </div>
          {result.historico_consumo?.length>0&&(
            <div style={{marginBottom:8}}>
              <div style={{fontSize:10,color:C.muted,marginBottom:4}}>HISTÓRICO</div>
              <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                {result.historico_consumo.slice(0,6).map(({mes,kwh})=>(
                  <div key={mes} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:3,padding:"3px 5px",fontSize:9,fontFamily:"'JetBrains Mono',monospace"}}>
                    <div style={{color:C.muted}}>{mes}</div>
                    <div style={{color:C.accent}}>{kwh?.toLocaleString("pt-BR")} kWh</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {result.observacoes&&<div style={{fontSize:10,color:C.muted,background:C.bg,padding:"6px 8px",borderRadius:3,marginBottom:6,lineHeight:1.5}}>📝 {result.observacoes}</div>}
          <button className="fatura-btn-apply" onClick={aplicar}>↓ Aplicar dados ao simulador</button>
        </>
      )}
    </div>
  );
}

// ─── Dados Huawei BESS vs Concorrentes ───────────────────────────────────
const HW_VANTAGENS = [
  {
    icon:"🔋", title:"Densidade de Energia Superior",
    desc:"O SmartString ESS utiliza células LFP com densidade de até 175 Wh/kg, superando a maioria dos concorrentes em compacidade. Menos espaço físico necessário para a mesma capacidade instalada.",
    pills:[{t:"175 Wh/kg",c:"red"},{t:"vs ~150 Wh/kg mercado",c:"amber"},{t:"+16% compacto",c:"green"}],
  },
  {
    icon:"⚡", title:"Eficiência Round-Trip de 97%",
    desc:"A arquitetura SmartString com inversores modulares elimina conversões desnecessárias de energia. A eficiência de 97% reduz perdas e maximiza o retorno econômico em aplicações de arbitragem tarifária.",
    pills:[{t:"97% RTE",c:"red"},{t:"vs 92-95% média",c:"amber"},{t:"+2-5% economia",c:"green"}],
  },
  {
    icon:"🛡", title:"Segurança Cell-to-Pack com IA",
    desc:"Sistema de gestão térmica com detecção precoce de falhas por IA (BMS de 5 camadas). Suprime propagação térmica em < 2 ms, atendendo IEC 62619 e UL 9540A — padrões mais rígidos do mercado.",
    pills:[{t:"< 2ms detecção",c:"red"},{t:"IEC 62619",c:"blue"},{t:"UL 9540A",c:"blue"}],
  },
  {
    icon:"📡", title:"SmartString: Arquitetura Distribuída",
    desc:"Cada string de baterias possui seu próprio MPPT e inversor, eliminando ponto único de falha. Degradação de uma unidade não impacta o sistema. Disponibilidade superior a 99,9% garantida.",
    pills:[{t:"99,9% disponibilidade",c:"green"},{t:"Sem ponto único falha",c:"green"},{t:"MPPT por string",c:"blue"}],
  },
  {
    icon:"☁️", title:"Plataforma FusionSolar + Gestão IA",
    desc:"Integração nativa com FusionSolar para monitoramento em tempo real, despacho inteligente e previsão de carga/geração por IA. APIs abertas para integração com SCADA e sistemas de energia de terceiros.",
    pills:[{t:"Previsão IA 48h",c:"red"},{t:"SCADA integrado",c:"blue"},{t:"API aberta",c:"amber"}],
  },
  {
    icon:"📈", title:"Garantia de Rendimento Energético",
    desc:"Huawei garante contratualmente a retenção de 80% de capacidade em 10 anos e 70% em 15 anos. Ciclos garantidos: 6.000+ ciclos para LFP com calendário de manutenção preditiva incluído.",
    pills:[{t:"6.000+ ciclos",c:"green"},{t:"80% cap. em 10 anos",c:"green"},{t:"15 anos garantia",c:"amber"}],
  },
  {
    icon:"🔧", title:"Modularidade e Escalabilidade",
    desc:"Módulos de 100 kWh empilháveis sem limitação prática. Expansão in-situ sem desligamento do sistema. De 100 kWh residencial a centenas de MWh em utility scale com a mesma plataforma.",
    pills:[{t:"100 kWh por módulo",c:"red"},{t:"Expansão sem downtime",c:"green"},{t:"Até centenas MWh",c:"amber"}],
  },
  {
    icon:"🌡", title:"Operação em Ambientes Extremos",
    desc:"Operação garantida de -30°C a +60°C com sistema de climatização integrado. Grau de proteção IP55 (gabinete externo). Ideal para instalações industriais e regiões tropicais brasileiras.",
    pills:[{t:"-30°C a +60°C",c:"blue"},{t:"IP55",c:"blue"},{t:"Climatização interna",c:"amber"}],
  },
];

const CONCORRENTES = [
  {
    nome:"Huawei SmartString ESS", flag:"🔴", destaque:true,
    specs:{
      "Eficiência RTE":       {v:"97%",     win:true},
      "Densidade (Wh/kg)":   {v:"175",     win:true},
      "Ciclos garantidos":   {v:"6.000+",  win:true},
      "Vida útil":           {v:"15 anos", win:true},
      "Monit. IA nativa":    {v:"✓ FusionSolar", win:true},
      "Garantia cap. 10a":   {v:"80%",     win:true},
      "Escala mín. (kWh)":   {v:"100",     win:false},
      "IP Rating":           {v:"IP55",    win:true},
      "C2C Safety":          {v:"5 camadas IA", win:true},
    }
  },
  {
    nome:"Tesla Megapack", flag:"🟠", destaque:false,
    specs:{
      "Eficiência RTE":      {v:"94%",     win:false},
      "Densidade (Wh/kg)":  {v:"~160",    win:false},
      "Ciclos garantidos":  {v:"4.000",   win:false},
      "Vida útil":          {v:"20 anos", win:true},
      "Monit. IA nativa":   {v:"Autobidder", win:false},
      "Garantia cap. 10a":  {v:"70%",     win:false},
      "Escala mín. (kWh)":  {v:"3.900",   win:false},
      "IP Rating":          {v:"IP67",    win:true},
      "C2C Safety":         {v:"Sistema Thermalcom", win:false},
    }
  },
  {
    nome:"BYD Battery-Box", flag:"🟡", destaque:false,
    specs:{
      "Eficiência RTE":      {v:"95%",     win:false},
      "Densidade (Wh/kg)":  {v:"~160",    win:false},
      "Ciclos garantidos":  {v:"6.000",   win:false},
      "Vida útil":          {v:"10 anos", win:false},
      "Monit. IA nativa":   {v:"Limitado", win:false},
      "Garantia cap. 10a":  {v:"60%",     win:false},
      "Escala mín. (kWh)":  {v:"5",       win:true},
      "IP Rating":          {v:"IP55",    win:true},
      "C2C Safety":         {v:"BMS Blade", win:false},
    }
  },
  {
    nome:"CATL TENER", flag:"🟢", destaque:false,
    specs:{
      "Eficiência RTE":      {v:"96%",     win:false},
      "Densidade (Wh/kg)":  {v:"187",     win:true},
      "Ciclos garantidos":  {v:"5.000",   win:false},
      "Vida útil":          {v:"15 anos", win:true},
      "Monit. IA nativa":   {v:"CATL EMS",win:false},
      "Garantia cap. 10a":  {v:"75%",     win:false},
      "Escala mín. (kWh)":  {v:"372",     win:false},
      "IP Rating":          {v:"IP55",    win:true},
      "C2C Safety":         {v:"Zero-Vent", win:false},
    }
  },
  {
    nome:"Sungrow ST2752UX", flag:"🔵", destaque:false,
    specs:{
      "Eficiência RTE":      {v:"93%",     win:false},
      "Densidade (Wh/kg)":  {v:"~155",    win:false},
      "Ciclos garantidos":  {v:"4.500",   win:false},
      "Vida útil":          {v:"10 anos", win:false},
      "Monit. IA nativa":   {v:"iSolarCloud", win:false},
      "Garantia cap. 10a":  {v:"70%",     win:false},
      "Escala mín. (kWh)":  {v:"2.752",   win:false},
      "IP Rating":          {v:"IP54",    win:false},
      "C2C Safety":         {v:"3 camadas", win:false},
    }
  },
  {
    nome:"LG ESS Grid", flag:"🟣", destaque:false,
    specs:{
      "Eficiência RTE":      {v:"95%",     win:false},
      "Densidade (Wh/kg)":  {v:"~150",    win:false},
      "Ciclos garantidos":  {v:"4.000",   win:false},
      "Vida útil":          {v:"10 anos", win:false},
      "Monit. IA nativa":   {v:"Limitado", win:false},
      "Garantia cap. 10a":  {v:"60%",     win:false},
      "Escala mín. (kWh)":  {v:"88",      win:false},
      "IP Rating":          {v:"IP55",    win:true},
      "C2C Safety":         {v:"BMS 3D",  win:false},
    }
  },
];

const RADAR_COMPARATIVO = [
  {criterio:"Eficiência",    Huawei:97, Tesla:88, BYD:90, CATL:94, Sungrow:87, LG:90},
  {criterio:"Segurança",     Huawei:98, Tesla:85, BYD:88, CATL:92, Sungrow:80, LG:82},
  {criterio:"Monitoramento", Huawei:97, Tesla:88, BYD:70, CATL:78, Sungrow:76, LG:68},
  {criterio:"Escalabilidade",Huawei:95, Tesla:72, BYD:95, CATL:80, Sungrow:75, LG:82},
  {criterio:"Garantia",      Huawei:96, Tesla:88, BYD:72, CATL:88, Sungrow:78, LG:72},
  {criterio:"Densidade",     Huawei:90, Tesla:85, BYD:85, CATL:98, Sungrow:82, LG:80},
];

const CERTIFICACOES = [
  {icon:"🏅",name:"IEC 62619",sub:"Segurança células"},
  {icon:"🏅",name:"UL 9540A",sub:"Proteção térmica"},
  {icon:"🏅",name:"IEC 62040",sub:"UPS / backup"},
  {icon:"🏅",name:"IP55",sub:"Proteção ambiental"},
  {icon:"🏅",name:"CE / CB",sub:"Conformidade global"},
  {icon:"🏅",name:"ISO 9001",sub:"Gestão qualidade"},
];

function AbaHuawei() {
  const [viewMode, setViewMode] = useState("vantagens"); // vantagens | comparativo | specs

  const specKeys = Object.keys(CONCORRENTES[0].specs);

  return (
    <>
      {/* Hero */}
      <div className="hw-hero">
        <span className="hw-hero-logo">🔴</span>
        <div>
          <div className="hw-hero-title">Huawei SmartString ESS</div>
          <div className="hw-hero-sub">
            Sistema de armazenamento de energia inteligente com arquitetura distribuída,<br/>
            gestão por IA e eficiência líder de mercado para aplicações C&I e Utility Scale.
          </div>
        </div>
        <div className="hw-hero-badge">
          <div className="hw-hero-badge-val">97%</div>
          <div className="hw-hero-badge-label">Eficiência RTE<br/>Líder de Mercado</div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{display:"flex",gap:4,marginBottom:18,borderBottom:`1px solid ${C.border}`}}>
        {[{id:"vantagens",label:"✦ Vantagens Técnicas"},{id:"comparativo",label:"⊞ Comparativo de Mercado"},{id:"specs",label:"≡ Tabela Full Specs"}].map(t=>(
          <div key={t.id} onClick={()=>setViewMode(t.id)}
            style={{padding:"8px 16px",fontSize:12,cursor:"pointer",fontWeight:500,transition:"all .15s",
              color:viewMode===t.id?"#ff4444":C.muted,
              borderBottom:viewMode===t.id?"2px solid #c80000":"2px solid transparent"}}>
            {t.label}
          </div>
        ))}
      </div>

      {/* ── VANTAGENS ── */}
      {viewMode==="vantagens"&&(
        <>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
            {HW_VANTAGENS.map((v,i)=>(
              <div key={i} className="hw-vantagem">
                <span className="hw-vantagem-icon">{v.icon}</span>
                <div style={{flex:1}}>
                  <div className="hw-vantagem-title">{v.title}</div>
                  <div className="hw-vantagem-desc">{v.desc}</div>
                  <div className="hw-vantagem-metric">
                    {v.pills.map((p,j)=>(
                      <span key={j} className={`hw-metric-pill ${p.c}`}>{p.t}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{borderColor:"#c8000022"}}>
            <div className="hw-section-title">Certificações e Conformidade</div>
            <div className="cert-grid">
              {CERTIFICACOES.map((c,i)=>(
                <div key={i} className="cert-item">
                  <div className="cert-item-icon">{c.icon}</div>
                  <div className="cert-item-name">{c.name}</div>
                  <div className="cert-item-sub">{c.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── COMPARATIVO RADAR + CARDS ── */}
      {viewMode==="comparativo"&&(
        <>
          <div className="grid-2" style={{marginBottom:16}}>
            <div className="card">
              <div className="card-title">Score Multidimensional — Huawei vs. Mercado</div>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={RADAR_COMPARATIVO}>
                  <PolarGrid stroke={C.border}/>
                  <PolarAngleAxis dataKey="criterio" tick={{fill:C.muted,fontSize:10}}/>
                  <PolarRadiusAxis angle={30} domain={[60,100]} tick={{fill:C.muted,fontSize:8}}/>
                  <Radar dataKey="Huawei"  stroke="#c80000" fill="#c80000" fillOpacity={0.25} strokeWidth={2.5}/>
                  <Radar dataKey="Tesla"   stroke={C.amber}  fill={C.amber}  fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="4 2"/>
                  <Radar dataKey="BYD"     stroke={C.green}  fill={C.green}  fillOpacity={0.06} strokeWidth={1.5} strokeDasharray="4 2"/>
                  <Radar dataKey="CATL"    stroke={C.accent} fill={C.accent} fillOpacity={0.06} strokeWidth={1.5} strokeDasharray="4 2"/>
                  <Legend wrapperStyle={{fontSize:10}}/>
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <div className="card-title">Score Geral por Fabricante</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart layout="vertical"
                  data={[
                    {name:"🔴 Huawei",  score:95, fill:"#c80000"},
                    {name:"🟢 CATL",    score:85, fill:C.accent},
                    {name:"🟠 Tesla",   score:83, fill:C.amber},
                    {name:"🟡 BYD",     score:80, fill:C.green},
                    {name:"🔵 Sungrow", score:78, fill:C.purple},
                    {name:"🟣 LG ESS",  score:75, fill:C.muted},
                  ]}
                  margin={{top:5,right:20,left:10,bottom:5}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false}/>
                  <XAxis type="number" domain={[60,100]} tick={{fill:C.muted,fontSize:10}}/>
                  <YAxis type="category" dataKey="name" tick={{fill:C.muted,fontSize:11}} width={90}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Bar dataKey="score" name="Score" radius={[0,4,4,0]}>
                    {[{fill:"#c80000"},{fill:C.accent},{fill:C.amber},{fill:C.green},{fill:C.purple},{fill:C.muted}].map((e,i)=>(
                      <Cell key={i} fill={e.fill}/>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cards comparativos individuais */}
          <div className="hw-section-title" style={{marginBottom:14}}>Comparativo por Fabricante</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
            {CONCORRENTES.filter(c=>!c.destaque).map(comp=>{
              const hw=CONCORRENTES[0];
              return(
                <div key={comp.nome} className="card" style={{padding:0,overflow:"hidden"}}>
                  <div className="comp-header">
                    <span className="comp-header-logo">{comp.flag}</span>
                    <div>
                      <div className="comp-header-name">{comp.nome.split(" ").slice(0,2).join(" ")}</div>
                      <div className="comp-header-sub">{comp.nome.split(" ").slice(2).join(" ")}</div>
                    </div>
                  </div>
                  {["Eficiência RTE","Ciclos garantidos","Garantia cap. 10a","Monit. IA nativa","Vida útil"].map(key=>{
                    const hwVal=hw.specs[key];
                    const compVal=comp.specs[key];
                    const hwWins = hwVal?.win && !compVal?.win;
                    return(
                      <div key={key} className="spec-row">
                        <span className="spec-key">{key}</span>
                        <div style={{display:"flex",gap:6,alignItems:"center",fontSize:11}}>
                          <span className={`hw-${hwWins?"win":"neutral"}`}>{hwVal?.v}</span>
                          <span style={{color:C.border}}>vs</span>
                          <span className={`hw-${!hwWins?"neutral":"lose"}`}>{compVal?.v}</span>
                          {hwWins&&<span className="hw-best-badge">✓ HW</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── TABELA FULL SPECS ── */}
      {viewMode==="specs"&&(
        <>
          <div className="hw-section-title" style={{marginBottom:12}}>Especificações Técnicas Completas — Todos os Fabricantes</div>
          <div style={{overflowX:"auto"}}>
            <table className="hw-table">
              <thead>
                <tr>
                  <th style={{minWidth:160}}>Especificação</th>
                  {CONCORRENTES.map(c=>(
                    <th key={c.nome} className={c.destaque?"hw-col":""}
                      style={{minWidth:130,textAlign:"center"}}>
                      {c.flag} {c.nome.split(" ").slice(0,2).join(" ")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {specKeys.map(key=>(
                  <tr key={key}>
                    <td style={{color:C.muted,fontWeight:500}}>{key}</td>
                    {CONCORRENTES.map(c=>{
                      const s=c.specs[key];
                      return(
                        <td key={c.nome} className={c.destaque?"hw-col":""} style={{textAlign:"center"}}>
                          <span className={s?.win?(c.destaque?"hw-win":"hw-neutral"):"hw-lose"}>
                            {s?.v||"—"}
                          </span>
                          {c.destaque&&s?.win&&<> <span className="hw-best-badge">✓ Melhor</span></>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{marginTop:16}} className="card">
            <div className="hw-section-title">Eficiência Round-Trip — Comparativo Visual</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={[
                {nome:"Huawei",rte:97,fill:"#c80000"},
                {nome:"CATL",  rte:96,fill:C.accent},
                {nome:"BYD",   rte:95,fill:C.green},
                {nome:"LG",    rte:95,fill:C.purple},
                {nome:"Tesla", rte:94,fill:C.amber},
                {nome:"Sungrow",rte:93,fill:C.muted},
              ]} margin={{top:5,right:20,left:0,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                <XAxis dataKey="nome" tick={{fill:C.muted,fontSize:11}}/>
                <YAxis domain={[90,98]} tick={{fill:C.muted,fontSize:10}} unit="%"/>
                <Tooltip content={<CustomTooltip/>}/>
                <Bar dataKey="rte" name="Eficiência RTE (%)" radius={[4,4,0,0]}>
                  {["#c80000",C.accent,C.green,C.purple,C.amber,C.muted].map((fill,i)=>(
                    <Cell key={i} fill={fill}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </>
  );
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────
export default function BESSApp(){
  const [tab,setTab]=useState("simulacao");
  const [params,setParams]=useState({
    peakLoad:100,tipoConsumidor:"residencial",potenciaSolar:80,
    capacidadeBESS:200,potenciaBESS:50,socMin:20,socMax:95,eficiencia:92,
    tarifaPonta:1.80,tarifaForaPonta:0.65,horasPonta:[17,18,19,20,21],
    geracaoDiesel:false,potenciaDiesel:30,custoKWhBESS:1800,custoKWpSolar:3200,vidaUtil:15,tma:12,quimBESS:"LFP",
  });
  const [faturaAplicada,setFaturaAplicada]=useState(false);
  const [faturaData,setFaturaData]=useState(null);        // dados brutos da fatura
  const [analiseApps,setAnaliseApps]=useState(null);      // resultado análise aplicações
  const [analiseLoading,setAnaliseLoading]=useState(false);

  const set=useCallback((k,v)=>setParams(p=>({...p,[k]:v})),[]);

  const applyFatura=useCallback((updates)=>{
    setParams(p=>({...p,...updates}));
    setFaturaAplicada(true);
    setTab("aplicacoes");
  },[]);

  const handleFaturaLida=useCallback(async(data)=>{
    setFaturaData(data);
    setAnaliseApps(null);
    setAnaliseLoading(true);
    try{
      const analise=await analisarAplicacoes(data);
      setAnaliseApps(analise);
    }catch(e){
      console.error("Erro análise aplicações:",e);
    }finally{
      setAnaliseLoading(false);
    }
  },[]);

  const{timeline,kpis}=useMemo(()=>simularBESS(params),[params]);
  const eco=useMemo(()=>calcEconomia(params,kpis),[params,kpis]);
  const fluxoCaixa=useMemo(()=>Array.from({length:params.vidaUtil},(_,i)=>({
    ano:`A${i+1}`,fluxo:parseFloat(eco.economiaAnual.toFixed(0)),
    acumulado:parseFloat((eco.economiaAnual*(i+1)-eco.investTotal).toFixed(0)),
  })),[eco,params.vidaUtil]);

  const TABS=[
    {id:"simulacao",label:"Simulação 24h"},
    {id:"aplicacoes",label:"Aplicações BESS",novo:true},
    {id:"energia",label:"Balanço Energético"},
    {id:"economia",label:"Análise Econômica"},
    {id:"dimensionamento",label:"Dimensionamento"},
    {id:"huawei",label:"🔴 Huawei BESS"},
  ];

  return(
    <>
      <style>{css}</style>
      <div className="app">
        <div className="topbar">
          <span className="topbar-logo">◈ BESS·SIM</span>
          <span className="topbar-tag">v2.2 · Dimensionamento de Sistemas de Armazenamento</span>
          {faturaAplicada&&<span className="badge badge-ok" style={{fontSize:10}}>✓ Fatura Importada</span>}
          {analiseLoading&&<span className="badge badge-blue" style={{fontSize:10}}><span className="pulse">◉</span> Analisando aplicações...</span>}
          <button className="topbar-run">▶ SIMULAR</button>
        </div>

        <div className="layout">
          <div className="sidebar">
            <FaturaUpload onApply={applyFatura} onFaturaLida={handleFaturaLida}/>

            <div className="section-label">Carga Elétrica</div>
            <div className="field">
              <label>Tipo de Consumidor</label>
              <select value={params.tipoConsumidor} onChange={e=>set("tipoConsumidor",e.target.value)}>
                <option value="residencial">Residencial</option>
                <option value="comercial">Comercial</option>
                <option value="industrial">Industrial</option>
              </select>
            </div>
            <Field label="Demanda de Pico" unit=" kW" value={params.peakLoad} min={10} max={1000} step={5} onChange={v=>set("peakLoad",v)}/>

            <div className="section-label">Geração Solar FV</div>
            <Field label="Potência Instalada" unit=" kWp" value={params.potenciaSolar} min={0} max={800} step={5} onChange={v=>set("potenciaSolar",v)}/>

            <div className="section-label">Bateria BESS</div>
            <div className="field">
              <label>Química</label>
              <select value={params.quimBESS} onChange={e=>set("quimBESS",e.target.value)}>
                <option value="LFP">LFP (Lítio Ferro Fosfato)</option>
                <option value="NMC">NMC (Níquel Manganês Cobalto)</option>
                <option value="VRFB">VRFB (Fluxo Vanádio)</option>
                <option value="Na-ion">Na-ion (Sódio-íon)</option>
              </select>
            </div>
            <Field label="Capacidade" unit=" kWh" value={params.capacidadeBESS} min={10} max={2000} step={10} onChange={v=>set("capacidadeBESS",v)}/>
            <Field label="Potência Nominal" unit=" kW" value={params.potenciaBESS} min={5} max={1000} step={5} onChange={v=>set("potenciaBESS",v)}/>
            <Field label="SoC Mínimo" unit="%" value={params.socMin} min={5} max={40} onChange={v=>set("socMin",v)}/>
            <Field label="SoC Máximo" unit="%" value={params.socMax} min={60} max={100} onChange={v=>set("socMax",v)}/>
            <Field label="Eficiência Round-Trip" unit="%" value={params.eficiencia} min={70} max={99} onChange={v=>set("eficiencia",v)}/>

            <div className="section-label">Tarifas</div>
            <Field label="Tarifa Ponta" unit=" R$/kWh" value={params.tarifaPonta} min={0.5} max={10} step={0.0001} type="number" onChange={v=>set("tarifaPonta",v)}/>
            <Field label="Tarifa Fora-Ponta" unit=" R$/kWh" value={params.tarifaForaPonta} min={0.1} max={5} step={0.0001} type="number" onChange={v=>set("tarifaForaPonta",v)}/>

            <div className="section-label">Diesel (Backup)</div>
            <div className="field">
              <label style={{display:"flex",alignItems:"center",gap:8}}>
                <input type="checkbox" checked={params.geracaoDiesel} onChange={e=>set("geracaoDiesel",e.target.checked)}/>
                Grupo Gerador
              </label>
            </div>
            {params.geracaoDiesel&&<Field label="Potência Diesel" unit=" kW" value={params.potenciaDiesel} min={5} max={500} step={5} onChange={v=>set("potenciaDiesel",v)}/>}

            <div className="section-label">Análise Econômica</div>
            <Field label="Custo BESS" unit=" R$/kWh" value={params.custoKWhBESS} min={800} max={5000} step={100} type="number" onChange={v=>set("custoKWhBESS",v)}/>
            <Field label="Custo Solar" unit=" R$/kWp" value={params.custoKWpSolar} min={1500} max={6000} step={100} type="number" onChange={v=>set("custoKWpSolar",v)}/>
            <Field label="Vida Útil" unit=" anos" value={params.vidaUtil} min={5} max={25} onChange={v=>set("vidaUtil",v)}/>
            <Field label="TMA" unit="% a.a." value={params.tma} min={5} max={25} onChange={v=>set("tma",v)}/>
          </div>

          <div className="main">
            <div className="kpi-row">
              <KPI label="Autossuficiência Energética" value={kpis.autossuficiencia} unit="%" color={C.green} sub={`FC BESS: ${kpis.fcBESS}%`}/>
              <KPI label="Energia da Rede (diário)" value={kpis.energiaGrid} unit=" kWh" color={C.accent}/>
              <KPI label="Custo c/ Energia (diário)" value={`R$ ${kpis.custoTotal}`} unit="" color={C.amber} sub={`Ponta: R$ ${kpis.custoPonta}`}/>
              <KPI label="Payback Simples" value={eco.payback.toFixed(1)} unit=" anos" color={C.red} sub={`VPL: R$ ${(eco.vpl/1000).toFixed(0)}k`}/>
            </div>

            <div className="tab-row">
              {TABS.map(t=>(
                <div key={t.id} className={`tab ${tab===t.id?"active":""} ${t.novo?"tab-new":""}`}
                  onClick={()=>setTab(t.id)}
                  style={t.id==="huawei"&&tab===t.id?{color:"#c80000",borderBottomColor:"#c80000"}:
                         t.id==="huawei"?{color:"#c8000088"}:{}}>
                  {t.label}
                </div>
              ))}
            </div>

            {/* ── SIMULAÇÃO ── */}
            {tab==="simulacao"&&(
              <>
                <div className="card">
                  <div className="card-title">Perfil de Carga e Geração Solar — 24 horas</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={timeline} margin={{top:5,right:10,left:0,bottom:5}}>
                      <defs>
                        <linearGradient id="gSolar" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.amber} stopOpacity={.3}/><stop offset="95%" stopColor={C.amber} stopOpacity={0}/></linearGradient>
                        <linearGradient id="gCarga" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.accent} stopOpacity={.2}/><stop offset="95%" stopColor={C.accent} stopOpacity={0}/></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border}/><XAxis dataKey="hora" tick={{fill:C.muted,fontSize:10}}/><YAxis tick={{fill:C.muted,fontSize:10}} unit=" kW"/>
                      <Tooltip content={<CustomTooltip/>}/><Legend wrapperStyle={{fontSize:11}}/>
                      <Area dataKey="carga" name="Carga (kW)" stroke={C.accent} fill="url(#gCarga)" strokeWidth={2} dot={false}/>
                      <Area dataKey="solar" name="Solar (kW)" stroke={C.amber} fill="url(#gSolar)" strokeWidth={2} dot={false}/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid-2">
                  <div className="card">
                    <div className="card-title">Estado de Carga (SoC)</div>
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={timeline} margin={{top:5,right:10,left:0,bottom:5}}>
                        <CartesianGrid strokeDasharray="3 3" stroke={C.border}/><XAxis dataKey="hora" tick={{fill:C.muted,fontSize:10}} interval={3}/><YAxis tick={{fill:C.muted,fontSize:10}} unit="%" domain={[0,100]}/>
                        <Tooltip content={<CustomTooltip/>}/>
                        <ReferenceLine y={params.socMin} stroke={C.red} strokeDasharray="4 2"/>
                        <ReferenceLine y={params.socMax} stroke={C.green} strokeDasharray="4 2"/>
                        <Line dataKey="soc" name="SoC (%)" stroke={C.accent} strokeWidth={2} dot={false}/>
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="card">
                    <div className="card-title">Fluxo Bateria</div>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={timeline} margin={{top:5,right:10,left:0,bottom:5}}>
                        <CartesianGrid strokeDasharray="3 3" stroke={C.border}/><XAxis dataKey="hora" tick={{fill:C.muted,fontSize:10}} interval={3}/><YAxis tick={{fill:C.muted,fontSize:10}} unit=" kW"/>
                        <Tooltip content={<CustomTooltip/>}/>
                        <Bar dataKey="batCarga" name="Carga bat (kW)" fill={C.green} opacity={.8}/>
                        <Bar dataKey="batDescarga" name="Descarga bat (kW)" fill={C.amber} opacity={.8}/>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="card">
                  <div className="card-title">Despacho — Grid e Diesel</div>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={timeline} margin={{top:5,right:10,left:0,bottom:5}}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border}/><XAxis dataKey="hora" tick={{fill:C.muted,fontSize:10}}/><YAxis tick={{fill:C.muted,fontSize:10}} unit=" kW"/>
                      <Tooltip content={<CustomTooltip/>}/><Legend wrapperStyle={{fontSize:11}}/>
                      <Bar dataKey="grid" name="Rede (kW)" fill={C.accent} opacity={.75}/>
                      {params.geracaoDiesel&&<Bar dataKey="diesel" name="Diesel (kW)" fill="#A3E635" opacity={.75}/>}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {/* ── APLICAÇÕES ── */}
            {tab==="aplicacoes"&&(
              <AbaAplicacoes analise={analiseLoading?null:analiseApps} faturaData={faturaData}/>
            )}

            {/* ── ENERGIA ── */}
            {tab==="energia"&&(
              <>
                <div className="grid-2">
                  <div className="card">
                    <div className="card-title">Balanço Energético Diário</div>
                    <table className="results-table">
                      <thead><tr><th>Fonte</th><th>kWh</th><th>Part.</th></tr></thead>
                      <tbody>{[{n:"Solar FV",v:kpis.energiaSolar,c:C.amber},{n:"Rede",v:kpis.energiaGrid,c:C.accent},{n:"Diesel",v:kpis.energiaDiesel,c:"#A3E635"}].map(({n,v,c})=>{
                        const total=kpis.energiaSolar+kpis.energiaGrid+kpis.energiaDiesel;
                        return(<tr key={n}><td><span style={{color:c}}>■</span> {n}</td><td>{v.toFixed(1)}</td>
                          <td><div style={{display:"flex",alignItems:"center",gap:6}}>
                            <div style={{width:50,height:4,background:C.border,borderRadius:2}}><div style={{width:`${total?v/total*100:0}%`,height:"100%",background:c,borderRadius:2}}/></div>
                            {total?(v/total*100).toFixed(1):0}%</div></td></tr>);
                      })}</tbody>
                    </table>
                    <div style={{marginTop:12}}>
                      <table className="results-table"><tbody>
                        <tr><td>FC BESS</td><td>{kpis.fcBESS}%</td></tr>
                        <tr><td>Autossuficiência</td><td>{kpis.autossuficiencia}%</td></tr>
                        <tr><td>SoC mín.</td><td>{kpis.socMin24}%</td></tr>
                        <tr><td>SoC máx.</td><td>{kpis.socMax24}%</td></tr>
                      </tbody></table>
                    </div>
                  </div>
                  <div className="card">
                    <div className="card-title">Configuração do Sistema</div>
                    <table className="results-table"><tbody>
                      <tr><td>Química</td><td><span className="badge badge-ok">{params.quimBESS}</span></td></tr>
                      <tr><td>Capacidade</td><td>{params.capacidadeBESS} kWh</td></tr>
                      <tr><td>Potência</td><td>{params.potenciaBESS} kW</td></tr>
                      <tr><td>C-rate</td><td>{(params.potenciaBESS/params.capacidadeBESS).toFixed(2)} C</td></tr>
                      <tr><td>Energia útil</td><td>{((params.socMax-params.socMin)/100*params.capacidadeBESS).toFixed(0)} kWh</td></tr>
                      <tr><td>Eff. RT</td><td>{params.eficiencia}%</td></tr>
                      <tr><td>Solar</td><td>{params.potenciaSolar} kWp</td></tr>
                    </tbody></table>
                  </div>
                </div>
                <div className="card">
                  <div style={{overflowX:"auto"}}>
                    <table className="results-table">
                      <thead><tr><th>Hora</th><th>Carga</th><th>Solar</th><th>Bat↑</th><th>Bat↓</th><th>Grid</th><th>SoC</th><th>Período</th></tr></thead>
                      <tbody>{timeline.map(r=>(
                        <tr key={r.hora}><td>{r.hora}</td><td>{r.carga}</td>
                          <td style={{color:C.amber}}>{r.solar}</td><td style={{color:C.green}}>{r.batCarga}</td>
                          <td style={{color:C.orange}}>{r.batDescarga}</td><td style={{color:C.accent}}>{r.grid}</td>
                          <td>{r.soc}%</td>
                          <td><span className={`badge ${r.emPonta?"badge-warn":"badge-ok"}`}>{r.emPonta?"PONTA":"F-PONTA"}</span></td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* ── ECONOMIA ── */}
            {tab==="economia"&&(
              <>
                <div className="kpi-row">
                  <KPI label="Investimento Total" value={`R$ ${(eco.investTotal/1000).toFixed(0)}k`} unit="" color={C.red}/>
                  <KPI label="Economia Anual" value={`R$ ${(eco.economiaAnual/1000).toFixed(1)}k`} unit="" color={C.green}/>
                  <KPI label="VPL" value={`R$ ${(eco.vpl/1000).toFixed(0)}k`} unit="" color={eco.vpl>0?C.green:C.red}/>
                  <KPI label="TIR" value={eco.tir} unit="% a.a." color={eco.tir>params.tma?C.green:C.red} sub={`TMA: ${params.tma}%`}/>
                </div>
                <div className="grid-2">
                  <div className="card">
                    <div className="card-title">Fluxo de Caixa Acumulado</div>
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={fluxoCaixa} margin={{top:5,right:10,left:0,bottom:5}}>
                        <defs><linearGradient id="gVpl" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.green} stopOpacity={.3}/><stop offset="95%" stopColor={C.green} stopOpacity={0}/></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={C.border}/><XAxis dataKey="ano" tick={{fill:C.muted,fontSize:10}}/><YAxis tick={{fill:C.muted,fontSize:10}} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
                        <Tooltip content={<CustomTooltip/>}/><ReferenceLine y={0} stroke={C.muted} strokeDasharray="4 2"/>
                        <Area dataKey="acumulado" name="Acumulado (R$)" stroke={C.green} fill="url(#gVpl)" strokeWidth={2} dot={false}/>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="card">
                    <div className="card-title">Breakdown Investimento</div>
                    <table className="results-table" style={{marginBottom:12}}>
                      <thead><tr><th>Componente</th><th>Custo</th><th>Part.</th></tr></thead>
                      <tbody>{[{n:"BESS",v:eco.custoBESS,c:C.accent},{n:"Solar FV",v:eco.custoSolar,c:C.amber}].map(({n,v,c})=>(
                        <tr key={n}><td><span style={{color:c}}>■</span> {n}</td><td>R$ {(v/1000).toFixed(1)}k</td>
                          <td><div style={{display:"flex",alignItems:"center",gap:6}}>
                            <div style={{width:40,height:4,background:C.border,borderRadius:2}}><div style={{width:`${v/eco.investTotal*100}%`,height:"100%",background:c,borderRadius:2}}/></div>
                            {(v/eco.investTotal*100).toFixed(0)}%</div></td></tr>
                      ))}</tbody>
                    </table>
                    <table className="results-table"><tbody>
                      <tr><td>LCOE</td><td>R$ {eco.lcoe.toFixed(3)}/kWh</td></tr>
                      <tr><td>Payback</td><td>{eco.payback.toFixed(1)} anos</td></tr>
                    </tbody></table>
                  </div>
                </div>
              </>
            )}

            {/* ── DIMENSIONAMENTO ── */}
            {tab==="dimensionamento"&&(
              <>
                <div className="grid-2">
                  <div className="card">
                    <div className="card-title">Resultado do Dimensionamento</div>
                    <table className="results-table"><tbody>
                      <tr><td>Potência BESS</td><td style={{color:C.accent}}>{params.potenciaBESS} kW</td></tr>
                      <tr><td>Capacidade BESS</td><td style={{color:C.accent}}>{params.capacidadeBESS} kWh</td></tr>
                      <tr><td>Energia utilizável</td><td>{((params.socMax-params.socMin)/100*params.capacidadeBESS).toFixed(0)} kWh</td></tr>
                      <tr><td>C-rate nominal</td><td>{(params.potenciaBESS/params.capacidadeBESS).toFixed(2)} C</td></tr>
                      <tr><td>Autonomia</td><td>{(((params.socMax-params.socMin)/100*params.capacidadeBESS)/(params.peakLoad*0.7)).toFixed(1)} h</td></tr>
                      <tr><td>Razão Arm./Solar</td><td>{(params.capacidadeBESS/params.potenciaSolar).toFixed(2)} kWh/kWp</td></tr>
                      <tr><td>Módulos (100kWh)</td><td>{Math.ceil(params.capacidadeBESS/100)} un.</td></tr>
                    </tbody></table>
                  </div>
                  <div className="card">
                    <div className="card-title">Critérios de Dimensionamento</div>
                    {[
                      {label:"Razão P/E (C-rate)",val:(params.potenciaBESS/params.capacidadeBESS),ok:v=>v<=1,unit:"C",desc:"≤ 1C recomendado"},
                      {label:"Cobertura de Ponta",val:((params.socMax-params.socMin)/100*params.capacidadeBESS/params.peakLoad),ok:v=>v>=1,unit:"h",desc:"Mínimo 1h"},
                      {label:"Solar/BESS ratio",val:(params.potenciaSolar/params.capacidadeBESS),ok:v=>v>=0.3&&v<=1.5,unit:"kWp/kWh",desc:"0.3~1.5 ideal"},
                      {label:"SoC útil",val:(params.socMax-params.socMin),ok:v=>v>=60,unit:"%",desc:"≥ 60%"},
                    ].map(({label,val,ok,unit,desc})=>(
                      <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.border}22`,fontSize:12}}>
                        <div><div style={{color:C.text}}>{label}</div><div style={{fontSize:10,color:C.muted}}>{desc}</div></div>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontFamily:"'JetBrains Mono',monospace",color:ok(val)?C.green:C.amber}}>{val.toFixed(2)}{unit}</span>
                          <span className={`badge ${ok(val)?"badge-ok":"badge-warn"}`}>{ok(val)?"OK":"⚠"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="card">
                  <div className="card-title">Sensibilidade — Capacidade vs. Autossuficiência</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={[100,150,200,250,300,350,400,500].map(cap=>{const r=simularBESS({...params,capacidadeBESS:cap});return{cap:`${cap}kWh`,autoss:r.kpis.autossuficiencia,fc:r.kpis.fcBESS};})} margin={{top:5,right:10,left:0,bottom:5}}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border}/><XAxis dataKey="cap" tick={{fill:C.muted,fontSize:10}}/><YAxis tick={{fill:C.muted,fontSize:10}} unit="%"/>
                      <Tooltip content={<CustomTooltip/>}/><Legend wrapperStyle={{fontSize:11}}/>
                      <Line dataKey="autoss" name="Autossuficiência (%)" stroke={C.green} strokeWidth={2} dot={{r:3}}/>
                      <Line dataKey="fc" name="FC BESS (%)" stroke={C.accent} strokeWidth={2} dot={{r:3}}/>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
            {/* ── HUAWEI ── */}
            {tab==="huawei"&&<AbaHuawei/>}
          </div>
        </div>

        <div className="status-bar">
          <span>Sistema: <b>{params.quimBESS} {params.capacidadeBESS}kWh/{params.potenciaBESS}kW</b></span>
          <span>Solar: <b>{params.potenciaSolar}kWp</b></span>
          <span>Consumidor: <b>{params.tipoConsumidor}</b></span>
          <span>Tarifa ponta: <b>R${params.tarifaPonta}/kWh</b></span>
          {faturaAplicada&&<span style={{color:C.green}}>✓ <b>Fatura aplicada</b></span>}
          {analiseLoading&&<span style={{color:C.accent}}><span className="pulse">◉</span> <b>Analisando aplicações...</b></span>}
          {analiseApps&&!analiseLoading&&<span style={{color:C.amber}}>⭐ <b>Rec: {APPS_META[analiseApps.recomendacao_principal]?.label||""}</b></span>}
          <span style={{marginLeft:"auto"}}>◈ BESS·SIM 2.3</span>
        </div>
      </div>
    </>
  );
}
