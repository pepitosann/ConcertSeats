/**
 * The Seat type, used throughout the app.
 * This is a constructor function.
 *
 * @param id the seat ID, a unique integer.
 * @param code the seat code.
 * @param row the id of the row of the seat.
 * @param address the id of the column of the seat.
 * @param concert_id the id of the concert associated to the seat.
 * @param status the status of the seat.
 */
function Seat(id, code, row, column, concert_id, status) {
    this.id = id;
    this.code = code;
    this.row = row;
    this.column = column;
    this.concert_id = concert_id;
    this.status = status;
  }
  
  export { Seat };