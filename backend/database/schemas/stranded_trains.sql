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
  deleted INTEGER DEFAULT 0
);