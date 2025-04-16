import { Container, Navbar, Nav, Button } from "react-bootstrap";
import { useAuth } from "../../context/AuthCon";
import { useState } from "react";
import AuthModal from "./AuthModal";
import { Link, useLocation } from "react-router";

function Header() {
  const { auth, login, logout, toggleTheme } = useAuth();
  const [show, setShow] = useState<string>("");
  const location = useLocation();

  return (
    <>
      <Navbar className="border-bottom mb-4 py-3">
        <Container>
          <Navbar.Brand href="/" className="fs-4">
            FinTrack
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="main-navbar" />
          <Navbar.Collapse id="main-navbar" className="justify-content-between">
            <Nav className="mx-auto">
              <Nav.Link as={Link} to="/" active={location.pathname === "/"}>
                Home
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/income"
                active={location.pathname === "/income"}
                className={(location.pathname === "/income" && "fw-bold") || ""}
              >
                Incomes
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/expense"
                active={location.pathname === "/expense"}
                className={
                  (location.pathname === "/expense" && "fw-bold") || ""
                }
              >
                Expenses
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/transaction"
                active={location.pathname === "/transaction"}
                className={
                  (location.pathname === "/transaction" && "fw-bold") || ""
                }
              >
                Transactions
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/budget"
                active={location.pathname === "/budget"}
                className={(location.pathname === "/budget" && "fw-bold") || ""}
              >
                Budget
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/savings_goals"
                active={location.pathname === "/savings_goals"}
                className={
                  (location.pathname === "/savings_goals" && "fw-bold") || ""
                }
              >
                Saving Goals
              </Nav.Link>
            </Nav>
            {!auth ? (
              <div className="text-end">
                <Button
                  variant="primary"
                  className="me-2"
                  onClick={() => setShow("login")}
                >
                  Login
                </Button>

                <Button
                  variant="outline-primary"
                  onClick={() => setShow("signup")}
                >
                  Sign-up
                </Button>

                <Button
                  className="ms-3"
                  variant="outline-secondary"
                  onClick={toggleTheme}
                >
                  Toggle Theme
                </Button>
              </div>
            ) : (
              <div className="text-end">
                <Link to="/settings" className="btn me-3">
                  Settings
                </Link>
                <Button onClick={() => logout()} variant="danger">
                  Logout
                </Button>
                <Button
                  className="ms-3 fw-bolder"
                  variant="outline-secondary"
                  onClick={toggleTheme}
                >
                  Toggle Theme
                </Button>
              </div>
            )}
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {show && (
        <AuthModal
          login={login}
          visible={show}
          onClose={() => setShow("")}
          isLoginScreen={show == "login" ? true : false}
        />
      )}
    </>
  );
}

export default Header;
