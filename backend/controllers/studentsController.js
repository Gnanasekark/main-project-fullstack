import db from "../db.js";


export const getStudents = (req, res) => {
  const sql = "SELECT * FROM students";
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
};

export const addStudent = (req, res) => {
  const { name, roll_no, class_name } = req.body;
  const sql =
    "INSERT INTO students (name, roll_no, class_name) VALUES (?, ?, ?)";

  db.query(sql, [name, roll_no, class_name], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Student added successfully" });
  });
};
