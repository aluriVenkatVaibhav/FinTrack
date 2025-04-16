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

type Expense = {
  description?: string;
  user_id: number;
  amount: number;
  created_at: Date;
  expense_id: number;
  expense_date: Date;
};

function AddExpenseModal({
  show,
  setExpenses,
  handleClose,
}: {
  show: boolean;
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  handleClose: () => void;
}) {
  const { user, auth } = useAuth();

  const initialValues = {
    user_id: user?.user_id,
    amount: "",
    description: "",
    expense_date: "",
  };

  const validationSchema = Yup.object({
    user_id: Yup.number().required("User ID is required"),
    amount: Yup.number()
      .required("Amount is required")
      .positive("Amount must be positive"),
    description: Yup.string().required("Description is required"),
    expense_date: Yup.date().required("Expense Date is required"),
  });

  const handleSubmit = (
    values: typeof initialValues,
    formikHelpers: FormikHelpers<typeof initialValues>
  ) => {
    formikHelpers.setSubmitting(true);

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", "Bearer " + auth);

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(values),
    };

    fetch(BASE_URL + "/expense/post_expense", requestOptions)
      .then((res) => res.json())
      .then((res) => setExpenses((prev) => [...(prev || []), res.results]))
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
        <Modal.Title>Add Expense</Modal.Title>
      </Modal.Header>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, errors, touched }) => (
          <FormikForm>
            <Modal.Body>
              <Form.Group className="form-floating mb-3" controlId="amount">
                <Field
                  name="amount"
                  type="number"
                  placeholder="Amount"
                  as={Form.Control}
                  isInvalid={!!(errors.amount && touched.amount)}
                />
                <Form.Label>Amount</Form.Label>
                <Form.Control.Feedback type="invalid">
                  <ErrorMessage name="amount" />
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group
                className="form-floating mb-3"
                controlId="description"
              >
                <Field
                  name="description"
                  type="text"
                  placeholder="Description"
                  as={Form.Control}
                  isInvalid={!!(errors.description && touched.description)}
                />
                <Form.Label>Description</Form.Label>
                <Form.Control.Feedback type="invalid">
                  <ErrorMessage name="description" />
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group
                className="form-floating mb-3"
                controlId="expense_date"
              >
                <Field
                  name="expense_date"
                  type="date"
                  placeholder="Expense Date"
                  as={Form.Control}
                  isInvalid={!!(errors.expense_date && touched.expense_date)}
                />
                <Form.Label>Expense Date</Form.Label>
                <Form.Control.Feedback type="invalid">
                  <ErrorMessage name="expense_date" />
                </Form.Control.Feedback>
              </Form.Group>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                Add Expense
              </Button>
            </Modal.Body>
          </FormikForm>
        )}
      </Formik>
    </Modal>
  );
}

function EditExpenseModal({
  expense,
  setExpenses,
  handleClose,
}: {
  expense: Expense;
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  handleClose: () => void;
}) {
  const { auth } = useAuth();

  const validationSchema = Yup.object({
    user_id: Yup.number().required("User ID is required"),
    amount: Yup.number()
      .required("Amount is required")
      .positive("Amount must be positive"),
    description: Yup.string().required("Description is required"),
    expense_date: Yup.date().required("Expense Date is required"),
  });

  const handleSubmit = (
    values: typeof expense,
    formikHelpers: FormikHelpers<typeof expense>
  ) => {
    formikHelpers.setSubmitting(true);

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", "Bearer " + auth);

    const requestOptions = {
      method: "PUT",
      headers: myHeaders,
      body: JSON.stringify(values),
    };

    fetch(BASE_URL + "/expense/put_expense", requestOptions)
      .then((res) => res.json())
      .then((res) =>
        setExpenses((prev) =>
          prev.map((exp) =>
            exp.expense_id === res.results.expense_id ? res.results : exp
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
    <Modal show={!!expense} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Edit Expense</Modal.Title>
      </Modal.Header>
      <Formik
        initialValues={expense}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, errors, touched }) => (
          <FormikForm>
            <Modal.Body>
              <Form.Group className="form-floating mb-3" controlId="amount">
                <Field
                  name="amount"
                  type="number"
                  placeholder="Amount"
                  as={Form.Control}
                  isInvalid={!!(errors.amount && touched.amount)}
                />
                <Form.Label>Amount</Form.Label>
                <Form.Control.Feedback type="invalid">
                  <ErrorMessage name="amount" />
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group
                className="form-floating mb-3"
                controlId="description"
              >
                <Field
                  name="description"
                  type="text"
                  placeholder="Description"
                  as={Form.Control}
                  isInvalid={!!(errors.description && touched.description)}
                />
                <Form.Label>Description</Form.Label>
                <Form.Control.Feedback type="invalid">
                  <ErrorMessage name="description" />
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group
                className="form-floating mb-3"
                controlId="expense_date"
              >
                <Field
                  name="expense_date"
                  type="date"
                  placeholder="Expense Date"
                  as={Form.Control}
                  isInvalid={!!(errors.expense_date && touched.expense_date)}
                />
                <Form.Label>Expense Date</Form.Label>
                <Form.Control.Feedback type="invalid">
                  <ErrorMessage name="expense_date" />
                </Form.Control.Feedback>
              </Form.Group>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                Update Expense
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

    <Button variant="outline-secondary" className="fw-bold " onClick={onClear}>
      Clear
    </Button>
  </div>
);

export default function Expense() {
  const { auth, theme } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [addShow, setAddShow] = useState(false);
  const [editShow, setEditShow] = useState<Expense | null>(null);
  const [filterText, setFilterText] = useState("");
  const [resetPaginationToggle, setResetPaginationToggle] = useState(false);

  const filteredItems = expenses?.filter((item) =>
    [item.amount, item.description ?? "", item.expense_date]
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

  const deleteExpense = (expense: Expense) => {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + auth);

    fetch(`${BASE_URL}/expense/delete_expense/${expense.expense_id}`, {
      method: "DELETE",
      headers: myHeaders,
    })
      .then((res) => res.json())
      .then((res) =>
        setExpenses((prev) =>
          prev.filter((exp) => exp.expense_id !== res.results.expense_id)
        )
      )
      .catch(console.error);
  };

  const columns: TableColumn<Expense>[] = [
    {
      name: "Options",
      cell: (row: Expense) => (
        <div className="d-flex">
          <button
            className="btn btn-primary me-2"
            onClick={() => setEditShow(row)}
          >
            Edit
          </button>
          <button
            onClick={() => {
              if (confirm("Are you sure?")) deleteExpense(row);
            }}
            className="btn btn-danger"
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
      name: "Description",
      selector: (row) => row.description || "-",
    },
    {
      name: "Expense Date",
      selector: (row) => new Date(row.expense_date).toISOString().split("T")[0],
      sortable: true,
    },
  ];

  useEffect(() => {
    if (!auth) return;

    const myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + auth);

    fetch(`${BASE_URL}/expense/get_all_expenses`, {
      method: "GET",
      headers: myHeaders,
    })
      .then((res) => res.json())
      .then((res) => setExpenses(res.results))
      .catch(console.error);
  }, [auth]);

  return auth ? (
    <div className="container-fluid px-5">
      <div className="d-flex">
        <h3 className="mb-3">Expense Table</h3>
        <div className="ms-3">
          <button className="btn btn-success">
            <span onClick={() => setAddShow(true)} className="fs-5 fw-bolder">
              +
            </span>
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
        <AddExpenseModal
          setExpenses={setExpenses}
          show={addShow}
          handleClose={() => setAddShow(false)}
        />
      )}

      {editShow && (
        <EditExpenseModal
          setExpenses={setExpenses}
          expense={editShow}
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
