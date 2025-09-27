const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(express.static(__dirname));

mongoose.connect('mongodb://127.0.0.1:27017/zorbas12', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const userSchema = new mongoose.Schema({
  username: String,
  score: Number
});
const User = mongoose.model('User', userSchema);

app.post('/add-user', async (req, res) => {
  const { username, score } = req.body;
  const user = new User({ username, score });
  await user.save();
  res.send('User saved!');
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(3000, () => console.log('Server running at http://localhost:3000'));
