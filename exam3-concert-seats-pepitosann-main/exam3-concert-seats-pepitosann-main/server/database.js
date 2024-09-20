"use strict"

const sqlite = require("sqlite3");
const crypto = require("crypto");

const dbAllAsync = (db, sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => {
    if (err) reject(err);
    else resolve(rows);
  });
});

const dbRunAsync = (db, sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, err => {
    if (err) reject(err);
    else resolve();
  });
});

const dbGetAsync = (db, sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => {
    if (err) reject(err);
    else resolve(row);
  });
});

/**
 * Interface to the sqlite database for the application
 *
 * @param dbname name of the sqlite3 database file to open
 */
function Database(dbname) {
  this.db = new sqlite.Database(dbname, err => {
    if (err) throw err;
  });

  /**
  * Retrieve the list of all concerts from the db
  *
  * @returns a Promise that resolves to the list of concert objects
  */
  this.getConcerts = async () => {
    const concerts = (await dbAllAsync(this.db, "select id, name, date, theater_id FROM concerts"))
    return concerts;
  };

  /**
  * Retrieve the list of all theaters from the db
  *
  * @returns a Promise that resolves to the list of theater objects
  */
  this.getTheaters = async () => {
    const theaters = (await dbAllAsync(this.db, "select id, name, address, rows, columns FROM theaters"))
    return theaters;
  };

  /**
  * Retrieve the list of all seats from the db
  *
  * @returns a Promise that resolves to the list of seat objects
  */
  this.getSeats = async () => {
    const seats = (await dbAllAsync(this.db, "select id, code, row, column, concert_id, status FROM seats"))
    return seats;
  };

  /**
   * Retrieve the user with the specified id
   * 
   * @param id the id of the user to retrieve
   * 
   * @returns a Promise that resolves to the user object
   */
  this.getUser = async id => {
    const user = await dbGetAsync(
      this.db,
      "select * from users where id = ?",
      [id]
    );

    return { ...user, id };
  };

  /**
  * Retrieve the reservation for a specific user and concert
  *
  * @param userId the ID of the user
  * @param concertId the ID of the concert
  * 
  * @returns reservation object or null if no reservation exists
  */
  this.getReservationByUserAndConcert = async (userId, concertId) => {
    const res = await dbGetAsync(
      this.db,
      "SELECT * FROM reservations WHERE user_id = ? AND concert_id = ?",
      [userId, concertId]
    );

    return res || null;
  };

  /**
   * Retrieve the reservations of a specific user thanks to its id
   * 
   * @param userId the id of the user to retrieve
   * 
   * @returns a Promise that resolves to the the reservations done
   */
  this.getUserReservation = async (userId) => {
    const res = await dbAllAsync(
      this.db,
      "SELECT * FROM reservations WHERE user_id = ?",
      [userId]
    );

    return res || null;
  };

  /**
   * Retrieve the biggest id in the reservations
   *
   * @returns a Promise that resolves to the bigger reservation id
   */
  this.getMaxReservationId = async () => {
    const res = await dbGetAsync(
      this.db,
      "SELECT MAX(id) as id FROM reservations",
    );

    return { res };
  }

  /**
   * Retrieve the reserved seats of a specific user thanks to the reservations ids
   * 
   * @param reservationIds the ids of the reservations to retrieve
   * 
   * @returns a Promise that resolves to the reserved seats
   */
  this.getReservedSeats = async (reservationIds) => {
    try {
      // Convert reservationIds to a comma-separated list of placeholders (e.g., ?, ?, ?)
      const placeholders = reservationIds.map(() => '?').join(',');

      const query = `
      SELECT reserved_seats.*, reservations.concert_id
      FROM reserved_seats
      JOIN reservations ON reserved_seats.reservation_id = reservations.id
      WHERE reservations.id IN (${placeholders})
    `;

      const res = await dbAllAsync(
        this.db,
        query,
        reservationIds
      );

      return res || [];
    } catch (error) {
      console.error('Error fetching reserved seats:', error);
      throw error;
    }
  };

  /**
   * Retrieve the seats with some specific ids
   * 
   * @param seatIds the ids of the seats to retrieve
   * 
   * @returns a Promise that resolves to the specific seats
   */
  this.getSeatsByIds = async (seatIds) => {
    try {
      // Ensure seatIds is a string, then split it by commas to create an array
      const seatIdsArray = seatIds.split(',').map(id => parseInt(id, 10));

      // Validate that all IDs are integers
      if (seatIdsArray.some(isNaN)) {
        throw new Error('Invalid seat ID(s) provided');
      }

      // Generate a string with a placeholder for each seat ID
      const seatPlaceholders = seatIdsArray.map(() => '?').join(',');

      const query = `SELECT * FROM seats WHERE id IN (${seatPlaceholders})`;
      const seats = await dbAllAsync(this.db, query, seatIdsArray);
      return seats;
    } catch (error) {
      console.error('Error getting seats by IDs:', error);
      throw error;
    }
  };


  /**
   * Delete the specified user's reservation and seats
   * 
   * @param userId the id of the user whose reservation is to be deleted
   * @param concertIds the id of the concert that has to be deleted
   * @param reservationIds the id of the reservation that has to be deleted
   * @param seatIds the id of the seats that has to be deleted
   * 
   * @returns a Promise that resolves to nothing when the reservation has been deleted
   */
  this.deleteReservedSeats = async (userId, concertIds, reservationIds, seatIds) => {
    try {
      // Convert reservationIds and seatIds to comma-separated placeholders
      const reservationPlaceholders = reservationIds.map(() => '?').join(',');
      const seatPlaceholders = seatIds.map(() => '?').join(',');

      // Perform the deletion of reserved seats
      await dbRunAsync(
        this.db,
        `DELETE FROM reserved_seats WHERE reservation_id IN (${reservationPlaceholders}) AND seat_id IN (${seatPlaceholders})`,
        [...reservationIds, ...seatIds]
      );

      // Update the status of seats to available
      await dbRunAsync(
        this.db,
        `UPDATE seats SET status = 'available' WHERE id IN (${seatPlaceholders})`,
        seatIds
      );

      // Delete reservations for the specified user and concerts
      await dbRunAsync(
        this.db,
        `DELETE FROM reservations WHERE user_id = ? AND concert_id IN (${reservationPlaceholders})`,
        [userId, ...concertIds]
      );

    } catch (error) {
      console.error('Error deleting reserved seats:', error);
      throw error;
    }
  };

  /**
   * Authenticate a user from their username and password
   * 
   * @param username username of the user to authenticate
   * @param password password of the user to authenticate
   * 
   * @returns a Promise that resolves to the user object {id, username, quality}
   */
  this.authUser = (username, password) => new Promise((resolve, reject) => {
    // Get the user with the given username
    dbGetAsync(
      this.db,
      "select * from users where username = ?",
      [username]
    ).then(user => {
      if (!user) resolve(false);

      // Verify the password
      crypto.scrypt(password, user.salt, 32, (err, hash) => {
        if (err) reject(err);

        if (crypto.timingSafeEqual(hash, Buffer.from(user.hash, "hex")))
          resolve({ id: user.id, username: user.username });
        else resolve(false);
      });
    })
      .catch(e => reject(e));
  });

  /**
   * Get available seats for a specific concert
   *
   * @param concertId the ID of the concert
   * 
   * @returns available seats by seat ID
   */
  this.getAvailableSeats = async concertId => {
    try {
      const allSeats = await dbAllAsync(this.db, `
      SELECT id, status FROM seats WHERE concert_id = ?
    `, [concertId]);

      // Convert to a map with seat IDs as keys and their statuses as values
      const seatsMap = {};
      allSeats.forEach(({ id, status }) => {
        seatsMap[id] = status;
      });

      // Get all reserved seats for the concert
      const reservedSeats = await dbAllAsync(this.db, `
      SELECT seat_id
      FROM reserved_seats
      INNER JOIN reservations ON reserved_seats.reservation_id = reservations.id
      WHERE reservations.concert_id = ?
    `, [concertId]);

      const reservedSet = new Set(reservedSeats.map(({ seat_id }) => seat_id));

      // Calculate available seats
      const availableSeats = {};
      for (const [id, status] of Object.entries(seatsMap)) {
        // Ensure id is compared as a number
        if (status === 'available' && !reservedSet.has(Number(id))) {
          availableSeats[id] = status;
        }
      }

      return availableSeats;
    } catch (error) {
      console.error('Error retrieving available seats:', error);
      throw error; // Or handle the error as needed
    }
  };

  /**
   * Update the status of the seats in the database to 'occupied'
   *
   * @param seatsToReserve array of seats with their new status
   * 
   * @returns nothing
   */
  this.updateSeats = async (seatsToReserve, userId, concertId, newReservationId) => {
    try {
      for (const seat of seatsToReserve) {
        const sql = `UPDATE seats SET status = 'occupied' WHERE id = ?`;
        await dbRunAsync(this.db, sql, [seat.id]);
      }

      const sql = `INSERT INTO reservations (id, user_id, concert_id) VALUES (?, ?, ?)`;
      await dbRunAsync(this.db, sql, [newReservationId, userId, concertId]);

      for (const seat of seatsToReserve) {
        const sql = `INSERT INTO reserved_seats (reservation_id, seat_id) VALUES (?, ?)`;
        await dbRunAsync(this.db, sql, [newReservationId, seat.id]);
      }

    } catch (error) {
      console.error("Failed to update seats:", error);
      throw error;
    }
  };

}

const connect = () => {
  console.log("Connecting to the database...");
};

module.exports = Database;