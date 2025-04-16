import { Form, Button, FloatingLabel, Container } from "react-bootstrap";
import {
  Formik,
  Field,
  Form as FormikForm,
  FieldProps,
  FormikHelpers,
} from "formik";
import * as Yup from "yup";
import { useAuth } from "../context/AuthCon";

const BASE_URL = process.env.BASE_URL;

const UserEditFormSchema = Yup.object({
  username: Yup.string().min(1, "Username is required"),
  email: Yup.string().email("Invalid email address"),
  password: Yup.string(),
  cpassword: Yup.string().when("password", {
    is: (val: string | undefined) => val && val.length > 0,
    then: (schema) =>
      schema
        .required("Please confirm your password")
        .oneOf([Yup.ref("password")], "Passwords must match"),
    otherwise: (schema) => schema.notRequired(),
  }),
});

const UserEditForm = () => {
  const { user, auth, logout } = useAuth();
  console.log(user);

  interface Values {
    username: string;
    email: string;
    password: string;
    cpassword: string;
  }

  async function handleChangeUser(
    values: Values,
    formikHelpers: FormikHelpers<Values>
  ) {
    formikHelpers.setSubmitting(true);
    console.log(values);

    const payload = {
      user_id: user?.user_id,
      ...(values.username && { username: values.username }),
      ...(values.email && { email: values.email }),
      ...(values.password && { password: values.password }),
    };

    const response = await fetch(`${BASE_URL}/users/put_user`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth}`,
      },
      body: JSON.stringify(payload),
    });

    const res = await response.json();

    console.log(res);

    if (!res.success) {
      formikHelpers.setStatus({ error: `${res.errorType}: ${res.error}` });
      return;
    }

    formikHelpers.setSubmitting(false);
    formikHelpers.resetForm();
  }

  function handleDelete() {
    if (confirm("Are you sure to delete your account?")) {
      console.log("Account deleted");
      const myHeaders = new Headers();
      myHeaders.append("Authorization", "Bearer " + auth);

      const requestOptions = {
        method: "DELETE",
        headers: myHeaders,
        redirect: "follow" as RequestRedirect,
      };

      fetch(
        "http://localhost:8000/users/delete_user/" + user?.user_id,
        requestOptions
      )
        .then((response) => response.text())
        .then((result) => console.log(result))
        .catch((error) => console.error(error));

      logout();
    }
  }

  return (
    user && (
      <Container className="mt-4">
        <div className="d-flex column-gap-3 mb-3">
          <h3 className="mb-3">Update Your Details</h3>
          <div>
            <button onClick={handleDelete} className="btn btn-danger">
              Delete my account
            </button>
          </div>
        </div>
        <Formik
          initialValues={{
            username: user?.username || "",
            email: user?.email || "",
            password: "",
            cpassword: "",
          }}
          validationSchema={UserEditFormSchema}
          onSubmit={handleChangeUser}
        >
          {({ status, handleSubmit, errors, touched }) => (
            <FormikForm onSubmit={handleSubmit}>
              <div className="container-fluid w-100 row-gap-3 column-gap-3">
                <div className="row">
                  <div className="col-12 col-lg-6 mb-3">
                    <Field name="username">
                      {({ field }: FieldProps) => (
                        <FloatingLabel label="Username">
                          <Form.Control
                            type="text"
                            placeholder="Username"
                            {...field}
                            isInvalid={touched.username && !!errors.username}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.username}
                          </Form.Control.Feedback>
                        </FloatingLabel>
                      )}
                    </Field>
                  </div>

                  <div className="col-12 col-lg-6 mb-3">
                    <Field name="email">
                      {({ field }: FieldProps) => (
                        <FloatingLabel label="Email">
                          <Form.Control
                            type="email"
                            placeholder="Email"
                            {...field}
                            isInvalid={touched.email && !!errors.email}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.email}
                          </Form.Control.Feedback>
                        </FloatingLabel>
                      )}
                    </Field>
                  </div>

                  <div className="col-12 col-lg-6 mb-3">
                    <Field name="password">
                      {({ field }: FieldProps) => (
                        <FloatingLabel label="Password">
                          <Form.Control
                            type="password"
                            placeholder="Password"
                            {...field}
                            isInvalid={touched.password && !!errors.password}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.password}
                          </Form.Control.Feedback>
                        </FloatingLabel>
                      )}
                    </Field>
                  </div>

                  <div className="col-12 col-lg-6 mb-3">
                    <Field name="cpassword">
                      {({ field }: FieldProps) => (
                        <FloatingLabel label="Confirm Password">
                          <Form.Control
                            type="password"
                            placeholder="Confirm Password"
                            {...field}
                            isInvalid={touched.cpassword && !!errors.cpassword}
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.cpassword}
                          </Form.Control.Feedback>
                        </FloatingLabel>
                      )}
                    </Field>
                  </div>
                </div>
              </div>

              <div className="d-flex">
                <Button className="ms-3 me-3" variant="primary" type="submit">
                  Save Changes
                </Button>
                {status?.error && (
                  <p className="my-auto text-danger">{status?.error}</p>
                )}
              </div>
            </FormikForm>
          )}
        </Formik>
      </Container>
    )
  );
};

export default UserEditForm;
