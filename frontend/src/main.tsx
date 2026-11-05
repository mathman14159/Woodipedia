import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles.css'

const root = document.getElementById('root')!
const application = (
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)

// Keep prerendered content and keyboard focus intact as React attaches behavior.
if (root.hasChildNodes()) ReactDOM.hydrateRoot(root, application)
else ReactDOM.createRoot(root).render(application)
