import { useContext, useState } from 'react';
import { SeatGrid } from './SeatGrid';
import { Accordion, Badge, Col, Container, Row } from 'react-bootstrap';
import { concertsContext, theatersContext, seatsContext } from './Miscellaneous';

function ConcertList({ onSelect, updateSeatStatus }) {
  const concerts = useContext(concertsContext);
  const theaters = useContext(theatersContext);
  const seats = useContext(seatsContext);
  const [activeConcertId, setActiveConcertId] = useState(null);

  /**
  * Function to handle which concert has been selected (clicking the accordion)
  * 
  * @param concertId the id of the concert where the user is clicking on
  * 
  */
  const handleToggle = (concertId) => {
    setActiveConcertId((prevId) => (prevId === concertId ? null : concertId));
    onSelect(concertId); // Notify the parent about the selected concert
  };

  return (
    <Accordion activeKey={activeConcertId ? activeConcertId.toString() : null} alwaysOpen={false}>
      {concerts.map((concert) => (
        <ConcertItem
          concert={concert}
          theater={theaters.find(t => t.id === concert.theater_id)}
          seats={seats}
          key={concert.id}
          onSelect={handleToggle}
          isSelected={concert.id === activeConcertId}
          updateSeatStatus={updateSeatStatus}
        />
      ))}
    </Accordion>
  );
}

function ConcertItem({ concert, theater, seats, onSelect, isSelected, updateSeatStatus }) {
  const theaterSize = theater.rows * theater.columns;
  const concertSeats = seats.filter(seat => seat.concert_id === concert.id);

  return (
    <Row>
      <Col>
        <Accordion.Item eventKey={concert.id.toString()}>
          <Accordion.Header
            onClick={() => onSelect(concert.id)} // Toggle selection
          >
            <Container style={{ paddingLeft: '0.5rem' }}>
              <Row className="align-items-center">
                <Col md="auto">
                  <Badge bg="dark">
                    <tt>{concert.id}</tt>
                  </Badge>
                </Col>
                <Col>
                  <Row className="align-items-center">
                    <Col>
                      <h5>{concert.name}</h5>
                      <p>Date: {new Date(concert.date).toLocaleDateString()}</p>
                      <p>Theater: {theater.name} ({theater.address})</p>
                      <p>Size: {theaterSize} seats</p>
                    </Col>
                    <Col md="auto" style={{ paddingLeft: '1rem' }}>
                      <Badge bg="light" text="dark">
                        Theater ID: {concert.theater_id}
                      </Badge>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Container>
          </Accordion.Header>
          {isSelected && (
            <Accordion.Body>
              <ConcertItemDetails concert={concert} theater={theater} seats={concertSeats} updateSeatStatus={updateSeatStatus}/>
            </Accordion.Body>
          )}
        </Accordion.Item>
      </Col>
    </Row>
  );
}

function ConcertItemDetails(props) {
  const { concert, theater, seats, updateSeatStatus } = props;

  const rows = Array.from({ length: theater.rows }, (_, i) => i + 1);
  const columns = Array.from({ length: theater.columns }, (_, i) => String.fromCharCode(65 + i));

  return (
    <SeatGrid concert={concert} rows={rows} columns={columns} seats={seats} updateSeatStatus={updateSeatStatus}/>
  );
}

export { ConcertList };
