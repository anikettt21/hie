// expired-students.js

document.addEventListener('DOMContentLoaded', function () {
    fetchExpiredStudents();
    
    // Add event listeners for filter buttons
    document.getElementById('search-bar')?.addEventListener('input', filterExpiredStudents);
    document.getElementById('filter-hall')?.addEventListener('change', filterExpiredStudents);
    document.getElementById('filter-status')?.addEventListener('change', filterExpiredStudents);
  });
  
  // Function to calculate days between two dates
  function daysBetween(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
    const firstDate = new Date(date1);
    const secondDate = new Date(date2);
    return Math.round(Math.abs((firstDate - secondDate) / oneDay));
  }
  
  // Function to fetch students who are past the 30-day period
  function fetchExpiredStudents() {
    fetch('https://hie-1.onrender.com/api/students')
      .then(response => {
        if (!response.ok) throw new Error("Failed to fetch students.");
        return response.json();
      })
      .then(data => {
        const today = new Date();
        
        // Filter only students who are past 30 days but not yet deleted
        const expiredStudents = data.filter(student => {
          if (student.deleted) return false; // Skip already deleted students
          
          const regDate = new Date(student.registration_date);
          const daysSinceRegistration = daysBetween(today, regDate);
          
          // Include students who are past 30 days from registration
          return daysSinceRegistration > 30 && daysSinceRegistration <= 60;
        });
        
        renderExpiredStudents(expiredStudents);
      })
      .catch(error => console.error('Error fetching expired students:', error));
  }
  
  // Render the filtered students
  function renderExpiredStudents(expiredStudents) {
    const tbody = document.getElementById('expired-student-data');
    const today = new Date();
    
    if (!tbody) {
      console.error('Could not find element with id "expired-student-data"');
      return;
    }
    
    tbody.innerHTML = expiredStudents.map((student, index) => {
      const regDate = new Date(student.registration_date);
      const daysSinceRegistration = daysBetween(today, regDate);
      
      // Calculate days remaining until final removal (60 days after registration)
      const daysRemaining = 60 - daysSinceRegistration;
      
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${student.name} ${student.surname}</td>
          <td>${student.phone}</td>
          <td>${student.hall}</td>
          <td>${student.seat_number}</td>
          <td>${new Date(student.registration_date).toLocaleDateString('en-GB')}</td>
          <td><span class="status-indicator status-pending-removal"></span> Pending Removal</td>
          <td class="countdown">${daysRemaining} days</td>
          <td>
            <button class="restore-btn" onclick="restoreStudent('${student._id}', '${student.hall}', ${student.seat_number})">Restore</button>
            <button class="remove-btn" onclick="removeStudent('${student._id}')">Remove</button>
          </td>
        </tr>
      `;
    }).join('');
    
    // If no students found
    if (expiredStudents.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align: center;">No students pending removal found</td></tr>`;
    }
  }
  
// Function to restore a student
function restoreStudent(studentId, hall, seatNumber) {
    // First check if the seat is still available
    fetch('https://hie-1.onrender.com/api/students')
      .then(response => response.json())
      .then(students => {
        // Find seats that are currently occupied in the same hall
        const occupiedSeats = students.filter(s => 
          s.hall === hall && 
          !s.deleted && 
          s._id !== studentId // Exclude the student we're trying to restore
        ).map(s => s.seat_number);
        
        // Check if the seat is already occupied
        if (occupiedSeats.includes(parseInt(seatNumber))) {
          // Seat is occupied, ask for a new seat number
          const newSeatNumber = prompt(
            `Seat ${seatNumber} in ${hall} is already occupied. Please provide a different seat number:`,
            ""
          );
          
          if (!newSeatNumber) {
            alert("Restoration cancelled.");
            return;
          }
          
          const parsedNewSeat = parseInt(newSeatNumber);
          
          if (isNaN(parsedNewSeat) || parsedNewSeat < 1) {
            alert("Invalid seat number.");
            return;
          }
          
          // Check if the new seat is also occupied
          if (occupiedSeats.includes(parsedNewSeat)) {
            alert(`Seat ${parsedNewSeat} is also occupied. Please try again with a different seat.`);
            return;
          }
          
          // Restore with the new seat number
          updateStudentRestoration(studentId, parsedNewSeat);
        } else {
          // Original seat is available, restore with the existing seat number
          updateStudentRestoration(studentId, parseInt(seatNumber));
        }
      })
      .catch(error => {
        console.error('Error checking seat availability:', error);
        alert("Error checking seat availability. Please try again.");
      });
  }
  
  // Function to update student restoration with specified seat
  function updateStudentRestoration(studentId, seatNumber) {
    // Verify admin before proceeding
    verifyAdmin()
      .then(() => {
        // Update the student with the new seat if needed and mark as not deleted
        fetch(`https://hie-1.onrender.com/api/students/restore/${studentId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            seat_number: seatNumber,
            // Reset registration date to today (optional, based on your requirements)
            registration_date: new Date().toISOString()
          })
        })
          .then(response => {
            if (!response.ok) {
              return response.json().then(data => {
                throw new Error(data.message || "Failed to restore student.");
              });
            }
            return response.json();
          })
          .then(data => {
            alert(data.message || "Student has been restored successfully.");
            fetchExpiredStudents(); // Refresh the list
          })
          .catch(error => {
            console.error('Error restoring student:', error);
            alert(error.message || "Failed to restore student. Please try again.");
          });
      })
      .catch(() => {
        console.error("Admin verification failed for restoration.");
      });
  }
  
  // Function to permanently remove a student
  function removeStudent(studentId) {
    verifyAdmin()
      .then(() => {
        if (confirm("Are you sure you want to remove this student? This will mark them as deleted.")) {
          fetch(`https://hie-1.onrender.com/api/students/${studentId}`, { 
            method: 'DELETE' 
          })
            .then(response => {
              if (!response.ok) throw new Error("Failed to remove student.");
              return response.json();
            })
            .then(data => {
              alert(data.message || "Student has been removed successfully.");
              fetchExpiredStudents(); // Refresh the list
            })
            .catch(error => {
              console.error('Error removing student:', error);
              alert("Failed to remove student. Please try again.");
            });
        }
      })
      .catch(() => {
        console.error("Admin verification failed for removal.");
      });
  }
  
  // Filter function for expired students
  function filterExpiredStudents() {
    const searchText = document.getElementById('search-bar').value.toLowerCase();
    const filterHall = document.getElementById('filter-hall').value;
    
    fetch('https://hie-1.onrender.com/api/students')
      .then(response => response.json())
      .then(students => {
        const today = new Date();
        
        const filteredData = students.filter(student => {
          if (student.deleted) return false; // Skip deleted students
          
          // Calculate days since registration
          const regDate = new Date(student.registration_date);
          const daysSinceRegistration = daysBetween(today, regDate);
          
          // Only include students who are past 30 days but within 60 days
          if (daysSinceRegistration <= 30 || daysSinceRegistration > 60) return false;
          
          // Apply search text filter
          const matchesSearch = 
            student.name.toLowerCase().includes(searchText) ||
            student.surname.toLowerCase().includes(searchText) ||
            student.phone.includes(searchText) ||
            (student.email && student.email.toLowerCase().includes(searchText)) ||
            student.seat_number.toString().includes(searchText);
          
          // Apply hall filter
          const matchesHall = filterHall === 'all' ? true : student.hall === filterHall;
          
          return matchesSearch && matchesHall;
        });
        
        renderExpiredStudents(filteredData);
      })
      .catch(error => console.error('Error filtering expired students:', error));
  }
  
  // Helper for admin verification using backend API
  function verifyAdmin() {
    return new Promise((resolve, reject) => {
      const adminPass = prompt("Enter Admin Password:");
      if (!adminPass) {
        reject();
        return;
      }
      
      fetch("https://hie-1.onrender.com/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPass })
      })
        .then(response => {
          if (!response.ok) throw new Error("Incorrect admin password.");
          return response.json();
        })
        .then(() => resolve())
        .catch(err => {
          alert(err.message);
          reject();
        });
    });
  }
  
  // Set up auto-refresh every minute to update countdown timers
  setInterval(fetchExpiredStudents, 60000);