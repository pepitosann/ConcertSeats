"use strict"

const Database = require("./database");
const express = require("express");
const cors = require("cors");
const { param, body, validationResult } = require("express-validator");
const { initAuthentication, isLoggedIn } = require("./auth");
const passport = require("passport");

const jsonwebtoken = require('jsonwebtoken');
const jwtSecret = '47e5edcecab2e23c8545f66fca6f3aec8796aee5d830567cc362bb7fb31adafc';
const expireTime = 60; //seconds

const PORT = 3001;
const app = new express();
const db = new Database("concert-seats.db");

app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

initAuthentication(app, db);

/**
 * Get all the concerts
 *
 * This is an open endpoint: non authenticated users can still access this
 */
app.get("/api/concerts", async (req, res) => {
  try {
    const concerts = await db.getConcerts();
    res.json(concerts);
  } catch {
    res.status(500).json({ errors: ["Database error"] });
  }
});

/**
 * Get all the theaters
 *
 * This is an open endpoint: non authenticated users can still access this
 */
app.get("/api/theaters", async (req, res) => {
  try {
    const theaters = await db.getTheaters();
    res.json(theaters);
  } catch {
    res.status(500).json({ errors: ["Database error"] });
  }
});

/**
 * Get all the seats
 *
 * This is an open endpoint: non authenticated users can still access this
 */
app.get("/api/seats", async (req, res) => {
  try {
    const seats = await db.getSeats();
    res.json(seats);
  } catch {
    res.status(500).json({ errors: ["Database error"] });
  }
});

/**
* Get the seats with some specific ids
*/
app.get("/api/user-seat-id/:seatIds",
  isLoggedIn,
  [
    param('seatIds')
      .exists()
      .custom(value => {
        const seatIds = value.split(',').map(Number);
        if (seatIds.some(isNaN)) {
          throw new Error('All seat IDs must be valid numbers');
        }
        return true;
      })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { seatIds } = req.params;

    if (!seatIds) {
      return res.status(400).json({ errors: ["No seat IDs specified"] });
    }

    try {
      const seatsToUpdate = await db.getSeatsByIds(seatIds);
      res.json(seatsToUpdate);
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ errors: ["Database error"] });
    }
  });

/**
 * Get the reservation of the user
 */
app.get(
  "/api/user-reservations",
  isLoggedIn,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { id } = req.user;

    if (!id) {
      return res.status(400).json({ errors: ["No id specified"] });
    }

    try {
      const reservations = await db.getUserReservation(id);
      res.json(reservations);
    } catch {
      res.status(500).json({ errors: ["Database error"] });
    }
  }
);

/**
 * Get the reserved seats of the user
 */
app.get(
  "/api/user-seats",
  isLoggedIn,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { id } = req.user;

    if (!id) {
      return res.status(400).json({ errors: ["No id specified"] });
    }

    try {
      const reservations = await db.getUserReservation(id);
      const reservationIds = reservations.map(reservation => reservation.id);
      const reservedSeats = await db.getReservedSeats(reservationIds);
      res.json(reservedSeats);
    } catch {
      res.status(500).json({ errors: ["Database error"] });
    }
  }
);

/**
 * Delete the current reserved seats for the currently logged in user for the specific concert
 */
app.delete(
  "/api/reserved-seats",
  isLoggedIn,
  body("reservedSeats", "No reserved seats specified").isArray(),
  body("reservedSeats.*", "No element specified").isObject(),
  async (req, res) => {
    const { id } = req.user;
    const reservedSeats = req.body.reservedSeats;

    if (!id) {
      return res.status(400).json({ errors: ["No id specified"] });
    }

    try {
      const reservationIds = [...new Set(reservedSeats.map(seat => seat.reservation_id))];
      const seatIds = reservedSeats.map(seat => seat.seat_id);
      const concertIds = [...new Set(reservedSeats.map(seat => seat.concert_id))];

      await db.deleteReservedSeats(id, concertIds, reservationIds, seatIds);
      res.end();
    } catch {
      res.status(500).json({ errors: ["Database error"] });
    }
  });

/**
 * Reserve seats for a concert
 */
app.post(
  "/api/seats-update",
  isLoggedIn,
  body("seatsToReserve").isArray().notEmpty(),
  body("seatsToReserve.*", "No element specified").isObject(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array().map(e => e.msg) });
    }

    const { seatsToReserve } = req.body;
    const { id } = req.user;

    if (!id) {
      return res.status(400).json({ errors: ["No id specified"] });
    }

    try {
      const concertId = seatsToReserve[0]?.concert_id;

      if (!concertId) {
        return res.status(400).json({ success: false, errors: ["Concert ID is required in seat data"] });
      }

      const existingReservation = await db.getReservationByUserAndConcert(id, concertId);

      if (existingReservation) {
        return res.status(409).json({ success: false, errors: ["Reservation conflict"] });
      }

      const availableSeats = await db.getAvailableSeats(concertId);
      const reservationId = await db.getMaxReservationId();
      const newReservationId = reservationId.res.id + 1;

      const reservedSeatIds = seatsToReserve.map(seat => seat.id.toString());
      const availableSeatIds = Object.keys(availableSeats).map(id => id.toString());

      const conflictedSeats = reservedSeatIds.filter(id => !availableSeatIds.includes(id));

      if (conflictedSeats.length === 0) {
        await db.updateSeats(seatsToReserve, id, concertId, newReservationId);
        return res.json({ success: true });
      } else {
        return res.json({
          success: false,
          errors: ["Some seats are no longer available"],
          conflictedSeats
        });
      }
    } catch (error) {
      console.error("Error handling seat reservation:", error);
      return res.status(500).json({ success: false, errors: ["Database error"] });
    }
  }
);

/**
 * Authenticate and login
 */
app.post(
  "/api/session",
  body("username", "username is not a valid username").isString().notEmpty(),
  body("password", "password must be a non-empty string").isString().notEmpty(),
  (req, res, next) => {
    // Check if validation is ok
    const err = validationResult(req);
    const errList = [];
    if (!err.isEmpty()) {
      errList.push(...err.errors.map(e => e.msg));
      return res.status(400).json({ errors: errList });
    }

    // Perform the actual authentication
    passport.authenticate("local", (err, user) => {
      if (err) {
        res.status(err.status).json({ errors: [err.msg] });
      } else {
        req.login(user, err => {
          if (err) return next(err);
          else {
            res.json({ username: user.username });
          }
        });
      }
    })(req, res, next);
  }
);

/**
 * Logout
 */
app.delete("/api/session", isLoggedIn, (req, res) => {
  req.logout(() => res.end());
});

/**
 * Get token
 */
app.get('/api/auth-token', isLoggedIn, (req, res) => {
  const loyal = req.user.loyal;

  const payloadToSign = { loyal: loyal, userId: req.user.id };
  const jwtToken = jsonwebtoken.sign(payloadToSign, jwtSecret, { expiresIn: expireTime });

  res.json({ token: jwtToken });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}/`));