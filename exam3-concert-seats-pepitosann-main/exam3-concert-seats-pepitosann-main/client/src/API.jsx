const SERVER_HOST = "http://localhost";
const SERVER2_HOST = "http://localhost";
const SERVER_PORT = 3001;
const SERVER2_PORT = 3002;

const SERVER_BASE = `${SERVER_HOST}:${SERVER_PORT}/api/`;
const SERVER2_BASE = `${SERVER2_HOST}:${SERVER2_PORT}/api/`;

/**
 * Generic API call
 *
 * @param endpoint API endpoint string to fetch
 * @param method HTTP method
 * @param body HTTP request body string
 * @param headers additional HTTP headers to be passed to 'fetch'
 * @param expectResponse wheter to expect a non-empty response body
 * 
 * @returns whatever the specified API endpoint returns
 */
const APICall = async (endpoint, method = "GET", body = undefined, headers = undefined, expectResponse = true, server_base_url = SERVER_BASE) => {
  let errors = [];

  try {
    const response = await fetch(new URL(endpoint, server_base_url), {
      method,
      body,
      headers,
      credentials: "include"
    });

    if (response.ok) {
      if (expectResponse) return await response.json();
    }
    else errors = (await response.json()).errors;
  } catch {
    const err = ["Failed to contact the server"];
    throw err;
  }

  if (errors.length !== 0)
    throw errors;
};

/**
 * Fetches all the concerts from the server
 *
 * @returns list of concerts
 */
const fetchConcerts = async () => await APICall("concerts");

/**
 * Fetches all the theaters from the server
 *
 * @returns list of theaters
 */
const fetchTheaters = async () => await APICall("theaters");

/**
 * Fetches all the seats from the server
 *
 * @returns list of seats
 */
const fetchSeats = async () => await APICall("seats");

/**
 * Fetches the reservations of the user
 * 
 * @returns list of reservations
 */
const getUserReservations = async () => await APICall("user-reservations");

/**
 * Fetches the reserved seats of the user
 * 
 * @returns list of reserved seats
 */
const getSeatsReserved = async () => await APICall("user-seats");


/**
 * Fetches the seats with some specific ids
 * 
 * @param seatIds the seats' id of the seats to retrieve
 *
 * @returns list of seats with some specific ids
 */
const getSeatsFromId = async (seatIds) => {
  const endpoint = `user-seat-id/${encodeURIComponent(seatIds)}`;
  return await APICall(endpoint, "GET", undefined, undefined, true);
};

/**
 * Delete the reserved seats of a specific user
 * 
 * @param reservedSeats the reserved seats to delete
 * 
 */
const deleteReservedSeats = async (reservedSeats) => await APICall(
  "reserved-seats",
  "DELETE",
  JSON.stringify({ reservedSeats }),
  { "Content-Type": "application/json" },
  false
);

/**
 * Attempts to login the user
 * 
 * @param username username of the user
 * @param password password of the user
 */
const login = async (username, password) => await APICall(
  "session",
  "POST",
  JSON.stringify({ username: username, password }),
  { "Content-Type": "application/json" }
);

/**
 * Logout.
 */
const logout = async () => await APICall(
  "session",
  "DELETE",
  undefined,
  undefined,
  false
);

/**
 * Update the seats when reserved
 * 
 * @param seatsToReserve the seats' id of the seats to reserve
 *
 * @returns list of seats with some specific ids
 */
const updateSeats = async (seatsToReserve) => await APICall(
  "seats-update",
  "POST",
  JSON.stringify({ seatsToReserve }),
  { "Content-Type": "application/json" }
);

/**
 * Fetches the token to access the second server
 */
const getAuthToken = async () => await APICall(
  "auth-token",
  "GET",
  undefined,
  undefined,
  true
);

/**
 * Fetches the discount from second server
 */
const getDiscount = async (authToken, seatsRes) => await APICall(
  "discount",
  "post",
  JSON.stringify({ seatsRes }),
  {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${authToken}`,
  },
  true,
  SERVER2_BASE
)

const API = {
  fetchConcerts,
  fetchTheaters,
  fetchSeats,
  deleteReservedSeats,
  login,
  logout,
  updateSeats,
  getUserReservations,
  getSeatsReserved,
  getSeatsFromId,
  getAuthToken,
  getDiscount,
};

export { API };