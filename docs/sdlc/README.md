# 📚 Sistema de Documentación SDLC (Software Development Life Cycle)
## ConsigueTuVisa.com — Engineering & Product Documentation Framework

Este directorio alberga la documentación formal de ingeniería de software y gestión de producto del ecosistema **ConsigueTuVisa.com** y su integración operativa con **`erp_worldclass_v2`**, estructurada según las fases canónicas del SDLC.

---

## 🗂️ Mapa de Fases del SDLC

```
docs/sdlc/
├── 00_product/                 # 👑 Visión de Negocio, PRD v2.0, Funnel y Estrategia (Product Owner)
├── 01_requirements/            # 📋 Especificación de Requisitos de Software (SRS) y User Stories
├── 02_design/                  # 🎨 UX (User Journeys, Wireframes) y UI (Design System, Tokens)
├── 03_architecture/            # 🏛️ C4 Architecture, Modelo de Datos (ERD), ADRs y Contratos API
├── 04_implementation/          # 💻 Estándares de Código (SOLID/DRY), Guía de Onboarding y RAG AI
├── 05_testing/                 # 🧪 Estrategia de Pruebas (Unitarias, Integración, Pentesting)
├── 06_deployment/              # 🚀 Ambientes (Local/Test/Prod), Cloudflare Edge y Vercel CI/CD
└── 07_operations/              # ⚙️ Observabilidad (Deep Health Check), Runbooks y Disaster Recovery
```

---

## 🧭 Índice Rápido de Documentos Clave

| Fase | Documento Principal | Descripción |
| :--- | :--- | :--- |
| **00. Producto** | [`PRD-v2.0-ecosystem.md`](./00_product/PRD-v2.0-ecosystem.md) | Documento de Requisitos de Producto del Ecosistema Integral. |
| **03. Arquitectura** | [`c4-system-architecture.md`](./03_architecture/) | Arquitectura C4 del Front-Office y Back-Office ERP. |
| **03. Arquitectura** | [`ADR-001`](./03_architecture/adrs/) | Registros de Decisiones de Arquitectura de Software. |
| **05. Testing** | [`security-pentest-audit.md`](./05_testing/) | Plan de Auditoría de Seguridad y Pentesting. |
| **06. Despliegue** | [`environments-matrix.md`](./06_deployment/) | Matriz de variables y separación Testing vs Producción. |
| **07. Operaciones** | [`observability-health.md`](./07_operations/) | Guía técnica del Deep Health Check y SWR Cache. |
