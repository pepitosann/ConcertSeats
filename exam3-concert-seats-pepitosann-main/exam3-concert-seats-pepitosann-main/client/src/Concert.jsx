/**
 * The Concert type, used throughout the app.
 * This is a constructor function.
 *
 * @param id the concert ID, a unique integer.
 * @param name the concert name.
 * @param date the date of the concert.
 * @param theater_id the theater associated to that concert.
 */
function Concert(id, name, date, theater_id) {
    this.id = id;
    this.name = name;
    this.date = date;
    this.theater_id = theater_id;
  }
  
  export { Concert };