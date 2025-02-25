// hall.js

let hall = "";
let soldSeats = []; // Derived from student registrations fetched from the backend
// Removed seats arrays are maintained locally for now.
let removedSeats = JSON.parse(localStorage.getItem("removedSeats_" + (window.location.pathname.includes('hall1') ? 'hall1' : 'hall2'))) || [];
let permanentlyRemovedSeats = JSON.parse(localStorage.getItem("permanentlyRemovedSeats_" + (window.location.pathname.includes('hall1') ? 'hall1' : 'hall2'))) || [];
let totalSeats = parseInt(localStorage.getItem("totalSeats_" + (window.location.pathname.includes('hall1') ? 'hall1' : 'hall2'))) || 50;

// Helper: Extract month name from a "YYYY-MM-DD" date string.
function getMonthFromDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleString('default', { month: 'long' });
}

// Load hall-specific data by fetching sold seats from the backend.
function loadHallData() {
  hall = window.location.pathname.includes('hall1') ? 'hall1' : 'hall2';
  // Get removed seats and totalSeats from localStorage (or defaults)
  removedSeats = JSON.parse(localStorage.getItem("removedSeats_" + hall)) || [];
  permanentlyRemovedSeats = JSON.parse(localStorage.getItem("permanentlyRemovedSeats_" + hall)) || [];
  totalSeats = parseInt(localStorage.getItem("totalSeats_" + hall)) || 50;

  // Fetch students from the backend, filter by hall and not deleted.
  fetch('http://localhost:5000/api/students')
    .then(response => response.json())
    .then(students => {
      soldSeats = students.filter(s => s.hall === hall && !s.deleted).map(s => s.seat_number);
      const maxSold = soldSeats.length > 0 ? Math.max(...soldSeats) : 0;
      totalSeats = Math.max(totalSeats, 50, maxSold);
      renderSeats();
    })
    .catch(err => console.error("Error fetching students:", err));
}

// Render the seat layout based on current data.
function renderSeats() {
  const seatLayout = document.getElementById('seat-layout');
  seatLayout.innerHTML = '';
  for (let i = 1; i <= totalSeats; i++) {
    const seat = document.createElement('div');
    seat.classList.add('seat');
    seat.textContent = i;
    if (soldSeats.includes(i)) {
      seat.classList.add('sold');
    } else if (isSeatRemoved(i, permanentlyRemovedSeats)) {
      seat.classList.add('removed-permanent');
      addEditIcon(seat, i);
    } else if (isSeatRemoved(i, removedSeats)) {
      seat.classList.add('removed');
      addEditIcon(seat, i);
    } else {
      seat.classList.add('available');
    }
    seatLayout.appendChild(seat);
  }
}

// Helper: Check if a seat is in an array of removal objects.
function isSeatRemoved(seatNumber, removalArray) {
  return removalArray.some(item => item.seat === seatNumber);
}

// Load data and render seats.
function fetchAndRenderSeats() {
  loadHallData();
}

// Helper: Add an edit icon to a removed seat.
function addEditIcon(seatElement, seatNumber) {
  const editIcon = document.createElement('span');
  editIcon.className = 'edit-icon';
  editIcon.innerHTML = '&#9998;';
  editIcon.addEventListener('click', function (e) {
    e.stopPropagation();
    handleEditSeat(seatNumber);
  });
  seatElement.appendChild(editIcon);
}

// Handle editing a seat.
function handleEditSeat(seatNumber) {
  const choice = prompt(`For seat ${seatNumber}:\nEnter 1 to restore this seat.\nEnter 2 to mark it permanently removed.`);
  if (choice === "1") {
    removedSeats = removedSeats.filter(item => item.seat !== seatNumber);
    permanentlyRemovedSeats = permanentlyRemovedSeats.filter(item => item.seat !== seatNumber);
  } else if (choice === "2") {
    removedSeats = removedSeats.filter(item => item.seat !== seatNumber);
    if (!isSeatRemoved(seatNumber, permanentlyRemovedSeats)) {
      permanentlyRemovedSeats.push({ seat: seatNumber, removalDate: new Date().toISOString() });
    }
  }
  localStorage.setItem("removedSeats_" + hall, JSON.stringify(removedSeats));
  localStorage.setItem("permanentlyRemovedSeats_" + hall, JSON.stringify(permanentlyRemovedSeats));
  renderSeats();
}

// Helper for admin verification.
function verifyAdmin() {
  return new Promise((resolve, reject) => {
    const adminPass = prompt("Enter Admin Password:");
    // For simplicity, we use the backend admin login endpoint here.
    fetch("http://localhost:5000/api/admin/login", {
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

// PLUS button: Add/restore a seat.
document.getElementById('add-seat-button').addEventListener('click', function () {
  verifyAdmin().then(() => {
    const seatInput = prompt("Enter the seat number to add/restore:");
    if (seatInput === null) return;
    const seatNumber = parseInt(seatInput, 10);
    if (isNaN(seatNumber) || seatNumber < 1) {
      alert("Invalid seat number.");
      return;
    }
    if (soldSeats.includes(seatNumber)) {
      alert("This seat is sold and cannot be restored.");
      return;
    }
    if (seatNumber > totalSeats) {
      totalSeats = seatNumber;
      localStorage.setItem('totalSeats_' + hall, totalSeats);
    } else {
      if (!isSeatRemoved(seatNumber, removedSeats) && !isSeatRemoved(seatNumber, permanentlyRemovedSeats)) {
        alert("This seat is already available.");
        return;
      }
      removedSeats = removedSeats.filter(item => item.seat !== seatNumber);
      permanentlyRemovedSeats = permanentlyRemovedSeats.filter(item => item.seat !== seatNumber);
    }
    localStorage.setItem("removedSeats_" + hall, JSON.stringify(removedSeats));
    localStorage.setItem("permanentlyRemovedSeats_" + hall, JSON.stringify(permanentlyRemovedSeats));
    renderSeats();
  }).catch(() => {});
});

// MINUS button: Remove a seat.
document.getElementById('remove-seat-button').addEventListener('click', function () {
  verifyAdmin().then(() => {
    const seatInput = prompt("Enter the seat number you want to remove:");
    if (seatInput === null) return;
    const seatNumber = parseInt(seatInput, 10);
    if (isNaN(seatNumber) || seatNumber < 1 || seatNumber > totalSeats) {
      alert("Invalid seat number.");
      return;
    }
    if (soldSeats.includes(seatNumber)) {
      alert(`Seat ${seatNumber} is sold and cannot be removed.`);
      return;
    }
    if (isSeatRemoved(seatNumber, removedSeats) || isSeatRemoved(seatNumber, permanentlyRemovedSeats)) {
      alert(`Seat ${seatNumber} is already removed.`);
      return;
    }
    removedSeats.push({ seat: seatNumber, removalDate: new Date().toISOString() });
    localStorage.setItem("removedSeats_" + hall, JSON.stringify(removedSeats));
    renderSeats();
  }).catch(() => {});
});

// ------------------ Monthly Report Functionality ------------------

// When a month is selected, generate a report.
function showMonthlySeatReport(month) {
  // Sold seats: from backend student registrations for this hall and matching month.
  fetch('http://localhost:5000/api/students')
    .then(response => response.json())
    .then(students => {
      const filteredStudents = students.filter(s =>
        s.hall === hall && getMonthFromDate(s.registration_date) === month
      );
      const soldSeatNumbers = filteredStudents.map(s => s.seat_number);
      const soldCount = soldSeatNumbers.length;

      // Removed seats: filter by removalDate's month.
      const removedForMonth = removedSeats
        .filter(item => getMonthFromDate(item.removalDate) === month)
        .map(item => item.seat);
      const removedForMonthPermanent = permanentlyRemovedSeats
        .filter(item => getMonthFromDate(item.removalDate) === month)
        .map(item => item.seat);
      const removedSeatNumbers = [...removedForMonth, ...removedForMonthPermanent].sort((a, b) => a - b);
      const removedCount = removedSeatNumbers.length;

      // Available seats: those not sold or removed.
      const availableSeatNumbers = [];
      for (let i = 1; i <= totalSeats; i++) {
        if (!soldSeatNumbers.includes(i) && !removedSeatNumbers.includes(i)) {
          availableSeatNumbers.push(i);
        }
      }
      const availableCount = availableSeatNumbers.length;

      const reportDiv = document.getElementById("monthly-report");
      reportDiv.innerHTML = `
        <h3>Monthly Report for ${month}</h3>
        <p>Sold Seats: ${soldCount}</p>
        <p>Removed Seats: ${removedCount}</p>
        <p>Available Seats: ${availableCount}</p>
        <button onclick="toggleFullReport('${month}')">View Full Details</button>
        <div id="full-report" style="display:none; margin-top:15px;"></div>
      `;
    })
    .catch(err => console.error("Error fetching monthly report:", err));
}

// Toggle full details for the monthly report.
function toggleFullReport(month) {
  const fullReportDiv = document.getElementById("full-report");
  if (fullReportDiv.style.display === "none") {
    fetch('http://localhost:5000/api/students')
      .then(response => response.json())
      .then(students => {
        const filteredStudents = students.filter(s =>
          s.hall === hall && getMonthFromDate(s.registration_date) === month
        );
        const soldSeatNumbers = filteredStudents.map(s => s.seat_number);

        const removedForMonth = removedSeats
          .filter(item => getMonthFromDate(item.removalDate) === month)
          .map(item => item.seat);
        const removedForMonthPermanent = permanentlyRemovedSeats
          .filter(item => getMonthFromDate(item.removalDate) === month)
          .map(item => item.seat);
        const removedSeatNumbers = [...removedForMonth, ...removedForMonthPermanent].sort((a, b) => a - b);

        const availableSeatNumbers = [];
        for (let i = 1; i <= totalSeats; i++) {
          if (!soldSeatNumbers.includes(i) && !removedSeatNumbers.includes(i)) {
            availableSeatNumbers.push(i);
          }
        }

        fullReportDiv.innerHTML = `
          <div class="report-box sold-box">
            <h4>Sold Seats</h4>
            <p>${soldSeatNumbers.join(", ") || "None"}</p>
          </div>
          <div class="report-box removed-box">
            <h4>Removed Seats</h4>
            <p>${removedSeatNumbers.join(", ") || "None"}</p>
          </div>
          <div class="report-box available-box">
            <h4>Available Seats</h4>
            <p>${availableSeatNumbers.join(", ") || "None"}</p>
          </div>
        `;
        fullReportDiv.style.display = "block";
      })
      .catch(err => console.error("Error fetching full report:", err));
  } else {
    fullReportDiv.style.display = "none";
  }
}

// Handler for month dropdown change.
function handleMonthChange() {
  const month = document.getElementById("month-select").value;
  if (month) {
    showMonthlySeatReport(month);
  } else {
    document.getElementById("monthly-report").innerHTML = "";
  }
}

// Initialize the seat layout on page load.
document.addEventListener('DOMContentLoaded', fetchAndRenderSeats);
