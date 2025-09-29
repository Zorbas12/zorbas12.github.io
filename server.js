const express = require('express');
const bodyParser = require('body-parser');
const { Low, JSONFile } = require('lowdb');
const path = require('path');

const app = express();
const port = 3000;

// Serve your frontend
app.use(express.static(path.join(__dirname)));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// LowDB setup
const adapter = new JSONFile('db.json');
const db = new Low(adapter);

async function initDB() {
  await db.read();
  db.data = db.data || { submissions: [] };
  await db.write();
}
initDB();

// Handle form submission
app.post('/submit', async (req, res) => {
  const { name, month, day, shift, store } = req.body;
  await db.read();
  const newSubmission = { id: Date.now().toString(), name, month, day, shift, store };
  db.data.submissions.push(newSubmission);
  await db.write();
  res.json({ success: true });
});

// Get all submissions
app.get('/submissions', async (req, res) => {
  await db.read();
  res.json(db.data.submissions);
});

// Delete submission
app.delete('/submission/:id', async (req, res) => {
  await db.read();
  db.data.submissions = db.data.submissions.filter(s => s.id !== req.params.id);
  await db.write();
  res.json({ success: true });
});

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
