import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useEffect, useState } from 'react';
import { Concert } from './Concert';
import { ConcertList } from './ConcertList';
import { Theater } from './Theater';
import { Seat } from './Seat';
import { SeatReservation } from './SeatReservation';
import { BrowserRouter, Routes, Route, Outlet, useNavigate } from 'react-router-dom';
import { Col, Container, Row, Alert } from 'react-bootstrap';
import { concertsContext, theatersContext, seatsContext, usersContext, ErrorsAlert, MyNavbar, NotFoundPage } from './Miscellaneous';
import { API } from './API';
import { LoginForm } from './LoginForm';

function App() {
  return (
    <BrowserRouter>
      <Main />
    </BrowserRouter>
  );
}

function Main() {

  const navigate = useNavigate();

  /** The list of concerts */
  const [concerts, setConcerts] = useState([]);

  /** The list of theaters */
  const [theaters, setTheaters] = useState([]);

  /** The list of theaters */
  const [seats, setSeats] = useState([]);

  const [authToken, setAuthToken] = useState(undefined);

  /**
   * Information about the currently logged in user.
   * This is undefined when no user is logged in
   */
  const [user, setUser] = useState(undefined);

  const [seatsRes, setSeatsRes] = useState([]);

  /** A list of errors */
  const [errors, setErrors] = useState([]);

  const [discount, setDiscount] = useState(null);

  const [showDiscountNotification, setShowDiscountNotification] = useState(false);

  useEffect(() => {
    // Load the list of concerts, the theaters and seats from the server
    Promise.all([API.fetchConcerts(), API.fetchTheaters(), API.fetchSeats()])
      .then(res => {
        const c = res[0]; // Concerts
        const t = res[1]; // Theaters
        const s = res[2]; // Seats

        setConcerts(
          c.map(concert => new Concert(
            concert.id,
            concert.name,
            concert.date,
            concert.theater_id
          ))
        );

        setTheaters(
          t.map(theater => new Theater(
            theater.id,
            theater.name,
            theater.address,
            theater.rows,
            theater.columns
          ))
        );

        setSeats(
          s.map(seat => new Seat(
            seat.id,
            seat.code,
            seat.row,
            seat.column,
            seat.concert_id,
            seat.status
          ))
        );

      })
      .catch(err => setErrors(err));

    if (user) {
      API.getAuthToken().then((res) => setAuthToken(res.token));
    }

  }, []);

  useEffect(() => {
    const fetchSeatsData = async () => {
      if (user) {
        try {
          const resSeats = await API.getSeatsReserved();
          const seatIds = resSeats.map(reservation => reservation.seat_id);

          if (seatIds.length > 0) {
            await API.getSeatsFromId(seatIds).then(res => setSeatsRes(res));
          } else {
            setSeatsRes([]);
          }
        } catch (error) {
          console.error('Error fetching seats:', error);
        }
      }
    };

    fetchSeatsData();

  }, [user, seats]);

  useEffect(() => {
    if (user && seatsRes.length > 0) {
      API.getAuthToken()
        .then((res) => {
          setAuthToken(res.token);
          API.getDiscount(res.token, seatsRes)
            .then(val => setDiscount(val.discount),
              setShowDiscountNotification(true));
        })
        .catch((error) => {
          console.error('Error fetching auth token:', error);
        });
    }
  }, [seatsRes]);


  /**
   * Perform the login
   * 
   * @param username username of the user
   * @param password password of the user
   * @param onFinish optional callback to be called on login success or fail
   */
  const login = (username, password, onFinish) => {
    API.login(username, password)
      .then(user => {
        setErrors([]);
        setUser(user);
        navigate("/");
      })
      .catch(err => setErrors(err))
      .finally(() => onFinish?.());
  };

  /**
  * Perform the logout
  */
  const logout = () => {
    API.logout()
      .then(() => {
        setUser(undefined);
        setShowDiscountNotification(false);
        setAuthToken(undefined);
      })
      .catch(err => {
        setErrors(err.filter(e => e !== "Not authenticated"));
      });
  };

  /**
  * Perform the update of the seat status
  * 
  * @param updatedSeats contains the updates seats to modify the seats state
  */
  const updateSeatStatus = (updatedSeats) => {
    setSeats((prevSeats) =>
      prevSeats.map((seat) => {
        const updatedSeat = updatedSeats.find((s) => s.id === seat.id);
        if (updatedSeat) {
          setSeats(updatedSeat);
          return { ...seat, status: updatedSeat.status };
        }
        return seat;
      })
    );
  };

  return (
    <Routes>
      <Route path="/" element={<Header user={user} logoutCbk={logout} errors={errors} clearErrors={() => setErrors([])} />}>
        <Route path="" element={
          <HomePage
            user={user}
            errorAlertActive={errors.length > 0}
            concerts={concerts}
            theaters={theaters}
            seats={seats}
            updateSeatStatus={updateSeatStatus}
            discount={discount}
            showDiscountNotification={showDiscountNotification}
            setShowDiscountNotification={setShowDiscountNotification}
            reservedSeats={seatsRes}
          />}
        />
        <Route path="login" element={<LoginForm loginCbk={login} errorAlertActive={errors.length > 0} />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function HomePage(props) {
  const [selectedConcertId, setSelectedConcertId] = useState(null);

  const handleSelectConcert = (concertId) => {
    setSelectedConcertId(prevId => prevId === concertId ? null : concertId);
  };

  const handleCloseNotification = () => {
    props.setShowDiscountNotification(false);
  };

  return (
    <concertsContext.Provider value={props.concerts}>
      <theatersContext.Provider value={props.theaters}>
        <seatsContext.Provider value={props.seats}>
          <usersContext.Provider value={props.user}>
            <Container fluid style={{ paddingLeft: '2rem', paddingRight: '2rem', paddingBottom: '1rem', marginTop: props.errorAlertActive ? '2rem' : '6rem' }}>
              <Row className="justify-content-center">
                <Col lg={props.user ? 8 : 12} style={{ maxWidth: '70%' }}>
                  <h1>TicketToo</h1>
                  <h3>The best place to buy moments to share</h3>
                  {props.user ? (
                    <div>
                      <h2>Welcome, {props.user.username}!</h2>
                      <p>You can book a seat by selecting a concert from the list below. Once you've chosen a concert, you can select your seat using the seat grid or the interface that will appear on the right.</p>

                      {props.reservedSeats.length > 0 ? (
                        <div>
                          <h3>Your Reserved Seats</h3>
                          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 row-cols-xl-5 row-cols-xl-6 g-2">
                            {props.reservedSeats.map(seat => (
                              <div className="col" key={seat.id}>
                                <div className="card h-100 shadow-sm" style={{ minWidth: '120px', padding: '0.5rem' }}>
                                  <div className="card-body" style={{ padding: '0.5rem' }}>
                                    <h6 className="card-title" style={{ fontSize: '1rem' }}>
                                      <i className="bi bi-chair-fill"></i> Seat {seat.code}
                                    </h6>
                                    <p className="card-text" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                      <small>Concert ID: {seat.concert_id}</small>
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p>No reserved seats yet.</p>
                      )}

                    </div>
                  ) : (
                    <p>Login to start buying tickets!</p>
                  )}
                  <hr className="my-4" />
                </Col>

                {props.user && selectedConcertId && (
                  <Col lg={4} className="d-none d-lg-block">
                    <SeatReservation
                      concertId={selectedConcertId}
                      updateSeatStatus={props.updateSeatStatus}
                    />
                  </Col>
                )}
              </Row>

              {props.showDiscountNotification && props.discount !== null && (
                <Row>
                  <Col>
                    <DiscountNotification
                      discount={props.discount}
                      onClose={handleCloseNotification}
                    />
                  </Col>
                </Row>
              )}

              <Row>
                {props.concerts.length === 0 ? (
                  <Col className="text-center">
                    <p>No concerts available.</p>
                  </Col>
                ) : (
                  <Col className="text-center">
                    <h3 className="my-3">The concerts available on our platform:</h3>
                    <ConcertList onSelect={handleSelectConcert} updateSeatStatus={props.updateSeatStatus} />
                  </Col>
                )}
              </Row>

              <Footer />
            </Container>
          </usersContext.Provider>
        </seatsContext.Provider>
      </theatersContext.Provider>
    </concertsContext.Provider>
  );
}

function Header(props) {
  return (
    <>
      <MyNavbar user={props.user} logoutCbk={props.logoutCbk} />
      {
        props.errors.length > 0 ? <ErrorsAlert errors={props.errors} clear={props.clearErrors} /> : false
      }
      <Outlet />
    </>
  );
}

function DiscountNotification({ discount, onClose }) {
  return (
    <Alert variant="success" onClose={onClose} dismissible>
      <Alert.Heading>Great News!</Alert.Heading>
      <p>
        Your reserved seats grant you a discount of {discount}% on your next booking. Enjoy!
      </p>
    </Alert>
  );
}

function Footer() {
  return (
    <footer className="mt-5 py-3 bg-dark text-white">
      <Container>
        <Row>
          <Col className="text-center">
            <p>&copy; 2024 TicketTwo. All rights reserved.</p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
}

export default App;