import React from "react";
import { Button, Form } from "react-bootstrap";
import { Formik, Field, Form as FormikForm, ErrorMessage } from "formik";
import * as Yup from "yup";
import { User } from "../../schemas";

const BASE_URL = process.env.BASE_URL;

const LoginSchema = Yup.object().shape({
  username_or_email: Yup.string().required("Username or email is required"),
  password: Yup.string().required("Password is required"),
});

interface Props {
  onClose: () => void;
  login: (user: User, jwt: string) => void;
}

const LoginForm: React.FC<Props> = ({ onClose, login }) => {
  const handleSubmit = async (values: {
    username_or_email: string;
    password: string;
  }) => {
    try {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok)
        throw new Error(`Login failed with status ${response.status}`);
      const result = await response.json();
      const { user, jwt } = result.results;

      login(user, jwt);
      onClose();
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <Formik
      initialValues={{ username_or_email: "", password: "" }}
      validationSchema={LoginSchema}
      onSubmit={handleSubmit}
    >
      <FormikForm>
        <Form.Group>
          <Form.Label>Username or Email</Form.Label>
          <Field name="username_or_email" as={Form.Control} />
          <ErrorMessage
            name="username_or_email"
            component="div"
            className="text-danger"
          />
        </Form.Group>
        <Form.Group className="mt-3">
          <Form.Label>Password</Form.Label>
          <Field name="password" type="password" as={Form.Control} />
          <ErrorMessage
            name="password"
            component="div"
            className="text-danger"
          />
        </Form.Group>
        <Button className="mt-3 w-100" variant="primary" type="submit">
          Login
        </Button>
      </FormikForm>
    </Formik>
  );
};

export default LoginForm;
