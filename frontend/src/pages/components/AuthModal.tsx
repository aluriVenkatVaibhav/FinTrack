import React, { useState } from "react";
import { Modal, Button } from "react-bootstrap";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import { User } from "../../schemas";

interface AuthModalProps {
  visible: string;
  onClose: () => void;
  login: (user: User, auth: string) => void;
  isLoginScreen?: boolean;
}

const AuthModal: React.FC<AuthModalProps> = ({
  visible,
  onClose,
  login,
  isLoginScreen = true,
}) => {
  const [isLogin, setIsLogin] = useState(isLoginScreen);

  return (
    <Modal show={Boolean(visible)} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>{isLogin ? "Login" : "Sign Up"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {isLogin ? (
          <LoginForm onClose={onClose} login={login} />
        ) : (
          <SignupForm onClose={onClose} login={login} />
        )}
        <div className="text-center mt-3">
          <span>
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <Button
              variant="link"
              onClick={() => setIsLogin(!isLogin)}
              style={{ padding: 0 }}
            >
              {isLogin ? "Sign Up" : "Login"}
            </Button>
          </span>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default AuthModal;
