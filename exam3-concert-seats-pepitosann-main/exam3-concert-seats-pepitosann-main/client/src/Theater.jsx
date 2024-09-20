/**
 * The Theater type, used throughout the app.
 * This is a constructor function.
 *
 * @param id the theater ID, a unique integer.
 * @param name the theater name.
 * @param address the address of the theater.
 * @param rows the rows of the theater.
 * @param columns the columns of the theater.
 */
function Theater(id, name, address, rows, columns) {
    this.id = id;
    this.name = name;
    this.address = address;
    this.rows = rows;
    this.columns = columns;
  }
  
  export { Theater };