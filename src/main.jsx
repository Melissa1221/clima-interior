import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import '@fontsource-variable/atkinson-hyperlegible-next'
import '@fontsource-variable/fraunces/full.css'
import './estilos.css'
import './componentes.css'

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>)
