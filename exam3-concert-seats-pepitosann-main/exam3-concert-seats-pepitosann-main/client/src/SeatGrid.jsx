import React, { useState, useEffect, useContext } from 'react';
import { Badge, Col, Container, Row, Button, Card } from 'react-bootstrap';
import { usersContext } from './Miscellaneous';
import { API } from './API';

function SeatGrid({ concert, rows, columns, seats, updateSeatStatus }) {
  const [localSeats, setLocalSeats] = useState(seats);
  const [hasReservedSeats, setHasReservedSeats] = useState(false);
  const [requestedSeats, setRequestedSeats] = useState([]);
  const [conflictedSeats, setConflictedSeats] = useState([]);
  const user = useContext(usersContext);

  useEffect(() => {
    const fetchUserReservations = async () => {
      if (user) {
        try {
          const currentConcertId = concert.id;
          const userReservations = await API.getUserReservations();
          const isReserved = userReservations.some(reservation =>
            reservation.concert_id === currentConcertId
          );
          setHasReservedSeats(isReserved);
        } catch (error) {
          console.error('Error fetching user reservations:', error);
        }
      }
    };

    fetchUserReservations().then(setLocalSeats(seats));

  }, [user, concert, seats]);

  /*
  * Change the requested seats as something happens in the local seat 
  * so as to dynamically change the number of requested seats into the seat grid
  */
  useEffect(() => {
    setRequestedSeats(localSeats.filter(seat => seat.status === 'requested'));
  }, [localSeats]);

  const availableSeats = localSeats.filter(seat => seat.status === 'available').length;
  const occupiedSeats = localSeats.filter(seat => seat.status === 'occupied').length;
  const totalSeats = localSeats.length;

  /**
  * Function to handle the user clicking the seats
  * 
  * @param seatCode the code of the seat where the user is clicking on
  * 
  */
  const handleSeatClick = (seatCode) => {
    if (!user || hasReservedSeats) return;

    setLocalSeats(prevSeats =>
      prevSeats.map(seat => {
        if (seat.code === seatCode) {
          if (seat.status === 'available') {
            return { ...seat, status: 'requested' };
          } else if (seat.status === 'requested') {
            return { ...seat, status: 'available' };
          }
        }
        return seat;
      })
    );
  };

  /**
  * Confirm the reservation
  */
  const handleConfirmReservation = async () => {
    const requestedSeats = localSeats.filter(seat => seat.status === 'requested');

    try {
      const response = await API.updateSeats(requestedSeats);

      if (response.success) {
        const updatedSeats = localSeats.map(seat =>
          requestedSeats.some(requestedSeat => requestedSeat.code === seat.code)
            ? { ...seat, status: 'occupied' }
            : seat
        );
        setLocalSeats(updatedSeats);
        updateSeatStatus(updatedSeats);
        setHasReservedSeats(true);
      } else {
        // Seats were already taken by others
        setConflictedSeats(response.conflictedSeats);

        const conflictedSeatIds = response.conflictedSeats.map(id => Number(id));

        // Highlight conflicted seats in blue
        const updatedSeats = localSeats.map(seat =>
          conflictedSeatIds.includes(seat.id)
            ? { ...seat, status: 'conflicted' }
            : seat
        );
        setLocalSeats(updatedSeats);

        setTimeout(() => {
          setLocalSeats(prevSeats =>
            prevSeats.map(seat =>
              seat.status === 'conflicted' ? { ...seat, status: 'available' } : seat
            )
          );
          setConflictedSeats([]);
        }, 5000);
      }
    } catch (error) {
      console.error('Reservation failed:', error);
      setLocalSeats(prevSeats =>
        prevSeats.map(seat =>
          requestedSeats.some(requestedSeat => requestedSeat.code === seat.code)
            ? { ...seat, status: 'available' }
            : seat
        )
      );
    }
  };

  /**
  * Cancel/Undo the reservation
  */
  const handleCancelReservation = () => {
    const seatsToReset = localSeats.filter(seat => seat.status === 'requested');
    if (seatsToReset.length > 0) {
      const updatedSeats = localSeats.map(seat =>
        seat.status === 'requested' ? { ...seat, status: 'available' } : seat
      );
      setLocalSeats(updatedSeats);
      setRequestedSeats([]);
    }
  };

  return (
    <div>
      <Card className="mb-3">
        <Card.Body>
          <Card.Title>Seat Information</Card.Title>
          <div className="d-flex justify-content-between">
            <div><strong>Total Seats:</strong> {totalSeats}</div>
            <div><strong>Available Seats:</strong> {availableSeats}</div>
            {user && (
              <div><strong>Requested Seats:</strong> {requestedSeats.length}</div>
            )}
            <div><strong>Occupied Seats:</strong> {occupiedSeats}</div>
          </div>
        </Card.Body>
      </Card>

      <Container>
        <Row className="mb-3">
          <Col>
            <Badge bg="success" style={{ width: '5rem', height: '3rem', display: 'inline-block', lineHeight: '2.5rem' }}>
              Available
            </Badge>
          </Col>
          {user && (
            <>
              <Col>
                <Badge bg="warning" text="dark" style={{ width: '5rem', height: '3rem', display: 'inline-block', lineHeight: '2.5rem' }}>
                  Requested
                </Badge>
              </Col>
            </>
          )}
          <Col>
            <Badge bg="danger" style={{ width: '5rem', height: '3rem', display: 'inline-block', lineHeight: '2.5rem' }}>
              Occupied
            </Badge>
          </Col>
          {user && (
            <Col>
              <Badge bg="primary" style={{ width: '5rem', height: '3rem', display: 'inline-block', lineHeight: '2.5rem' }}>
                Conflicted
              </Badge>
            </Col>
          )}
        </Row>
      </Container>

      <Container>
        {rows.map(row => (
          <Row key={row} className="mb-2 justify-content-center">
            {columns.map((col, colIndex) => {
              const seat = localSeats.find(seat => seat.row === row && seat.column === col);
              const seatCode = `${row}${col}`;
              const seatStatus = seat ? seat.status : 'unavailable';

              return (
                <Col key={colIndex} xs="auto" className="text-center">
                  <Badge
                    bg={
                      seatStatus === 'available'
                        ? 'success'
                        : seatStatus === 'requested'
                          ? 'warning'
                          : seatStatus === 'occupied'
                            ? 'danger'
                            : seatStatus === 'conflicted'
                              ? 'primary'
                              : 'secondary'
                    }
                    style={{ width: '3rem', height: '3rem', display: 'inline-block', lineHeight: '3rem', cursor: user && !hasReservedSeats ? 'pointer' : 'default' }}
                    onClick={() => handleSeatClick(seatCode)}
                  >
                    {seat ? seatCode : 'X'}
                  </Badge>
                </Col>
              );
            })}
          </Row>
        ))}
      </Container>

      {user && (
        <>
          <Button
            variant="primary"
            className="mt-2"
            onClick={handleConfirmReservation}
            disabled={hasReservedSeats}
          >
            Confirm Reservation
          </Button>
          <Button
            variant="secondary"
            className="mt-2 ms-2"
            onClick={handleCancelReservation}
            disabled={requestedSeats.length === 0}
          >
            Cancel Reservation
          </Button>
        </>
      )}
    </div>
  );
}

export { SeatGrid };
