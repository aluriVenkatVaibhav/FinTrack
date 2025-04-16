import React from "react";
import { Button, Form } from "react-bootstrap";
import { Formik, Field, Form as FormikForm, ErrorMessage } from "formik";
import * as Yup from "yup";
import { User } from "../../schemas";

const BASE_URL = process.env.BASE_URL;

const SignupSchema = Yup.object().shape({
  username: Yup.string().required("Username is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string().required("Password is required"),
  cpassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Confirm password is required"),
});

interface Props {
  onClose: () => void;
  login: (user: User, jwt: string) => void;
}

const SignupForm: React.FC<Props> = ({ onClose, login }) => {
  const handleSubmit = async (values: {
    username: string;
    email: string;
    password: string;
    cpassword: string;
  }) => {
    try {
      const { password, email, username } = values;
      const data = { password, email, username };
      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: JSON.stringify(data),
      };

      const response = await fetch(BASE_URL + "/auth/signup", requestOptions);

      if (!response.ok)
        throw new Error(`Signup failed with status ${response.status}`);

      const res = await response.json();
      const { user, jwt } = res.results;

      login(user, jwt);
      onClose();
    } catch (error) {
      console.error("Signup failed:", error);
    }
  };

  return (
    <Formik
      initialValues={{
        username: "",
        email: "",
        password: "",
        cpassword: "",
      }}
      validationSchema={SignupSchema}
      onSubmit={handleSubmit}
    >
      <FormikForm>
        <Form.Group>
          <Form.Label>Username</Form.Label>
          <Field name="username" as={Form.Control} />
          <ErrorMessage
            name="username"
            component="div"
            className="text-danger"
          />
        </Form.Group>
        <Form.Group className="mt-3">
          <Form.Label>Email</Form.Label>
          <Field name="email" type="email" as={Form.Control} />
          <ErrorMessage name="email" component="div" className="text-danger" />
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
        <Form.Group className="mt-3">
          <Form.Label>Confirm Password</Form.Label>
          <Field name="cpassword" type="password" as={Form.Control} />
          <ErrorMessage
            name="cpassword"
            component="div"
            className="text-danger"
          />
        </Form.Group>
        <Button className="mt-3 w-100" variant="primary" type="submit">
          Sign Up
        </Button>
      </FormikForm>
    </Formik>
  );
};

export default SignupForm;
