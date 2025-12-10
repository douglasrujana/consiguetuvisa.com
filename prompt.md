Responde en español y asume los siguientes roles:
- Ingeniero de producto
- Diseñador web
- Especialista en marketing
- Arquitecto de software
- Desarrollador senior fullstack
- Ingeniero de DevOps / QA

Enfoque: Incremental 
Prioridad: MVP 

Contexto:
Estoy construyendo un copiloto de chatbot RAG para una página de asesoría de visas. 
El stack definido es: Frontend con Astro 5 (runas) + Svelte + Tailwind (Sitem design) + shadcn-svelte, Backend con Vercel SDK, Base de datos Turso con soporte vectorial, Gemini LLM para generación y embeddings, y LlamaIndex como orquestador RAG. 
Todo debe ser ágil, práctico, reproducible y fácil de mantener, usando opciones free forever donde aplique.

Caso de uso:
El chatbot debe responder preguntas sobre requisitos de visas, procesos consulares y documentación, citando fuentes oficiales y ofreciendo un flujo claro de pasos. 
Debe capturar leads (CRM HubSpot), enviar checklists por email (Resend), y escalar a humano en casos complejos.

Producto y visión:
- Producto: Copiloto RAG especializado en asesoría de visas.
- Visión: Ser un asistente confiable, transparente y actualizado que guíe al usuario paso a paso, con citas oficiales y opciones de contacto humano.
- Valores: claridad, confianza, cumplimiento legal, experiencia ágil.

Reglas:
1. Siempre citar fuentes oficiales con fecha y URL.
2. No inventar información ni dar consejos ilegales.
3. Pedir aclaraciones si falta contexto (país, tipo de visa, motivo).
4. Responder en formato estructurado: requisitos, pasos, tiempos, costos, enlaces.
5. Redactar en lenguaje claro, accesible y neutral.
6. Proteger datos sensibles (PII) y aplicar moderación.

Requisitos:
- Ingesta de documentos oficiales con chunking semántico y metadatos (país, visa, fecha).
- Embeddings con Gemini y almacenamiento en Turso.
- Recuperación con similarity search + filtros.
- Generación con Gemini LLM y system prompt estricto.
- CRM y email integrados.
- Observabilidad mínima: métricas de precisión, latencia, costos y feedback.

Requistos No funcionales:
- Seguir estrictamente, estructuradamente la arquitectura Clean Architecture del sistema variante feature
- crear las migraciones y seed de peubas para ambiente de desarrollo 

Diseño:
- Chat web accesible y minimalista.
- Captura de contexto inicial (país, tipo de visa, motivo).
- Respuestas con secciones claras y botones de acción (enviar checklist, agendar consulta).
- Branding sobrio y confiable.

Stack:
- Frontend: Astro + Svelte + Tailwind + shadcn-svelte.
- Backend: Vercel SDK (API routes).
- DB: Turso con vectores.
- LLM: Gemini (generación + embeddings).
- Orquestación: LlamaIndex.
- CRM: HubSpot.
- Email: Resend.

Testing:
- Unit tests: parsing y chunking de documentos.
- Eval dataset: preguntas frecuentes por país/visa con respuestas esperadas.
- Métricas: precision@k, citation coverage, latencia.
- Smoke tests: prompts básicos y recuperación.

Deploy:
- CI/CD en Vercel con entornos dev, preview y prod.
- Variables .env gestionadas y auditadas.
- Canary release y rollback automático.

Operación:
- Cron jobs para revalidar documentos y re-indexar.
- Backups semanales de Turso y Storage.
- Alertas de latencia, contradicciones y tasa de “no encontrado”.

Monitoreo:
- OpenTelemetry para trazas y métricas.
- Panel simple con recall@k, costo por conversación y ratio de handoff a humano.
- Feedback del usuario (thumbs up/down).
- Auditoría de prompts y decisiones de recuperación.

Instrucciones finales:
Cada rol debe dar su visión inicial del proyecto, identificar vacíos de información, proponer hipótesis razonables, y sugerir preguntas clave al cliente. 
Al final, entrega un resumen holístico con:
- Mapa del proyecto
- Riesgos y oportunidades
- Checklist de información faltante