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
  if(user[0] == null) {
    res.json({success: false, message: 'Username or password invalid'});
  } else {
    bcrypt.compare(req.body.passphrase, user[0].password, function(err, result) {
      if ((result) && (req.body.username === user[0].username)) {
        req.session.user = req.body.username;
        res.json({success: true, message: 'Login success'});
      } else {
        res.json({success: false, message: 'Username or password invalid'});
      }
    });
  }
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
    res.json({success: true, message: 'Create success'});
  } else {
    res.json({success: false, message: 'Username or password invalid'});
  }
});

app.get('/logout', async(req, res) => {
  req.session.destroy();
  res.send({
    isLoggedIn: false,
    });
});

/* Main app routes */
app.get('/blog/home', async(req, res) => {
    const post = await Post.findAll({where: {user: {[Op.eq]: req.session.user}},order:[['updatedAt','DESC']]});
    res.send({
      posts: post,
      isLoggedIn: !(req.session.user == null),
      });
 });

app.delete('/blog/home', async(req, res) => {
    await Post.destroy({
        where: {
          id: req.body.postID
        }
      });
    const post = await Post.findAll({where: {user: {[Op.eq]: req.session.user}},order:[['updatedAt','DESC']]});
    res.send({
      posts: post,
      isLoggedIn: !(req.session.user == null),
      });
});

app.post('/blog/newpost', async(req, res) => {
  const post = await Post.create({title:req.body.title, body: req.body.content, isPublished: req.body.isPublished, user: req.session.user});
  res.send({
    post: post,
    isLoggedIn: !(req.session.user == null),
    });
});

app.post('/blog/editpost', async(req, res) => {
    const postID = parseInt(req.body.postID);

    const post = await Post.update({ title: req.body.title, body: req.body.content, isPublished: req.body.isPublished }, {
        where: {
        id: postID
        }
    });
    res.send({
      post: post,
      isLoggedIn: !(req.session.user == null),
    });
});

app.get('/blog/users', async(req, res) => {
  const users = await User.findAll({order:[['username']]});
    res.send({
      users: users,
      isLoggedIn: !(req.session.user == null),
      });
});

app.get('/blog/users/:user', async(req, res) => {
  const userName = req.params.user;
  const post = await Post.findAll({where: {user: userName, isPublished: true},order:[['updatedAt','DESC']]});
    res.send({
      posts: post,
      isLoggedIn: !(req.session.user == null),
      });
});

const server = app.listen(3001, function() {
    console.log('listening on port 3001');
});


