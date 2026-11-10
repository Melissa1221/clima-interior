# Arquitectura (modelo C4)

Los diagramas usan la notación C4 de Mermaid, que GitHub muestra directamente.
Las partes marcadas como **(pendiente)** están diseñadas pero todavía no están en el código.

## Nivel 1: contexto

Quién usa Clima Interior y con qué sistemas externos se comunica.

```mermaid
C4Context
  title Clima Interior: diagrama de contexto
  Person(usuario, "Usuario", "Persona que registra cómo fue su día. Incluye usuarios con discapacidad visual, auditiva, motora y neurodivergentes.")
  Person(psicologa, "Psicóloga o terapeuta", "Recibe el resumen que el usuario decide exportar.")
  Person(amigos, "Participantes de una sala", "Comparten solo los parámetros del clima, con seudónimo.")
  System(clima, "Clima Interior", "PWA con relé de salas: check-in por voz, paisaje, emociones propuestas por IA, perfil que aprende, historial y salas.")
  System_Ext(llm, "Proveedor de LLM", "Groq, Gemini, API remota por proxy u Ollama local.")
  System_Ext(stt, "Voz del dispositivo", "Web Speech API para STT y TTS.")
  System_Ext(lineas, "Líneas de ayuda", "113 op. 5, SAMU 106, PNP 105. La app solo muestra los números.")

  Rel(usuario, clima, "Usa")
  Rel(clima, psicologa, "Resumen")
  Rel(amigos, clima, "Ven la sala")
  Rel(clima, llm, "Relato")
  Rel(clima, stt, "STT / TTS")
  Rel(usuario, lineas, "Llama")
  UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

## Nivel 2: contenedores

```mermaid
C4Container
  title Clima Interior: contenedores
  Person(usuario, "Usuario")
  System_Boundary(app, "Clima Interior") {
    Container(pwa, "PWA", "React + Vite", "Interfaz, paisaje, voz y flujo del check-in.")
    Container(sw, "Service worker", "Workbox", "Caché offline de la app, los datos demo y los recursos de crisis.")
    ContainerDb(local, "Perfil local", "localStorage", "Registros, preferencias, ritmo, lo aprendido y el motivo de cada cambio. El audio no se guarda.")
    Container(rele, "Relé de salas", "Node.js + ws (server/salas.mjs)", "Reenvía mensajes numéricos entre quienes tienen el mismo código. No guarda diarios; borra la sala al cerrarla o a las 24 h.")
    Container(proxy, "Proxy LLM", "Función serverless", "Guarda la clave de la API remota (pendiente).")
  }
  System_Ext(llm, "LLM", "Groq / Gemini / Claude / Ollama")

  Rel(usuario, pwa, "Usa", "navegador o app instalada")
  Rel(pwa, sw, "Pide recursos")
  Rel(pwa, local, "Lee y escribe el perfil")
  Rel(pwa, proxy, "Relato", "HTTPS")
  Rel(proxy, llm, "Prompt", "HTTPS")
  Rel(pwa, llm, "Ollama local", "HTTP")
  Rel(pwa, llm, "Groq o Gemini (demo)", "HTTPS")
  Rel(pwa, rele, "Clima en números", "WebSocket")
  UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

## Nivel 3: componentes de la PWA

```mermaid
flowchart LR
  subgraph UI["Interfaz (src/App.jsx)"]
    inicio["Elegir clima"] --> contar["Contarlo (voz o texto)"]
    contar --> emociones["Nubes de emociones"]
    emociones --> guardado["Día guardado"]
    inicio --> semana["Historial 30 días"]
    inicio --> tu["Lo que sé de ti<br/>src/pantallas/Perfil.jsx"]
    inicio --> salaUI["Sala compartida<br/>src/pantallas/Sala.jsx"]
  end
  contar --> riesgo["Detector de riesgo<br/>src/datos/riesgo.js"]
  riesgo -- "hay riesgo" --> crisis["Pantalla 113 / 106 / 105"]
  riesgo -- "sin riesgo" --> llm["Capa LLM<br/>src/llm/index.js"]
  llm --> contrato["Contrato y validación<br/>src/llm/contrato.js"]
  llm --> prov["Proveedores<br/>mock · gemini · groq · ollama · remoto"]
  contrato -- "respuesta inválida o >10 s" --> respaldo["Reflexión local"]
  contar --> voz["Voz<br/>src/voz/stt.js"]
  guardado --> perfil["Perfil persistente que aprende<br/>src/datos/perfil.js"]
  perfil -- "emociones tuyas, frases cortas" --> emociones
  perfil -- "solo preferencias, nunca el diario" --> llm
  tu --> perfil
  salaUI --> logica["Lógica de la sala<br/>src/salas/sala.js"]
  logica --> esquema["Esquema numérico<br/>src/salas/mensaje.js"]
  logica --> transp["Transporte<br/>src/salas/transporte.js"]
  transp -- "sin servidor" --> bc["BroadcastChannel<br/>(pestañas del navegador)"]
  transp -- "VITE_SALAS_URL" --> ws["Relé WebSocket<br/>server/salas.mjs"]
  ws --> esquema
```

## Decisiones de arquitectura

| Decisión | Por qué | Requerimientos |
|---|---|---|
| PWA y no una app nativa | Lo exige el proyecto. Se instala en el celular, funciona offline y no pasa por la tienda de apps | RF-19, RF-20 |
| Capa de abstracción del LLM con contrato común | Cambiar de proveedor es cambiar `VITE_LLM_PROVIDER`, sin tocar la interfaz | RF-18, RNF-22, RNF-23 |
| El detector de riesgo corre antes que el LLM y no depende de él | Si el modelo falla o se equivoca, la derivación igual aparece | RF-14, RNF-25 |
| El relato va delimitado en el prompt | El texto del diario es un dato, no una instrucción (inyección de prompts) | RNF-16 |
| En producción la clave de la API vive en un proxy (`remoto`) | Nunca se expone en el navegador. Los proveedores `groq` y `gemini` leen la clave del `.env` y son solo para la demo local | RNF-15 |
| El audio no se guarda; el perfil vive en el dispositivo | Privacidad de datos emocionales | RNF-11, RNF-12 |
| Las salas comparten solo números y seudónimos | Nadie ve el diario de otra persona. El esquema se valida en el navegador y otra vez en el relé | RF-27, RNF-13, RNF-14 |
| El relé decide quién creó la sala y fija la identidad de cada conexión | Un invitado no puede expulsar ni cerrar, ni hablar en nombre de otro | RF-29, RNF-15 |
| El transporte de las salas es intercambiable, como la capa LLM | La sala funciona sin servidor en la demo y entre dispositivos con el relé, sin tocar la interfaz | RF-26 |
| La personalización anota el motivo de cada cambio y se puede apagar | La persona entiende y controla lo que la app aprendió | RF-22, RF-23 |
