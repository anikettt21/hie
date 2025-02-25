// registration.js

document.addEventListener("DOMContentLoaded", async function () {
    // Handle remaining fees field toggling
    const remainingFeesSelect = document.getElementById("remaining-fees");
    const feesGroup = document.getElementById("fees-group");
    remainingFeesSelect.addEventListener("change", function() {
      feesGroup.style.display = this.value === "yes" ? "block" : "none";
    });
  
    // Check if we are in edit mode by looking for the "edit" query parameter.
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    
    if (editId) {
      try {
        const response = await fetch(`https://hie-xtry.onrender.com/api/students/${editId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch student data.");
        }
        const student = await response.json();
        console.log("Fetched student:", student);
        
        // Populate the form fields with the fetched student data.
        document.getElementById('name').value = student.name || "";
        document.getElementById('surname').value = student.surname || "";
        document.getElementById('email').value = student.email || "";
        document.getElementById('phone').value = student.phone || "";
        document.getElementById('hall').value = student.hall || "";
        document.getElementById('seat').value = student.seat_number || "";
        document.getElementById('seat-type').value = student.seat_type || "";
        document.getElementById('payment-method').value = student.payment_method || "";
        document.getElementById('remaining-fees').value = student.remaining_fees || "no";
        
        if (student.remaining_fees === 'yes') {
          feesGroup.style.display = 'block';
          document.getElementById('fees').value = student.fees_amount || "";
        } else {
          feesGroup.style.display = 'none';
        }
        
        // Convert registration_date to YYYY-MM-DD format for the date input.
        const regDate = new Date(student.registration_date);
        document.getElementById('registration-date').value = regDate.toISOString().split("T")[0];
        
        document.title = "Edit Student - Study-Room";
        const headerH2 = document.querySelector('h2');
        if (headerH2) headerH2.textContent = "Edit Student Registration";
      } catch (error) {
        console.error("Error fetching student data:", error);
        alert("Could not load student data for editing.");
      }
    }
  });
  
  document.getElementById('registration-form').addEventListener('submit', function (e) {
    e.preventDefault();
  
    const student = {
      name: document.getElementById('name').value,
      surname: document.getElementById('surname').value,
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value,
      hall: document.getElementById('hall').value,
      seat_number: parseInt(document.getElementById('seat').value),
      seat_type: document.getElementById('seat-type').value,
      payment_method: document.getElementById('payment-method').value,
      remaining_fees: document.getElementById('remaining-fees').value,
      fees_amount: document.getElementById('remaining-fees').value === 'yes' ? parseInt(document.getElementById('fees').value) : 0,
      registration_date: document.getElementById('registration-date').value
    };
  
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
  
    if (editId) {
      // Update existing student via PUT request
      fetch(`https://hie-xtry.onrender.com/api/students/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student)
      })
        .then(response => {
          if (!response.ok) throw new Error("Failed to update student.");
          return response.json();
        })
        .then(data => {
          alert(data.message);
          window.location.href = "students.html";
        })
        .catch(error => {
          console.error('Error updating student:', error);
          alert("Error updating student.");
        });
    } else {
      // Create new student via POST request
      fetch('https://hie-xtry.onrender.com/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student)
      })
        .then(response => {
          if (!response.ok) throw new Error("Failed to register student.");
          return response.json();
        })
        .then(data => {
          alert(data.message);
          window.location.href = "students.html";
        })
        .catch(error => {
          console.error('Error registering student:', error);
          alert("Error registering student.");
        });
    }
  });
  
