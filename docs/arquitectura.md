# Arquitectura (modelo C4)

Los diagramas usan la notación C4 de Mermaid, que GitHub muestra directamente.
Las partes marcadas como **(pendiente)** están diseñadas pero todavía no están en el código. El estado de cada requerimiento está en el [reporte de trazabilidad](reporte-trazabilidad.md).

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
    Container(pwa, "PWA", "React + Vite", "Primer uso, check-in por voz, paisaje, privacidad, exportar resumen y accesibilidad.")
    Container(sw, "Service worker", "Workbox", "Caché offline de la app, los datos demo y los recursos de crisis.")
    ContainerDb(local, "Perfil local", "localStorage → IndexedDB", "Registros, permisos, ajustes de accesibilidad, ritmo, lo aprendido y el motivo de cada cambio. El audio no se guarda.")
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
    bienvenida["Primer uso S01-S05<br/>edad · permisos · límites · ajustes"] --> inicio
    inicio --> antes["Antes de grabar (S07)"] --> contar
    inicio --> miperfil["Lo que sabe de mí (S40)<br/>aprendizaje, olvidar, motivo de cada cambio"]
    miperfil --> priv["Privacidad y datos (S42)"]
    priv --> exportar["Exportar PDF (S43-S44)"]
    priv --> borrar["Eliminar todo (S45)"]
    miperfil --> acc["Accesibilidad (S46-S49)"]
    inicio --> salaUI["Sala compartida<br/>src/pantallas/Sala.jsx"]
  end
  priv -- "permiso apagado" --> consent["Consentimiento<br/>src/datos/privacidad.js"]
  consent -.-> voz
  consent -.-> llm
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

## Despliegue

Cómo llega la PWA al dispositivo. La app es estática: no hay servidor propio ni base de datos; el perfil vive en el navegador de cada persona.

```mermaid
C4Deployment
  title Clima Interior: despliegue
  Deployment_Node(cdn, "Vercel", "CDN estática") {
    Container(estaticos, "Archivos estáticos", "dist/", "HTML, JS, CSS, fuentes, íconos, datos demo y manifiesto de la PWA.")
  }
  Deployment_Node(cel, "Dispositivo de la persona", "Android, iOS o escritorio") {
    Deployment_Node(nav, "Navegador", "Chrome, Edge o Safari") {
      Container(pwa, "PWA instalada", "React + Vite", "Se instala en la pantalla de inicio.")
      Container(sw, "Service worker", "Workbox", "Caché offline: app, fuentes, demo y recursos de crisis.")
      ContainerDb(local, "Perfil local", "localStorage", "Registros, permisos y ajustes. Nada sale sin permiso.")
    }
    Deployment_Node(ollama, "Ollama (opcional)", "localhost:11434") {
      Container(modelo, "Modelo local", "llama3.2", "Reflexión generada en el dispositivo.")
    }
  }
  Deployment_Node(prox, "Proxy LLM (opcional)", "Función serverless") {
    Container(proxy, "Proxy", "HTTPS", "Guarda la clave de la API remota.")
  }
  System_Ext(llm, "API del LLM", "Claude o Gemini")

  Rel(pwa, estaticos, "Primera visita y versiones nuevas", "HTTPS")
  Rel(pwa, sw, "Pide recursos")
  Rel(pwa, local, "Lee y escribe")
  Rel(pwa, modelo, "Relato, si el permiso de IA en internet está apagado", "HTTP")
  Rel(pwa, proxy, "Relato, solo con permiso de IA en internet", "HTTPS")
  Rel(proxy, llm, "Prompt", "HTTPS")
  UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

La versión pública usa el proveedor `mock` (sin claves). Una clave `VITE_GEMINI_API_KEY` se incrusta en el bundle y quedaría visible para cualquiera, por eso en producción la clave solo puede vivir en el proxy.

## Decisiones de arquitectura

| Decisión | Por qué | Requerimientos |
|---|---|---|
| PWA y no una app nativa | Lo exige el proyecto. Se instala en el celular, funciona offline y no pasa por la tienda de apps | RF-19, RF-20 |
| Capa de abstracción del LLM con contrato común | Cambiar de proveedor es cambiar `VITE_LLM_PROVIDER`, sin tocar la interfaz | RF-18, RNF-22, RNF-23 |
| El detector de riesgo corre antes que el LLM y no depende de él | Si el modelo falla o se equivoca, la derivación igual aparece | RF-14, RNF-25 |
| El relato va delimitado en el prompt | El texto del diario es un dato, no una instrucción (inyección de prompts) | RNF-16 |
| En producción la clave de la API vive en un proxy (`remoto`) | Nunca se expone en el navegador. Los proveedores `groq` y `gemini` leen la clave del `.env` y son solo para la demo local | RNF-15 |
| El audio no se guarda; el perfil vive en el dispositivo | Privacidad de datos emocionales | RNF-11, RNF-12 |
| Cada permiso es independiente y arranca apagado: sin permiso de internet el dictado solo corre en el dispositivo y la IA en la nube se reemplaza por el modelo local | Nada sale del teléfono antes del consentimiento correspondiente | RF-37, RNF-11 |
| El resumen para la psicóloga o el psicólogo se arma en el teléfono y nunca incluye lo que propuso la IA | La persona decide qué comparte y la IA no deja diagnósticos escritos | RF-38, RNF-24 |
| La versión pública es estática y sin claves | Un bundle de navegador no puede guardar secretos; el LLM remoto pasa por un proxy | RNF-15, RNF-22 |
| Las animaciones se apagan con «Movimiento reducido» o la preferencia del sistema | Sin destellos ni movimiento no esencial | RF-32, RNF-07 |
| Las salas comparten solo números y seudónimos | Nadie ve el diario de otra persona. El esquema se valida en el navegador y otra vez en el relé | RF-27, RNF-13, RNF-14 |
| El relé decide quién creó la sala y fija la identidad de cada conexión | Un invitado no puede expulsar ni cerrar, ni hablar en nombre de otro | RF-29, RNF-15 |
| El transporte de las salas es intercambiable, como la capa LLM | La sala funciona sin servidor en la demo y entre dispositivos con el relé, sin tocar la interfaz | RF-26 |
| La personalización anota el motivo de cada cambio y se puede apagar | La persona entiende y controla lo que la app aprendió | RF-22, RF-23 |
