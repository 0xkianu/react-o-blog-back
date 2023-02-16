const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();
const Sequelize = require('sequelize');
const { Post } = require('./models');
const { User } = require('./models');
const { Op } = require('sequelize');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');


app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '/../public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.use(
  session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      maxAge: 2592000000,
     } 
  })
);


//test for accessibility
app.get('/heartbeat', (req, res) => {
    res.json({
        "is": "working"
    })
});

//login routes
app.post('/login', async(req, res) => {
  const user = await User.findAll({
    where: {
      username: {
        [Op.eq]: req.body.username
      }
    }
  });

  bcrypt.compare(req.body.passphrase, user[0].password, function(err, result) {
      if ((result) && (req.body.username === user[0].username)) {
        req.session.user = req.body.username;
      } 
  });
});

app.post('/create_account', async(req, res) => {
  const user = await User.findAll({
    where: {
      username: {
        [Op.eq]: req.body.username
      }
    }
  });
  if(user[0] == null) {
    bcrypt.hash(req.body.passphrase, 10, function(err, hash) {
        User.create({username: req.body.username, password: hash});
    });
  } 
});

/* Main app routes */
app.get('/blog/home', async(req, res) => {
    req.session.user = 'tlee';
    const post = await Post.findAll({where: {user: {[Op.eq]: req.session.user}},order:[['updatedAt','DESC']]});
    res.send(post);
 });

app.delete('/blog/home', async(req, res) => {
    await Post.destroy({
        where: {
          id: req.body.postID
        }
      });
    const post = await Post.findAll({where: {user: {[Op.eq]: req.session.user}},order:[['updatedAt','DESC']]});
    res.send(post);
});

app.post('/blog/newpost', async(req, res) => {
  const post = await Post.create({title:req.body.title, body: req.body.content, isPublished: req.body.isPublished, user: req.session.user});
  res.send(post);
});

app.post('/blog/editpost', async(req, res) => {
    const postID = parseInt(req.body.postID);

    const post = await Post.update({ title: req.body.title, body: req.body.content, isPublished: req.body.isPublished }, {
        where: {
        id: postID
        }
    });
    res.send(post);
});

const server = app.listen(3001, function() {
    console.log('listening on port 3001');
});


