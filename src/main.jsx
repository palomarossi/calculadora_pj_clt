import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Procura pelo container usando o atributo obrigatório
const widgetContainer = document.querySelector('[data-pj-clt-widget]');

if (widgetContainer) {
  ReactDOM.createRoot(widgetContainer).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
} else {
  console.error('Widget PJxCLT: Container [data-pj-clt-widget] não encontrado.');
}
