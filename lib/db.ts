import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

const DB_PATH = path.join(process.cwd(), 'data', 'zerosbatti.db');

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    const fs = require('fs');
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeSchema();
  }
  return db;
}

function initializeSchema() {
  const database = db;

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'collaborator', 'client')),
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS module_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      module_name TEXT NOT NULL,
      is_visible INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, module_name)
    );

    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      company TEXT,
      assigned_admin_id INTEGER,
      user_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (assigned_admin_id) REFERENCES users(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'paused', 'completed', 'cancelled')),
      start_date TEXT,
      end_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS collaboration_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      collaborator_id INTEGER NOT NULL,
      project_id INTEGER NOT NULL,
      role_in_project TEXT,
      FOREIGN KEY (collaborator_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      UNIQUE(collaborator_id, project_id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      assigned_to INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo', 'in_progress', 'review', 'done')),
      due_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_to) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS content_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('copy', 'video', 'script', 'creative', 'campaign_material')),
      link_url TEXT,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'review', 'approved', 'published')),
      scheduled_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS calendar_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      start_datetime TEXT NOT NULL,
      end_datetime TEXT NOT NULL,
      event_type TEXT NOT NULL DEFAULT 'content' CHECK(event_type IN ('content', 'task', 'meeting', 'deadline', 'campaign')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      project_id INTEGER,
      invoice_number TEXT NOT NULL UNIQUE,
      amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'overdue')),
      due_date TEXT NOT NULL,
      issued_date TEXT NOT NULL,
      notes TEXT,
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      amount_paid REAL NOT NULL,
      payment_date TEXT NOT NULL,
      method TEXT,
      notes TEXT,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      project_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      items_json TEXT NOT NULL DEFAULT '[]',
      total_amount REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
      valid_until TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'system' CHECK(type IN ('task', 'content', 'invoice', 'quote', 'comment', 'system')),
      is_read INTEGER NOT NULL DEFAULT 0,
      related_entity_type TEXT,
      related_entity_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      content_item_id INTEGER,
      author_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (content_item_id) REFERENCES content_items(id) ON DELETE CASCADE,
      FOREIGN KEY (author_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS payment_reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      triggered_by INTEGER NOT NULL,
      trigger_date TEXT NOT NULL DEFAULT (datetime('now')),
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'sent')),
      FOREIGN KEY (invoice_id) REFERENCES invoices(id),
      FOREIGN KEY (triggered_by) REFERENCES users(id)
    );
  `);

  // Seed admin user if not exists
  const adminExists = database.prepare('SELECT id FROM users WHERE email = ?').get('admin@zerosbatti.it');
  if (!adminExists) {
    const adminHash = bcrypt.hashSync('Admin123!', 10);
    const collabHash = bcrypt.hashSync('Collab123!', 10);
    const clientHash = bcrypt.hashSync('Client123!', 10);

    const insertUser = database.prepare(
      'INSERT INTO users (email, password_hash, name, role, is_active) VALUES (?, ?, ?, ?, 1)'
    );

    const adminResult = insertUser.run('admin@zerosbatti.it', adminHash, 'Alessandro Admin', 'admin');
    const collabResult = insertUser.run('collaborator@zerosbatti.it', collabHash, 'Marco Collaboratore', 'collaborator');
    const clientResult = insertUser.run('cliente@demo.it', clientHash, 'Luca Cliente', 'client');

    // Insert demo client linked to client user
    const insertClient = database.prepare(
      'INSERT INTO clients (name, email, phone, company, assigned_admin_id, user_id) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const clientRecord = insertClient.run('Luca Cliente', 'cliente@demo.it', '+39 331 000000', 'Demo Srl', adminResult.lastInsertRowid, clientResult.lastInsertRowid);

    // Insert demo project
    const insertProject = database.prepare(
      'INSERT INTO projects (client_id, name, description, status, start_date) VALUES (?, ?, ?, ?, ?)'
    );
    const projectRecord = insertProject.run(
      clientRecord.lastInsertRowid,
      'Social Media Management Q1',
      'Gestione social media completa per il primo trimestre: Instagram, Facebook, LinkedIn',
      'active',
      new Date().toISOString().split('T')[0]
    );

    // Assign collaborator to project
    database.prepare(
      'INSERT INTO collaboration_assignments (collaborator_id, project_id, role_in_project) VALUES (?, ?, ?)'
    ).run(collabResult.lastInsertRowid, projectRecord.lastInsertRowid, 'Content Creator');

    // Seed demo tasks
    const insertTask = database.prepare(
      'INSERT INTO tasks (project_id, assigned_to, title, description, status, due_date) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    insertTask.run(projectRecord.lastInsertRowid, collabResult.lastInsertRowid, 'Crea contenuti Instagram Settimana 1', 'Creare 3 post Instagram con copy e creatività', 'in_progress', futureDate.toISOString().split('T')[0]);
    
    futureDate.setDate(futureDate.getDate() + 3);
    insertTask.run(projectRecord.lastInsertRowid, collabResult.lastInsertRowid, 'Report mensile performance', 'Analisi KPI e report per il cliente', 'todo', futureDate.toISOString().split('T')[0]);

    // Seed demo content
    const insertContent = database.prepare(
      'INSERT INTO content_items (project_id, title, type, link_url, description, status, scheduled_date) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 5);
    insertContent.run(projectRecord.lastInsertRowid, 'Post Instagram - Lancio Promo', 'creative', 'https://drive.google.com/example', 'Post creatività per lancio promozione estate', 'review', nextWeek.toISOString().split('T')[0]);
    insertContent.run(projectRecord.lastInsertRowid, 'Copy Facebook - Brand Awareness', 'copy', null, 'Testi per campagna brand awareness su Facebook', 'draft', null);

    // Seed demo invoice
    const overdue = new Date();
    overdue.setDate(overdue.getDate() - 10);
    database.prepare(
      'INSERT INTO invoices (client_id, project_id, invoice_number, amount, status, due_date, issued_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(clientRecord.lastInsertRowid, projectRecord.lastInsertRowid, 'INV-2025-001', 1500.00, 'paid', overdue.toISOString().split('T')[0], new Date(overdue.getTime() - 30*86400000).toISOString().split('T')[0], 'Primo mese gestione social');

    const upcoming = new Date();
    upcoming.setDate(upcoming.getDate() + 20);
    database.prepare(
      'INSERT INTO invoices (client_id, project_id, invoice_number, amount, status, due_date, issued_date) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(clientRecord.lastInsertRowid, projectRecord.lastInsertRowid, 'INV-2025-002', 1500.00, 'pending', upcoming.toISOString().split('T')[0], new Date().toISOString().split('T')[0]);

    // Seed demo quote
    const quoteItems = JSON.stringify([
      { description: 'Social Media Management (mensile)', quantity: 3, unit_price: 1500 },
      { description: 'Campagna ADV Facebook/Instagram', quantity: 1, unit_price: 800 },
      { description: 'Content Creation extra (5 post)', quantity: 1, unit_price: 350 },
    ]);
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);
    database.prepare(
      'INSERT INTO quotes (client_id, project_id, title, description, items_json, total_amount, status, valid_until) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(clientRecord.lastInsertRowid, projectRecord.lastInsertRowid, 'Proposta Servizi Social Q2 2025', 'Pacchetto completo gestione social media e ADV per Q2', quoteItems, 5150.00, 'sent', validUntil.toISOString().split('T')[0]);

    // Seed demo calendar events
    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + 2);
    database.prepare(
      'INSERT INTO calendar_events (project_id, title, description, start_datetime, end_datetime, event_type) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(projectRecord.lastInsertRowid, 'Call con cliente', 'Review mensile strategia social', eventDate.toISOString().slice(0, 16), new Date(eventDate.getTime() + 3600000).toISOString().slice(0, 16), 'meeting');

    eventDate.setDate(eventDate.getDate() + 3);
    database.prepare(
      'INSERT INTO calendar_events (project_id, title, description, start_datetime, end_datetime, event_type) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(projectRecord.lastInsertRowid, 'Pubblicazione Post Instagram', 'Post promo estate', eventDate.toISOString().slice(0, 16), new Date(eventDate.getTime() + 1800000).toISOString().slice(0, 16), 'content');

    // Seed notifications
    const insertNotif = database.prepare(
      'INSERT INTO notifications (user_id, title, message, type, is_read) VALUES (?, ?, ?, ?, ?)'
    );
    insertNotif.run(adminResult.lastInsertRowid, 'Nuovo cliente registrato', 'Luca Cliente si è unito alla piattaforma', 'system', 0);
    insertNotif.run(collabResult.lastInsertRowid, 'Task assegnato', 'Ti è stato assegnato: Crea contenuti Instagram Settimana 1', 'task', 0);
    insertNotif.run(clientResult.lastInsertRowid, 'Preventivo disponibile', 'È disponibile un nuovo preventivo da approvare', 'quote', 0);
    insertNotif.run(clientResult.lastInsertRowid, 'Contenuto in revisione', 'Post Instagram - Lancio Promo è pronto per la tua approvazione', 'content', 0);
  }
}

export default getDb;
