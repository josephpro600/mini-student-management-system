
import { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";

// 1. CUSTOM HOOK: DEBOUNCING
function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// 2. CUSTOM HOOK: THROTTLING
function useThrottle(callback, delay = 1000) {
  const lastRun = useRef(0);
  const callbackRef = useRef(callback);

  callbackRef.current = callback;

  return useCallback((...args) => {
    const now = Date.now();

    if (now - lastRun.current >= delay) {
      lastRun.current = now;
      callbackRef.current(...args);
    }
  }, [delay]);
}

// 3. CUSTOM HOOK: KEYBOARD SHORTCUTS
function useKeyboardShortcuts({ onSearch, onNewStudent, onEscape }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.ctrlKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onSearch();
      }

      if (event.ctrlKey && event.key.toLowerCase() === "n") {
        event.preventDefault();
        onNewStudent();
      }

      if (event.key === "Escape") {
        onEscape();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onSearch, onNewStudent, onEscape]);
}

function App() {
  // 4. CONTROLLED COMPONENTS
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    className: ""
  });

  // Store student records in localStorage
  const [students, setStudents] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("students")) || [];
    } catch {
      return [];
    }
  });

  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [message, setMessage] = useState("");

  const searchRef = useRef(null);
  const nameRef = useRef(null);

  // Save records whenever students change
  useEffect(() => {
    localStorage.setItem("students", JSON.stringify(students));
  }, [students]);

  // 5. DEBOUNCED SEARCH
  const debouncedSearch = useDebounce(search, 500);

  const filteredStudents = students.filter((student) =>
    `${student.name} ${student.email} ${student.className}`
      .toLowerCase()
      .includes(debouncedSearch.toLowerCase())
  );

  // 6. FORM INPUT EVENT
  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));
  }

  // 7. REGISTER STUDENT
  function registerStudent(event) {
    event.preventDefault();

    const { name, email, phone, gender, className } = formData;

    if (!name.trim() || !email.trim() || !phone.trim() ||
        !gender || !className.trim()) {
      setMessage("Please complete all fields.");
      return;
    }

    const emailExists = students.some(
      (student) => student.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (emailExists) {
      setMessage("This email is already registered.");
      return;
    }

    const newStudent = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      gender,
      className: className.trim(),
      registeredAt: new Date().toLocaleDateString()
    };

    setStudents((previous) => [...previous, newStudent]);

    setFormData({
      name: "",
      email: "",
      phone: "",
      gender: "",
      className: ""
    });

    setMessage("Student registered successfully!");
  }

  // 8. THROTTLED FORM SUBMISSION
  const throttledRegister = useThrottle(registerStudent, 1000);

  function handleSubmit(event) {
    event.preventDefault();
    throttledRegister(event);
  }

  // 9. DELETE STUDENT USING FILTER()
  function deleteStudent(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this student?"
    );

    if (!confirmed) return;

    setStudents((previous) =>
      previous.filter((student) => student.id !== id)
    );

    setSelectedStudent(null);
    setMessage("Student deleted successfully!");
  }

  // 10. VIEW STUDENT DETAILS
  function viewStudent(id) {
    const student = students.find((item) => item.id === id);
    setSelectedStudent(student || null);
  }

  // 11. KEYBOARD SHORTCUT CALLBACKS
  const focusSearch = useCallback(() => {
    searchRef.current?.focus();
  }, []);

  const focusNewStudent = useCallback(() => {
    nameRef.current?.focus();
  }, []);

  const closeDetails = useCallback(() => {
    setSelectedStudent(null);
  }, []);

  useKeyboardShortcuts({
    onSearch: focusSearch,
    onNewStudent: focusNewStudent,
    onEscape: closeDetails
  });

  return (
    <div className="app">

      {/* SIDEBAR */}
      <aside className="sidebar">
        <h2>SMS Admin</h2>
        <p>Student Management</p>

        <nav>
          <a href="#dashboard">Dashboard</a>
          <a href="#register">Register Student</a>
          <a href="#students">Students</a>
        </nav>

        <div className="shortcut">
          <p>Keyboard shortcuts</p>
          <small>Ctrl + K : Search</small>
          <small>Ctrl + N : New student</small>
          <small>Esc : Close details</small>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main">

        <header className="topbar">
          <div>
            <h1>Student Management</h1>
            <p>Manage your student records efficiently.</p>
          </div>
          <span className="admin">Administrator</span>
        </header>

        {/* DASHBOARD */}
        <section id="dashboard" className="stats">

          <div className="stat-card">
            <h3>Total Students</h3>
            <h2>{students.length}</h2>
          </div>

          <div className="stat-card">
            <h3>Male Students</h3>
            <h2>
              {students.filter(s => s.gender === "Male").length}
            </h2>
          </div>

          <div className="stat-card">
            <h3>Female Students</h3>
            <h2>
              {students.filter(s => s.gender === "Female").length}
            </h2>
          </div>

        </section>

        {/* REGISTRATION FORM */}
        <section id="register" className="panel">
          <h2>Register New Student</h2>

          <form onSubmit={handleSubmit}>

            <div className="form-grid">

              <input
                ref={nameRef}
                type="text"
                name="name"
                placeholder="Student full name"
                value={formData.name}
                onChange={handleChange}
                required
              />

              <input
                type="email"
                name="email"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
                required
              />

              <input
                type="tel"
                name="phone"
                placeholder="Phone number"
                value={formData.phone}
                onChange={handleChange}
                required
              />

              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>

              <input
                type="text"
                name="className"
                placeholder="Class e.g. L5 Software Development"
                value={formData.className}
                onChange={handleChange}
                required
              />

            </div>

            <button type="submit" className="primary-btn">
              Register Student
            </button>

            {message && <p className="message">{message}</p>}

          </form>
        </section>

        {/* STUDENT LIST */}
        <section id="students" className="panel">

          <div className="list-header">
            <h2>Registered Students</h2>

            <input
              ref={searchRef}
              type="search"
              placeholder="Search students... (Ctrl + K)"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Class</th>
                  <th>Gender</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.map((student) => (

                  // NESTED CLICK EVENT
                  <tr
                    key={student.id}
                    onClick={() => viewStudent(student.id)}
                    className="student-row"
                  >
                    <td>{student.name}</td>
                    <td>{student.email}</td>
                    <td>{student.className}</td>
                    <td>{student.gender}</td>

                    <td>
                      <button
                        className="view-btn"
                        onClick={(event) => {
                          event.stopPropagation();
                          viewStudent(student.id);
                        }}
                      >
                        View
                      </button>

                      <button
                        className="delete-btn"
                        onClick={(event) => {
                          event.stopPropagation();
                          deleteStudent(student.id);
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>

                ))}

                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan="5" className="empty">
                      No students found.
                    </td>
                  </tr>
                )}

              </tbody>
            </table>
          </div>

        </section>

        {/* STUDENT DETAILS MODAL */}
        {selectedStudent && (
          <div
            className="modal-overlay"
            onClick={closeDetails}
          >
            <div
              className="modal"
              onClick={(event) => event.stopPropagation()}
            >
              <h2>Student Details</h2>

              <p><strong>Name:</strong> {selectedStudent.name}</p>
              <p><strong>Email:</strong> {selectedStudent.email}</p>
              <p><strong>Phone:</strong> {selectedStudent.phone}</p>
              <p><strong>Gender:</strong> {selectedStudent.gender}</p>
              <p><strong>Class:</strong> {selectedStudent.className}</p>
              <p>
                <strong>Registration date:</strong>{" "}
                {selectedStudent.registeredAt}
              </p>

              <button
                className="primary-btn"
                onClick={closeDetails}
              >
                Close
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
