
# 🧮 Calculadora CLT x PJ 

Uma ferramenta desenvolvida para comparar financeiramente os regimes de contratação **CLT** e **PJ**. 


🔗 **Demo Online:** [https://calculadora-pj-clt.vercel.app](https://calculadora-pj-clt.vercel.app)

---

## 📦 Como fazer o Build do Projeto

Se você baixou o código-fonte e deseja gerar os arquivos para colocar em produção:

### Pré-requisitos
- Node.js instalado (v18 ou superior recomendado).
- npm ou yarn.

### Passo a Passo

1. **Instalar as dependências:**
   ```bash
   npm install

2. **Gerar a versão de produção:**
   ```bash
   npm run build
---

3. **Localizar os arquivos:**
Após o build, os arquivos otimizados estarão na pasta `dist/`:
* `dist/assets/index-[hash].js` (Lógica do Widget)
* `dist/assets/index-[hash].css` (Estilos)



> **Nota:** O `[hash]` é um código aleatório gerado pelo Vite (ex: `index-a1b2c.js`) para evitar problemas de cache no navegador.

---

## 🛠️ Guia de Integração

O widget foi projetado para ser **agnóstico**. Ele não usa IDs globais (como `#root`), evitando conflitos com sites feitos em React, WordPress ou Wix. Utilizamos um **Data Attribute** para identificar onde o widget deve ser renderizado.

### 1. Hospedagem dos Arquivos

Copie os arquivos `.js` e `.css` da pasta `dist/assets` para o servidor do seu site (ex: pasta `/public` ou `/assets`).

### 2. Código HTML

Adicione o seguinte código à página onde deseja exibir a calculadora:

```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <link rel="stylesheet" href="/caminho/para/index-[hash].css" />
  </head>
  <body>
    
    <div data-pj-clt-widget></div>

    <script type="module" src="/caminho/para/index-[hash].js"></script>
    
  </body>
</html>

```

---

## 🎨 Customização de Layout

O widget é programado para ocupar **100% da largura** do elemento pai. Isso significa que você controla o tamanho dele através da `div` container, sem precisar mexer no código do React.

**Exemplo de uso em uma coluna estreita (Sidebar):**

```html
<style>
  .sidebar-widget {
    max-width: 400px; /* Define a largura máxima */
    margin: 0 auto;
    border: 1px solid #e1e1e1;
    border-radius: 8px;
    padding: 10px;
  }
</style>

<div class="sidebar-widget" data-pj-clt-widget></div>

```

---

## 🔧 Desenvolvimento Local

Para rodar o projeto em sua máquina e fazer alterações:

```bash
# Inicia o servidor de desenvolvimento com Hot Reload
npm run dev

# Pré-visualiza como ficará o build final
npm run build && npm run preview

```

---

## ⚠️ Notas Técnicas

* **Data Attribute:** O script busca pelo seletor `[data-pj-clt-widget]`. Certifique-se de que este atributo esteja presente na tag HTML alvo.
* **Isolamento:** O CSS do widget é razoavelmente isolado, mas herda as fontes (font-family) do site hospedeiro para manter a consistência visual da marca.
* **React:** O projeto é construído em React + Vite. Se for integrar em um site que já usa React, o widget funcionará como uma instância independente (Roots separados).

---

