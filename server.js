const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Replace <db_username> and <db_password> with your provided credentials,
// and use your database name "Study-room"
const uri = "mongodb+srv://aniket:878819@cluster0.tvi7o.mongodb.net/Study-room?retryWrites=true&w=majority";

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch(err => console.error("MongoDB connection error:", err));

//
// Mongoose Schemas and Models
//

// Student Schema
const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  surname: { type: String, required: true },
  email: String,
  phone: { type: String, required: true },
  hall: { type: String, required: true },
  seat_number: { type: Number, required: true },
  seat_type: String,
  payment_method: String,
  remaining_fees: String,
  fees_amount: Number,
  registration_date: { type: Date, required: true },
  deleted: { type: Boolean, default: false }
});
const Student = mongoose.model("Student", studentSchema);

// Admin Schema (for storing admin password)
const adminSchema = new mongoose.Schema({
  password_hash: String
});
const Admin = mongoose.model("Admin", adminSchema);

//
// ADMIN ROUTES
//

// GET: Check if an admin password is set
app.get('/api/admin/check', async (req, res) => {
  try {
    const admin = await Admin.findOne();
    if (!admin || !admin.password_hash) {
      res.json({ passwordSet: false });
    } else {
      res.json({ passwordSet: true });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Set or update admin password
app.post('/api/admin/set-password', async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: "Password is required" });
  try {
    const hashed = await bcrypt.hash(password, 10);
    let admin = await Admin.findOne();
    if (!admin) {
      admin = new Admin({ password_hash: hashed });
    } else {
      admin.password_hash = hashed;
    }
    await admin.save();
    res.json({ message: "Admin password set/updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Verify admin login
app.post('/api/admin/login', async (req, res) => {
  const { password } = req.body;
  try {
    const admin = await Admin.findOne();
    if (!admin || !admin.password_hash)
      return res.status(400).json({ error: "No admin password set" });
    const match = await bcrypt.compare(password, admin.password_hash);
    if (match) {
      res.json({ success: true });
    } else {
      res.status(401).json({ error: "Incorrect password" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//
// STUDENT ROUTES
//

// GET: Retrieve all students
app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Create a new student registration
app.post('/api/students', async (req, res) => {
  try {
    const studentData = req.body;
    studentData.registration_date = new Date(studentData.registration_date);
    const student = new Student(studentData);
    await student.save();
    res.json({ message: "Student registered successfully", student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT: Update a student registration
app.put('/api/students/:id', async (req, res) => {
  try {
    const studentData = req.body;
    studentData.registration_date = new Date(studentData.registration_date);
    const student = await Student.findByIdAndUpdate(req.params.id, studentData, { new: true });
    res.json({ message: "Student updated successfully", student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE: Soft delete a student (mark as deleted)
app.delete('/api/students/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, { deleted: true }, { new: true });
    res.json({ message: "Student marked as deleted", student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//
// HALL ROUTES (Optional)
//

// GET: Retrieve sold seat numbers for a given hall (non-deleted students)
app.get('/api/hall/:hall', async (req, res) => {
  try {
    const hallName = req.params.hall;
    const students = await Student.find({ hall: hallName, deleted: false });
    const seats = students.map(s => s.seat_number);
    res.json(seats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// GET: Retrieve a single student by ID
app.get('/api/students/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: "Student not found" });
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
