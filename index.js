import express from "express";
import pg from "pg";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 8000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "sticky-notes",
  password: "Leviackerman1016!",
  port: 5432,
});
db.connect();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  if (req.url.endsWith('.js')) {
    res.setHeader('Content-Type', 'text/javascript');
  }
  next();
});

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM items ORDER BY id ASC");
    const items = result.rows;

    res.render("index.ejs", {
      listTitle: "Today",
      listDay1: "Sunday",
      listDay2: "Monday",
      listDay3: "Tuesday",
      listDay4: "Wednesday",
      listDay5: "Thursday",
      listDay6: "Friday",
      listDay7: "Saturday",
      listItems: items,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/edit", async (req, res) => {
  const { updatedItemId, updatedItemTitle, updatedItemPosX, updatedItemPosY } = req.body;

  try {
    await db.query("UPDATE items SET title = $1, pos_x = $2, pos_y = $3 WHERE id = $4", [
      updatedItemTitle,
      updatedItemPosX,
      updatedItemPosY,
      updatedItemId,
    ]);
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});


app.post("/add", async (req, res) => {
  const { newItem, newItemPosX, newItemPosY, color } = req.body;

  try {
    await db.query("INSERT INTO items (title, pos_x, pos_y, color) VALUES ($1, $2, $3, $4)", [
      newItem,
      newItemPosX,
      newItemPosY,
      color,
    ]);
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/delete", async (req, res) => {
  const { deleteItemId } = req.body;

  try {
    await db.query("DELETE FROM items WHERE id = $1", [deleteItemId]);
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

app.put("/updatePosition", async (req, res) => {
  const { id, pos_x, pos_y } = req.body;

  try {
    const result = await db.query("UPDATE items SET pos_x = $1, pos_y = $2 WHERE id = $3", [pos_x, pos_y, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ status: "error", message: "Note not found" });
    }

    return res.status(200).json({ status: "success" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", error: err });
  }
});

app.options("/updatePosition", (req, res) => {
  res.setHeader("Access-Control-Allow-Methods", "PUT");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.sendStatus(200);
});

app.put("/updateColor/:id", async (req, res) => {
  const noteId = req.params.id;
  const { color } = req.body;

  try {
    const result = await db.query("UPDATE items SET color = $1 WHERE id = $2", [color, noteId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ status: "error", message: "Note not found" });
    }

    return res.status(200).json({ status: "success" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", error: err });
  }
});

app.get("/getColor/:id", async (req, res) => {
  const noteId = req.params.id;

  try {
    const result = await db.query("SELECT color FROM items WHERE id = $1", [noteId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ status: "error", message: "Note not found" });
    }

    const color = result.rows[0].color;
    return res.status(200).json({ status: "success", color });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", error: err });
  }
});

app.put("/updateTitle/:id", async (req, res) => {
  const noteId = req.params.id;
  const { newTitle } = req.body;

  try {
    const result = await db.query("UPDATE items SET title = $1 WHERE id = $2", [newTitle, noteId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ status: "error", message: "Note not found" });
    }

    return res.status(200).json({ status: "success" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", error: err });
  }
});



app.get("/getData/:id", async (req, res) => {
  const noteId = req.params.id;

  try {
    const result = await db.query("SELECT title, content, color FROM items WHERE id = $1", [noteId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ status: "error", message: "Note not found" });
    }

    const { title, content, color } = result.rows[0];
    return res.status(200).json({ status: "success", title, content, color });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", error: err });
  }
});



app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
