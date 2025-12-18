import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import './App.css';

function App() {
  // --- useStates (Dados do Formulário) ---
  const [valorBruto, setValorBruto] = useState('');
  const [temBeneficios, setTemBeneficios] = useState(''); 
  const [regime, setRegime] = useState('mei');
  
  const [valeTransporte, setValeTransporte] = useState('R$ 0,00');
  const [valeRefeicao, setValeRefeicao] = useState('R$ 0,00');
  const [planoSaude, setPlanoSaude] = useState('R$ 0,00');
  const [outrosBeneficios, setOutrosBeneficios] = useState('R$ 0,00');

  // --- Estados de Resultado ---
  const [errorMessage, setErrorMessage] = useState('');
  const [errorKey, setErrorKey] = useState(0);
  const [errorFields, setErrorFields] = useState({ valorBruto: false, beneficios: false });
  const [invalidAttempts, setInvalidAttempts] = useState(0);
  const [compareLocked, setCompareLocked] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState(null);

  // --- Funções Auxiliares ---
  const parseCurrency = (strValue) => {
    if (!strValue) return 0;
    return parseFloat(strValue.replace(/\D/g, "")) / 100;
  };

  const isFormValid = (valorBrutoValue, beneficiosValue) => {
    return valorBrutoValue > 0 && (beneficiosValue === 'sim' || beneficiosValue === 'nao');
  };
  
  const formatCurrency = (value) => {
    const onlyDigits = value.replace(/\D/g, "");
    if (onlyDigits === "") return "R$ 0,00";
    const numberValue = parseFloat(onlyDigits) / 100;
    return numberValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleCurrencyInput = (setter) => (e) => {
    const nextValue = formatCurrency(e.target.value);
    setter(nextValue);
    if (errorMessage) setErrorMessage('');
    setErrorFields((prev) => ({ ...prev, valorBruto: false }));

    if (compareLocked && isFormValid(parseCurrency(nextValue), temBeneficios)) {
      setCompareLocked(false);
      setInvalidAttempts(0);
    }
  };

  const showError = (message, fields = []) => {
    setErrorMessage(message);
    setErrorFields({
      valorBruto: fields.includes('valorBruto'),
      beneficios: fields.includes('beneficios'),
    });
    setErrorKey((k) => k + 1);
  };

  const handleBeneficiosToggle = (value) => {
    const nextValue = temBeneficios === value ? '' : value;
    setTemBeneficios(nextValue);
    if (errorMessage) setErrorMessage('');
    setErrorFields((prev) => ({ ...prev, beneficios: false }));

    if (compareLocked && isFormValid(parseCurrency(valorBruto), nextValue)) {
      setCompareLocked(false);
      setInvalidAttempts(0);
    }
  };

  // --- CÁLCULOS TRIBUTÁRIOS (Lógica de 2025) ---
  const calcularINSS = (salario) => {
    let inss = 0;
    // Faixas INSS 2025 (progressivo)
    if (salario <= 1518.0) inss = salario * 0.075;
    else if (salario <= 2793.88) inss = (1518.0 * 0.075) + ((salario - 1518.0) * 0.09);
    else if (salario <= 4190.83) inss = (1518.0 * 0.075) + ((2793.88 - 1518.0) * 0.09) + ((salario - 2793.88) * 0.12);
    else if (salario <= 8157.41) inss = (1518.0 * 0.075) + ((2793.88 - 1518.0) * 0.09) + ((4190.83 - 2793.88) * 0.12) + ((salario - 4190.83) * 0.14);
    else inss = 951.63;
    return inss;
  };

  const calcularIRRF = (baseCalculo) => {
    let irrf = 0;
    if (baseCalculo <= 2259.20) irrf = 0;
    else if (baseCalculo <= 2826.65) irrf = (baseCalculo * 0.075) - 169.44;
    else if (baseCalculo <= 3751.05) irrf = (baseCalculo * 0.15) - 381.44;
    else if (baseCalculo <= 4664.68) irrf = (baseCalculo * 0.225) - 662.77;
    else irrf = (baseCalculo * 0.275) - 896.00;
    return irrf > 0 ? irrf : 0;
  };

  const handleComparar = () => {
    if (compareLocked) return;

    const vBruto = parseCurrency(valorBruto);

    const isValorInvalido = !vBruto || vBruto === 0;
    const isBeneficiosInvalido = temBeneficios !== 'sim' && temBeneficios !== 'nao';

    if (isValorInvalido || isBeneficiosInvalido) {
      const fields = [];
      if (isValorInvalido) fields.push('valorBruto');
      if (isBeneficiosInvalido) fields.push('beneficios');
      showError("EXISTEM VALORES INSERIDOS INCORRETAMENTE.", fields);

      setInvalidAttempts((prev) => {
        const next = prev + 1;
        if (next >= 2) setCompareLocked(true);
        return next;
      });
      return;
    }

    // --- 1. BENEFÍCIOS ---
    let totalBeneficios = 0;
    if (temBeneficios === 'sim') {
      totalBeneficios += parseCurrency(valeTransporte);
      totalBeneficios += parseCurrency(valeRefeicao);
      totalBeneficios += parseCurrency(planoSaude);
      totalBeneficios += parseCurrency(outrosBeneficios);
    }

    // --- 2. CÁLCULO CLT ---
    const inssFunc = calcularINSS(vBruto);
    const irrfFunc = calcularIRRF(vBruto - inssFunc);
    const salarioLiquido = vBruto - inssFunc - irrfFunc;

    const fgts = vBruto * 0.08;
    const encargosTotaisEmpresa = vBruto * 0.68; // 68% encargos
    const custoRealCLT = vBruto + encargosTotaisEmpresa + totalBeneficios;

    const pCLT_Salario = parseFloat(((salarioLiquido / custoRealCLT) * 100).toFixed(1));
    const pCLT_Beneficios = parseFloat(((totalBeneficios / custoRealCLT) * 100).toFixed(1));
    
    // Percentuais detalhados para o TEXTO
    const pCLT_INSS_Text = parseFloat((((inssFunc + (vBruto * 0.20)) / custoRealCLT) * 100).toFixed(1));
    const pCLT_IRRF_Text = parseFloat(((irrfFunc / custoRealCLT) * 100).toFixed(1));
    const pCLT_FGTS_Text = parseFloat(((fgts / custoRealCLT) * 100).toFixed(1));

    const dataCLT = [
      { name: 'Salário', value: pCLT_Salario },
      { name: 'Benefícios', value: pCLT_Beneficios },
      { name: 'INSS', value: 15.4 }, 
      { name: 'IRRF', value: 11.5 },
      { name: 'FGTS', value: 7.7 },
    ].filter(i => i.value > 0);

    // --- 3. CÁLCULO PJ ---
    const regimeUsado = regime;

    let impostosPJ = 0;
    if (regimeUsado === 'mei') impostosPJ = 75.0;
    else if (regimeUsado === 'simples') impostosPJ = vBruto * 0.06;
    else if (regimeUsado === 'presumido') impostosPJ = vBruto * 0.1133;

    // Custos adicionais (aplicáveis para Simples/Presumido)
    const contabilidade = regimeUsado === 'mei' ? 0 : 350.0;
    const custosAdicionais = regimeUsado === 'mei' ? 0 : vBruto * 0.02;
    const proLabore = regimeUsado === 'mei' ? 0 : 1412.0;
    const inssProLabore = regimeUsado === 'mei' ? 0 : proLabore * 0.11;

    // Modelo de custo utilizado na comparação e no gráfico:
    // - MEI: faturamento + benefícios + DAS (R$ 75)
    // - Simples/Presumido: faturamento + benefícios + impostos + pró-labore + INSS + contabilidade + custos adicionais
    const custoRealPJ =
      vBruto +
      totalBeneficios +
      impostosPJ +
      contabilidade +
      custosAdicionais +
      proLabore +
      inssProLabore;

    const baseGraficoPJ = custoRealPJ;

    const pPJ_Faturamento = parseFloat(((vBruto / baseGraficoPJ) * 100).toFixed(1));
    const pPJ_Impostos = parseFloat(((impostosPJ / baseGraficoPJ) * 100).toFixed(1));
    const pPJ_Beneficios = parseFloat(((totalBeneficios / baseGraficoPJ) * 100).toFixed(1));
    const pPJ_INSS = parseFloat(((inssProLabore / baseGraficoPJ) * 100).toFixed(1));
    const pPJ_ProLabore = parseFloat(((proLabore / baseGraficoPJ) * 100).toFixed(1));
    const pPJ_Contabil = parseFloat(((contabilidade / baseGraficoPJ) * 100).toFixed(1));
    const pPJ_Custos = parseFloat(((custosAdicionais / baseGraficoPJ) * 100).toFixed(1));

    const dataPJ = [
      { name: 'Faturamento', value: pPJ_Faturamento },
      { name: 'INSS', value: pPJ_INSS },
      { name: 'Impostos', value: pPJ_Impostos },
      { name: 'Pró-labore', value: pPJ_ProLabore },
      { name: 'Contabilidade', value: pPJ_Contabil },
      { name: 'Custos Adic.', value: pPJ_Custos },
      { name: 'Benefícios', value: pPJ_Beneficios },
    ].filter((i) => i.value > 0);

    // --- 4. RESULTADO ---
    const diferenca = custoRealCLT - custoRealPJ;
    const economiaMensal = Math.abs(diferenca).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    let fraseResultado = "";
    if (diferenca > 0) {
      fraseResultado = `Para o seu negócio, a contratação via Pessoa Jurídica é mais vantajosa, gerando uma economia estimada de ${economiaMensal} por mês.`;
    } else if (diferenca < 0) {
      fraseResultado = `Neste cenário específico, a contratação via CLT apresenta um custo menor de ${economiaMensal} por mês.`;
    } else {
      fraseResultado = "Os custos são equivalentes para ambas as modalidades.";
    }

    const maxVal = Math.max(custoRealCLT, custoRealPJ);
    
    setResultData({
      clt: { total: custoRealCLT, chart: dataCLT, percentBar: (custoRealCLT / maxVal) * 100, 
             pSalario: pCLT_Salario, pBeneficios: pCLT_Beneficios, pINSS: pCLT_INSS_Text, pIRRF: pCLT_IRRF_Text, pFGTS: pCLT_FGTS_Text },
      pj: { total: custoRealPJ, chart: dataPJ, percentBar: (custoRealPJ / maxVal) * 100,
            regime: regimeUsado,
            pFaturamento: pPJ_Faturamento,
            pINSS: pPJ_INSS,
            pImpostos: pPJ_Impostos,
            pProLabore: pPJ_ProLabore,
            pContabilidade: pPJ_Contabil,
            pCustos: pPJ_Custos,
            pBeneficios: pPJ_Beneficios },
      mensagemDinamica: fraseResultado
    });

    setErrorMessage('');
    setShowResult(true);
  };

  const handleRefazer = () => setShowResult(false);

  const handleReiniciar = () => {
    setValorBruto('');
    setTemBeneficios('');
    setRegime('mei');
    setValeTransporte('R$ 0,00');
    setValeRefeicao('R$ 0,00');
    setPlanoSaude('R$ 0,00');
    setOutrosBeneficios('R$ 0,00');
    setErrorMessage('');
    setErrorFields({ valorBruto: false, beneficios: false });
    setInvalidAttempts(0);
    setCompareLocked(false);
    setResultData(null);
    setShowResult(false);
  };

  // --- CORES ---
  const COLORS_CLT = ['#FFC107', '#03A9F4', '#263238', '#2962FF', '#69F0AE'];
  const COLORS_PJ = ['#FFC107', '#2196F3', '#00E5FF', '#3F51B5', '#263238', '#5E35B1', '#E91E63']; 

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value }) => {
    const radius = outerRadius * 1.58; 
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const textAnchor = x > cx ? 'start' : 'end';

    return (
      <text x={x} y={y} fill="#374151" textAnchor={textAnchor} dominantBaseline="central" style={{ fontSize: '13px', fontWeight: '700', fontFamily: 'Segoe UI, sans-serif' }}>
        <tspan x={x} dy="-0.4em" textAnchor={textAnchor}>{name}</tspan>
        <tspan x={x} dy="0.95em" fill="#111" fontSize="12px" fontWeight="800" textAnchor={textAnchor}>{`${value}%`}</tspan>
      </text>
    );
  };

  return (
    <div className="page-background">
      <div className={`main-card ${showResult ? 'expanded' : 'compact'}`}>
        
        {/* Lado Esquerdo */}
        <div className="left-panel">
          <h1>COMPARADOR<br />CLT x PJ</h1>
          <p>
            Tomar a decisão certa na hora de contratar
            faz toda a diferença para a saúde financeira
            do seu negócio. O Comparador CLT x PJ foi
            criado para oferecer uma visão clara e prática.
          </p>
        </div>

        {/* Lado Direito */}
        <div className="right-panel">
          
          {!showResult ? (
            // --- TELA 1: FORMULÁRIO ---
            <>
              {errorMessage && (
                <div key={errorKey} className="error-alert fade-in-down">
                  <button className="close-btn" onClick={() => {
                    setErrorMessage('');
                    setErrorFields({ valorBruto: false, beneficios: false });
                  }}>X</button>
                  <strong>{errorMessage}</strong>
                  <span>Verifique os valores preenchidos para você obter um resultado eficiente!</span>
                </div>
              )}

              <div className="form-content fade-in">
                <h2>COMPARADOR CLT x PJ</h2>
                
                <div className="form-body-row">
                  <div className="col-inputs">
                    
                    {/* INPUT COM TOOLTIP RESTAURADO */}
                    <div className="form-group">
                      <label htmlFor="valorBruto">
                        Valor Mensal Bruto 
                        <span className="info-icon">
                          ⓘ
                          <span className="tooltip-box">
                            Para CLT, será considerado
                            como “salário”. Para PJ, será
                            considerado como “faturamento”.
                          </span>
                        </span>
                      </label>
                      <input 
                        type="text" 
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={valorBruto}
                        onChange={handleCurrencyInput(setValorBruto)}
                        className={`input-pill ${errorFields.valorBruto ? 'input-error' : ''}`}
                        placeholder="R$ 0,00"
                      />
                    </div>

                    {/* BENEFÍCIOS COM TOOLTIP RESTAURADO */}
                    <div className="form-group">
                      <label>
                        Benefícios
                        <span className="info-icon">
                          ⓘ
                          <span className="tooltip-box">
                            Inclua todos os valores a mais que envolvem uma contratação, como: 
                            VR, VT, plano de saúde/odonto, auxílio-exercícios e afins.
                          </span>
                        </span>
                      </label>
                      <div className={`checkbox-wrapper ${errorFields.beneficios ? 'benefits-error' : ''}`}>
                        <label className={`checkbox-item ${temBeneficios === 'sim' ? 'active-check' : ''}`}>
                          <input type="checkbox" checked={temBeneficios === 'sim'} onChange={() => handleBeneficiosToggle('sim')} /> Sim
                        </label>
                        <label className={`checkbox-item ${temBeneficios === 'nao' ? 'active-check' : ''}`}>
                          <input type="checkbox" checked={temBeneficios === 'nao'} onChange={() => handleBeneficiosToggle('nao')} /> Não
                        </label>
                      </div>
                    </div>

                    {temBeneficios === 'sim' && (
                      <div className="benefits-container fade-in">
                        <div className="sub-input-group"><label>Vale-transporte:</label><input type="text" inputMode="numeric" pattern="[0-9]*" value={valeTransporte} onChange={handleCurrencyInput(setValeTransporte)} className="input-sub"/></div>
                        <div className="sub-input-group"><label>VR/VA:</label><input type="text" inputMode="numeric" pattern="[0-9]*" value={valeRefeicao} onChange={handleCurrencyInput(setValeRefeicao)} className="input-sub"/></div>
                        <div className="sub-input-group"><label>Plano de Saúde:</label><input type="text" inputMode="numeric" pattern="[0-9]*" value={planoSaude} onChange={handleCurrencyInput(setPlanoSaude)} className="input-sub"/></div>
                        <div className="sub-input-group"><label>Outros:</label><input type="text" inputMode="numeric" pattern="[0-9]*" value={outrosBeneficios} onChange={handleCurrencyInput(setOutrosBeneficios)} className="input-sub"/></div>
                      </div>
                    )}

                    <div className="actions-row desktop-only">
                      <button className="btn-action" onClick={handleComparar} disabled={compareLocked}>COMPARAR</button>
                      <button type="button" className="btn-icon" onClick={handleReiniciar} aria-label="Reiniciar" title="Reiniciar">↻</button>
                    </div>
                  </div>

                  <div className="col-radios">
                    <div className="form-group">
                      <label className="label-destaque">Regime PJ:</label>
                      <div className="radio-group">
                        <label className={`radio-box ${regime === 'mei' ? 'selected' : ''}`}>
                          <div className="radio-control"><input type="radio" name="regime" value="mei" checked={regime === 'mei'} onChange={(e) => setRegime(e.target.value)}/></div>
                          <div className="radio-text"><strong>MEI (Microempreendedor Individual)</strong><span>— Sem custos adicionais</span></div>
                        </label>

                        <label className={`radio-box ${regime === 'simples' ? 'selected' : ''}`}>
                          <div className="radio-control"><input type="radio" name="regime" value="simples" checked={regime === 'simples'} onChange={(e) => setRegime(e.target.value)}/></div>
                          <div className="radio-text"><strong>Pessoa Simples Nacional</strong><span>— IRPJ/CSLL/PIS/COFINS: 6,00%</span></div>
                        </label>

                        <label className={`radio-box ${regime === 'presumido' ? 'selected' : ''}`}>
                          <div className="radio-control"><input type="radio" name="regime" value="presumido" checked={regime === 'presumido'} onChange={(e) => setRegime(e.target.value)}/></div>
                          <div className="radio-text"><strong>Lucro Presumido</strong><span>— IRPJ/CSLL/PIS/COFINS: 11,33%</span><span>— Lucro Imobiliário</span></div>
                        </label>
                      </div>

                      <div className="actions-row mobile-only">
                        <button className="btn-action" onClick={handleComparar} disabled={compareLocked}>COMPARAR</button>
                        <button type="button" className="btn-icon" onClick={handleReiniciar} aria-label="Reiniciar" title="Reiniciar">↻</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // --- TELA 2: RESULTADOS ---
            <div className="result-content fade-in">
              <h2 className="result-title">VEJA A DIFERENÇA NA SUA<br/>CONTRATAÇÃO!</h2>
              
              <div className="comparison-bars">
                <div className="bar-row">
                   <div className="bar-pill pill-pj" style={{width: `${resultData.pj.percentBar}%`}}>
                      <span>{resultData.pj.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                   </div>
                   <span className="bar-label-text">Pessoa Jurídica</span>
                </div>
                <div className="bar-row">
                   <div className="bar-pill pill-clt" style={{width: `${resultData.clt.percentBar}%`}}>
                      <span>{resultData.clt.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                   </div>
                   <span className="bar-label-text">CLT</span>
                </div>
              </div>

              <p className="result-summary">
                {resultData.mensagemDinamica}
              </p>

              <div className="charts-row">
                {/* GRÁFICO CLT */}
                <div className="chart-column">
                  <h4 className="chart-header">VEJA OS GASTOS NA CONTRATAÇÃO VIA CLT:</h4>
                  <div className="recharts-wrapper-custom">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={resultData.clt.chart} cx="50%" cy="50%" innerRadius={0} outerRadius={85} dataKey="value" label={renderCustomizedLabel} labelLine={false}>
                          {resultData.clt.chart.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS_CLT[index % COLORS_CLT.length]} stroke="none"/>
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="chart-footer-text">
                    Observe que, na <strong>contratação via CLT</strong>, seus gastos se resumiriam em: {resultData.clt.pSalario}% de salário; 
                    {resultData.clt.pBeneficios > 0 ? ` ${resultData.clt.pBeneficios}% de benefícios;` : ''} 
                    {` `}{resultData.clt.pINSS}% de INSS; {resultData.clt.pIRRF}% de IRRF; e {resultData.clt.pFGTS}% de FGTS.
                  </p>
                </div>

                {/* GRÁFICO PJ */}
                <div className="chart-column">
                  <h4 className="chart-header">VEJA OS GASTOS NA CONTRATAÇÃO VIA PJ:</h4>
                  <div className="recharts-wrapper-custom">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={resultData.pj.chart} cx="50%" cy="50%" innerRadius={0} outerRadius={85} dataKey="value" label={renderCustomizedLabel} labelLine={false}>
                          {resultData.pj.chart.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS_PJ[index % COLORS_PJ.length]} stroke="none"/>
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="chart-footer-text">
                    {resultData.pj.regime === 'mei' ? (
                      <>
                        Já na <strong>contratação via PJ (MEI)</strong>, seus gastos se dariam em: {resultData.pj.pFaturamento}% de faturamento;
                        {resultData.pj.pBeneficios > 0 ? ` ${resultData.pj.pBeneficios}% de benefícios;` : ''}
                        {` `}e {resultData.pj.pImpostos}% de impostos.
                      </>
                    ) : (
                      <>
                        Já na <strong>contratação via PJ</strong>, seus gastos se dariam em: {resultData.pj.pFaturamento}% de faturamento;
                        {` `}{resultData.pj.pINSS}% de INSS; {resultData.pj.pImpostos}% de impostos; {resultData.pj.pProLabore}% de pró-labore;
                        {` `}{resultData.pj.pContabilidade}% de contabilidade; e {resultData.pj.pCustos}% de custos adicionais.
                        {resultData.pj.pBeneficios > 0 ? ` ${resultData.pj.pBeneficios}% de benefícios.` : ''}
                      </>
                    )}
                  </p>
                </div>
              </div>

              <button className="btn-back" onClick={handleRefazer}>Refazer Cálculo</button>
            </div>
          )}
        </div>
      </div>

      <div className="footer-cta">
        <div className="footer-content">
        </div>
      </div>
    </div>
  );
}

export default App;