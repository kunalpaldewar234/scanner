  const express = require("express");
  const path = require("path");
  const db = require("./database");

  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static("public"));

  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "views"));

  const session = require("express-session");
  const bcrypt = require("bcrypt");


  app.use(session({
    secret: "secretkey123",
    resave: false,
    saveUninitialized: false
  }));

  function isAuthenticated(req, res, next) {
    if (req.session.userId) {
      next();
    } else {
      res.redirect("/login");
    }
  }

  app.get("/register", (req, res) => {
    res.render("register");
  });

  app.post("/register", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.send("All fields required");
    }

    // Step 1: Check if username already exists
    db.query("SELECT * FROM users WHERE username = ?", [username], async (err, result) => {
      if (err) {
        console.log(err);
        return res.send("Database error");
      }

      if (result.length > 0) {
        return res.send("Username already exists");
      }

      // Step 2: Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Step 3: Insert new user
      db.query(
        "INSERT INTO users (username, password) VALUES (?, ?)",
        [username, hashedPassword],
        (err, result) => {
          if (err) {
            console.log(err);
            return res.send("Database error");
          }
          res.redirect("/login");
        }
      );
    });
  });

  app.get("/login", (req, res) => {
    res.render("login");
  });

  app.post("/login", (req, res) => {
    const { username, password } = req.body;

    const sql = "SELECT * FROM users WHERE username = ?";

    db.query(sql, [username], async (err, result) => {
      if (err || result.length === 0) {
        return res.send("Invalid username");
      }

      const user = result[0];

      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        return res.send("Wrong password");
      }

      req.session.userId = user.id;
    req.session.username = user.username;
      res.redirect("/");
    });
  });
  app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/login");
  });



  app.get("/", isAuthenticated, (req, res) => {
    res.render("index", {
      user: req.session.username

    });
  });



  app.delete("/inventory/:sku", (req, res) => {
    const sku = req.params.sku;

    const sql = "DELETE FROM inventory WHERE sku = ?";

    db.query(sql, [sku], (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ message: "Error deleting item" });
      }

      if (result.affectedRows === 0) {
        return res.json({ message: "Item not found" });
      }

      res.json({ message: "Item deleted successfully" });
    });
  });


  app.post("/add-item", (req, res) => {
    const { sku, name, price } = req.body;

    if (!sku || !name || !price) {
      return res.json({ message: "All fields required" });
    }

    const sql = "INSERT INTO inventory (sku, name, price) VALUES (?, ?, ?)";

    db.query(sql, [sku, name, price], (err, result) => {
      if (err) {
        console.log(err);
        return res.json({ message: "Error adding item" });
      }

      res.json({ message: "Item added successfully" });
    });
  });


  app.get("/inventory", (req, res) => {
    db.query("SELECT * FROM inventory", (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result);
    });
  });

  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
