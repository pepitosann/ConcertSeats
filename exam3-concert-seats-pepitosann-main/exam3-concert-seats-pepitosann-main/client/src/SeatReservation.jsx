import React, { useState, useContext, useEffect } from 'react';
import { Button, Form, Alert } from 'react-bootstrap';
import { seatsContext, usersContext } from './Miscellaneous';
import { API } from './API';

function SeatReservation({ concertId, updateSeatStatus }) {
  const [seatCount, setSeatCount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasReservation, setHasReservation] = useState(false);
  const seats = useContext(seatsContext);
  const users = useContext(usersContext);

  useEffect(() => {
    const checkReservation = async () => {
      if (concertId && users.username) {
        const reserved = await checkUserReservation(concertId);
        setHasReservation(reserved);
      }
    };

    checkReservation();

  }, [concertId, users.username, seats]);

  /**
  * Perform the reservation of the seats (first method)
  */
  const handleReserve = async () => {
    const count = parseInt(seatCount, 10);
    if (Number.isInteger(count) && count > 0) {
      try {
        if (hasReservation) {
          setError('You have already reserved seats for this concert.');
          setSuccess('');
          return;
        }

        const result = await reserveSeats(concertId, count);
        
        if (result.success) {
          setSuccess(`Successfully reserved ${count} seats.`);
          setError('');
          updateSeatStatus(result.reservedSeats.map(seat => ({ ...seat, status: 'occupied' })));
          setHasReservation(true);
        } else {
          setError(result.message);
          setSuccess('');
        }
      } catch (err) {
        setError('Failed to reserve seats.');
        setSuccess('');
      }
    } else {
      setError('Please enter a valid number of seats.');
      setSuccess('');
    }
  };

  /**
  * Perform the delte of the seats
  */
  const handleDeleteReservation = async () => {
    try {
      if (!hasReservation) {
        setError('No reservation found for this concert.');
        setSuccess('');
        return;
      }

      const result = await API.getSeatsReserved();
      const reservedSeats = result.filter(reservation => reservation.concert_id === concertId);

      if (reservedSeats.length === 0) {
        setError('No reserved seats found for this concert.');
        setSuccess('');
        return;
      }

      await API.deleteReservedSeats(reservedSeats);

      const seatIds = reservedSeats.map(seat => seat.seat_id);
      const seatsToUpdate = await API.getSeatsFromId(seatIds);
      updateSeatStatus(seatsToUpdate.map(seat => ({ ...seat, status: 'available' })));

      setSuccess('Reservation successfully deleted.');
      setError('');
      setHasReservation(false);
    } catch (err) {
      setError('Failed to delete reservation.');
      setSuccess('');
    }
  };

  /**
  * Function called by the handleReserve to actually reserve seats and check if there is the possibility to do it
  * 
  * @param concertId the id of the concert where the user is reserving seats
  * @param count the number of seats to reserve
  * 
  */
  const reserveSeats = async (concertId, count) => {
    try {
      // Fetch all available seats for the concert
      const updatedSeats = await API.fetchSeats();
      const availableSeats = updatedSeats.filter(seat => seat.concert_id === concertId && seat.status === 'available');
  
      // Check if enough seats are available
      if (availableSeats.length >= count) {
        const seatsToReserve = availableSeats.slice(0, count);
  
        // Temporarily mark them as 'occupied' locally
        seatsToReserve.forEach(seat => {
          seat.status = 'occupied';
        });
  
        try {
          // Call the API to update the reserved seats
          await API.updateSeats(seatsToReserve);
          return { success: true, reservedSeats: seatsToReserve };
        } catch (error) {
          // If there's an error (e.g., concurrency issue), revert status locally
          seatsToReserve.forEach(seat => {
            seat.status = 'available';
          });
          return { success: false, message: 'Failed to reserve seats. They may have been reserved by another user.' };
        }
      } else {
        // Not enough seats available
        return { success: false, message: `Not enough seats available. Only ${availableSeats.length} seats are available.` };
      }
    } catch (err) {
      return { success: false, message: 'An error occurred while fetching seats or updating reservations.' };
    }
  };

  /**
  * Function called by the useEffect to check if the user has a reservation
  * 
  * @param concertId the id of the concert where the user is reserving seats
  * @param username the username of the user who is reserving seats
  * 
  */
  const checkUserReservation = async (concertId) => {
    try {
      const reservations = await API.getUserReservations();
      return reservations.some(reservation => reservation.concert_id === concertId);
    } catch (error) {
      console.error('Failed to check user reservation:', error);
      return false;
    }
  };

  return (
    <div className="border p-3 bg-light">
      <h4>Reserve Seats for Concert {concertId}</h4>
      <Form>
        <Form.Group controlId="seatCount">
          <Form.Label>Number of seats to reserve</Form.Label>
          <Form.Control
            type="text"
            value={seatCount}
            onChange={(event) => setSeatCount(event.target.value)}
            placeholder="Enter number of seats"
          />
        </Form.Group>
        <Button
          variant="primary"
          className="mt-2"
          onClick={handleReserve}
          disabled={hasReservation}
        >
          Reserve
        </Button>
        <Button
          variant="danger"
          className="mt-2 ms-2"
          onClick={handleDeleteReservation}
          disabled={!hasReservation} 
        >
          <i className="bi bi-trash me-2"></i>
          Delete Reservation
        </Button>
      </Form>

      {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
      {success && <Alert variant="success" className="mt-3">{success}</Alert>}
    </div>
  );
}

export { SeatReservation };