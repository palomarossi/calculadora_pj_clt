import { useState } from 'react';
import './App.css';

function App() {
  // --- useStates ---
  const [valorBruto, setValorBruto] = useState('R$ 0,00');
  const [temBeneficios, setTemBeneficios] = useState('nao'); 
  const [regime, setRegime] = useState('mei');
  
  // usestates dos beneficios
  const [valeTransporte, setValeTransporte] = useState('R$ 0,00');
  const [valeRefeicao, setValeRefeicao] = useState('R$ 0,00');
  const [planoSaude, setPlanoSaude] = useState('R$ 0,00');
  const [outrosBeneficios, setOutrosBeneficios] = useState('R$ 0,00');

  // usestate mensagem erro
  const [errorMessage, setErrorMessage] = useState('');

  // --- Funções Auxiliares ---

  const parseCurrency = (strValue) => {
    return parseFloat(strValue.replace(/\D/g, "")) / 100;
  };

  const formatCurrency = (value) => {
    const onlyDigits = value.replace(/\D/g, "");
    if (onlyDigits === "") return "R$ 0,00";
    const numberValue = parseFloat(onlyDigits) / 100;
    return numberValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleCurrencyInput = (setter) => (e) => {
    const formatted = formatCurrency(e.target.value);
    setter(formatted);
    if (errorMessage) setErrorMessage('');
  };

  // --- Validação e Submit ---
  const handleComparar = () => {
    const valorNumerico = parseCurrency(valorBruto);

    // Validação de valores
    if (!valorNumerico || valorNumerico === 0) {
      setErrorMessage("EXISTEM VALORES INSERIDOS INCORRETAMENTE.");
      return;
    }

    setErrorMessage('');
    alert(`Tudo certo! Calculando para R$ ${valorBruto}...`);
  };

  return (
    <div className="page-background">
      <div className="main-card">
        
        {/* Lado Esquerdo */}
        <div className="left-panel">
          <h1>COMPARADOR<br />CLT x PJ</h1>
          <p>
            Tomar a decisão certa na hora de contratar faz toda a diferença para a saúde financeira 
            do seu negócio. O <em>Comparador CLT x PJ</em> oferece uma visão clara e prática.
          </p>
        </div>

        {/* Lado Direito */}
        <div className="right-panel">
          
          {/* Notificação de Erro*/}
          {errorMessage && (
            <div className="error-alert fade-in-down">
              <button className="close-btn" onClick={() => setErrorMessage('')}>X</button>
              <strong>{errorMessage}</strong>
              <span>Verifique os valores preenchidos para você obter um resultado eficiente!</span>
            </div>
          )}

          <div className="form-content">
            <h2>COMPARADOR CLT x PJ</h2>
            
            <div className="form-body-row">
              {/* Coluna */}
              <div className="col-inputs">
                <div className="form-group">
                  <label htmlFor="valorBruto">
                    Valor Mensal Bruto 
                    <span className="info-icon">
                      ⓘ
                      <span className="tooltip-box">
                        Para CLT, será considerado como “salário”. <br/>
                        Para PJ, será considerado como “faturamento”.
                      </span>
                    </span>
                  </label>
                  <input 
                    type="text" 
                    id="valorBruto" 
                    value={valorBruto}
                    onChange={handleCurrencyInput(setValorBruto)}
                    className={`input-pill ${errorMessage ? 'input-error' : ''}`}
                    placeholder="R$ 0,00"
                  />
                </div>

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
                  <div className="checkbox-wrapper">
                    <label className={`checkbox-item ${temBeneficios === 'sim' ? 'active-check' : ''}`}>
                      <input 
                        type="checkbox" 
                        checked={temBeneficios === 'sim'} 
                        onChange={() => setTemBeneficios('sim')}
                      /> Sim
                    </label>
                    <label className={`checkbox-item ${temBeneficios === 'nao' ? 'active-check' : ''}`}>
                      <input 
                        type="checkbox" 
                        checked={temBeneficios === 'nao'} 
                        onChange={() => setTemBeneficios('nao')}
                      /> Não
                    </label>
                  </div>
                </div>

                {temBeneficios === 'sim' && (
                  <div className="benefits-container fade-in">
                    <div className="sub-input-group">
                      <label>Vale-transporte:</label>
                      <input type="text" value={valeTransporte} onChange={handleCurrencyInput(setValeTransporte)} className="input-sub"/>
                    </div>
                    <div className="sub-input-group">
                      <label>Vale-refeição/alimentação:</label>
                      <input type="text" value={valeRefeicao} onChange={handleCurrencyInput(setValeRefeicao)} className="input-sub"/>
                    </div>
                    <div className="sub-input-group">
                      <label>Plano de Saúde:</label>
                      <input type="text" value={planoSaude} onChange={handleCurrencyInput(setPlanoSaude)} className="input-sub"/>
                    </div>
                    <div className="sub-input-group">
                      <label>Outros:</label>
                      <input type="text" value={outrosBeneficios} onChange={handleCurrencyInput(setOutrosBeneficios)} className="input-sub"/>
                    </div>
                  </div>
                )}

                <button className="btn-action" onClick={handleComparar}>
                  COMPARAR
                </button>
              </div>

              {/*Radios */}
              <div className="col-radios">
                <div className="form-group">
                  <label className="label-destaque">Registro/Tributação para Comparação:</label>
                  <div className="radio-group">
                    <label className={`radio-box ${regime === 'mei' ? 'selected' : ''}`}>
                      <div className="radio-control">
                        <input type="radio" name="regime" value="mei" checked={regime === 'mei'} onChange={(e) => setRegime(e.target.value)}/>
                      </div>
                      <div className="radio-text">
                        <strong>MEI (Microempreendedor Individual)</strong>
                        <span>— Sem custos adicionais</span>
                      </div>
                    </label>

                    <label className={`radio-box ${regime === 'simples' ? 'selected' : ''}`}>
                      <div className="radio-control">
                        <input type="radio" name="regime" value="simples" checked={regime === 'simples'} onChange={(e) => setRegime(e.target.value)}/>
                      </div>
                      <div className="radio-text">
                        <strong>Pessoa Simples Nacional</strong>
                        <span>— IRPJ/CSLL/PIS/COFINS: 6,00%</span>
                      </div>
                    </label>

                    <label className={`radio-box ${regime === 'presumido' ? 'selected' : ''}`}>
                      <div className="radio-control">
                        <input type="radio" name="regime" value="presumido" checked={regime === 'presumido'} onChange={(e) => setRegime(e.target.value)}/>
                      </div>
                      <div className="radio-text">
                        <strong>Lucro Presumido</strong>
                        <span>— IRPJ/CSLL/PIS/COFINS: 11,33%</span>
                        <span>— Lucro Imobiliário</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;