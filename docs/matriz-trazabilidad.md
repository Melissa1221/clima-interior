# Matriz de trazabilidad

44 RF, 32 RNF y 32 historias de usuario. Cada requerimiento tiene al menos una historia y cada historia cubre al menos un requerimiento.

**Prioridad (MoSCoW):** M = Must, S = Should, C = Could.

**Estado:** *Prototipado* = ya está en el prototipo de fidelidad media. *Pendiente* = definido, aún sin diseñar ni implementar.

| ID Req | Descripción del requerimiento | Tipo | Prioridad | Historia(s) de usuario que lo cubre(n) | ID HU | Estado | Evidencia / criterio de aceptación |
|---|---|---|---|---|---|---|---|
| RF-01 | Paisaje de 5 capas sin formularios | FR | M | Ver mi día como un paisaje | HU-01 | Pendiente | HU-01 Esc. 1: paisaje con 5 capas y sin `<form>` |
| RF-02 | Codificación no cromática | FR | S | Distinguir días sin color | HU-16 | Pendiente | HU-16 Esc. 1: diferencia en escala de grises |
| RF-03 | Descripción textual y hablada del paisaje | FR | M | Escuchar mi paisaje | HU-15 | Pendiente | HU-15 Esc. 1: anuncio del lector de pantalla |
| RF-04 | Sonificación del clima | FR | C | Escuchar mi paisaje | HU-15 | Pendiente | HU-15 Esc. 1: sonido asociado al clima |
| RF-05 | Check-in de 60 s con pausa y cierre sugerido | FR | M | Check-in hablado | HU-02 | Prototipado | HU-02 Esc. 1-2: sugerencia a 60 s, pausa sin pérdida |
| RF-06 | Transcripción plegada bajo el paisaje ("Listo" / "Ver lo que entendí"); va al LLM solo tras confirmar | FR | M | Revisar lo que entendió | HU-03 | Prototipado | HU-03 Esc. 1: envío solo tras confirmar |
| RF-07 | Revisión si confianza STT < 0.75 | FR | S | Revisar lo que entendió | HU-03 | Pendiente | HU-03 Esc. 2: edición obligatoria |
| RF-08 | Entrada alternativa sin perder borrador | FR | M | Registrar sin hablar | HU-19 | Pendiente | HU-19 Esc. 1: borrador intacto al cambiar |
| RF-09 | TTS con subtítulos integrados | FR | S | Leer lo que dice el asistente | HU-17 | Pendiente | HU-17 Esc. 1 y 3 |
| RF-10 | Micrófono denegado con ruta alternativa | FR | M | Registrar sin hablar | HU-19 | Pendiente | HU-19 Esc. 2 |
| RF-11 | Indicador de micrófono y aviso de privacidad | FR | M | Check-in hablado | HU-02 | Prototipado | HU-02 Esc. 1: indicador en ≤200 ms |
| RF-12 | Emoción propuesta que el usuario confirma o corrige | FR | M | Confirmar o corregir la emoción | HU-04 | Prototipado | HU-04 Esc. 1-2 |
| RF-13 | Reflexión no clínica de máx. 2 frases, como subtítulo | FR | M | Reflexión breve | HU-05 | Prototipado | HU-05 Esc. 1: regenerar, omitir, simplificar |
| RF-14 | Detector de riesgo independiente y previo | FR | M | Ayuda si estoy en riesgo | HU-06 | Pendiente | HU-06 Esc. 1: sin reflexión ante riesgo |
| RF-15 | Pantalla de derivación 113 / 106 / 105 | FR | M | Ayuda si estoy en riesgo | HU-06 | Pendiente | HU-06 Esc. 1 y 3 |
| RF-16 | Filtro contra respuestas diagnósticas | FR | M | Reflexión breve | HU-05 | Pendiente | HU-05 Esc. 2-3 |
| RF-17 | Patrones con al menos 3 registros | FR | S | Ver patrones | HU-07 | Prototipado | HU-07 Esc. 1-2 |
| RF-18 | Adaptadores LLM / STT / TTS intercambiables | FR | M | Cambiar de proveedor | HU-25 | Pendiente | HU-25 Esc. 1 |
| RF-19 | PWA instalable | FR | M | Instalar y usar sin internet | HU-11 | Pendiente | HU-11 Esc. 1 |
| RF-20 | Check-in offline con cola | FR | S | Instalar y usar sin internet | HU-11 | Pendiente | HU-11 Esc. 2-3 |
| RF-21 | Perfil persistente | FR | M | Que se adapte a mí | HU-08 | Pendiente | HU-08 Esc. 2 |
| RF-22 | Paisaje y lenguaje que evolucionan | FR | S | Que se adapte a mí | HU-08 | Pendiente | HU-08 Esc. 1 |
| RF-23 | Control sobre la personalización | FR | S | Controlar lo que sabe de mí | HU-09 | Pendiente | HU-09 Esc. 1 |
| RF-24 | Ayuda contextual por paso | FR | M | Ayuda en el momento | HU-10 | Pendiente | HU-10 Esc. 1 |
| RF-25 | Pista proactiva a los 12 s | FR | C | Ayuda en el momento | HU-10 | Pendiente | HU-10 Esc. 2-3 |
| RF-26 | Salas con código que caduca | FR | M | Clima compartido anónimo | HU-12 | Pendiente | HU-12 Esc. 1 |
| RF-27 | Solo parámetros del clima con seudónimo | FR | M | Clima compartido anónimo | HU-12 | Pendiente | HU-12 Esc. 2-3 |
| RF-28 | Clima colectivo de la sala | FR | C | Clima compartido anónimo | HU-12 | Pendiente | HU-12 Esc. 1 |
| RF-29 | Moderación sin acceso a diarios | FR | S | Administrar mi sala | HU-13 | Pendiente | HU-13 Esc. 1-2 |
| RF-30 | Ritual de cierre | FR | S | Cerrar mi día con calma | HU-14 | Pendiente | HU-14 Esc. 1-2 |
| RF-31 | Paisaje que reacciona a la voz | FR | C | Ver mi día como un paisaje | HU-01 | Prototipado | HU-01 Esc. 2 |
| RF-32 | Modo movimiento reducido | FR | M | Paisaje que no haga daño | HU-21 | Pendiente | HU-21 Esc. 1-2 |
| RF-33 | Modo predecible | FR | S | Experiencia predecible | HU-20 | Pendiente | HU-20 Esc. 1 |
| RF-34 | Modo neutral y "no quiero profundizar" | FR | M | Un día en que no quiero profundizar | HU-22 | Pendiente | HU-22 Esc. 1-2 |
| RF-35 | Teclado, conmutador y comandos de voz | FR | M | Usar sin pantalla táctil | HU-18 | Pendiente | HU-18 Esc. 1-2 |
| RF-36 | Alertas visuales y hápticas | FR | S | Leer lo que dice el asistente | HU-17 | Pendiente | HU-17 Esc. 2 |
| RF-37 | Edad y consentimiento granular | FR | M | Decidir qué datos autorizo | HU-23 | Pendiente | HU-23 Esc. 1 |
| RF-38 | Exportar para psicóloga y eliminar datos | FR | S | Resumen o borrar todo | HU-24 | Prototipado | HU-24 Esc. 1-3 |
| RF-39 | Demo de 30 días simulados | FR | M | Evaluar el MVP | HU-26 | Pendiente | HU-26 Esc. 1 |
| RF-40 | Check-in rápido: elegir 1 de 5 climas primero; contarlo es opcional | FR | M | Registrar mi día sin hablar | HU-28 | Prototipado | HU-28 Esc. 1-2 |
| RF-41 | Emociones como nubes tocables, con equivalente en botones accesibles | FR | S | Elegir mis emociones tocando nubes | HU-29 | Prototipado | HU-29 Esc. 1-2 |
| RF-42 | "1 minuto de lluvia para respirar", opcional | FR | S | Calmarme un minuto con la lluvia | HU-30 | Prototipado | HU-30 Esc. 1-3 |
| RF-43 | "Tu cielo de la semana" con patrón descriptivo | FR | S | Ver mi semana sin culpa | HU-31 | Prototipado | HU-31 Esc. 1 |
| RF-44 | Paisaje del día como fondo de pantalla, solo si el usuario lo pide | FR | C | Llevar mi clima fuera de la app | HU-32 | Prototipado | HU-32 Esc. 1-2 |
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
| RNF-31 | Check-in sin relato en ≤10 s y ≤2 acciones | NFR | M | Registrar mi día sin hablar | HU-28 | Prototipado | HU-28 Esc. 1: conteo E2E |
| RNF-32 | 0 mensajes de racha perdida o culpa | NFR | S | Ver mi semana sin culpa | HU-31 | Prototipado | HU-31 Esc. 2: revisión de cadenas |
