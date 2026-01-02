import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import './App.css';

function App() {
  const SALARIO_MINIMO_MENSAL = 1621;
  const SALARIO_MINIMO_MENSAL_LABEL = SALARIO_MINIMO_MENSAL.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

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
  const [errorFields, setErrorFields] = useState({ valorBruto: false, beneficios: false, beneficiosValores: false });
  const [invalidAttempts, setInvalidAttempts] = useState(0);
  const [compareLocked, setCompareLocked] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState(null);

  // --- Funções Auxiliares ---
  const parseCurrency = (strValue) => {
    if (!strValue) return 0;
    return parseFloat(strValue.replace(/\D/g, "")) / 100;
  };

  const hasAnyBeneficio = () => {
    return (
      parseCurrency(valeTransporte) > 0 ||
      parseCurrency(valeRefeicao) > 0 ||
      parseCurrency(planoSaude) > 0 ||
      parseCurrency(outrosBeneficios) > 0
    );
  };

  const isFormValid = (valorBrutoValue, beneficiosValue) => {
    const baseOk = valorBrutoValue >= SALARIO_MINIMO_MENSAL && (beneficiosValue === 'sim' || beneficiosValue === 'nao');
    if (!baseOk) return false;
    if (beneficiosValue === 'nao') return true;
    return hasAnyBeneficio();
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

  const handleBeneficioCurrencyInput = (setter) => (e) => {
    const nextValue = formatCurrency(e.target.value);
    setter(nextValue);
    if (errorMessage) setErrorMessage('');
    setErrorFields((prev) => ({ ...prev, beneficiosValores: false }));

    if (compareLocked && isFormValid(parseCurrency(valorBruto), temBeneficios)) {
      setCompareLocked(false);
      setInvalidAttempts(0);
    }
  };

  const showError = (message, fields = []) => {
    setErrorMessage(message);
    setErrorFields({
      valorBruto: fields.includes('valorBruto'),
      beneficios: fields.includes('beneficios'),
      beneficiosValores: fields.includes('beneficiosValores'),
    });
    setErrorKey((k) => k + 1);
  };

  const handleBeneficiosToggle = (value) => {
    const nextValue = temBeneficios === value ? '' : value;
    setTemBeneficios(nextValue);
    if (errorMessage) setErrorMessage('');
    setErrorFields((prev) => ({ ...prev, beneficios: false, beneficiosValores: false }));

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

    const isValorInvalido = !vBruto || vBruto < SALARIO_MINIMO_MENSAL;
    const isBeneficiosInvalido = temBeneficios !== 'sim' && temBeneficios !== 'nao';
    const isBeneficiosValoresInvalido = temBeneficios === 'sim' && !hasAnyBeneficio();

    if (isValorInvalido || isBeneficiosInvalido || isBeneficiosValoresInvalido) {
      const fields = [];
      if (isValorInvalido) fields.push('valorBruto');
      if (isBeneficiosInvalido) fields.push('beneficios');
      if (isBeneficiosValoresInvalido) fields.push('beneficiosValores');

      const message =
        isValorInvalido && !isBeneficiosInvalido
          ? `O VALOR MENSAL BRUTO DEVE SER NO MÍNIMO ${SALARIO_MINIMO_MENSAL_LABEL}.`
          : isBeneficiosValoresInvalido
            ? 'PREENCHA PELO MENOS UM BENEFÍCIO (VT, VR/VA, PLANO DE SAÚDE OU OUTROS).'
          : "EXISTEM VALORES INSERIDOS INCORRETAMENTE.";

      showError(message, fields);

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
    
    // Desconto de vale transporte (6% do salário, limitado ao valor do VT)
    const descontoVT = temBeneficios === 'sim' && parseCurrency(valeTransporte) > 0 
      ? Math.min(vBruto * 0.06, parseCurrency(valeTransporte)) 
      : 0;
    
    const totalDescontos = inssFunc + irrfFunc + descontoVT;
    const salarioLiquido = vBruto - totalDescontos;

    // Benefícios obrigatórios: FGTS, Férias e 13º (Lógica baseada na Contabilizei)
    // FGTS: 8% do Bruto
    const fgts = vBruto * 0.08;
    
    // 13º Salário: Considerado como (Salário Líquido Mensal / 12)
    const decimoTerceiroLiquido = salarioLiquido / 12;
    
    // Férias + 1/3: (Bruto + 1/3) - Impostos, dividido por 12
    const feriasBruto = vBruto + (vBruto / 3);
    const inssFerias = calcularINSS(feriasBruto);
    const irrfFerias = calcularIRRF(feriasBruto - inssFerias);
    const feriasLiquidoTotal = feriasBruto - inssFerias - irrfFerias;
    const feriasMensal = feriasLiquidoTotal / 12;

    const beneficiosObrigatorios = fgts + decimoTerceiroLiquido + feriasMensal;
    
    // TOTAL que o trabalhador RECEBE (líquido mensal + benefícios obrigatórios + benefícios extras)
    const recebimentoTotalCLT = salarioLiquido + beneficiosObrigatorios + totalBeneficios;

    // Percentuais sobre o salário bruto (para mostrar divisão no gráfico)
    const pCLT_Liquido = parseFloat(((salarioLiquido / vBruto) * 100).toFixed(1));
    const pCLT_Descontos = parseFloat(((totalDescontos / vBruto) * 100).toFixed(1));
    const pCLT_BenefObrig = parseFloat(((beneficiosObrigatorios / vBruto) * 100).toFixed(1));
    const pCLT_BenefExtras = parseFloat(((totalBeneficios / vBruto) * 100).toFixed(1));

    const dataCLT = [
      { name: 'Salário', value: pCLT_Liquido },
      { name: 'Benefícios Obrigatórios', value: pCLT_BenefObrig },
      { name: 'Benefícios Extras', value: pCLT_BenefExtras },
      { name: 'Descontos', value: pCLT_Descontos },
    ].filter(i => i.value > 0);

    // --- 3. CÁLCULO PJ ---
    const regimeUsado = regime;

    let impostosPJ = 0;
    if (regimeUsado === 'mei') impostosPJ = 75.0;
    else if (regimeUsado === 'simples') impostosPJ = vBruto * 0.06;
    else if (regimeUsado === 'presumido') impostosPJ = vBruto * 0.1133;

    // Custos operacionais (aplicáveis para Simples/Presumido)
    // Ajustado para refletir o cálculo simplificado de referência (apenas Impostos + INSS sobre SM 2025)
    const contabilidade = 0; 
    const custosAdicionais = 0; 
    const proLabore = regimeUsado === 'mei' ? 0 : 1518.0;
    const inssProLabore = regimeUsado === 'mei' ? 0 : proLabore * 0.11;

    // Total de descontos/custos
    const totalDescontosPJ = impostosPJ + contabilidade + custosAdicionais + inssProLabore;
    
    // TOTAL que o trabalhador RECEBE (faturamento - descontos + benefícios)
    const recebimentoTotalPJ = vBruto - totalDescontosPJ + totalBeneficios;

    // Percentuais sobre o faturamento bruto (para mostrar divisão no gráfico)
    const pPJ_Liquido = parseFloat((((vBruto - totalDescontosPJ) / vBruto) * 100).toFixed(1));
    const pPJ_Impostos = parseFloat(((impostosPJ / vBruto) * 100).toFixed(1));
    const pPJ_INSS = parseFloat(((inssProLabore / vBruto) * 100).toFixed(1));
    const pPJ_Contabil = parseFloat(((contabilidade / vBruto) * 100).toFixed(1));
    const pPJ_Custos = parseFloat(((custosAdicionais / vBruto) * 100).toFixed(1));
    const pPJ_BenefExtras = parseFloat(((totalBeneficios / vBruto) * 100).toFixed(1));

    const dataPJ = [
      { name: 'Salário', value: pPJ_Liquido },
      { name: 'Impostos', value: pPJ_Impostos },
      { name: 'INSS Pró-labore', value: pPJ_INSS },
      { name: 'Contabilidade', value: pPJ_Contabil },
      { name: 'Custos Adic.', value: pPJ_Custos },
      { name: 'Benefícios Extras', value: pPJ_BenefExtras },
    ].filter((i) => i.value > 0);

    // --- 4. RESULTADO ---
    // Para fins de comparação (texto), consideramos que o PJ NÃO recebe os benefícios extras "por fora",
    // ou seja, o valor bruto do PJ deve cobrir tudo.
    // Mas no gráfico (recebimentoTotalPJ), mantemos os benefícios somados se o usuário os preencheu,
    // assumindo que ele configurou o cenário assim.
    // Porém, a queixa "não calcula a diferença com benefícios" sugere comparar:
    // CLT (com benefícios) vs PJ (apenas líquido do faturamento).
    const recebimentoPJParaComparacao = vBruto - totalDescontosPJ;
    const diferenca = recebimentoPJParaComparacao - recebimentoTotalCLT;
    const diferencaValor = Math.abs(diferenca).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    // Função para calcular o salário bruto PJ equivalente para igualar o CLT
    const calcularSalarioBrutoPJEquivalente = (targetLiquido, regime) => {
      // Target = vBrutoPJ - totalDescontosPJ
      // (Assumindo que o PJ tem que cobrir o targetLiquido APENAS com o faturamento, sem benefícios extras)
      
      const targetSemBeneficios = targetLiquido; // O PJ precisa cobrir TUDO
      const proLabore = regime === 'mei' ? 0 : 1518.0;
      const inssProLabore = regime === 'mei' ? 0 : proLabore * 0.11;
      
      // vBrutoPJ - impostosPJ = targetSemBeneficios + inssProLabore
      const baseCalculo = targetSemBeneficios + inssProLabore;

      if (regime === 'mei') {
        // impostosPJ = 75.0
        // vBrutoPJ - 75.0 = baseCalculo
        return baseCalculo + 75.0;
      } else if (regime === 'simples') {
        // impostosPJ = vBrutoPJ * 0.06
        // vBrutoPJ - 0.06 * vBrutoPJ = baseCalculo
        // 0.94 * vBrutoPJ = baseCalculo
        return baseCalculo / 0.94;
      } else if (regime === 'presumido') {
        // impostosPJ = vBrutoPJ * 0.1133
        // vBrutoPJ - 0.1133 * vBrutoPJ = baseCalculo
        // 0.8867 * vBrutoPJ = baseCalculo
        return baseCalculo / 0.8867;
      }
      return 0;
    };

    let fraseResultado = "";
    if (diferenca > 0) {
      fraseResultado = (
        <>
          Como PJ, você receberia <span className="highlight-value">{diferencaValor}</span> a mais por mês em comparação com CLT.
        </>
      );
    } else if (diferenca < 0) {
      const pjEquivalente = calcularSalarioBrutoPJEquivalente(recebimentoTotalCLT, regimeUsado);
      const pjEquivalenteFormatado = pjEquivalente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      fraseResultado = (
        <>
          Confira o faturamento que você deve ter como PJ <br/>
          para receber o mesmo que o CLT: <span className="highlight-value">{pjEquivalenteFormatado}</span>
        </>
      );
    } else {
      fraseResultado = "Você receberia o mesmo valor em ambas as modalidades.";
    }

    const maxVal = Math.max(recebimentoTotalCLT, recebimentoTotalPJ);
    
    setResultData({
      clt: { 
        total: recebimentoTotalCLT, 
        chart: dataCLT, 
        percentBar: (recebimentoTotalCLT / maxVal) * 100,
        salarioBruto: vBruto,
        salarioLiquido: salarioLiquido,
        descontos: totalDescontos,
        beneficiosObrig: beneficiosObrigatorios,
        beneficiosExtras: totalBeneficios,
        pLiquido: pCLT_Liquido,
        pDescontos: pCLT_Descontos,
        pBenefObrig: pCLT_BenefObrig,
        pBenefExtras: pCLT_BenefExtras
      },
      pj: { 
        total: recebimentoTotalPJ, 
        chart: dataPJ, 
        percentBar: (recebimentoTotalPJ / maxVal) * 100,
        regime: regimeUsado,
        faturamentoBruto: vBruto,
        liquido: vBruto - totalDescontosPJ,
        descontos: totalDescontosPJ,
        beneficiosExtras: totalBeneficios,
        pLiquido: pPJ_Liquido,
        pImpostos: pPJ_Impostos,
        pINSS: pPJ_INSS,
        pContabilidade: pPJ_Contabil,
        pCustos: pPJ_Custos,
        pBenefExtras: pPJ_BenefExtras
      },
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
    setErrorFields({ valorBruto: false, beneficios: false, beneficiosValores: false });
    setInvalidAttempts(0);
    setCompareLocked(false);
    setResultData(null);
    setShowResult(false);
  };

  // --- CORES ---
  const COLORS_CLT = ['#FFC107', '#03A9F4', '#263238', '#2962FF', '#69F0AE'];
  const COLORS_PJ = ['#FFC107', '#2196F3', '#00E5FF', '#3F51B5', '#263238', '#5E35B1', '#E91E63']; 

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, value }) => {
    const radius = outerRadius * 1.58; 
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const textAnchor = x > cx ? 'start' : 'end';

    return (
      <text x={x} y={y} fill="#111" textAnchor={textAnchor} dominantBaseline="central" style={{ fontSize: '12px', fontWeight: '800', fontFamily: 'Segoe UI, sans-serif' }}>
        <tspan x={x} dy="0.3em" textAnchor={textAnchor}>{`${value}%`}</tspan>
      </text>
    );
  };

  const renderChartLegend = (items, colors) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="chart-legend">
        {items.map((item, index) => (
          <div key={`${item.name}-${index}`} className="legend-item">
            <span className="legend-swatch" style={{ backgroundColor: colors[index % colors.length] }} />
            <span className="legend-text">{item.name}</span>
            <span className="legend-value">{`${item.value}%`}</span>
          </div>
        ))}
      </div>
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
                    setErrorFields({ valorBruto: false, beneficios: false, beneficiosValores: false });
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
                            o salário mensal partindo do valor minimo R$1.621. Para PJ, será
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
                        onBlur={() => {
                          const parsed = parseCurrency(valorBruto);
                          if (parsed > 0 && parsed < SALARIO_MINIMO_MENSAL) {
                            setValorBruto(SALARIO_MINIMO_MENSAL_LABEL);
                          }
                        }}
                        className={`input-pill ${errorFields.valorBruto ? 'input-error' : ''}`}
                        placeholder={SALARIO_MINIMO_MENSAL_LABEL}
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
                      <div className={`benefits-container fade-in ${errorFields.beneficiosValores ? 'benefits-values-error' : ''}`}>
                        <div className="sub-input-group"><label>Vale-transporte:</label><input type="text" inputMode="numeric" pattern="[0-9]*" value={valeTransporte} onChange={handleBeneficioCurrencyInput(setValeTransporte)} className="input-sub"/></div>
                        <div className="sub-input-group"><label>VR/VA:</label><input type="text" inputMode="numeric" pattern="[0-9]*" value={valeRefeicao} onChange={handleBeneficioCurrencyInput(setValeRefeicao)} className="input-sub"/></div>
                        <div className="sub-input-group"><label>Plano de Saúde:</label><input type="text" inputMode="numeric" pattern="[0-9]*" value={planoSaude} onChange={handleBeneficioCurrencyInput(setPlanoSaude)} className="input-sub"/></div>
                        <div className="sub-input-group"><label>Outros:</label><input type="text" inputMode="numeric" pattern="[0-9]*" value={outrosBeneficios} onChange={handleBeneficioCurrencyInput(setOutrosBeneficios)} className="input-sub"/></div>
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
                          <div className="radio-text"><strong>MEI (Microempreendedor Individual)</strong><span>— Taxa fixa mensal</span></div>
                        </label>

                        <label className={`radio-box ${regime === 'simples' ? 'selected' : ''}`}>
                          <div className="radio-control"><input type="radio" name="regime" value="simples" checked={regime === 'simples'} onChange={(e) => setRegime(e.target.value)}/></div>
                          <div className="radio-text"><strong>Simples Nacional</strong><span>— IRPJ/CSLL/PIS/COFINS: 6,00%</span></div>
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
                   <div className="bar-track">
                     <div className="bar-pill pill-pj" style={{width: `${resultData.pj.percentBar}%`}}>
                        <span>{resultData.pj.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                     </div>
                   </div>
                   <span className="bar-label-text">Pessoa Jurídica</span>
                </div>
                <div className="bar-row">
                   <div className="bar-track">
                     <div className="bar-pill pill-clt" style={{width: `${resultData.clt.percentBar}%`}}>
                        <span>{resultData.clt.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                     </div>
                   </div>
                   <span className="bar-label-text">CLT</span>
                </div>
              </div>

              <p className="result-primary">
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
                  {renderChartLegend(resultData.clt.chart, COLORS_CLT)}
                  <p className="chart-footer-text">
                    <strong>(-) Descontos:</strong> {resultData.clt.descontos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
                    (INSS, IRRF, VT)<br/>
                    <strong>(+) Benefícios obrigatórios:</strong> {resultData.clt.beneficiosObrig.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
                    (FGTS, 13º, Férias)<br/>
                    {resultData.clt.beneficiosExtras > 0 ? `(+) Outros benefícios: ${resultData.clt.beneficiosExtras.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : ''}
                    {resultData.clt.beneficiosExtras > 0 ? <br/> : ''}
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
                  {renderChartLegend(resultData.pj.chart, COLORS_PJ)}
                  <p className="chart-footer-text">
                    <strong>(-) Descontos:</strong> {resultData.pj.descontos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
                    (Impostos + INSS + Contabilidade + Custos)<br/>
                    {resultData.pj.beneficiosExtras > 0 ? `(+) Outros benefícios: ${resultData.pj.beneficiosExtras.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : ''}
                    {resultData.pj.beneficiosExtras > 0 ? <br/> : ''}
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