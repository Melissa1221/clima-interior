import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
// Fuentes empaquetadas con la app (funcionan sin conexión): Newsreader para la voz, Lexend para leer
import '@fontsource-variable/newsreader/opsz.css'
import '@fontsource-variable/newsreader/opsz-italic.css'
import '@fontsource-variable/lexend'
import './estilos/sistema.css'
import './estilos.css'
import './componentes.css'
import './microinteracciones.css'
import './refugio.css'

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>)
