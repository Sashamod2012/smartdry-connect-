# SmartDry Connect™ — PRD

## Original Problem Statement
Investor-demo web application for SmartDry Connect™ (powered by Adebobo Dynamic Resources): the digital monitoring and traceability platform for a commercial **hybrid LPG hot-air agricultural dryer** with **solar/battery-powered electrical controls, sensors, monitoring and comms** (NOT a conventional grid-electric dehydrator). Built on a real ESP32 IoT prototype (temp/humidity, load-cell weight, gas detection, OLED, controls, alerts). Audience: investors, manufacturers, pilot customers, strategic partners (London). Tagline: **Monitor. Trace. Grow.** All live-looking values must be clearly labelled **SIMULATED / DEMO DATA — NOT PILOT RESULTS**. No invented energy-savings or performance claims.

## User Choices (confirmed)
- Real scannable QR codes (react-qr-code, linking to /trace/:batchId passport)
- No login — opens straight to dashboard
- Line charts + gauge dials for live monitoring
- Batches persisted in MongoDB
- 24-tray commercial system; controlled pilot validation before small-batch manufacturing

## Architecture
- **Backend**: FastAPI + MongoDB (motor). Endpoints: `/api/telemetry` (time-based simulated sensor feed), `/api/batches` (GET/POST), `/api/batches/{id}` (GET/PATCH), `/api/energy/summary` (simulated analytics + comparison model), `/api/system/status`. Seeds 8 demo batches (SDC-2026-083..090) on startup.
- **Frontend**: React 19 + Tailwind + Recharts + react-qr-code + sonner + lucide. Dark industrial SCADA theme (SmartDry green #059669/#10B981, tech blue #0284C7/#38BDF8, obsidian #090D16). Fonts: Outfit + JetBrains Mono.
- **Design spec**: /app/design_guidelines.json

## User Personas
- Investor / strategic partner evaluating the digital layer in a live pitch
- Agricultural processor (pilot customer) assessing monitoring & traceability
- Manufacturing partner reviewing system architecture & subsystem health

## Core Requirements (static)
1. Dashboard: status, temp, humidity, weight, drying time, gas safety, power, active batch, ESP32→Cloud→Dashboard concept, demo banner
2. Live Monitor: line charts + gauges, START/PAUSE/STOP, progress + stage indicator
3. New Batch: ID, product (Catfish, Vegetables, Fruits, Ginger, Pepper, Tomatoes, Herbs, Grains), weight, trays, operator, method, datetime → persisted record
4. Batch History: table with search/filter, status + traceability badges
5. Energy & Performance: LPG/battery/solar/yield/per-kg metrics + existing-vs-SmartDry comparison, all simulated-labelled
6. QR Traceability: real QR per batch + digital passport
7. System Status: architecture flow + subsystem health + telemetry stream

## Implemented (2026-06)
- All 7 sections fully functional; sidebar + mobile nav; persistent SIMULATED/DEMO banner
- Live Monitor client-side SCADA simulator (3s ticks, stages, gauges, recharts)
- Batch CRUD with MongoDB persistence; monotonic auto batch-ID
- Real QR codes with PNG download; /trace/:batchId passport route
- Energy analytics computed from batch records with disclaimers; comparison table with "awaiting pilot validation" basis notes
- System Status architecture diagram, health matrix, simulated ESP32 telemetry stream
- E2E tested: 100% backend + frontend pass (/app/test_reports/iteration_1.json)

## Backlog
- **P0**: Connect real ESP32 telemetry ingestion (MQTT/HTTP webhook) replacing simulated feed
- **P1**: Controlled pilot data capture mode; replace simulated energy model with measured data
- **P1**: Batch lifecycle actions (complete/abort from Live Monitor writing back to DB)
- **P2**: PDF batch audit export, printable QR packaging labels
- **P2**: Multi-dryer fleet view, operator accounts/auth, alerts (SMS/WhatsApp via Twilio)
- **P2**: FastAPI lifespan migration (deprecation), /api/batches pagination

## Next Tasks
1. Review demo with stakeholders; gather pitch feedback
2. Define ESP32 → cloud payload contract for real telemetry
3. Plan controlled pilot metrics schema (LPG kg, kWh, moisture in/out, duration)
