const sqlite3 = require('sqlite3').verbose()
const { v4: uuidv4 } = require('uuid')
const path = require('path')

class Database {
  constructor() {
    this.db = null
    this.init()
  }

  init() {
    // Create database file in the api directory
    const dbPath = path.join(__dirname, 'coad.db')
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err.message)
      } else {
        console.log('Connected to SQLite database')
        this.createTables()
      }
    })
  }

  createTables() {
    // Create websites table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS websites (
        id TEXT PRIMARY KEY,
        url TEXT UNIQUE NOT NULL,
        publisher_id TEXT UNIQUE NOT NULL,
        title TEXT,
        description TEXT,
        status TEXT DEFAULT 'active',
        health_status TEXT,
        response_time INTEGER,
        dom_elements INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating websites table:', err.message)
      } else {
        console.log('Websites table ready')
      }
    })

    // Create ad_placements table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS ad_placements (
        id TEXT PRIMARY KEY,
        website_id TEXT NOT NULL,
        selector TEXT NOT NULL,
        description TEXT,
        priority TEXT DEFAULT 'medium',
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (website_id) REFERENCES websites (id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) {
        console.error('Error creating ad_placements table:', err.message)
      } else {
        console.log('Ad placements table ready')
      }
    })

    // Create health_checks table for tracking health check history
    this.db.run(`
      CREATE TABLE IF NOT EXISTS health_checks (
        id TEXT PRIMARY KEY,
        website_id TEXT NOT NULL,
        status TEXT NOT NULL,
        response_time INTEGER,
        dom_elements INTEGER,
        error_message TEXT,
        checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (website_id) REFERENCES websites (id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) {
        console.error('Error creating health_checks table:', err.message)
      } else {
        console.log('Health checks table ready')
      }
    })
  }

  // Website operations
  async registerWebsite(websiteData) {
    return new Promise((resolve, reject) => {
      const id = uuidv4()
      const publisherId = 'pub_' + Math.random().toString(36).substr(2, 9)
      
      const {
        url,
        title,
        description,
        healthStatus,
        responseTime,
        domElements
      } = websiteData

      this.db.run(`
        INSERT INTO websites (
          id, url, publisher_id, title, description, 
          health_status, response_time, dom_elements
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [id, url, publisherId, title, description, healthStatus, responseTime, domElements], 
      function(err) {
        if (err) {
          reject(err)
        } else {
          resolve({
            id,
            publisherId,
            url,
            title,
            description,
            healthStatus,
            responseTime,
            domElements
          })
        }
      })
    })
  }

  async getWebsiteByUrl(url) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM websites WHERE url = ?',
        [url],
        (err, row) => {
          if (err) {
            reject(err)
          } else {
            resolve(row)
          }
        }
      )
    })
  }

  async getWebsiteById(id) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM websites WHERE id = ?',
        [id],
        (err, row) => {
          if (err) {
            reject(err)
          } else {
            resolve(row)
          }
        }
      )
    })
  }

  async getWebsiteByPublisherId(publisherId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM websites WHERE publisher_id = ?',
        [publisherId],
        (err, row) => {
          if (err) {
            reject(err)
          } else {
            resolve(row)
          }
        }
      )
    })
  }

  async getAllWebsites() {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM websites ORDER BY created_at DESC',
        [],
        (err, rows) => {
          if (err) {
            reject(err)
          } else {
            resolve(rows)
          }
        }
      )
    })
  }

  async updateWebsiteHealth(websiteId, healthData) {
    return new Promise((resolve, reject) => {
      const { status, responseTime, domElements } = healthData

      this.db.run(`
        UPDATE websites
        SET health_status = ?, response_time = ?, dom_elements = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [status, responseTime, domElements, websiteId],
      function(err) {
        if (err) {
          reject(err)
        } else {
          resolve({ changes: this.changes })
        }
      })
    })
  }

  async deleteWebsite(websiteId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM websites WHERE id = ?',
        [websiteId],
        function(err) {
          if (err) {
            reject(err)
          } else {
            resolve({ changes: this.changes })
          }
        }
      )
    })
  }

  async deleteWebsiteByPublisherId(publisherId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM websites WHERE publisher_id = ?',
        [publisherId],
        function(err) {
          if (err) {
            reject(err)
          } else {
            resolve({ changes: this.changes })
          }
        }
      )
    })
  }

  // Ad placement operations
  async addAdPlacement(websiteId, placementData) {
    return new Promise((resolve, reject) => {
      const id = uuidv4()
      const { selector, description, priority = 'medium' } = placementData

      this.db.run(`
        INSERT INTO ad_placements (id, website_id, selector, description, priority)
        VALUES (?, ?, ?, ?, ?)
      `, [id, websiteId, selector, description, priority], 
      function(err) {
        if (err) {
          reject(err)
        } else {
          resolve({
            id,
            websiteId,
            selector,
            description,
            priority
          })
        }
      })
    })
  }

  async getAdPlacementsByWebsiteId(websiteId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM ad_placements WHERE website_id = ? AND is_active = 1 ORDER BY created_at',
        [websiteId],
        (err, rows) => {
          if (err) {
            reject(err)
          } else {
            resolve(rows)
          }
        }
      )
    })
  }

  async getAdPlacementsByPublisherId(publisherId) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT ap.* FROM ad_placements ap
        JOIN websites w ON ap.website_id = w.id
        WHERE w.publisher_id = ? AND ap.is_active = 1
        ORDER BY ap.created_at
      `, [publisherId], (err, rows) => {
        if (err) {
          reject(err)
        } else {
          resolve(rows)
        }
      })
    })
  }

  async removeAdPlacement(placementId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE ad_placements SET is_active = 0 WHERE id = ?',
        [placementId],
        function(err) {
          if (err) {
            reject(err)
          } else {
            resolve({ changes: this.changes })
          }
        }
      )
    })
  }

  // Health check history
  async recordHealthCheck(websiteId, healthData) {
    return new Promise((resolve, reject) => {
      const id = uuidv4()
      const { status, responseTime, domElements, errorMessage } = healthData

      this.db.run(`
        INSERT INTO health_checks (id, website_id, status, response_time, dom_elements, error_message)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [id, websiteId, status, responseTime, domElements, errorMessage], 
      function(err) {
        if (err) {
          reject(err)
        } else {
          resolve({ id })
        }
      })
    })
  }

  async getHealthCheckHistory(websiteId, limit = 10) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM health_checks WHERE website_id = ? ORDER BY checked_at DESC LIMIT ?',
        [websiteId, limit],
        (err, rows) => {
          if (err) {
            reject(err)
          } else {
            resolve(rows)
          }
        }
      )
    })
  }

  // Close database connection
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message)
        } else {
          console.log('Database connection closed')
        }
      })
    }
  }
}

module.exports = new Database()
