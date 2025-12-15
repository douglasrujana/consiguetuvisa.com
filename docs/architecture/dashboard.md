/admin
├── /                    → Dashboard principal (KPIs, resumen)
├── /usuarios            → UsersCrud (ya existe)
├── /solicitudes         → AdminDashboard solicitudes (ya existe)
├── /knowledge           → 🆕 Knowledge Base Manager
│   ├── Sources (CRUD)
│   ├── Documents (lista, ingestar, eliminar)
│   └── Búsqueda semántica (probar queries)
├── /alertas             → 🆕 Centro de Alertas
│   ├── Pendientes
│   ├── Historial
│   └── Configuración
├── /chat                → 🆕 Gestión de Chatbot
│   ├── Conversaciones recientes
│   ├── Métricas (mensajes/día, temas frecuentes)
│   └── Configuración RAG
└── /config              → Configuración general
    ├── Storage
    └── Integraciones
