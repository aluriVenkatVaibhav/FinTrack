// App.tsx
import { createBrowserRouter, RouterProvider, Outlet } from "react-router";
import Home from "./pages/Home";
import Settings from "./pages/Settings";
import Income from "./pages/Income";
import Header from "./pages/components/Header";
import Expense from "./pages/Expense";
import Transaction from "./pages/Transaction";
import Budget from "./pages/Budget";
import SavingGoals from "./pages/SavingGoals";

function Layout() {
  return (
    <div className="max-w-full">
      <Header />
      <Outlet />
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
      {
        path: "income",
        element: <Income />,
      },
      {
        path: "expense",
        element: <Expense />,
      },
      {
        path: "transaction",
        element: <Transaction />,
      },
      {
        path: "budget",
        element: <Budget />,
      },
      {
        path: "savings_goals",
        element: <SavingGoals />,
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
