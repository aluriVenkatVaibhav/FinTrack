import { Router } from "express";
import conn from "../db/db";
import md5 from "md5";
let router = Router();

router.post("/post_users", async (req, res) => {
  const { users } = req.body;

  if (!Array.isArray(users) || users.length === 0) {
    return res.status(400).json({ error: "Invalid users array" });
  }

  try {
    const values = users.map((user) => [
      user.username,
      user.email,
      md5(user.password),
    ]);

    const placeholders = values.map(() => "(?, ?, ?)").join(",");

    const flattenedValues = values.flat();

    const [{ affectedRows }] = await conn.query(
      `INSERT INTO users (username, email, password_hash) VALUES ${placeholders}`,
      flattenedValues
    );

    const [new_users] = await conn.query(
      `SELECT * FROM users ORDER BY user_id DESC LIMIT ?`,
      [users.length]
    );

    res.json({ new_users, inserted_count: affectedRows });
  } catch (error) {
    console.error("Error inserting users:", error);
    res.status(500).json({ error: "Database error", details: error.message });
  }
});

router.get("/get_users", async (req, res) => {
  let { user_ids } = req.query;
  user_ids = JSON.parse(user_ids);

  const [users] = await conn.query(
    `select * from users where user_id in (${user_ids
      .map((q) => `?`)
      .join(", ")})`,
    [...user_ids]
  );

  res.json({ users });
});

router.put("/put_users", async (req, res) => {
  try {
    let { users } = req.body;

    for (let user of users) {
      let querySet = [];
      let queryValueSet = [];
      let userMap = new Map(Object.entries(user));
      userMap.delete("user_id");
      if (userMap.has("password")) {
        userMap.set("password_hash", md5(userMap.get("password")));
        userMap.delete("password");
      }

      userMap.entries().forEach(([k, v]) => {
        if (v) {
          querySet.push(`${k} = ?`);
          queryValueSet.push(v);
        }
      });

      let query = `UPDATE users SET ${querySet.join(", ")} WHERE user_id = ?`;
      queryValueSet.push(user.user_id);

      const [queryResult] = await conn.query(query, queryValueSet);

      console.log(queryResult);
    }

    res.json({ message: "Users updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.delete("/delete_users", async (req, res) => {
  try {
    let { user_ids } = req.body;

    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({ message: "Invalid user_ids array" });
    }

    let query = `DELETE FROM users WHERE user_id IN (${user_ids
      .map(() => "?")
      .join(", ")})`;

    const [queryResult] = await conn.query(query, user_ids);

    res.status(200).json({
      message: `${queryResult.affectedRows} users successfully deleted`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
