const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const currentUser = require('./currentUser');
const con = require('./connection.js');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: 'your-secret-key', 
    resave: false,
    saveUninitialized: true,
  })
);

app.listen(3000, function () {
  console.log('Server is running!');
});

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/newsfeed', function (req, res) {
  res.sendFile(__dirname + '/newsfeed.html');
});
app.get('/myposts', function (req, res) {
  res.sendFile(__dirname + '/myposts.html');
});



app.post('/login', function (req, res) {
  var email = req.body.email;
  var password = req.body.password;

  var sql = 'SELECT * FROM `USER` WHERE email = ? AND password = ?';
  var values = [email, password];

  con.query(sql, values, function (err, result) {
    if (err) throw err;

    if (result.length > 0) {

      const userId = result[0].id_user;
      console.log(userId);


      req.session.userId = userId;

      currentUser.setCurrentUserId(userId);
      currentUser.setCurrentUserIdPost(userId);
      res.redirect('/newsfeed');
    } else {

      res.send('User not found!');
    }
  });
});

app.post('/', function (req, res) {
  var name = req.body.name;
  var email = req.body.email;
  var password = req.body.password;
  var phone_number = req.body.phone_number;
  var hobbies = req.body.hobbies;
  var description = req.body.description;
  var facebook = req.body.facebook;
  var location = req.body.location;

  var userSql =
    'INSERT INTO `USER` (name, password, email, register_date, last_login) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)';
  var userValues = [name, password, email];

  con.query(userSql, userValues, function (err, result) {
    if (err) throw err;


    const userId = result.insertId;
    req.session.userId = userId;


    currentUser.setCurrentUserId(userId);
    currentUser.setCurrentUserIdPost(userId);


    var profileSql =
      'INSERT INTO `PROFILE` (id_user, phone_number, hobbies, description, facebook, location) VALUES (?, ?, ?, ?, ?, ?)';
    var profileValues = [
      userId,
      phone_number,
      hobbies,
      description,
      facebook,
      location,
    ];

    con.query(profileSql, profileValues, function (err, result) {
      if (err) throw err;

      console.log('Data uploaded!');
      res.redirect('/newsfeed'); 
    });
  });
});

app.get('/posts', function (req, res) {
  var userIdToExclude = req.session.userId;
  console.log(userIdToExclude);

  var sql = `
    SELECT p.id_post, p.title, p.content, p.post_date, 
    u.name as user_name, c.name as category_name,
    COUNT(DISTINCT f1.id_user) as positive_feedbacks,
    COUNT(DISTINCT f2.id_user) as negative_feedbacks,
    GROUP_CONCAT(DISTINCT t.name) as tags,
    MAX(cmt.content) as comment_content,
    MAX(cu.name) as comment_user
  FROM post p
  JOIN USER u ON p.id_user = u.id_user
  JOIN category c ON p.id_category = c.id_category
  LEFT JOIN feedback f1 ON p.id_post = f1.id_post AND f1.type = 'positive'
  LEFT JOIN feedback f2 ON p.id_post = f2.id_post AND f2.type = 'negative'
  LEFT JOIN post_tags pt ON p.id_post = pt.id_post
  LEFT JOIN tags t ON pt.id_tag = t.id_tag
  LEFT JOIN COMMENT cmt ON p.id_post = cmt.id_post
  LEFT JOIN USER cu ON cmt.id_user = cu.id_user
  WHERE p.id_user <> ?
  GROUP BY p.id_post, p.title, p.content, p.post_date, u.name, c.name
  ORDER BY p.post_date DESC;
  `;

  con.query(sql, [userIdToExclude], function (err, result) {
    if (err) {
      console.error('Error fetching posts:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(result);
    }
  });
});

app.post("/createpost", function (req, res) {
  const userId = req.session.userId 

  const title = req.body.title;

  const content = req.body.content;
  const category = req.body.category;


  const postSql = 'INSERT INTO `post` (title, content, post_date, id_user, id_category) VALUES (?, ?, CURRENT_TIMESTAMP, ?, ?)';
  const postValues = [title, content, userId, category];

  con.query(postSql, postValues, function (err, result) {
    if (err) {
      console.error('Error creating post:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      console.log("Post created!");
      res.redirect("/newsfeed"); 
    }
  });
});


app.post("/createcomment", function (req, res) {
  const userId = req.session.userId;
  const postId = req.body.postId; 

  const content = req.body.content;

  const commentSql = 'INSERT INTO `comment` (content, comment_date, id_user, id_post) VALUES (?, CURRENT_TIMESTAMP, ?, ?)';
  const commentValues = [content, userId, postId];

  con.query(commentSql, commentValues, function (err, result) {
    if (err) {
      console.error('Error creating comment:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      console.log("Comment created!");
      res.redirect("/newsfeed"); 
    }
  });
});



app.get('/mypostsdata', function (req, res) {
  var userId = req.session.userId; 

  var sql = `
    SELECT p.id_post, p.title, p.content, p.post_date, 
    u.name as user_name, c.name as category_name,
    COUNT(DISTINCT f1.id_user) as positive_feedbacks,
    COUNT(DISTINCT f2.id_user) as negative_feedbacks,
    GROUP_CONCAT(DISTINCT t.name) as tags,
    MAX(cmt.content) as comment_content,
    MAX(cu.name) as comment_user
  FROM post p
  JOIN USER u ON p.id_user = u.id_user
  JOIN category c ON p.id_category = c.id_category
  LEFT JOIN feedback f1 ON p.id_post = f1.id_post AND f1.type = 'positive'
  LEFT JOIN feedback f2 ON p.id_post = f2.id_post AND f2.type = 'negative'
  LEFT JOIN post_tags pt ON p.id_post = pt.id_post
  LEFT JOIN tags t ON pt.id_tag = t.id_tag
  LEFT JOIN COMMENT cmt ON p.id_post = cmt.id_post
  LEFT JOIN USER cu ON cmt.id_user = cu.id_user
  WHERE p.id_user = ?
  GROUP BY p.id_post, p.title, p.content, p.post_date, u.name, c.name
  ORDER BY p.post_date DESC;
  `;

  con.query(sql, [userId], function (err, result) {
    if (err) {
      console.error('Error fetching user\'s posts:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(result);
    }
  });
});


app.post('/feedback', function (req, res) {
  const userId = req.session.userId;
  const postId = req.body.postId;
  const type = req.body.type;

  const feedbackSql = 'INSERT INTO `feedback` ( id_user, id_post, type, feedback_date) VALUES (?, ?, ?, CURRENT_TIMESTAMP)';
  const feedbackValues = [userId, postId, type];

  con.query(feedbackSql, feedbackValues, function (err, result) {
    if (err) {
      console.error(`Error inserting ${type} feedback for post ${postId}:`, err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json({ success: true });
    }
  });
});

app.post('/feedbackrst', function (req, res) {
  const userId = req.session.userId;
  const postId = req.body.postId;

  const feedbackSql = 'DELETE FROM `feedback` WHERE id_user = ? AND id_post = ?';
  const feedbackValues = [userId, postId];

  con.query(feedbackSql, feedbackValues, function (err, result) {
    if (err) {
      console.error(`Error resetting feedback for post ${postId}:`, err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json({ success: true });
    }
  });
});

app.get('/comments', function (req, res) {
  const postId = req.query.postId;

  const commentsSql = `
      SELECT c.id_comment, c.content, c.comment_date, u.name as user_name
      FROM COMMENT c
      JOIN USER u ON c.id_user = u.id_user
      WHERE c.id_post = ?;
  `;

  con.query(commentsSql, [postId], function (err, result) {
    if (err) {
      console.error(`Error fetching comments for post ${postId}:`, err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(result);
    }
  });
});


app.post('/deletepost', function (req, res) {
  const postId = req.body.postId;

  const deletePostSql = 'DELETE FROM post WHERE id_post = ?';
  const deletePostValues = [postId];

  con.query(deletePostSql, deletePostValues, function (err, result) {
    if (err) {
      console.error('Error deleting post:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      console.log(`Post with ID ${postId} deleted successfully`);
      res.json({ success: true });
    }
  });
});


app.get('/mycommentsdata', function (req, res) {
  const userId = req.session.userId;

  con.beginTransaction(function (err) {
    if (err) {
      console.error('Error beginning transaction:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    const getCommentsSql = `
          SELECT c.id_comment, c.content, p.title AS post_title
          FROM COMMENT c
          JOIN post p ON c.id_post = p.id_post
          WHERE c.id_user = ?;
      `;

    con.query(getCommentsSql, [userId], function (err, comments) {
      if (err) {
        console.error('Error fetching comments:', err);
        con.rollback(function () {
          res.status(500).json({ error: 'Internal Server Error' });
        });
      } else {
        con.commit(function (err) {
          if (err) {
            console.error('Error committing transaction:', err);
            con.rollback(function () {
              res.status(500).json({ error: 'Internal Server Error' });
            });
          } else {
            res.json(comments);
          }
        });
      }
    });
  });
});


app.post('/deletecomment', (req, res) => {
  const { id_comment } = req.body;

  const deleteCommentQuery = 'DELETE FROM COMMENT WHERE id_comment = ?';
  con.query(deleteCommentQuery, [id_comment], (error, results) => {
    if (error) {
      console.error('Error deleting comment:', error);
      res.status(500).json({ success: false, message: 'Error deleting comment.' });
    } else {
      res.json({ success: true, message: 'Comment deleted successfully.' });
    }
  });
});



module.exports = app;
