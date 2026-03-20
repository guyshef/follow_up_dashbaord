const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'follow_up.db');
let db;

function getDb() {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function init() {
  const conn = getDb();

  conn.exec(`
    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      address TEXT NOT NULL,
      email TEXT DEFAULT '',
      agent_name TEXT DEFAULT '',
      agent_email TEXT DEFAULT '',
      agent_phone TEXT DEFAULT '',
      listing_price REAL DEFAULT 0,
      initial_offer REAL DEFAULT 0,
      offer_date TEXT DEFAULT '',
      seller_response TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS follow_ups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      method TEXT NOT NULL,
      notes TEXT DEFAULT ''
    );
  `);

  // Seed sample data if properties table is empty
  const count = conn.prepare('SELECT COUNT(*) AS cnt FROM properties').get();
  if (count.cnt === 0) {
    const insert = conn.prepare(`
      INSERT INTO properties (address, email, agent_name, agent_email, agent_phone, listing_price, initial_offer, offer_date, seller_response)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const seedData = [
      ['270 West Glendale', 'dana.gcy.invest@gmail.com', 'Stuart', '', '216-xxx-xxxx', 120000, 105000, '2025-12-10', 'closed'],
      ['8570 Randolph Rd, Crestwood Heights', 'dana.gcy.invest@gmail.com', 'Karen', 'kherftho@gmail.com', '', 0, 140000, '2026-09-02', 'checking'],
      ['15012 Corlett Rd, Maple Heights, OH 44137', 'dana.gcy.invest@gmail.com', 'Deborah Kidd', 'deborahsolutions@gmail.com', '', 145000, 120000, '2026-09-02', 'checking'],
      ['21860 Louis Rd, Bedford Heights, OH 44146', 'dana.gcy.invest@gmail.com', '', 'SikTheRealtor@gmail.com', '', 0, 120000, '2026-09-03', ''],
      ['440 E 21st St, Euclid', 'dana.gcy.invest@gmail.com', 'Gene Williams', 'genewilliams703@gmail.com', '', 45000, 110000, '2026-09-02', '1.07% not work for the seller'],
    ];

    const insertMany = conn.transaction((rows) => {
      for (const row of rows) {
        insert.run(...row);
      }
    });

    insertMany(seedData);
  }
}

function attachFollowUps(property) {
  if (!property) return null;
  const conn = getDb();
  const followUps = conn.prepare('SELECT * FROM follow_ups WHERE property_id = ? ORDER BY id').all(property.id);
  return { ...property, followUps };
}

function getAllProperties() {
  const conn = getDb();
  const properties = conn.prepare('SELECT * FROM properties ORDER BY id').all();
  return properties.map(attachFollowUps);
}

function getPropertyById(id) {
  const conn = getDb();
  const property = conn.prepare('SELECT * FROM properties WHERE id = ?').get(id);
  return attachFollowUps(property);
}

function createProperty(data) {
  const conn = getDb();
  const result = conn.prepare(`
    INSERT INTO properties (address, email, agent_name, agent_email, agent_phone, listing_price, initial_offer, offer_date, seller_response)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.address,
    data.email || '',
    data.agentName || '',
    data.agentEmail || '',
    data.agentPhone || '',
    data.listingPrice || 0,
    data.initialOffer || 0,
    data.offerDate || '',
    data.sellerResponse || ''
  );
  return getPropertyById(result.lastInsertRowid);
}

function updateProperty(id, data) {
  const conn = getDb();

  // Build dynamic SET clause from provided fields
  const fieldMap = {
    address: 'address',
    email: 'email',
    agentName: 'agent_name',
    agentEmail: 'agent_email',
    agentPhone: 'agent_phone',
    listingPrice: 'listing_price',
    initialOffer: 'initial_offer',
    offerDate: 'offer_date',
    sellerResponse: 'seller_response',
  };

  const setClauses = [];
  const values = [];

  for (const [jsKey, dbCol] of Object.entries(fieldMap)) {
    if (data[jsKey] !== undefined) {
      setClauses.push(`${dbCol} = ?`);
      values.push(data[jsKey]);
    }
  }

  if (setClauses.length === 0) {
    return getPropertyById(id);
  }

  values.push(id);
  conn.prepare(`UPDATE properties SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);
  return getPropertyById(id);
}

function deleteProperty(id) {
  const conn = getDb();
  conn.prepare('DELETE FROM properties WHERE id = ?').run(id);
}

function createFollowUp(propertyId, data) {
  const conn = getDb();
  const result = conn.prepare(`
    INSERT INTO follow_ups (property_id, date, method, notes)
    VALUES (?, ?, ?, ?)
  `).run(propertyId, data.date, data.method, data.notes || '');
  return conn.prepare('SELECT * FROM follow_ups WHERE id = ?').get(result.lastInsertRowid);
}

function deleteFollowUp(id) {
  const conn = getDb();
  conn.prepare('DELETE FROM follow_ups WHERE id = ?').run(id);
}

module.exports = {
  init,
  getAllProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  createFollowUp,
  deleteFollowUp,
};
