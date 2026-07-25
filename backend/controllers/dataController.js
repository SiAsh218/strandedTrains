// =========================
// Stranded Trains - Backend Data Controller
// This file contains the logic for handling data operations related to stranded trains, including CRUD operations and body parsing.
// =========================

// =========================
// Import dependencies
// =========================
const strandedTrainModel = require("../models/strandedTrainModel.js");

class DataController {
  constructor() {}

  // =========================
  // GET ALL
  // =========================
  async getAll() {
    return await strandedTrainModel.getAll();
  }

  // GET ACTIVE WITHOUT PHONE NUMBERS
  async getAllWithoutPhoneNumbers() {
    return await strandedTrainModel.getAllWithoutPhoneNumbers();
  }

  // GET ACTIVE WITHOUT PHONE NUMBERS
  async getActiveWithoutPhoneNumbers() {
    return await strandedTrainModel.getActiveWithoutPhoneNumbers();
  }

  // =========================
  // GET ACTIVE - only returns stranded trains that are currently stranded (i.e. not rescued)
  // =========================
  async getActive() {
    return await strandedTrainModel.getActive();
  }

  async getByCreatedDate(from, to) {
    return await strandedTrainModel.getByCreatedDate(from, to);
  }

  // =========================
  // GET BY ID
  // =========================
  async getById(id) {
    return await strandedTrainModel.getById(id);
  }

  // =========================
  // CREATE
  // =========================
  async create(data) {
    return await strandedTrainModel.create(data);
  }

  // =========================
  // UPDATE
  // =========================
  async update(id, data) {
    return await strandedTrainModel.update(id, data);
  }

  // =========================
  // Body Parser
  // =========================
  async parseBody(req) {
    return new Promise((resolve, reject) => {
      let body = "";

      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", () => {
        try {
          resolve(JSON.parse(body || "{}"));
        } catch (err) {
          reject(err);
        }
      });

      req.on("error", reject);
    });
  }
}

module.exports = new DataController();
