## Arquitectura, ecosistema multi-agente
[ Usuario ]
    |
    v
[ Chatbot RAG (Agente Conversacional) ]
    |
    +--> [Agente de Ingesta] ----> [Turso DB + Gemini Embeddings]
    +--> [Agente de Monitoreo] ---> [Métricas / Alertas]
    +--> [Agente de Automatización] -> [Resend + HubSpot]
    +--> [Agente de Recomendación] -> [Acciones sugeridas]

