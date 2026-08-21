-- =========================
-- Stranded Trains - Database Schema
-- This file contains the SQL schema for the stranded_trains table, 
-- which is used to store all information about stranded trains.
-- =========================

CREATE TABLE IF NOT EXISTS stranded_trains (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  priority INTEGER,
  headcode TEXT,
  location TEXT,
  locationW3W TEXT,
  traction TEXT,
  strandedAt TEXT,

  contact TEXT,
  contactNo TEXT,
  responder TEXT,
  responderNo TEXT,

  ccilRef TEXT,
  status TEXT,

  moodOnboard TEXT,
  rescuedAt TEXT,

  passengerLoading TEXT,
  passengerCount INTEGER,

  toiletsWorking TEXT,
  noOfStaff INTEGER,

  vulnerablePeople TEXT,
  tolo TEXT,

  heatingRequired TEXT,
  airCoolingRequired TEXT,
  lighting TEXT,

  paWorking TEXT,
  cateringAvailable TEXT,

  strandedTrainChampion TEXT,
  championNo TEXT,

  otherAffectedTrains TEXT,

  planA TEXT,
  planB TEXT,
  planC TEXT,

  additionalInformation TEXT,

  lastContact TEXT,
  lastContactPerson TEXT,

  contactRecord TEXT,

  updatedByRole TEXT,
  createdByRole TEXT,

  showDeletionFlag INTEGER,
  lastUpdated TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  deleted INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  passwordHash TEXT NOT NULL,
  role TEXT NOT NULL,
  active INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Roles
-- ============================================================

CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions TEXT NOT NULL DEFAULT '[]',
  active INTEGER NOT NULL DEFAULT 1,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Reporting queries
CREATE INDEX IF NOT EXISTS idx_stranded_trains_created_deleted
ON stranded_trains(createdAt, deleted);