# Matriz de trazabilidad — Clima Interior (PC2, avance 1)

Esta es la matriz de la LEC06 actualizada con el diseño mejorado de la LEC07 (CU-01', SCAMPER) y con el estado real del avance.
Tiene el formato que pide el enunciado: ID, descripción, tipo, prioridad, historia que lo cubre, ID de la historia, estado y evidencia o criterio de aceptación.

**Totales:** 44 RF, 32 RNF y 32 historias de usuario. Un script cruza la línea "Cubre" de cada historia con la matriz y no encontró huecos: cada requerimiento tiene al menos una historia y cada historia cubre al menos un requerimiento.

**Prioridad (MoSCoW):** **M** = Must (42), **S** = Should (29), **C** = Could (5).

**Estado:**
- **Prototipado:** aparece en el prototipo de fidelidad media en Figma, CU-01' (15 requerimientos). La evidencia indica la pantalla:
  1. Elegir el clima.
  2. Contarlo.
  3. Las nubes, la reflexión y la respiración.
  4. Tu cielo de la semana.
- **Pendiente:** está definido y tiene historia, pero todavía no está diseñado ni implementado.

## Qué cambió respecto de la LEC06

**Requerimientos nuevos.** Salen de las alternativas SCAMPER de la LEC07:

| ID | Requerimiento | Paso SCAMPER |
|---|---|---|
| RF-40 | El check-in empieza eligiendo uno de 5 climas (soleado, nublado, lluvia, tormenta, niebla). Después el usuario decide si lo cuenta ("Contarlo") o no ("Así está bien") | Reordenar / invertir |
| RF-41 | Las emociones propuestas aparecen como nubes dentro del paisaje: tocar una nube la acepta, "No es esto" la descarta y también está "No sé". Para teclado y lector de pantalla, cada nube es un botón con su nombre | Sustituir |
| RF-42 | Al cerrar el check-in, la app ofrece "1 minuto de lluvia para respirar": una respiración guiada al ritmo de la lluvia, que se puede saltar | Combinar |
| RF-43 | "Tu cielo de la semana" muestra los 7 paisajes en fila con un patrón descriptivo. Un día sin registro aparece como cielo despejado, no como una falla | Adaptar |
| RF-44 | El paisaje del día se puede descargar como fondo de pantalla, solo si el usuario lo pide y sin ningún texto del diario | Poner otros usos |
| RNF-31 | Un check-in sin relato toma 10 s o menos y 2 acciones o menos desde la pantalla inicial (conteo en prueba E2E) | Reordenar / invertir |
| RNF-32 | La app no muestra ningún mensaje de racha perdida ni de culpa (revisión automática de todas las cadenas de texto) | Adaptar |

**Requerimientos modificados.** Mantienen el ID y cambia la descripción:
- **RF-06:** la transcripción ya no tiene pantalla propia. Aparece plegada bajo el paisaje, con los botones "Listo" y "Ver lo que entendí". Se sigue enviando al LLM solo después de confirmar (Eliminar).
- **RF-13:** la reflexión se reduce a 2 frases como máximo y se muestra como subtítulo (Minimizar).

**Sobre la plataforma:** el enunciado exige una PWA (RF-19), así que no es una app nativa. Hay dos funciones que una PWA no puede dar igual en todos los celulares, y por eso se ajustaron:
- **Widgets:** una PWA no puede crearlos, así que RF-44 quedó como fondo de pantalla descargable.
- **Vibración:** no existe en Safari para iPhone. RF-36 se cumple con la vibración en Android y con una alerta visual en iPhone.

## Historias de usuario nuevas

**HU-28: Registrar mi día sin hablar**\
Como usuario en un día sin energía para contar nada (ST-01), quiero registrar solo el clima de mi día, para no romper el hábito.

- *Escenario 1: camino rápido.* **Dado** que abro la app, **cuando** elijo "Nublado" y toco "Así está bien", **entonces** el registro se guarda con ese clima en 10 s o menos **y** no se llama al LLM.
- *Escenario 2: quiero contarlo.* **Dado** que elegí un clima, **cuando** toco "Contarlo", **entonces** empieza el check-in hablado **y** el paisaje parte del clima que elegí.

Cubre: RF-40, RNF-31.

**HU-29: Elegir mis emociones tocando nubes**\
Como persona que no sabe bien qué siente (ST-01), quiero que las emociones propuestas aparezcan como nubes que puedo tocar, para confirmarlas sin sentir que lleno un formulario.

- *Escenario 1: toco las mías.* **Dado** que la app propone cuatro emociones, **cuando** toco "Cansancio" y "Ansiedad" y continúo, **entonces** las dos quedan como emociones declaradas **y** las otras se descartan.
- *Escenario 2: lector de pantalla.* **Dado** que uso TalkBack o VoiceOver, **cuando** llego a las emociones, **entonces** cada nube se anuncia como un botón con su nombre y su estado (marcada o no marcada).

Cubre: RF-41.

**HU-30: Calmarme un minuto con la lluvia**\
Como usuario que termina el check-in con ansiedad (ST-01), quiero una respiración guiada corta, para sentirme mejor en ese momento y no solo registrar.

- *Escenario 1: lo hago.* **Dado** que terminé mi check-in, **cuando** toco "1 minuto de lluvia para respirar", **entonces** la lluvia marca el ritmo de inhalar y exhalar durante 60 s **y** al terminar vuelvo al resumen.
- *Escenario 2: lo salto.* **Dado** que no quiero hacerlo, **cuando** toco "Saltar", **entonces** el registro se guarda igual **y** la app no vuelve a ofrecerlo ese día.
- *Escenario 3: movimiento reducido.* **Dado** que activé el movimiento reducido, **cuando** empiezo la respiración, **entonces** el ritmo se indica con texto y sonido, sin animación.

Cubre: RF-42.

**HU-31: Ver mi semana sin culpa**\
Como usuario (ST-01), quiero ver mis últimos 7 días como cielos, para notar patrones sin sentir que fallé los días que no registré.

- *Escenario 1: patrón.* **Dado** que tengo al menos 3 registros en la semana, **cuando** abro "Tu cielo de la semana", **entonces** veo los 7 paisajes en fila **y** un patrón descriptivo, por ejemplo "los lunes aparece más niebla".
- *Escenario 2: día sin registro.* **Dado** que el sábado no registré, **cuando** veo la semana, **entonces** ese día aparece como cielo despejado **y** ningún texto habla de rachas perdidas.

Cubre: RF-43, RNF-32.

**HU-32: Llevar mi clima fuera de la app**\
Como usuario (ST-01), quiero poner el paisaje del día como fondo de pantalla, para recordar cómo estoy sin abrir la app.

- *Escenario 1: lo pido.* **Dado** que estoy en "Tu cielo de la semana", **cuando** toco "Poner como fondo del día", **entonces** se descarga una imagen del paisaje **y** la imagen no contiene ningún texto de mi diario.
- *Escenario 2: no lo pido.* **Dado** que nunca toqué esa opción, **entonces** la app no genera imágenes ni notificaciones por su cuenta.

Cubre: RF-44.

## Matriz

| ID Req | Descripción del requerimiento | Tipo | Prioridad | Historia(s) de usuario que lo cubre(n) | ID HU | Estado | Evidencia / criterio de aceptación |
|---|---|---|---|---|---|---|---|
| RF-01 | Paisaje de 5 capas sin formularios | FR | M | Ver mi día como un paisaje | HU-01 | Pendiente | HU-01 Esc. 1: paisaje con 5 capas y sin `<form>` |
| RF-02 | Codificación no cromática | FR | S | Distinguir días sin color | HU-16 | Pendiente | HU-16 Esc. 1: diferencia en escala de grises |
| RF-03 | Descripción textual y hablada del paisaje | FR | M | Escuchar mi paisaje | HU-15 | Pendiente | HU-15 Esc. 1: anuncio del lector de pantalla |
| RF-04 | Sonificación del clima | FR | C | Escuchar mi paisaje | HU-15 | Pendiente | HU-15 Esc. 1: sonido asociado al clima |
| RF-05 | Check-in de 60 s con pausa y cierre sugerido | FR | M | Check-in hablado | HU-02 | Prototipado | HU-02 Esc. 1-2: sugerencia a 60 s, pausa sin pérdida · Figma pantalla 2 |
| RF-06 | Transcripción plegada bajo el paisaje ("Listo" / "Ver lo que entendí"); va al LLM solo tras confirmar | FR | M | Revisar lo que entendió | HU-03 | Prototipado | HU-03 Esc. 1: envío solo tras confirmar · Figma pantalla 2 |
| RF-07 | Revisión si confianza STT < 0.75 | FR | S | Revisar lo que entendió | HU-03 | Pendiente | HU-03 Esc. 2: edición obligatoria |
| RF-08 | Entrada alternativa sin perder borrador | FR | M | Registrar sin hablar | HU-19 | Pendiente | HU-19 Esc. 1: borrador intacto al cambiar |
| RF-09 | TTS con subtítulos integrados | FR | S | Leer lo que dice el asistente | HU-17 | Pendiente | HU-17 Esc. 1 y 3 |
| RF-10 | Micrófono denegado con ruta alternativa | FR | M | Registrar sin hablar | HU-19 | Pendiente | HU-19 Esc. 2 |
| RF-11 | Indicador de micrófono y aviso de privacidad | FR | M | Check-in hablado | HU-02 | Prototipado | HU-02 Esc. 1: indicador en ≤200 ms · Figma pantalla 2 |
| RF-12 | Emoción propuesta que el usuario confirma o corrige | FR | M | Confirmar o corregir la emoción | HU-04 | Prototipado | HU-04 Esc. 1-2 · Figma pantalla 3 |
| RF-13 | Reflexión no clínica de máx. 2 frases, como subtítulo | FR | M | Reflexión breve | HU-05 | Prototipado | HU-05 Esc. 1: regenerar, omitir, simplificar · Figma pantalla 3 |
| RF-14 | Detector de riesgo independiente y previo | FR | M | Ayuda si estoy en riesgo | HU-06 | Pendiente | HU-06 Esc. 1: sin reflexión ante riesgo |
| RF-15 | Pantalla de derivación 113 / 106 / 105 | FR | M | Ayuda si estoy en riesgo | HU-06 | Pendiente | HU-06 Esc. 1 y 3 |
| RF-16 | Filtro contra respuestas diagnósticas | FR | M | Reflexión breve | HU-05 | Pendiente | HU-05 Esc. 2-3 |
| RF-17 | Patrones con al menos 3 registros | FR | S | Ver patrones | HU-07 | Prototipado | HU-07 Esc. 1-2 · Figma pantalla 4 |
| RF-18 | Adaptadores LLM / STT / TTS intercambiables | FR | M | Cambiar de proveedor | HU-25 | Pendiente | HU-25 Esc. 1 |
| RF-19 | PWA instalable | FR | M | Instalar y usar sin internet | HU-11 | Pendiente | HU-11 Esc. 1 |
| RF-20 | Check-in offline con cola | FR | S | Instalar y usar sin internet | HU-11 | Pendiente | HU-11 Esc. 2-3 |
| RF-21 | Perfil persistente | FR | M | Que se adapte a mí | HU-08 | Pendiente | HU-08 Esc. 2 |
| RF-22 | Paisaje y lenguaje que evolucionan | FR | S | Que se adapte a mí | HU-08 | Pendiente | HU-08 Esc. 1 |
| RF-23 | Control sobre la personalización | FR | S | Controlar lo que sabe de mí | HU-09 | Pendiente | HU-09 Esc. 1 |
| RF-24 | Ayuda contextual por paso | FR | M | Ayuda en el momento | HU-10 | Pendiente | HU-10 Esc. 1 |
| RF-25 | Pista proactiva a los 12 s | FR | C | Ayuda en el momento | HU-10 | Pendiente | HU-10 Esc. 2-3 |
| RF-26 | Salas con código que caduca | FR | S | Clima compartido anónimo | HU-12 | Pendiente | HU-12 Esc. 1 |
| RF-27 | Solo parámetros del clima con seudónimo | FR | M | Clima compartido anónimo | HU-12 | Pendiente | HU-12 Esc. 2-3 |
| RF-28 | Clima colectivo de la sala | FR | C | Clima compartido anónimo | HU-12 | Pendiente | HU-12 Esc. 1 |
| RF-29 | Moderación sin acceso a diarios | FR | S | Administrar mi sala | HU-13 | Pendiente | HU-13 Esc. 1-2 |
| RF-30 | Ritual de cierre | FR | S | Cerrar mi día con calma | HU-14 | Pendiente | HU-14 Esc. 1-2 |
| RF-31 | Paisaje que reacciona a la voz | FR | C | Ver mi día como un paisaje | HU-01 | Prototipado | HU-01 Esc. 2 · Figma pantalla 2 |
| RF-32 | Modo movimiento reducido | FR | M | Paisaje que no haga daño | HU-21 | Pendiente | HU-21 Esc. 1-2 |
| RF-33 | Modo predecible | FR | S | Experiencia predecible | HU-20 | Pendiente | HU-20 Esc. 1 |
| RF-34 | Modo neutral y "no quiero profundizar" | FR | M | Un día en que no quiero profundizar | HU-22 | Pendiente | HU-22 Esc. 1-2 |
| RF-35 | Teclado, conmutador y comandos de voz | FR | M | Usar sin pantalla táctil | HU-18 | Pendiente | HU-18 Esc. 1-2 |
| RF-36 | Alertas visuales y hápticas | FR | S | Leer lo que dice el asistente | HU-17 | Pendiente | HU-17 Esc. 2 |
| RF-37 | Edad y consentimiento granular | FR | M | Decidir qué datos autorizo | HU-23 | Pendiente | HU-23 Esc. 1 |
| RF-38 | Exportar para psicóloga y eliminar datos | FR | S | Resumen o borrar todo | HU-24 | Prototipado | HU-24 Esc. 1-3 · Figma pantalla 4 |
| RF-39 | Demo de 30 días simulados | FR | M | Evaluar el MVP | HU-26 | Pendiente | HU-26 Esc. 1 |
| RF-40 | Check-in rápido: elegir 1 de 5 climas primero; contarlo es opcional | FR | M | Registrar mi día sin hablar | HU-28 | Prototipado | HU-28 Esc. 1-2 · Figma pantalla 1 |
| RF-41 | Emociones como nubes tocables, con equivalente en botones accesibles | FR | S | Elegir mis emociones tocando nubes | HU-29 | Prototipado | HU-29 Esc. 1-2 · Figma pantalla 3 |
| RF-42 | "1 minuto de lluvia para respirar", opcional | FR | S | Calmarme un minuto con la lluvia | HU-30 | Prototipado | HU-30 Esc. 1-3 · Figma pantalla 3 |
| RF-43 | "Tu cielo de la semana" con patrón descriptivo | FR | S | Ver mi semana sin culpa | HU-31 | Prototipado | HU-31 Esc. 1 · Figma pantalla 4 |
| RF-44 | Paisaje del día como fondo de pantalla, solo si el usuario lo pide | FR | C | Llevar mi clima fuera de la app | HU-32 | Prototipado | HU-32 Esc. 1-2 · Figma pantalla 4 |
| RNF-01 | ≥80% de check-ins en < 90 s | NFR | M | Check-in hablado | HU-02 | Pendiente | HU-02 Esc. 1 + telemetría |
| RNF-02 | Iniciar check-in en ≤3 acciones | NFR | S | Check-in hablado | HU-02 | Pendiente | HU-02 Esc. 1: conteo E2E |
| RNF-03 | Errores con causa, estado y siguiente acción | NFR | S | Check-in hablado; Registrar sin hablar | HU-02, HU-19 | Pendiente | HU-02 Esc. 3, HU-19 Esc. 2 |
| RNF-04 | WCAG 2.2 AA sin violaciones críticas | NFR | M | Escuchar mi paisaje | HU-15 | Pendiente | HU-15 Esc. 2: axe-core |
| RNF-05 | Contraste 4.5:1 / 3:1 | NFR | M | Distinguir días sin color | HU-16 | Pendiente | HU-16 Esc. 2 |
| RNF-06 | Controles 44×44 px y foco visible | NFR | M | Usar sin pantalla táctil | HU-18 | Pendiente | HU-18 Esc. 1 y 3 |
| RNF-07 | ≤3 destellos/s; animaciones ≤200 ms | NFR | M | Paisaje que no haga daño | HU-21 | Pendiente | HU-21 Esc. 2 |
| RNF-08 | Texto equivalente en < 1 s | NFR | M | Leer lo que dice el asistente | HU-17 | Pendiente | HU-17 Esc. 1 |
| RNF-09 | Zoom 200% y reflujo 320 px | NFR | S | Usar sin pantalla táctil | HU-18 | Pendiente | HU-18 Esc. 3 |
| RNF-10 | Modo predecible: ≤15 palabras/oración, ≤80 total | NFR | S | Experiencia predecible | HU-20 | Pendiente | HU-20 Esc. 2 |
| RNF-11 | El audio no se guarda | NFR | M | Decidir qué datos autorizo | HU-23 | Pendiente | HU-23 Esc. 2: buffer en 0 bytes |
| RNF-12 | Cero datos sensibles en logs y analítica | NFR | M | Decidir qué datos autorizo | HU-23 | Pendiente | HU-23 Esc. 2: escáner con canarios |
| RNF-13 | Mensajes de sala solo numéricos | NFR | M | Clima compartido anónimo | HU-12 | Pendiente | HU-12 Esc. 3 |
| RNF-14 | Seudónimos efímeros, borrado a 24 h, 128 bits | NFR | S | Clima compartido; Administrar sala | HU-12, HU-13 | Pendiente | HU-13 Esc. 3 |
| RNF-15 | TLS y aislamiento entre usuarios y salas | NFR | M | Administrar mi sala | HU-13 | Pendiente | HU-13 Esc. 2: 403 |
| RNF-16 | Resistencia a inyección de prompts | NFR | M | Cambiar de proveedor | HU-25 | Pendiente | HU-25 Esc. 3 |
| RNF-17 | ≥30 FPS con modo liviano automático | NFR | S | Ver mi día como un paisaje | HU-01 | Pendiente | HU-01 Esc. 3 |
| RNF-18 | LCP ≤2.5 s, INP ≤200 ms | NFR | S | Instalar y usar sin internet | HU-11 | Pendiente | HU-11 Esc. 1 |
| RNF-19 | Grabación ≤200 ms; LLM ≤10 s p95 | NFR | S | Check-in hablado | HU-02 | Pendiente | HU-02 Esc. 1 |
| RNF-20 | Funciones clave y recursos de crisis offline | NFR | M | Instalar y usar sin internet; Ayuda si estoy en riesgo | HU-11, HU-06 | Pendiente | HU-06 Esc. 2, HU-11 Esc. 2 |
| RNF-21 | Sincronización ordenada sin duplicados | NFR | S | Instalar y usar sin internet | HU-11 | Pendiente | HU-11 Esc. 3 |
| RNF-22 | Proveedor por variable `LLM_PROVIDER` | NFR | M | Cambiar de proveedor | HU-25 | Pendiente | HU-25 Esc. 1 |
| RNF-23 | Esquema común y reflexión local de respaldo | NFR | M | Cambiar de proveedor | HU-25 | Pendiente | HU-25 Esc. 2 |
| RNF-24 | 100% de respuestas sin diagnóstico | NFR | M | Reflexión breve | HU-05 | Pendiente | HU-05 Esc. 2 |
| RNF-25 | Derivación en ≤1 s sin contactar terceros | NFR | M | Ayuda si estoy en riesgo | HU-06 | Pendiente | HU-06 Esc. 1 y 3 |
| RNF-26 | Inferida nunca sobrescribe declarada | NFR | M | Confirmar o corregir la emoción | HU-04 | Pendiente | HU-04 Esc. 3 |
| RNF-27 | Accesibilidad no se usa para inferir riesgo | NFR | M | Controlar lo que sabe de mí | HU-09 | Pendiente | HU-09 Esc. 2 |
| RNF-28 | Rótulo "generado por IA" | NFR | S | Reflexión breve | HU-05 | Pendiente | HU-05 Esc. 1 |
| RNF-29 | Lenguaje neutro y jerga peruana | NFR | S | Que la app entienda cómo hablo | HU-27 | Pendiente | HU-27 Esc. 1-2 |
| RNF-30 | Demo en ≤2 s y restablecible | NFR | S | Evaluar el MVP | HU-26 | Pendiente | HU-26 Esc. 1-2 |
| RNF-31 | Check-in sin relato en ≤10 s y ≤2 acciones | NFR | M | Registrar mi día sin hablar | HU-28 | Prototipado | HU-28 Esc. 1: conteo E2E · Figma pantalla 1 |
| RNF-32 | 0 mensajes de racha perdida o culpa | NFR | S | Ver mi semana sin culpa | HU-31 | Prototipado | HU-31 Esc. 2: revisión de cadenas · Figma pantalla 4 |
