import DataTable from "react-data-table-component";
import type { TableColumn } from "react-data-table-component";
import type { Income } from "../schemas";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthCon";

const BASE_URL = process.env.BASE_URL;

import {
  Formik,
  Form as FormikForm,
  Field,
  ErrorMessage,
  FormikHelpers,
} from "formik";
import * as Yup from "yup";
import { Form, Button, Modal } from "react-bootstrap";

function AddIncomeModal({
  show,
  setIncomes,
  handleClose,
}: {
  show: boolean;
  setIncomes: React.Dispatch<React.SetStateAction<Income[]>>;
  handleClose: () => void;
}) {
  const { user, auth } = useAuth();

  const initialValues = {
    user_id: user?.user_id,
    amount: "",
    description: "",
    income_date: "",
  };

  const validationSchema = Yup.object({
    user_id: Yup.string().required("User ID is required"),
    amount: Yup.number()
      .required("Amount is required")
      .positive("Amount must be positive"),
    description: Yup.string().required("Description is required"),
    income_date: Yup.date().required("Income Date is required"),
  });

  const handleSubmit = (
    values: typeof initialValues,
    formikHelpers: FormikHelpers<typeof initialValues>
  ) => {
    formikHelpers.setSubmitting(true);

    console.log("Form Values:", values);

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", "Bearer " + auth);

    const raw = JSON.stringify(values);

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
    };

    fetch(BASE_URL + "/income/post_income", requestOptions)
      .then((response) => response.text())
      .then((result) => JSON.parse(result))
      .then((result) => setIncomes((prev) => [...(prev || []), result.results]))
      .catch((error) => console.error(error));

    formikHelpers.setSubmitting(false);
    formikHelpers.resetForm();
    handleClose();
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Add Income</Modal.Title>
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
                controlId="income_date"
              >
                <Field
                  name="income_date"
                  type="date"
                  placeholder="Income Date"
                  as={Form.Control}
                  isInvalid={!!(errors.income_date && touched.income_date)}
                />
                <Form.Label>Income Date</Form.Label>
                <Form.Control.Feedback type="invalid">
                  <ErrorMessage name="income_date" />
                </Form.Control.Feedback>
              </Form.Group>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                Add Income
              </Button>
            </Modal.Body>
          </FormikForm>
        )}
      </Formik>
    </Modal>
  );
}

function EditIncomeModal({
  income,
  setIncomes,
  handleClose,
}: {
  income: Income;
  setIncomes: React.Dispatch<React.SetStateAction<Income[]>>;
  handleClose: () => void;
}) {
  const { auth } = useAuth();

  const initialValues = income;

  const validationSchema = Yup.object({
    user_id: Yup.string().required("User ID is required"),
    amount: Yup.number()
      .required("Amount is required")
      .positive("Amount must be positive"),
    description: Yup.string().required("Description is required"),
    income_date: Yup.date().required("Income Date is required"),
  });

  const handleSubmit = (
    values: typeof initialValues,
    formikHelpers: FormikHelpers<typeof initialValues>
  ) => {
    formikHelpers.setSubmitting(true);

    console.log("Form Values:", values);

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", "Bearer " + auth);

    const raw = JSON.stringify(values);

    const requestOptions = {
      method: "PUT",
      headers: myHeaders,
      body: raw,
    };

    fetch(BASE_URL + "/income/put_income", requestOptions)
      .then((response) => response.text())
      .then((result) => JSON.parse(result).results)
      .then((result) =>
        setIncomes((prev) =>
          prev.map((inc) => (inc.income_id == result.income_id ? result : inc))
        )
      )
      .catch((error) => console.error(error));

    formikHelpers.setSubmitting(false);
    formikHelpers.resetForm();
    handleClose();
  };

  return (
    <Modal show={Boolean(income)} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Add Income</Modal.Title>
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
                controlId="income_date"
              >
                <Field
                  name="income_date"
                  type="date"
                  placeholder="Income Date"
                  as={Form.Control}
                  isInvalid={!!(errors.income_date && touched.income_date)}
                />
                <Form.Label>Income Date</Form.Label>
                <Form.Control.Feedback type="invalid">
                  <ErrorMessage name="income_date" />
                </Form.Control.Feedback>
              </Form.Group>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                Add Income
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

export default function Income() {
  const { auth, theme } = useAuth();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [addShow, setAddShow] = useState<boolean>();
  const [editShow, setEditShow] = useState<Income | null>(null);
  const [filterText, setFilterText] = useState("");
  const [resetPaginationToggle, setResetPaginationToggle] = useState(false);

  const filteredItems = incomes?.filter((item) =>
    [item.amount, item.description, item.income_date]
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

  useEffect(() => {
    if (!auth) return;
    fetch(`${BASE_URL}/income/get_all_incomes`, {
      headers: { Authorization: "Bearer " + auth },
    })
      .then((res) => res.json())
      .then((res) => setIncomes(res.results))
      .catch(console.error);
  }, [auth]);

  function deleteIncome(income: Income) {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", "Bearer " + auth);

    const requestOptions = {
      method: "DELETE",
      headers: myHeaders,
    };

    fetch(
      BASE_URL + "/income/delete_income/" + income.income_id,
      requestOptions
    )
      .then((response) => response.json())
      .then((response) => response.results)
      .then((income) => {
        setIncomes((prev) =>
          prev.filter((inc) => inc.income_id != income.income_id)
        );
      })
      .catch((error) => console.error(error));
  }

  const columns: TableColumn<Income>[] = [
    {
      name: "Options",
      cell: (row: Income) => (
        <div className="d-flex">
          <button
            className="btn btn-primary me-2"
            onClick={() => setEditShow(row)}
          >
            Edit
          </button>
          <button
            onClick={() => {
              if (confirm("Are you sure?")) deleteIncome(row);
            }}
            className="btn btn-danger"
          >
            Delete
          </button>
        </div>
      ),
      sortable: true,
    },
    {
      name: "Amount",
      selector: (row: Income) => row.amount,
      sortable: true,
    },
    {
      name: "Description",
      selector: (row: Income) => row.description,
      sortable: false,
    },
    {
      name: "Income Date",
      selector: (row: Income) =>
        new Date(row.income_date).toISOString().split("T")[0],
      sortable: true,
    },
  ];

  return auth ? (
    <div className="container-fluid px-5" style={{ maxWidth: "100vw" }}>
      <div className="d-flex">
        <h3 className="mb-3">Income Table</h3>
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
        <div>
          <AddIncomeModal
            setIncomes={setIncomes}
            show={addShow}
            handleClose={() => setAddShow(false)}
          />
        </div>
      )}

      {editShow && (
        <div>
          <EditIncomeModal
            setIncomes={setIncomes}
            income={editShow}
            handleClose={() => setEditShow(null)}
          />
        </div>
      )}
    </div>
  ) : (
    <div className="w-100 text-center text-danger">
      <p>Login to access your details</p>
    </div>
  );
}
