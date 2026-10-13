# Arquitectura (modelo C4)

Los diagramas usan la notación C4 de Mermaid, que GitHub muestra directamente.
Las partes marcadas como **(siguiente avance)** están diseñadas pero todavía no están en el código.

## Nivel 1: contexto

Quién usa Clima Interior y con qué sistemas externos se comunica.

```mermaid
C4Context
  title Clima Interior: diagrama de contexto
  Person(usuario, "Usuario", "Persona que registra cómo fue su día. Incluye usuarios con discapacidad visual, auditiva, motora y neurodivergentes.")
  Person(psicologa, "Psicóloga o terapeuta", "Recibe el resumen que el usuario decide exportar.")
  Person(amigos, "Participantes de una sala", "Comparten solo los parámetros del clima, con seudónimo.")
  System(clima, "Clima Interior", "PWA: check-in por voz, paisaje generativo, emociones propuestas por IA, historial y salas.")
  System_Ext(llm, "Proveedor de LLM", "API remota (Claude, Gemini) u Ollama local.")
  System_Ext(stt, "Voz del dispositivo", "Web Speech API para STT y TTS.")
  System_Ext(supa, "Supabase", "Salas en tiempo real y sincronización (siguiente avance).")
  System_Ext(lineas, "Líneas de ayuda", "113 op. 5, SAMU 106, PNP 105. La app solo muestra los números.")

  Rel(usuario, clima, "Cuenta su día, elige emociones, ve su cielo")
  Rel(clima, psicologa, "Resumen exportado por el usuario")
  Rel(amigos, clima, "Ven el clima colectivo")
  Rel(clima, llm, "Texto confirmado → emociones propuestas y reflexión")
  Rel(clima, stt, "Audio → texto / texto → voz")
  Rel(clima, supa, "Parámetros numéricos del clima")
  Rel(usuario, lineas, "Llama si lo decide")
```

## Nivel 2: contenedores

```mermaid
C4Container
  title Clima Interior: contenedores
  Person(usuario, "Usuario")
  System_Boundary(app, "Clima Interior") {
    Container(pwa, "PWA", "React + Vite", "Interfaz, paisaje, voz y flujo del check-in.")
    Container(sw, "Service worker", "Workbox", "Caché offline de la app, los datos demo y los recursos de crisis.")
    ContainerDb(local, "Perfil local", "localStorage → IndexedDB", "Registros, preferencias y ritmo. El audio no se guarda.")
    Container(proxy, "Proxy LLM", "Función serverless", "Guarda la clave de la API remota (siguiente avance).")
  }
  System_Ext(llm, "LLM", "Claude / Gemini / Ollama")
  System_Ext(supa, "Supabase Realtime", "Salas (siguiente avance)")

  Rel(usuario, pwa, "Usa", "navegador o app instalada")
  Rel(pwa, sw, "Pide recursos")
  Rel(pwa, local, "Lee y escribe el perfil")
  Rel(pwa, proxy, "Relato confirmado", "HTTPS")
  Rel(proxy, llm, "Prompt con el relato delimitado", "HTTPS")
  Rel(pwa, llm, "Directo si es Ollama local", "HTTP localhost")
  Rel(pwa, supa, "Solo números + seudónimo", "WebSocket/TLS")
```

## Nivel 3: componentes de la PWA

```mermaid
flowchart LR
  subgraph UI["Interfaz (src/App.jsx)"]
    inicio["Elegir clima"] --> contar["Contarlo (voz o texto)"]
    contar --> emociones["Nubes de emociones"]
    emociones --> guardado["Día guardado"]
    inicio --> semana["Historial 30 días"]
  end
  contar --> riesgo["Detector de riesgo<br/>src/datos/riesgo.js"]
  riesgo -- "hay riesgo" --> crisis["Pantalla 113 / 106 / 105"]
  riesgo -- "sin riesgo" --> llm["Capa LLM<br/>src/llm/index.js"]
  llm --> contrato["Contrato y validación<br/>src/llm/contrato.js"]
  llm --> prov["Proveedores<br/>mock · ollama · remoto"]
  contrato -- "respuesta inválida o >10 s" --> respaldo["Reflexión local"]
  contar --> voz["Voz<br/>src/voz/stt.js"]
  guardado --> perfil["Perfil persistente<br/>src/datos/perfil.js"]
```

## Decisiones de arquitectura

| Decisión | Por qué | Requerimientos |
|---|---|---|
| PWA y no una app nativa | Lo exige el proyecto. Se instala en el celular, funciona offline y no pasa por la tienda de apps | RF-19, RF-20 |
| Capa de abstracción del LLM con contrato común | Cambiar de proveedor es cambiar `VITE_LLM_PROVIDER`, sin tocar la interfaz | RF-18, RNF-22, RNF-23 |
| El detector de riesgo corre antes que el LLM y no depende de él | Si el modelo falla o se equivoca, la derivación igual aparece | RF-14, RNF-25 |
| El relato va delimitado en el prompt | El texto del diario es un dato, no una instrucción (inyección de prompts) | RNF-16 |
| La clave de la API vive en un proxy | Nunca se expone en el navegador | RNF-15 |
| El audio no se guarda; el perfil vive en el dispositivo | Privacidad de datos emocionales | RNF-11, RNF-12 |
| Las salas comparten solo números y seudónimos | Nadie ve el diario de otra persona | RF-27, RNF-13, RNF-14 |
