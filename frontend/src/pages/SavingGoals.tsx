import DataTable from "react-data-table-component";
import type { TableColumn } from "react-data-table-component";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthCon";
import {
  Formik,
  Form as FormikForm,
  Field,
  ErrorMessage,
  FormikHelpers,
} from "formik";
import * as Yup from "yup";
import { Form, Button, Modal } from "react-bootstrap";

const BASE_URL = process.env.BASE_URL;

type SavingsGoal = {
  user_id: number;
  goal_id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date?: Date;
  created_at: Date;
  updated_at: Date;
};

function AddSavingsModal({
  show,
  setGoals,
  handleClose,
}: {
  show: boolean;
  setGoals: React.Dispatch<React.SetStateAction<SavingsGoal[]>>;
  handleClose: () => void;
}) {
  const { user, auth } = useAuth();

  const initialValues = {
    user_id: user?.user_id,
    name: "",
    target_amount: "",
    current_amount: "",
    target_date: "",
  };

  const validationSchema = Yup.object({
    user_id: Yup.number().required("User ID is required"),
    name: Yup.string().required("Name is required"),
    target_amount: Yup.number()
      .required("Target amount is required")
      .positive("Must be a positive number"),
    current_amount: Yup.number()
      .required("Current amount is required")
      .min(0, "Cannot be negative"),
    target_date: Yup.date().nullable(),
  });

  const handleSubmit = (
    values: typeof initialValues,
    formikHelpers: FormikHelpers<typeof initialValues>
  ) => {
    formikHelpers.setSubmitting(true);

    fetch(BASE_URL + "/savings_goals/post_goal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + auth,
      },
      body: JSON.stringify(values),
    })
      .then((res) => res.json())
      .then((res) => setGoals((prev) => [...(prev || []), res.results]))
      .catch(console.error)
      .finally(() => {
        formikHelpers.setSubmitting(false);
        formikHelpers.resetForm();
        handleClose();
      });
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Add Savings Goal</Modal.Title>
      </Modal.Header>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, errors, touched }) => (
          <FormikForm>
            <Modal.Body>
              <Form.Group className="form-floating mb-3">
                <Field
                  name="name"
                  type="text"
                  as={Form.Control}
                  placeholder="Goal Name"
                  isInvalid={!!(errors.name && touched.name)}
                />
                <Form.Label>Goal Name</Form.Label>
                <Form.Control.Feedback type="invalid">
                  <ErrorMessage name="name" />
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="form-floating mb-3">
                <Field
                  name="target_amount"
                  type="number"
                  as={Form.Control}
                  placeholder="Target Amount"
                  isInvalid={!!(errors.target_amount && touched.target_amount)}
                />
                <Form.Label>Target Amount</Form.Label>
                <Form.Control.Feedback type="invalid">
                  <ErrorMessage name="target_amount" />
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="form-floating mb-3">
                <Field
                  name="current_amount"
                  type="number"
                  as={Form.Control}
                  placeholder="Current Amount"
                  isInvalid={
                    !!(errors.current_amount && touched.current_amount)
                  }
                />
                <Form.Label>Current Amount</Form.Label>
                <Form.Control.Feedback type="invalid">
                  <ErrorMessage name="current_amount" />
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="form-floating mb-3">
                <Field
                  name="target_date"
                  type="date"
                  as={Form.Control}
                  isInvalid={!!(errors.target_date && touched.target_date)}
                />
                <Form.Label>Target Date</Form.Label>
                <Form.Control.Feedback type="invalid">
                  <ErrorMessage name="target_date" />
                </Form.Control.Feedback>
              </Form.Group>

              <Button type="submit" variant="primary" disabled={isSubmitting}>
                Add Goal
              </Button>
            </Modal.Body>
          </FormikForm>
        )}
      </Formik>
    </Modal>
  );
}

function EditSavingsModal({
  goal,
  setGoals,
  handleClose,
}: {
  goal: SavingsGoal;
  setGoals: React.Dispatch<React.SetStateAction<SavingsGoal[]>>;
  handleClose: () => void;
}) {
  const { auth } = useAuth();

  const validationSchema = Yup.object({
    user_id: Yup.number().required("User ID is required"),
    name: Yup.string().required("Name is required"),
    target_amount: Yup.number().required().positive(),
    current_amount: Yup.number().required().min(0),
    target_date: Yup.date().nullable(),
  });

  const handleSubmit = (
    values: typeof goal,
    formikHelpers: FormikHelpers<typeof goal>
  ) => {
    formikHelpers.setSubmitting(true);

    fetch(BASE_URL + "/savings_goals/put_goal", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + auth,
      },
      body: JSON.stringify(values),
    })
      .then((res) => res.json())
      .then((res) =>
        setGoals((prev) =>
          prev.map((g) => (g.goal_id === res.results.goal_id ? res.results : g))
        )
      )
      .catch(console.error)
      .finally(() => {
        formikHelpers.setSubmitting(false);
        handleClose();
      });
  };

  return (
    <Modal show={!!goal} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Edit Savings Goal</Modal.Title>
      </Modal.Header>
      <Formik
        initialValues={goal}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, errors, touched }) => (
          <FormikForm>
            <Modal.Body>
              <Form.Group className="form-floating mb-3">
                <Field
                  name="name"
                  type="text"
                  as={Form.Control}
                  placeholder="Goal Name"
                  isInvalid={!!(errors.name && touched.name)}
                />
                <Form.Label>Goal Name</Form.Label>
                <Form.Control.Feedback type="invalid">
                  <ErrorMessage name="name" />
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="form-floating mb-3">
                <Field
                  name="target_amount"
                  type="number"
                  as={Form.Control}
                  placeholder="Target Amount"
                  isInvalid={!!(errors.target_amount && touched.target_amount)}
                />
                <Form.Label>Target Amount</Form.Label>
                <Form.Control.Feedback type="invalid">
                  <ErrorMessage name="target_amount" />
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="form-floating mb-3">
                <Field
                  name="current_amount"
                  type="number"
                  as={Form.Control}
                  placeholder="Current Amount"
                  isInvalid={
                    !!(errors.current_amount && touched.current_amount)
                  }
                />
                <Form.Label>Current Amount</Form.Label>
                <Form.Control.Feedback type="invalid">
                  <ErrorMessage name="current_amount" />
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="form-floating mb-3">
                <Field
                  name="target_date"
                  type="date"
                  as={Form.Control}
                  isInvalid={!!(errors.target_date && touched.target_date)}
                />
                <Form.Label>Target Date</Form.Label>
                <Form.Control.Feedback type="invalid">
                  <ErrorMessage name="target_date" />
                </Form.Control.Feedback>
              </Form.Group>

              <Button type="submit" variant="primary" disabled={isSubmitting}>
                Update Goal
              </Button>
            </Modal.Body>
          </FormikForm>
        )}
      </Formik>
    </Modal>
  );
}

const FilterComponent = ({
  filterText,
  onFilter,
  onClear,
}: {
  filterText: string;
  onFilter: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}) => (
  <div className="d-flex gap-2 mt-2 align-items-center mb-2">
    <input
      type="text"
      className="form-control"
      placeholder="Search Income"
      value={filterText}
      onChange={onFilter}
    />
    <Button className="fw-bold " variant="outline-secondary" onClick={onClear}>
      Clear
    </Button>
  </div>
);

export default function SavingsGoals() {
  const { auth, theme } = useAuth();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [addShow, setAddShow] = useState(false);
  const [editShow, setEditShow] = useState<SavingsGoal | null>(null);
  const [filterText, setFilterText] = useState("");
  const [resetPaginationToggle, setResetPaginationToggle] = useState(false);

  const filteredItems = goals?.filter((item) =>
    [item.name, item.current_amount, item.target_amount, item.target_date]
      .join(" ")
      .toLowerCase()
      .includes(filterText.toLowerCase())
  );

  const subHeaderComponentMemo = useMemo(() => {
    const handleClear = () => {
      if (filterText) {
        setResetPaginationToggle(!resetPaginationToggle);
        setFilterText("");
      }
    };

    return (
      <FilterComponent
        onFilter={(e) => setFilterText(e.target.value)}
        onClear={handleClear}
        filterText={filterText}
      />
    );
  }, [filterText, resetPaginationToggle]);

  const deleteGoal = (goal: SavingsGoal) => {
    fetch(`${BASE_URL}/savings_goals/delete_goal/${goal.goal_id}`, {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + auth,
      },
    })
      .then((res) => res.json())
      .then((res) =>
        setGoals((prev) =>
          prev.filter((g) => g.goal_id !== res.results.goal_id)
        )
      )
      .catch(console.error);
  };

  const columns: TableColumn<SavingsGoal>[] = [
    {
      name: "Options",
      cell: (row) => (
        <div className="d-flex">
          <button
            className="btn btn-primary me-2"
            onClick={() => setEditShow(row)}
          >
            Edit
          </button>
          <button
            className="btn btn-danger"
            onClick={() => confirm("Are you sure?") && deleteGoal(row)}
          >
            Delete
          </button>
        </div>
      ),
    },
    {
      name: "Name",
      selector: (row) => row.name,
      sortable: true,
    },
    {
      name: "Target Amount",
      selector: (row) => row.target_amount,
      sortable: true,
    },
    {
      name: "Current Amount",
      selector: (row) => row.current_amount,
      sortable: true,
    },
    {
      name: "Target Date",
      selector: (row) =>
        row.target_date
          ? new Date(row.target_date).toISOString().split("T")[0]
          : "N/A",
      sortable: true,
    },
  ];

  useEffect(() => {
    if (!auth) return;
    fetch(`${BASE_URL}/savings_goals/get_all_goals`, {
      headers: {
        Authorization: "Bearer " + auth,
      },
    })
      .then((res) => res.json())
      .then((res) => setGoals(res.results))
      .catch(console.error);
  }, [auth]);

  return auth ? (
    <div className="container-fluid px-5">
      <div className="d-flex">
        <h3 className="mb-3">Savings Goals</h3>
        <div className="ms-3">
          <button className="btn btn-success" onClick={() => setAddShow(true)}>
            <span className="fs-5 fw-bolder">+</span>
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredItems}
        pagination
        paginationResetDefaultPage={resetPaginationToggle}
        subHeader
        subHeaderComponent={subHeaderComponentMemo}
        selectableRows
        persistTableHead
        highlightOnHover
        responsive
        theme={theme}
      />

      {addShow && (
        <AddSavingsModal
          show={addShow}
          setGoals={setGoals}
          handleClose={() => setAddShow(false)}
        />
      )}
      {editShow && (
        <EditSavingsModal
          goal={editShow}
          setGoals={setGoals}
          handleClose={() => setEditShow(null)}
        />
      )}
    </div>
  ) : (
    <div className="w-100 text-center text-danger">
      <p>Login to access your details</p>
    </div>
  );
}
