// scripts/migrate-turso.ts
// Script para aplicar el schema a Turso

import 'dotenv/config';
import { createClient } from '@libsql/client';

const dbUrl = process.env.DATABASE_URL!;
const authToken = process.env.TURSO_AUTH_TOKEN!;

if (!dbUrl.startsWith('libsql://')) {
  console.error('❌ DATABASE_URL debe ser una URL de Turso (libsql://)');
  process.exit(1);
}

const client = createClient({ url: dbUrl, authToken });

const schema = `
-- Users table
CREATE TABLE IF NOT EXISTS User (
  id TEXT PRIMARY KEY,
  externalId TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  firstName TEXT,
  lastName TEXT,
  phone TEXT,
  role TEXT DEFAULT 'USER',
  isActive INTEGER DEFAULT 1,
  emailVerified INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

-- Solicitud table
CREATE TABLE IF NOT EXISTS Solicitud (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  visaType TEXT NOT NULL,
  destinationCountry TEXT NOT NULL,
  status TEXT DEFAULT 'NUEVA',
  currentStep INTEGER DEFAULT 1,
  totalSteps INTEGER DEFAULT 5,
  fullName TEXT NOT NULL,
  birthDate TEXT,
  nationality TEXT,
  passportNumber TEXT,
  passportExpiry TEXT,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT,
  travelPurpose TEXT,
  travelDate TEXT,
  returnDate TEXT,
  hasVisaHistory INTEGER DEFAULT 0,
  visaHistoryNotes TEXT,
  hasDenials INTEGER DEFAULT 0,
  denialNotes TEXT,
  bitrixLeadId TEXT,
  bitrixDealId TEXT,
  appointmentDate TEXT,
  interviewDate TEXT,
  source TEXT,
  assignedAgentId TEXT,
  priority TEXT DEFAULT 'NORMAL',
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES User(id)
);


-- StatusHistory table
CREATE TABLE IF NOT EXISTS StatusHistory (
  id TEXT PRIMARY KEY,
  solicitudId TEXT NOT NULL,
  fromStatus TEXT,
  toStatus TEXT NOT NULL,
  changedBy TEXT,
  reason TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (solicitudId) REFERENCES Solicitud(id)
);

-- Document table
CREATE TABLE IF NOT EXISTS Document (
  id TEXT PRIMARY KEY,
  solicitudId TEXT,
  userId TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  fileUrl TEXT,
  fileName TEXT,
  fileSize INTEGER,
  mimeType TEXT,
  status TEXT DEFAULT 'PENDIENTE',
  reviewNotes TEXT,
  reviewedBy TEXT,
  reviewedAt TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (solicitudId) REFERENCES Solicitud(id),
  FOREIGN KEY (userId) REFERENCES User(id)
);

-- Note table
CREATE TABLE IF NOT EXISTS Note (
  id TEXT PRIMARY KEY,
  solicitudId TEXT,
  userId TEXT,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'GENERAL',
  isInternal INTEGER DEFAULT 0,
  createdById TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (solicitudId) REFERENCES Solicitud(id),
  FOREIGN KEY (userId) REFERENCES User(id),
  FOREIGN KEY (createdById) REFERENCES User(id)
);

-- Appointment table
CREATE TABLE IF NOT EXISTS Appointment (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  serviceType TEXT NOT NULL,
  scheduledDate TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING',
  notes TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES User(id)
);

-- SystemConfig table
CREATE TABLE IF NOT EXISTS SystemConfig (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  type TEXT DEFAULT 'STRING',
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_external_id ON User(externalId);
CREATE INDEX IF NOT EXISTS idx_user_email ON User(email);
CREATE INDEX IF NOT EXISTS idx_solicitud_user_id ON Solicitud(userId);
CREATE INDEX IF NOT EXISTS idx_solicitud_status ON Solicitud(status);
CREATE INDEX IF NOT EXISTS idx_document_solicitud_id ON Document(solicitudId);
CREATE INDEX IF NOT EXISTS idx_note_solicitud_id ON Note(solicitudId);
`;

async function migrate() {
  console.log('🚀 Conectando a Turso...');
  console.log(`   URL: ${dbUrl}`);

  try {
    // Ejecutar cada statement por separado
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`📦 Ejecutando ${statements.length} statements...`);

    for (const statement of statements) {
      await client.execute(statement);
      const tableName = statement.match(/(?:CREATE TABLE|CREATE INDEX).*?(\w+)/i)?.[1];
      if (tableName) {
        console.log(`   ✅ ${tableName}`);
      }
    }

    console.log('\n✅ Migración completada exitosamente!');
  } catch (error) {
    console.error('❌ Error en migración:', error);
    process.exit(1);
  }
}

migrate();
