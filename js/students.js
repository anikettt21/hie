// students.js

document.addEventListener('DOMContentLoaded', function () {
    fetchStudents();
    document.getElementById('toggle-cumulative').addEventListener('click', toggleCumulativeView);
  });
  
  function fetchStudents() {
    fetch('https://hie-1.onrender.com/api/students')
      .then(response => {
        if (!response.ok) throw new Error("Failed to fetch students.");
        return response.json();
      })
      .then(data => {
        renderStudents(data);
      })
      .catch(error => console.error('Error fetching students:', error));
  }
  
  function renderStudents(data) {
    const tbody = document.getElementById('student-data');
    tbody.innerHTML = data.map((student, index) => `
      <tr class="${student.deleted ? 'deleted-row' : ''}">
        <td>${index + 1}</td>
        <td>${student.name} ${student.surname}</td>
        <td>${student.phone}</td>
        <td>${student.hall}</td>
        <td>${student.seat_number}</td>
        <td>${new Date(student.registration_date).toLocaleDateString('en-GB')}</td>
        <td>
          <span class="${student.remaining_fees === 'yes' ? 'fees-yes' : 'fees-no'}">
            ${student.remaining_fees === 'yes' ? student.fees_amount : 'No'}
          </span>
        </td>
        <td>${student.seat_type}</td>
        <td>
          ${student.deleted 
            ? `<em>Deleted</em> 
               <button class="delete-btn" onclick="permanentlyDeleteStudent('${student._id}')">Permanent Delete</button>`
            : `<button class="edit-btn" onclick="editStudent('${student._id}')">Edit</button>
               <button class="delete-btn" onclick="deleteStudent('${student._id}')">Delete</button>`}
        </td>
      </tr>
    `).join('');
  }
  
  function filterStudents() {
    const searchText = document.getElementById('search-bar').value.toLowerCase();
    const filterMonth = document.getElementById('filter-month').value;
    const filterHall = document.getElementById('filter-hall').value;
    const filterSeatType = document.getElementById('filter-seat-type').value;
    
    fetch('https://hie-1.onrender.com/api/students')
      .then(response => response.json())
      .then(students => {
        const filteredData = students.filter(student => {
          const matchesSearch = student.name.toLowerCase().includes(searchText) ||
                                student.phone.includes(searchText) ||
                                (student.email && student.email.toLowerCase().includes(searchText)) ||
                                student.seat_number.toString().includes(searchText);
          const matchesMonth = filterMonth ? 
              new Date(student.registration_date).toLocaleString('default', { month: 'long' }) === filterMonth : true;
          const matchesHall = filterHall !== 'all' ? student.hall === filterHall : true;
          const matchesSeatType = filterSeatType ? student.seat_type === filterSeatType : true;
          return matchesSearch && matchesMonth && matchesHall && matchesSeatType;
        });
        renderStudents(filteredData);
      })
      .catch(error => console.error('Error filtering students:', error));
  }
    
  // Helper for admin verification using backend API.
  function verifyAdmin() {
    return new Promise((resolve, reject) => {
      const adminPass = prompt("Enter Admin Password:");
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
    
  function editStudent(id) {
    verifyAdmin()
      .then(() => {
        window.location.href = `registration.html?edit=${id}`;
      })
      .catch(() => {
        console.error("Admin verification failed for editing.");
      });
  }
    
  function deleteStudent(id) {
    verifyAdmin()
      .then(() => {
        if (confirm('Are you sure you want to delete this student?')) {
          fetch(`https://hie-1.onrender.com/api/students/${id}`, { method: 'DELETE' })
            .then(response => {
              if (!response.ok) throw new Error("Failed to delete student.");
              return response.json();
            })
            .then(data => {
              alert(data.message);
              fetchStudents();
            })
            .catch(error => console.error('Error deleting student:', error));
        }
      })
      .catch(() => {
        console.error("Admin verification failed for deletion.");
      });
  }
    
  // New: Permanently delete a student (for already soft-deleted students)
  function permanentlyDeleteStudent(id) {
    verifyAdmin()
      .then(() => {
        if (confirm("Are you sure you want to permanently delete this student? This action cannot be undone.")) {
          fetch(`https://hie-1.onrender.com/api/students/permanent/${id}`, { method: 'DELETE' })
            .then(response => {
              if (!response.ok) throw new Error("Failed to permanently delete student.");
              return response.json();
            })
            .then(data => {
              alert(data.message);
              fetchStudents();
            })
            .catch(error => console.error("Error permanently deleting student:", error));
        }
      })
      .catch(() => {
        console.error("Admin verification failed for permanent deletion.");
      });
  }
    
  // --- Cumulative (Timeline) View ---
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    
  function renderCumulativeStudents() {
    const searchText = document.getElementById('search-bar').value.toLowerCase();
    const filterHall = document.getElementById('filter-hall').value;
    const filterSeatType = document.getElementById('filter-seat-type').value;
    
    fetch('https://hie-1.onrender.com/api/students')
      .then(response => response.json())
      .then(allStudents => {
        let students = allStudents.filter(student => {
          const matchesSearch = student.name.toLowerCase().includes(searchText) ||
                                student.phone.includes(searchText) ||
                                (student.email && student.email.toLowerCase().includes(searchText)) ||
                                student.seat_number.toString().includes(searchText);
          const matchesHall = filterHall !== 'all' ? student.hall === filterHall : true;
          const matchesSeatType = filterSeatType ? student.seat_type === filterSeatType : true;
          return matchesSearch && matchesHall && matchesSeatType;
        });
        
        students.sort((a, b) => new Date(a.registration_date) - new Date(b.registration_date));
        
        let uniqueMonths = [
          ...new Set(
            students.map(s => parseInt(s.registration_date.split("-")[1], 10))
          )
        ];
        uniqueMonths.sort((a, b) => a - b);
        
        let html = "";
        uniqueMonths.forEach((monthNum) => {
          const cumulativeStudents = students.filter(s => {
            const regMonth = parseInt(s.registration_date.split("-")[1], 10);
            return regMonth <= monthNum;
          });
          if (cumulativeStudents.length > 0) {
            const monthName = monthNames[monthNum - 1];
            html += `<h3>${monthName}</h3>`;
            html += `<table class="cumulative-table"><thead><tr>
                      <th>#</th><th>Name</th><th>Phone</th><th>Hall</th><th>Seat</th><th>Reg Date</th>
                     </tr></thead><tbody>`;
            cumulativeStudents.forEach((s, i) => {
              html += `<tr ${s.deleted ? 'class="deleted-row"' : ''}>
                        <td>${i + 1}</td>
                        <td>${s.name} ${s.surname}</td>
                        <td>${s.phone}</td>
                        <td>${s.hall}</td>
                        <td>${s.seat_number}</td>
                        <td>${new Date(s.registration_date).toLocaleDateString('en-GB')}</td>
                      </tr>`;
            });
            html += `</tbody></table>`;
          }
        });
        document.getElementById("cumulative-container").innerHTML = html;
      })
      .catch(err => console.error("Error fetching cumulative students:", err));
  }
    
  function toggleCumulativeView() {
    const cumulativeContainer = document.getElementById("cumulative-container");
    const normalContainer = document.getElementById("normal-view");
    if (cumulativeContainer.style.display === "none" || cumulativeContainer.style.display === "") {
      cumulativeContainer.style.display = "block";
      normalContainer.style.display = "none";
      renderCumulativeStudents();
    } else {
      cumulativeContainer.style.display = "none";
      normalContainer.style.display = "block";
    }
  }
  

// After the line: document.getElementById('toggle-cumulative').addEventListener('click', toggleCumulativeView);
// Add:
document.addEventListener('DOMContentLoaded', function () {
  fetchStudents();
  document.getElementById('toggle-cumulative').addEventListener('click', toggleCumulativeView);
  
  // Add the expired students check
  checkForExpiringStudents();
});

// Add this function to students.js
function checkForExpiringStudents() {
  fetch('https://hie-1.onrender.com/api/students')
    .then(response => response.json())
    .then(students => {
      const today = new Date();
      const expiringStudents = students.filter(student => {
        if (student.deleted) return false;
        
        const regDate = new Date(student.registration_date);
        const daysSinceRegistration = daysBetween(today, regDate);
        
        // Students in either the first 30 days or the pending removal period
        return daysSinceRegistration <= 60;
      });
      
      // If there are students in the expiration window, show a notification
      if (expiringStudents.length > 0) {
        const pendingRemoval = expiringStudents.filter(student => {
          const regDate = new Date(student.registration_date);
          const daysSinceRegistration = daysBetween(today, regDate);
          return daysSinceRegistration > 30 && daysSinceRegistration <= 60;
        });
        
        // Add a visual indicator in the header if there are students pending removal
        if (pendingRemoval.length > 0) {
          const headerNav = document.querySelector('.nav-buttons');
          
          // Only add if it doesn't already exist
          if (!document.querySelector('.expired-link')) {
            const expiredLink = document.createElement('a');
            expiredLink.href = 'expired-students.html';
            expiredLink.className = 'btn btn-outline expired-link';
            expiredLink.innerHTML = `Pending Removal <span class="badge">${pendingRemoval.length}</span>`;
            expiredLink.style.position = 'relative';
            
            const badge = document.createElement('span');
            badge.className = 'badge';
            badge.textContent = pendingRemoval.length;
            badge.style.position = 'absolute';
            badge.style.top = '-8px';
            badge.style.right = '-8px';
            badge.style.backgroundColor = '#e74c3c';
            badge.style.color = 'white';
            badge.style.borderRadius = '50%';
            badge.style.padding = '2px 6px';
            badge.style.fontSize = '12px';
            
            expiredLink.appendChild(badge);
            headerNav.appendChild(expiredLink);
          }
        }
      }
    })
    .catch(error => console.error('Error checking for expiring students:', error));
}

// Helper function to calculate days between dates
function daysBetween(date1, date2) {
  const oneDay = 24 * 60 * 60 * 1000;
  const firstDate = new Date(date1);
  const secondDate = new Date(date2);
  return Math.round(Math.abs((firstDate - secondDate) / oneDay));
}

// Modifications to hall.js to respect expired student seats

// Modify the loadHallData function in hall.js:
function loadHallData() {
  hall = window.location.pathname.includes('hall1') ? 'hall1' : 'hall2';
  // Retrieve removed seats and totalSeats from localStorage (or defaults)
  removedSeats = JSON.parse(localStorage.getItem("removedSeats_" + hall)) || [];
  permanentlyRemovedSeats = JSON.parse(localStorage.getItem("permanentlyRemovedSeats_" + hall)) || [];
  totalSeats = parseInt(localStorage.getItem("totalSeats_" + hall)) || 50;

  // Fetch all students from backend and filter by hall
  fetch('https://hie-1.onrender.com/api/students')
    .then(response => response.json())
    .then(students => {
      const today = new Date();
      
      // For the hall display, only show seats of active students (not deleted and not in the removal period)
      soldSeats = students.filter(s => {
        if (s.hall !== hall || s.deleted) return false;
        
        // Check if student is in the removal period (between 30-60 days)
        const regDate = new Date(s.registration_date);
        const daysSinceRegistration = daysBetween(today, regDate);
        
        // Only include students in their first 30 days (active period)
        return daysSinceRegistration <= 30;
      }).map(s => s.seat_number);
      
      const maxSold = soldSeats.length > 0 ? Math.max(...soldSeats) : 0;
      totalSeats = Math.max(totalSeats, 50, maxSold);
      renderSeats();
    })
    .catch(err => console.error("Error fetching students:", err));
}

// Helper to calculate days between dates (add to hall.js)
function daysBetween(date1, date2) {
  const oneDay = 24 * 60 * 60 * 1000;
  const firstDate = new Date(date1);
  const secondDate = new Date(date2);
  return Math.round(Math.abs((firstDate - secondDate) / oneDay));
}
// Add this to the top of your DOMContentLoaded event in students.js
document.addEventListener('DOMContentLoaded', function () {
  fetchStudents();
  document.getElementById('toggle-cumulative').addEventListener('click', toggleCumulativeView);
  
  // Add the expired students check
  checkForExpiringStudents();
});

// Add this function to students.js
function checkForExpiringStudents() {
  fetch('https://hie-1.onrender.com/api/students')
    .then(response => response.json())
    .then(students => {
      const today = new Date();
      const pendingRemovalStudents = students.filter(student => {
        if (student.deleted) return false;
        
        const regDate = new Date(student.registration_date);
        const daysSinceRegistration = daysBetween(today, regDate);
        
        // Students in the pending removal period (between 30-60 days)
        return daysSinceRegistration > 30 && daysSinceRegistration <= 60;
      });
      
      // If there are students pending removal, show a notification
      if (pendingRemovalStudents.length > 0) {
        const headerNav = document.querySelector('.nav-buttons');
        
        // Only add if it doesn't already exist
        if (!document.querySelector('.expired-link')) {
          const expiredLink = document.createElement('a');
          expiredLink.href = 'expired-students.html';
          expiredLink.className = 'btn btn-outline expired-link';
          expiredLink.style.position = 'relative';
          expiredLink.innerHTML = `Pending Removal`;
          
          const badge = document.createElement('span');
          badge.className = 'badge';
          badge.textContent = pendingRemovalStudents.length;
          badge.style.position = 'absolute';
          badge.style.top = '-8px';
          badge.style.right = '-8px';
          badge.style.backgroundColor = '#e74c3c';
          badge.style.color = 'white';
          badge.style.borderRadius = '50%';
          badge.style.padding = '2px 6px';
          badge.style.fontSize = '12px';
          
          expiredLink.appendChild(badge);
          headerNav.appendChild(expiredLink);
        } else {
          // Update the count if the link already exists
          const badge = document.querySelector('.expired-link .badge');
          if (badge) {
            badge.textContent = pendingRemovalStudents.length;
          }
        }
      }
    })
    .catch(error => console.error('Error checking for pending removal students:', error));
}

// Helper function (add if not already present)
function daysBetween(date1, date2) {
  const oneDay = 24 * 60 * 60 * 1000;
  const firstDate = new Date(date1);
  const secondDate = new Date(date2);
  return Math.round(Math.abs((firstDate - secondDate) / oneDay));
}

// Modify the renderStudents function to show a special indicator for expired students
function renderStudents(data) {
  const today = new Date();
  
  const tbody = document.getElementById('student-data');
  tbody.innerHTML = data.map((student, index) => {
    // Calculate if student is in the removal period
    const regDate = new Date(student.registration_date);
    const daysSinceRegistration = daysBetween(today, regDate);
    const inRemovalPeriod = daysSinceRegistration > 30 && daysSinceRegistration <= 60;
    
    return `
      <tr class="${student.deleted ? 'deleted-row' : (inRemovalPeriod ? 'pending-removal-row' : '')}">
        <td>${index + 1}</td>
        <td>${student.name} ${student.surname}</td>
        <td>${student.phone}</td>
        <td>${student.hall}</td>
        <td>${student.seat_number}</td>
        <td>${new Date(student.registration_date).toLocaleDateString('en-GB')}</td>
        <td>
          <span class="${student.remaining_fees === 'yes' ? 'fees-yes' : 'fees-no'}">
            ${student.remaining_fees === 'yes' ? student.fees_amount : 'No'}
          </span>
        </td>
        <td>${student.seat_type}</td>
        <td>
          ${student.deleted 
            ? `<em>Deleted</em> 
               <button class="delete-btn" onclick="permanentlyDeleteStudent('${student._id}')">Permanent Delete</button>`
            : (inRemovalPeriod
               ? `<em>Pending Removal</em> 
                  <a href="expired-students.html" class="view-btn">View Options</a>`
               : `<button class="edit-btn" onclick="editStudent('${student._id}')">Edit</button>
                  <button class="delete-btn" onclick="deleteStudent('${student._id}')">Delete</button>`)
          }
        </td>
      </tr>
    `;
  }).join('');
}
