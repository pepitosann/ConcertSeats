BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS theaters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  rows INTEGER NOT NULL,
  columns INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS concerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  theater_id INTEGER NOT NULL,
  FOREIGN KEY (theater_id) REFERENCES theaters(id)
);

CREATE TABLE IF NOT EXISTS seats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL,
  row INTEGER NOT NULL,
  column TEXT NOT NULL,
  concert_id INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('available', 'occupied')),
  FOREIGN KEY (concert_id) REFERENCES concerts(id)
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  loyal INTEGER NOT NULL CHECK("loyal" IN (0, 1)),
  hash TEXT NOT NULL,
  salt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  concert_id INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (concert_id) REFERENCES concerts(id),
  UNIQUE (user_id, concert_id)
);

CREATE TABLE IF NOT EXISTS reserved_seats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reservation_id INTEGER NOT NULL,
  seat_id INTEGER NOT NULL,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id),
  FOREIGN KEY (seat_id) REFERENCES seats(id)
);

-- Insert data into theaters
INSERT INTO theaters (name, address, rows, columns) VALUES 
('Gran Teatro La Fenice', 'Campo S. Fantin, 1965, 30124 Venezia VE', 4, 8),
('Teatro Massimo', 'P.za Giuseppe Verdi, 90138 Palermo PA', 6, 10),
('Teatro Alla Scala', 'V. Filodrammatici, 2, 20121 Milano MI', 9, 14);

-- Insert data into concerts
INSERT INTO concerts (name, date, theater_id) VALUES 
('Love On Tour', '2024-08-30', 1),
('After Hours til Dawn Tour', '2024-09-15', 2),
('Noel Gallagher High Flying Birds Tour', '2024-10-05', 3),
('Music Of The Spheres World Tour', '2024-11-12', 1),
('Memento Mori World Tour', '2024-12-01', 2),
('The Eras Tour', '2024-12-20', 3);

INSERT INTO seats (code, row, column, concert_id, status) 
SELECT 
    r.row_number || c.column_letter, 
    r.row_number, 
    c.column_letter, 
    1 AS concert_id, 
    'available' AS status
FROM 
    (SELECT 1 AS row_number UNION SELECT 2 UNION SELECT 3 UNION SELECT 4) AS r, 
    (SELECT 'A' AS column_letter UNION SELECT 'B' UNION SELECT 'C' UNION SELECT 'D' UNION SELECT 'E' UNION SELECT 'F' UNION SELECT 'G' UNION SELECT 'H') AS c;

INSERT INTO seats (code, row, column, concert_id, status) 
SELECT 
    r.row_number || c.column_letter, 
    r.row_number, 
    c.column_letter, 
    2 AS concert_id, 
    'available' AS status
FROM 
    (SELECT 1 AS row_number UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6) AS r, 
    (SELECT 'A' AS column_letter UNION SELECT 'B' UNION SELECT 'C' UNION SELECT 'D' UNION SELECT 'E' UNION SELECT 'F' UNION SELECT 'G' UNION SELECT 'H' UNION SELECT 'I' UNION SELECT 'J') AS c;

INSERT INTO seats (code, row, column, concert_id, status) 
SELECT 
    r.row_number || c.column_letter, 
    r.row_number, 
    c.column_letter, 
    3 AS concert_id, 
    'available' AS status
FROM 
    (SELECT 1 AS row_number UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) AS r, 
    (SELECT 'A' AS column_letter UNION SELECT 'B' UNION SELECT 'C' UNION SELECT 'D' UNION SELECT 'E' UNION SELECT 'F' UNION SELECT 'G' UNION SELECT 'H' UNION SELECT 'I' UNION SELECT 'J' UNION SELECT 'K' UNION SELECT 'L' UNION SELECT 'M' UNION SELECT 'N') AS c;

INSERT INTO seats (code, row, column, concert_id, status) 
SELECT 
    r.row_number || c.column_letter, 
    r.row_number, 
    c.column_letter, 
    4 AS concert_id, 
    'available' AS status
FROM 
    (SELECT 1 AS row_number UNION SELECT 2 UNION SELECT 3 UNION SELECT 4) AS r, 
    (SELECT 'A' AS column_letter UNION SELECT 'B' UNION SELECT 'C' UNION SELECT 'D' UNION SELECT 'E' UNION SELECT 'F' UNION SELECT 'G' UNION SELECT 'H') AS c;

INSERT INTO seats (code, row, column, concert_id, status) 
SELECT 
    r.row_number || c.column_letter, 
    r.row_number, 
    c.column_letter, 
    5 AS concert_id, 
    'available' AS status
FROM 
    (SELECT 1 AS row_number UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6) AS r, 
    (SELECT 'A' AS column_letter UNION SELECT 'B' UNION SELECT 'C' UNION SELECT 'D' UNION SELECT 'E' UNION SELECT 'F' UNION SELECT 'G' UNION SELECT 'H' UNION SELECT 'I' UNION SELECT 'J') AS c;

INSERT INTO seats (code, row, column, concert_id, status) 
SELECT 
    r.row_number || c.column_letter, 
    r.row_number, 
    c.column_letter, 
    6 AS concert_id, 
    'available' AS status
FROM 
    (SELECT 1 AS row_number UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) AS r, 
    (SELECT 'A' AS column_letter UNION SELECT 'B' UNION SELECT 'C' UNION SELECT 'D' UNION SELECT 'E' UNION SELECT 'F' UNION SELECT 'G' UNION SELECT 'H' UNION SELECT 'I' UNION SELECT 'J' UNION SELECT 'K' UNION SELECT 'L' UNION SELECT 'M' UNION SELECT 'N') AS c;

INSERT INTO users (username, loyal, hash, salt) VALUES 
('pepitosann', 1, '1f1d5214763ccc27304465a6c88505a6b9ccd2b2f07b9c6e05ecd280b2a21253', '96a0f4e845fc918f5400b4e92ed0d345'),
('luca', 1, 'b470ede82433afa01946c39103cd1e99692eba143d021f8478bd0bf010e53bc6', 'cef0009f306c0743825d0a4d82b936cd'),
('saimon', 0, '8e42c9de4565fe3541f072582532687242d38670d1f97ec0bf54c7654d2e1aef', 'cc87df425167e7e0d33555d096e11c2b'),
('cricod', 0, 'fd7767ae5d1867d86c130589fadc676787e9c74198a2c7925f5e5d132a430225', '2cafabadd7d7fadf9c8e41c65133e45f'),
('elidegiu', 1, '9bd60ac4a45684b2c2fbd5c0b936a3bb65a87d4548e8b49e10c48819678392f8', '1d68f9281e66b5b48e54b4978507da3a'),
('nicco', 0, '61b8423a350e875a88d4809b0a6adfbef644107abcfc6565b3de01c78cefcb3c', 'sBFIhi3S3C14XKMbvE1G8E6h5PoxSFQY');

INSERT INTO reservations (user_id, concert_id) VALUES 
(1, 1),
(1, 3),
(2, 2), 
(2, 4),
(3, 2),
(3, 1),
(4, 4),
(4, 3); 

INSERT INTO reserved_seats (reservation_id, seat_id) VALUES 
(1, 1), (1, 2), 
(2, 95), (2, 96),
(3, 41), (3, 42), 
(4, 220), (4, 221),
(5, 73), (5, 74),
(6, 4), (6, 5), 
(7, 238), (7, 239), 
(8, 182), (8, 183); 

UPDATE seats
SET status = 'occupied'
WHERE id IN (1, 2);

UPDATE seats
SET status = 'occupied'
WHERE id IN (95, 96); 

UPDATE seats
SET status = 'occupied'
WHERE id IN (41, 42); 

UPDATE seats
SET status = 'occupied'
WHERE id IN (220, 221);

UPDATE seats
SET status = 'occupied'
WHERE id IN (73, 74);

UPDATE seats
SET status = 'occupied'
WHERE id IN (4, 5);

UPDATE seats
SET status = 'occupied'
WHERE id IN (238, 239);

UPDATE seats
SET status = 'occupied'
WHERE id IN (182, 183);

COMMIT;