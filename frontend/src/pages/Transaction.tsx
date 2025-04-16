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

type Transaction = {
  description?: string;
  user_id: number;
  amount: number;
  created_at: Date;
  type: string;
  transaction_id: number;
  transaction_date: Date;
};

function AddTransactionModal({
  show,
  setTransactions,
  handleClose,
}: {
  show: boolean;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  handleClose: () => void;
}) {
  const { user, auth } = useAuth();

  const initialValues = {
    user_id: user?.user_id,
    amount: "",
    description: "",
    type: "expense",
    transaction_date: "",
  };

  const validationSchema = Yup.object({
    user_id: Yup.number().required("User ID is required"),
    amount: Yup.number()
      .required("Amount is required")
      .positive("Must be positive"),
    description: Yup.string().required("Description is required"),
    type: Yup.string()
      .oneOf(["income", "expense"])
      .required("Type is required"),
    transaction_date: Yup.date().required("Date is required"),
  });

  const handleSubmit = (
    values: typeof initialValues,
    formikHelpers: FormikHelpers<typeof initialValues>
  ) => {
    formikHelpers.setSubmitting(true);

    fetch(BASE_URL + "/transaction/post_transaction", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + auth,
      },
      body: JSON.stringify(values),
    })
      .then((res) => res.json())
      .then((res) => setTransactions((prev) => [...(prev || []), res.results]))
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
        <Modal.Title>Add Transaction</Modal.Title>
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
                  name="description"
                  type="text"
                  as={Form.Control}
                  placeholder="Description"
                  isInvalid={!!(errors.description && touched.description)}
                />
                <Form.Label>Description</Form.Label>
                <Form.Control.Feedback type="invalid">
                  <ErrorMessage name="description" />
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="form-floating mb-3">
                <Field name="type" as="select" className="form-select">
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </Field>
                <Form.Label>Type</Form.Label>
              </Form.Group>

              <Form.Group className="form-floating mb-3">
                <Field
                  name="transaction_date"
                  type="date"
                  as={Form.Control}
                  isInvalid={
                    !!(errors.transaction_date && touched.transaction_date)
                  }
                />
                <Form.Label>Transaction Date</Form.Label>
                <Form.Control.Feedback type="invalid">
                  <ErrorMessage name="transaction_date" />
                </Form.Control.Feedback>
              </Form.Group>

              <Button type="submit" variant="primary" disabled={isSubmitting}>
                Add Transaction
              </Button>
            </Modal.Body>
          </FormikForm>
        )}
      </Formik>
    </Modal>
  );
}

function EditTransactionModal({
  transaction,
  setTransactions,
  handleClose,
}: {
  transaction: Transaction;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  handleClose: () => void;
}) {
  const { auth } = useAuth();

  const validationSchema = Yup.object({
    user_id: Yup.number().required("User ID is required"),
    amount: Yup.number()
      .required("Amount is required")
      .positive("Must be positive"),
    description: Yup.string().required("Description is required"),
    type: Yup.string()
      .oneOf(["income", "expense"])
      .required("Type is required"),
    transaction_date: Yup.date().required("Date is required"),
  });

  const handleSubmit = (
    values: typeof transaction,
    formikHelpers: FormikHelpers<typeof transaction>
  ) => {
    formikHelpers.setSubmitting(true);

    fetch(BASE_URL + "/transaction/put_transaction", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + auth,
      },
      body: JSON.stringify(values),
    })
      .then((res) => res.json())
      .then((res) =>
        setTransactions((prev) =>
          prev.map((t) =>
            t.transaction_id === res.results.transaction_id ? res.results : t
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
    <Modal show={!!transaction} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Edit Transaction</Modal.Title>
      </Modal.Header>
      <Formik
        initialValues={transaction}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, errors, touched }) => (
          <FormikForm>
            <Modal.Body>
              {/* Same fields as AddTransactionModal */}
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
                  name="description"
                  type="text"
                  as={Form.Control}
                  placeholder="Description"
                  isInvalid={!!(errors.description && touched.description)}
                />
                <Form.Label>Description</Form.Label>
                <Form.Control.Feedback type="invalid">
                  <ErrorMessage name="description" />
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="form-floating mb-3">
                <Field name="type" as="select" className="form-select">
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </Field>
                <Form.Label>Type</Form.Label>
              </Form.Group>

              <Form.Group className="form-floating mb-3">
                <Field
                  name="transaction_date"
                  type="date"
                  as={Form.Control}
                  isInvalid={
                    !!(errors.transaction_date && touched.transaction_date)
                  }
                />
                <Form.Label>Transaction Date</Form.Label>
                <Form.Control.Feedback type="invalid">
                  <ErrorMessage name="transaction_date" />
                </Form.Control.Feedback>
              </Form.Group>

              <Button type="submit" variant="primary" disabled={isSubmitting}>
                Update Transaction
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

export default function Transaction() {
  const { theme, auth } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [addShow, setAddShow] = useState(false);
  const [editShow, setEditShow] = useState<Transaction | null>(null);
  const [filterText, setFilterText] = useState("");
  const [resetPaginationToggle, setResetPaginationToggle] = useState(false);

  const filteredItems = transactions?.filter((item) =>
    [item.amount, item.description ?? "", item.type, item.transaction_date]
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

  const deleteTransaction = (transaction: Transaction) => {
    fetch(
      `${BASE_URL}/transaction/delete_transaction/${transaction.transaction_id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: "Bearer " + auth,
        },
      }
    )
      .then((res) => res.json())
      .then((res) =>
        setTransactions((prev) =>
          prev.filter((t) => t.transaction_id !== res.results.transaction_id)
        )
      )
      .catch(console.error);
  };

  const columns: TableColumn<Transaction>[] = [
    {
      name: "Options",
      cell: (row: Transaction) => (
        <div className="d-flex">
          <button
            className="btn btn-primary me-2"
            onClick={() => setEditShow(row)}
          >
            Edit
          </button>
          <button
            onClick={() => confirm("Are you sure?") && deleteTransaction(row)}
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
      name: "Type",
      selector: (row) => row.type,
      sortable: true,
    },
    {
      name: "Transaction Date",
      selector: (row) =>
        new Date(row.transaction_date).toISOString().split("T")[0],
      sortable: true,
    },
  ];

  useEffect(() => {
    if (!auth) return;
    fetch(`${BASE_URL}/transaction/get_all_transactions`, {
      headers: {
        Authorization: "Bearer " + auth,
      },
    })
      .then((res) => res.json())
      .then((res) => setTransactions(res.results))
      .catch(console.error);
  }, [auth]);

  return auth ? (
    <div className="container-fluid px-5">
      <div className="d-flex">
        <h3 className="mb-3">Transaction Table</h3>
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
        <AddTransactionModal
          show={addShow}
          setTransactions={setTransactions}
          handleClose={() => setAddShow(false)}
        />
      )}
      {editShow && (
        <EditTransactionModal
          transaction={editShow}
          setTransactions={setTransactions}
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
