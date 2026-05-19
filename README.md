# ZeroSbatti Social Client Hub

Piattaforma centralizzata per la gestione di clienti, contenuti, campagne ADV e comunicazione team — **ZeroSbatti Social**.

---

## 🚀 Avvio rapido

```bash
# Installa dipendenze
npm install

# Sviluppo
npm run dev

# Produzione
npm run build && npm start
```

Server: `http://localhost:3000`

---

## 🔑 Credenziali Demo

| Ruolo | Email | Password | Redirect |
|---|---|---|---|
| **Admin** | admin@zerosbatti.it | Admin123! | /admin |
| **Collaboratore** | collaborator@zerosbatti.it | Collab123! | /collaborator |
| **Cliente** | cliente@demo.it | Client123! | /client |

---

## 🏗 Stack Tecnico

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: SQLite via better-sqlite3 (file: `data/zerosbatti.db`)
- **Auth**: JWT custom (httpOnly cookies, 7gg scadenza)
- **Calendar Export**: ICS format via `ics` package
- **State**: Zustand

---

## 📁 Struttura progetto

```
zerosbatti-hub/
├── app/
│   ├── login/              # Login unificato tutti i ruoli
│   ├── admin/              # Dashboard Admin completa
│   ├── collaborator/       # Dashboard Collaboratori
│   ├── client/             # Dashboard Clienti
│   └── api/                # API Routes (JWT-protected)
│       ├── auth/           # Login, logout, me
│       ├── clients/        # CRUD clienti
│       ├── projects/       # CRUD progetti
│       ├── tasks/          # CRUD task
│       ├── content/        # Gestione contenuti
│       ├── calendar/       # Calendario + export .ics
│       ├── quotes/         # Preventivi (accept/reject)
│       ├── invoices/       # Fatture + pagamenti
│       ├── notifications/  # Notifiche in-app
│       ├── comments/       # Commenti progetto
│       ├── permissions/    # Permessi modulari
│       ├── users/          # Gestione utenti
│       └── dashboard/      # Stats per ruolo
├── components/
│   ├── layout/             # Navbar, Sidebar, DashboardLayout
│   ├── calendar/           # CalendarView (mese+settimana)
│   ├── dashboard/          # StatsCard, StatusBadge
│   └── forms/              # CommentBox
├── lib/
│   ├── db.ts               # SQLite setup + seed
│   ├── auth.ts             # JWT sign/verify
│   └── types.ts            # TypeScript types
├── store/
│   └── auth.ts             # Zustand auth store
├── proxy.ts                # Next.js 16 proxy (middleware)
└── data/                   # SQLite database (auto-creato)
```

---

## ✅ Feature implementate

### Autenticazione
- [x] Login unificato (tutti i ruoli)
- [x] JWT httpOnly cookie (7gg)
- [x] Redirect automatico per ruolo
- [x] Protezione route per ruolo

### Admin
- [x] Dashboard con KPI (clienti, progetti, task, fatture)
- [x] CRUD completo clienti
- [x] CRUD completo progetti
- [x] Task management con stato
- [x] Calendario editoriale (mese+settimana) + export .ics
- [x] Content library (link esterni, categorie, stati)
- [x] Preventivi con line items + invio cliente
- [x] Fatture con storico pagamenti + solleciti interni
- [x] Gestione collaboratori
- [x] Permessi modulari per-utente (toggle UI)
- [x] Notifiche in-app

### Collaboratore
- [x] Dashboard con task e prossimi eventi
- [x] Progetti assegnati
- [x] Task management
- [x] Calendario dei propri progetti
- [x] Contenuti dei propri progetti
- [x] Commenti su progetti
- [x] Notifiche

### Cliente
- [x] Dashboard con stato progetto e KPI
- [x] Visualizzazione progetto + avanzamento
- [x] Libreria contenuti (con link)
- [x] Calendario editoriale + export .ics
- [x] Preventivi: visualizzazione e **accetta/rifiuta**
- [x] Fatture: storico completo
- [x] Commenti su progetto
- [x] Notifiche

### Sistema
- [x] Notifiche automatiche (task assegnati, contenuti, preventivi, fatture)
- [x] Auto-update fatture scadute
- [x] Database seed con dati demo
- [x] Permessi modulari (admin può nascondere sezioni)
- [x] Esportazione calendario .ics

---

## 🔧 Configurazione

Crea `.env.local`:
```
JWT_SECRET=cambia-questa-chiave-in-produzione-con-stringa-casuale
```

Il database SQLite viene creato automaticamente in `data/zerosbatti.db` al primo avvio.

---

## 🗺 Roadmap futura

- [ ] Google Calendar OAuth sync (infrastruttura pronta)
- [ ] Email transazionali (Postmark/Resend)
- [ ] Analytics dashboard (Chart.js)
- [ ] Upload file (Cloudinary/R2)
- [ ] Multi-tenant (più agenzie)
- [ ] API REST pubblica per integrazioni
