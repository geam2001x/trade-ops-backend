# Trade Ops Backend

Backend `NestJS` del proyecto `Trade Operations Suite`.

## Estado

Scaffold inicial creado.
Base comun agregada:

- config
- database
- health

Base de identidad agregada:

- auth
- users
- roles

Primer modulo de negocio agregado:

- procurement

Segundo modulo de negocio agregado:

- shipments

Tercer modulo de negocio agregado:

- customs

Cuarto modulo de negocio agregado:

- inventory

Quinto modulo de negocio agregado:

- sales

Sexto modulo de negocio agregado:

- finance

Septimo modulo de negocio agregado:

- document-processing

## Objetivo

Servir como API central del sistema E2E para:

- autenticacion y usuarios
- compras e importacion
- procesamiento documental
- inventario por lote
- ventas retail y wholesale
- finanzas
- tipos de cambio
- dashboard y reportes

## Desarrollo local

```bash
cp .env.example .env
npm install
npm run start:dev
```

Endpoint base de salud:

```text
http://127.0.0.1:3000/api/health
```

Endpoints iniciales de negocio:

```text
POST   /api/procurement/orders
GET    /api/procurement/orders
GET    /api/procurement/orders/:id
POST   /api/procurement/orders/:id/advance-checkpoint
GET    /api/procurement/checkpoints/summary
GET    /api/procurement/checkpoints/:checkpoint/articles
POST   /api/shipments
GET    /api/shipments
GET    /api/shipments/:id
POST   /api/shipments/:id/events
PATCH  /api/shipments/:id/status
POST   /api/customs/entries
GET    /api/customs/entries
GET    /api/customs/entries/:id
POST   /api/customs/entries/:id/expenses
PATCH  /api/customs/entries/:id/status
POST   /api/inventory/lots/receive
GET    /api/inventory/lots
GET    /api/inventory/lots/:id
POST   /api/inventory/lots/:id/movements
POST   /api/sales/orders
GET    /api/sales/orders
GET    /api/sales/orders/:id
PATCH  /api/sales/orders/:id/status
POST   /api/finance/import-expenses/:id/allocations
GET    /api/finance/import-expenses/:id/allocations
GET    /api/finance/inventory-lots/:id/profitability
GET    /api/finance/sales-orders/:id/profitability
POST   /api/document-processing/uploads
GET    /api/document-processing/uploads
GET    /api/document-processing/uploads/:id
POST   /api/document-processing/uploads/:id/extractions
GET    /api/document-processing/extractions/:id
POST   /api/document-processing/extractions/:id/validate
POST   /api/document-processing/extractions/:id/create-purchase-order
```

Checkpoints manuales soportados actualmente:

- `quotation`
- `purchased`
- `international_transport`
- `customs_chile`
- `local_transport_to_warehouse`
- `in_warehouse`
- `out_for_delivery`
- `sold_or_paid`

## Build

```bash
npm run build
```

## Siguiente etapa recomendada

Continuar con uno de los siguientes tramos:

- trade-ops-web
- reportes financieros mas avanzados
- OCR/extraccion documental mas avanzada
