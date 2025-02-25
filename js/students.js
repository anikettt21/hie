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
            ? '<em>Deleted</em>' 
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
  
