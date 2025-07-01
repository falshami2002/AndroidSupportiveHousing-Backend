const db = require('../database/database');

// exports.addPillHistory = (req, res) => {
//   const { name, time } = req.body;
//   const query = `INSERT INTO pill_history (name, time) VALUES (?, ?)`;

//   db.run(query, [name, time], function (err) {
//     if (err) return res.status(500).json({ error: err.message });
//     res.status(201).json({ message: 'Inserted', id: this.lastID });
//   });
// };

// exports.getPillHistory = (req, res) => {
//   const query = `SELECT * FROM pill_history`;

//   db.all(query, [], (err, rows) => {
//     if (err) return res.status(500).json({ error: err.message });
//     res.json(rows);
//   });
// };