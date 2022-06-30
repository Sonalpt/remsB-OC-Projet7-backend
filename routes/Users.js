const express = require("express");
const router = express.Router();
const { Users } = require("../models");
const bcrypt = require("bcrypt");
const { validateToken } = require("../middlewares/Auth");
const { sign } = require("jsonwebtoken");

router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const user = await Users.findOne({ where: { username: username } });
  if (user) {
    res.json(`L'utilisateur existe déjà`);
    return;
  } else {
    bcrypt.hash(password, 10).then((hash) => {
      Users.create({
        username: username,
        password: hash,
      });
      res.json("SUCCESS");
    });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await Users.findOne({ where: { username: username } });

  if (!user) {
    res.json({ error: "User Doesn't Exist" });
  } else {
    bcrypt.compare(password, user.password).then((match) => {
      if (!match) {
        res.json({ error: "Wrong Username And Password Combination" });
      } else {
        const accessToken = sign(
          { username: user.username, id: user.id, isAdmin: user.isAdmin },
          "importantsecret",
          {
            expiresIn: "24h",
          }
        );
        res.json({
          token: accessToken,
          username: username,
          id: user.id,
          isAdmin: user.isAdmin,
        });
        console.log(user.isAdmin);
      }
    });
  }
});

router.get("/auth", validateToken, (req, res) => {
  res.json(req.user);
});

router.get("/basicinfo/:id", async (req, res) => {
  const id = req.params.id;

  const basicInfo = await Users.findByPk(id, {
    attributes: { exclude: ["password"] },
  });

  res.json(basicInfo);
});

router.put("/changepassword", validateToken, async (req, res) => {
  const { oldPassword, newPassword, username } = req.body;
  const user = await Users.findOne({ where: { username: username } });

  bcrypt.compare(oldPassword, user.password).then(async (match) => {
    if (!match) {
      res.json({ error: "Wrong Password Entered!" });
    } else {
      bcrypt.hash(newPassword, 10).then((hash) => {
        Users.update({ password: hash }, { where: { username: username } });
        res.json("SUCCESS");
      });
    }
  });
});

router.delete("/deleteaccount/:id", validateToken, async (req, res) => {
  console.log("je passe en 1er");
  Users.destroy({
    where: {
      id: req.params.id,
    },
  });

  res.json("DELETED SUCCESSFULLY");
});

router.get("/admin", validateToken, async (req, res) => {
  const listOfUsers = await Users.findAll({
    order: [["id", "DESC"]],
  });

  res.json(listOfUsers);
});

router.get("/lastusers", validateToken, async (req, res) => {
  const lastUsers = await Users.findAll({
    limit: 3,
    order: [["id", "DESC"]],
  });

  res.json(lastUsers);
});

router.get("/users", async (req, res) => {
  const listOfUsers = await Users.findAll({
    order: [["id", "DESC"]],
  });

  res.json(listOfUsers);
});

module.exports = router;

// expiresIn: "24h",
