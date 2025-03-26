import express from "express";
import conn from "./db/db";
import cors from "cors";
import usersRoute from "./routes/user.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use("/api/users", usersRoute);

app.get("/api/", (req, res) => {
  res.json({ message: "This is FinTrack" });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
