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

type Budget = {
  user_id: number;
  created_at: Date;
  amount: number;
  budget_id: number;
  start_date: Date;
  end_date: Date;
};

function AddBudgetModal({
  show,
  setBudgets,
  handleClose,
}: {
  show: boolean;
  setBudgets: React.Dispatch<React.SetStateAction<Budget[]>>;
  handleClose: () => void;
}) {
  const { user, auth } = useAuth();

  const initialValues = {
    user_id: user?.user_id,
    amount: "",
    start_date: "",
    end_date: "",
  };

  const validationSchema = Yup.object({
    user_id: Yup.number().required("User ID is required"),
    amount: Yup.number()
      .required("Amount is required")
      .positive("Amount must be positive"),
    start_date: Yup.date().required("Start date is required"),
    end_date: Yup.date()
      .required("End date is required")
      .min(Yup.ref("start_date"), "End date must be after start date"),
  });

  const handleSubmit = (
    values: typeof initialValues,
    formikHelpers: FormikHelpers<typeof initialValues>
  ) => {
    formikHelpers.setSubmitting(true);

    fetch(BASE_URL + "/budget/post_budget", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + auth,
      },
      body: JSON.stringify(values),
    })
      .then((res) => res.json())
      .then((res) => setBudgets((prev) => [...(prev || []), res.results]))
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
        <Modal.Title>Add Budget</Modal.Title>
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
                  name="amount"
                  type="number"
                  as={Form.Control}
                  placeholder="Amount"
                  isInvalid={!!(errors.amount && touched.amount)}
                />
                <Form.Label>Amount</Form.Label>
                <Form.Control.Feedback type="invalid">
                  <ErrorMessage name="amount" />
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="form-floating mb-3">
                <Field
                  name="start_date"
                  type="date"
                  as={Form.Control}
                  isInvalid={!!(errors.start_date && touched.start_date)}
                />
                <Form.Label>Start Date</Form.Label>
                <Form.Control.Feedback type="invalid">
                  <ErrorMessage name="start_date" />
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="form-floating mb-3">
                <Field
                  name="end_date"
                  type="date"
                  as={Form.Control}
                  isInvalid={!!(errors.end_date && touched.end_date)}
                />
                <Form.Label>End Date</Form.Label>
                <Form.Control.Feedback type="invalid">
                  <ErrorMessage name="end_date" />
                </Form.Control.Feedback>
              </Form.Group>

              <Button type="submit" variant="primary" disabled={isSubmitting}>
                Add Budget
              </Button>
            </Modal.Body>
          </FormikForm>
        )}
      </Formik>
    </Modal>
  );
}

function EditBudgetModal({
  budget,
  setBudgets,
  handleClose,
}: {
  budget: Budget;
  setBudgets: React.Dispatch<React.SetStateAction<Budget[]>>;
  handleClose: () => void;
}) {
  const { auth } = useAuth();

  const validationSchema = Yup.object({
    user_id: Yup.number().required("User ID is required"),
    amount: Yup.number()
      .required("Amount is required")
      .positive("Amount must be positive"),
    start_date: Yup.date().required("Start date is required"),
    end_date: Yup.date()
      .required("End date is required")
      .min(Yup.ref("start_date"), "End date must be after start date"),
  });

  const handleSubmit = (
    values: typeof budget,
    formikHelpers: FormikHelpers<typeof budget>
  ) => {
    formikHelpers.setSubmitting(true);

    fetch(BASE_URL + "/budget/put_budget", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + auth,
      },
      body: JSON.stringify(values),
    })
      .then((res) => res.json())
      .then((res) =>
        setBudgets((prev) =>
          prev.map((b) =>
            b.budget_id === res.results.budget_id ? res.results : b
          )
        )
      )
      .catch(console.error)
      .finally(() => {
        formikHelpers.setSubmitting(false);
        handleClose();
      });
  };

  return (
    <Modal show={!!budget} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Edit Budget</Modal.Title>
      </Modal.Header>
      <Formik
        initialValues={budget}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, errors, touched }) => (
          <FormikForm>
            <Modal.Body>
              <Form.Group className="form-floating mb-3">
                <Field
                  name="amount"
                  type="number"
                  as={Form.Control}
                  placeholder="Amount"
                  isInvalid={!!(errors.amount && touched.amount)}
                />
                <Form.Label>Amount</Form.Label>
                <Form.Control.Feedback type="invalid">
                  <ErrorMessage name="amount" />
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="form-floating mb-3">
                <Field
                  name="start_date"
                  type="date"
                  as={Form.Control}
                  isInvalid={!!(errors.start_date && touched.start_date)}
                />
                <Form.Label>Start Date</Form.Label>
                <Form.Control.Feedback type="invalid">
                  <ErrorMessage name="start_date" />
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="form-floating mb-3">
                <Field
                  name="end_date"
                  type="date"
                  as={Form.Control}
                  isInvalid={!!(errors.end_date && touched.end_date)}
                />
                <Form.Label>End Date</Form.Label>
                <Form.Control.Feedback type="invalid">
                  <ErrorMessage name="end_date" />
                </Form.Control.Feedback>
              </Form.Group>

              <Button type="submit" variant="primary" disabled={isSubmitting}>
                Update Budget
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

export default function Budget() {
  const { auth, theme } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [addShow, setAddShow] = useState(false);
  const [editShow, setEditShow] = useState<Budget | null>(null);
  const [filterText, setFilterText] = useState("");
  const [resetPaginationToggle, setResetPaginationToggle] = useState(false);

  const filteredItems = budgets?.filter((item) =>
    [item.amount, item.start_date, item.end_date]
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

  const deleteBudget = (budget: Budget) => {
    fetch(`${BASE_URL}/budget/delete_budget/${budget.budget_id}`, {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + auth,
      },
    })
      .then((res) => res.json())
      .then((res) =>
        setBudgets((prev) =>
          prev.filter((b) => b.budget_id !== res.results.budget_id)
        )
      )
      .catch(console.error);
  };

  const columns: TableColumn<Budget>[] = [
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
            onClick={() => confirm("Are you sure?") && deleteBudget(row)}
          >
            Delete
          </button>
        </div>
      ),
    },
    {
      name: "Amount",
      selector: (row) => row.amount,
      sortable: true,
    },
    {
      name: "Start Date",
      selector: (row) => new Date(row.start_date).toISOString().split("T")[0],
      sortable: true,
    },
    {
      name: "End Date",
      selector: (row) => new Date(row.end_date).toISOString().split("T")[0],
      sortable: true,
    },
  ];

  useEffect(() => {
    if (!auth) return;
    fetch(`${BASE_URL}/budget/get_all_budgets`, {
      headers: {
        Authorization: "Bearer " + auth,
      },
    })
      .then((res) => res.json())
      .then((res) => setBudgets(res.results))
      .catch(console.error);
  }, [auth]);

  return auth ? (
    <div className="container-fluid px-5">
      <div className="d-flex">
        <h3 className="mb-3">Budget Table</h3>
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
        <AddBudgetModal
          show={addShow}
          setBudgets={setBudgets}
          handleClose={() => setAddShow(false)}
        />
      )}
      {editShow && (
        <EditBudgetModal
          budget={editShow}
          setBudgets={setBudgets}
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
