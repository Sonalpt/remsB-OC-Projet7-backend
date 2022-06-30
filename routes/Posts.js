const express = require("express");
const router = express.Router();
const { Posts, Likes, Comments } = require("../models");
const { validateToken } = require("../middlewares/Auth");
const multer = require("../middlewares/multer-config");
const path = require("path");
const fs = require("fs");

router.get("/", validateToken, async (req, res) => {
  const listOfPosts = await Posts.findAll({
    include: [Likes, Comments],
    order: [["id", "DESC"]],
  });
  const likedPosts = await Likes.findAll({ where: { UserId: req.user.id } });
  res.json({
    listOfPosts: listOfPosts,
    likedPosts: likedPosts,
    Comments: Comments,
  });
});

router.get("/byId/:id", validateToken, async (req, res) => {
  const id = req.params.id;
  const post = await Posts.findByPk(id, { include: [Likes, Comments] });

  res.json(post);
});

router.get("/byuserId/:id", validateToken, async (req, res) => {
  const id = req.params.id;
  const listOfPosts = await Posts.findAll({
    where: { UserId: id },
    include: [Likes, Comments],
  });
  const likedPosts = await Likes.findAll({ where: { UserId: req.user.id } });

  res.json({ listOfPosts: listOfPosts, likedPosts: likedPosts });
});

router.post("/", validateToken, multer, async (req, res) => {
  const postBody = {
    title: req.body.title,
    postText: req.body.postText,
    image: req.body.image,
    username: req.user.username,
    UserId: req.user.id,
  };

  if (req.file) {
    postBody.imageUrl = `http://${req.get("host")}/images/${req.file.filename}`;
    await Posts.create(postBody);
  } else {
    await Posts.create(postBody);
  }

  res.json(postBody);
});

router.put("/editpost", validateToken, multer, async (req, res) => {
  const post = await Posts.findOne({ where: { id: req.body.id } });
  const reqfile = req.file;

  if (post.imageUrl) {
    postImageUrl = post.imageUrl;
    const filename = postImageUrl.split("/images/")[1];

    if (reqfile) {
      fs.unlink(`images/${filename}`, () => {
        Posts.update(
          {
            postText: req.body.newText,

            imageUrl: `http://${req.get("host")}/images/${req.file.filename}`,
          },
          { where: { id: req.body.id } }
        );
      });
    } else {
      Posts.update(
        {
          postText: req.body.newText,
        },
        { where: { id: req.body.id } }
      );
    }
  } else {
    if (reqfile) {
      Posts.update(
        {
          postText: req.body.newText,

          imageUrl: `http://${req.get("host")}/images/${req.file.filename}`,
        },
        { where: { id: req.body.id } }
      );
    } else {
      Posts.update(
        {
          postText: req.body.newText,
        },
        { where: { id: req.body.id } }
      );
    }
  }

  // console.log(res.json);
});

router.delete("/:postId", validateToken, async (req, res) => {
  const postId = req.params.postId;
  const post = await Posts.findByPk(postId);
  imageUrl = post.imageUrl;

  if (imageUrl) {
    const filename = imageUrl.split("/images/")[1];
    fs.unlink(`images/${filename}`, () => {
      Posts.destroy({
        where: {
          id: postId,
        },
      });
    });
  } else {
    Posts.destroy({
      where: {
        id: postId,
      },
    });
  }

  res.json("DELETED SUCCESSFULLY");
});

module.exports = router;
