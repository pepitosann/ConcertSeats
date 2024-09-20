import { createContext } from "react";
import { Alert, Container, Nav, Navbar } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";

/** Context used to propagate the list of models */
const concertsContext = createContext();

/** Context used to propagate the list of theaters */
const theatersContext = createContext();

/** Context used to propagate the list of seats */
const seatsContext = createContext();

/** Context used to propagate the user object */
const usersContext = createContext();

/**
 * The navigation bar at the top of the app.
 * This is meant to be inserted as a parent route to the entire app
 * 
 * @param props.user object with all the currently logged in user's info
 * @param props.logoutCbk callback to perform the user's logout
 */
function MyNavbar(props) {

  const navigate = useNavigate();

  return (
    <>
      <Navbar className="shadow" fixed="top" bg="light" style={{ "marginBottom": "2rem" }}>
        <Container>
          <Navbar.Brand href="/" onClick={event => { event.preventDefault(); navigate("/"); }}>
            <i className="bi bi-speaker"></i>
            {" "}
            TicketToo
          </Navbar.Brand>
          <Nav>
            {
              props.user ?
                <Navbar.Text>
                  Logged in as: {props.user.username} | <a href="/logout" onClick={event => { event.preventDefault(); props.logoutCbk(); }}>Logout</a>
                </Navbar.Text>
                :
                <Nav.Link href="/login" active={false} onClick={event => { event.preventDefault(); navigate("/login"); }}>
                  Login
                  {" "}
                  <i className="bi bi-person-fill" />
                </Nav.Link>
            }
          </Nav>
        </Container>
      </Navbar>
    </>
  );
}

function ErrorsAlert(props) {
  return (
    <Alert variant="danger" dismissible onClose={props.clear} style={{ "margin": "2rem", "marginTop": "6rem" }}>
      {props.errors.length === 1 ? props.errors[0] : ["Errors: ", <br key="br" />, <ul key="ul">
        {
          props.errors.map((e, i) => <li key={i + ""}>{e}</li>)
        }
      </ul>]}
    </Alert>
  );
}

/**
 * Informs the user that the route is not valid
 */
function NotFoundPage() {

  return <>
    <div style={{ "textAlign": "center", "paddingTop": "5rem" }}>
      <h1>
        <i className="bi bi-exclamation-circle-fill" />
        {" "}
        The page cannot be found
        {" "}
        <i className="bi bi-exclamation-circle-fill" />
      </h1>
      <br />
      <p>
        The requested page does not exist, please head back to the <Link to={"/"}>app</Link>.
      </p>
    </div>
  </>;
}

export {
  concertsContext,
  theatersContext,
  seatsContext,
  usersContext,
  MyNavbar,
  ErrorsAlert,
  NotFoundPage
};