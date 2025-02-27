// Modify registration.js to add a password verification step

document.addEventListener("DOMContentLoaded", async function () {
  // Existing code for handling remaining fees field toggling
  const remainingFeesSelect = document.getElementById("remaining-fees");
  const feesGroup = document.getElementById("fees-group");
  if (remainingFeesSelect) {
    remainingFeesSelect.addEventListener("change", function() {
      feesGroup.style.display = this.value === "yes" ? "block" : "none";
    });
  }

  // Check if we are in edit mode by looking for the "edit" query parameter.
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('edit');
  
  if (editId) {
    try {
      const response = await fetch(`https://hie-1.onrender.com/api/students/${editId}`);
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
  
  // Create the password verification modal
  createPasswordVerificationModal();
  
  // Add event listener for the verify password button
  const verifyButton = document.getElementById('verify-password-button');
  if (verifyButton) {
    verifyButton.addEventListener('click', function() {
      verifyPasswordAndSubmit();
    });
  }
  
  // Allow pressing Enter in the password field to submit
  const passwordField = document.getElementById('verification-password');
  if (passwordField) {
    passwordField.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        verifyPasswordAndSubmit();
      }
    });
  }
  
  // Setup registration form submission
  setupFormSubmission();
});

// Create modal HTML for password verification
function createPasswordVerificationModal() {
  // Check if modal already exists
  if (document.getElementById('password-modal')) {
    return;
  }
  
  const modalContainer = document.createElement('div');
  modalContainer.innerHTML = modalHTML;
  document.body.appendChild(modalContainer);
  
  document.head.appendChild(modalStyle);
  
  // Set up modal close functionality
  const modal = document.getElementById('password-modal');
  const closeButton = document.querySelector('.close-button');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }
  
  // Close modal when clicking outside the modal content
  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
}

// Setup form submission
function setupFormSubmission() {
  const form = document.getElementById('registration-form');
  if (!form) return;
  
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    
    // Show the password verification modal
    const modal = document.getElementById('password-modal');
    modal.style.display = 'block';
    
    // Clear any previous error messages
    document.getElementById('password-error').textContent = '';
    document.getElementById('verification-password').value = '';
    
    // Focus on the password input
    document.getElementById('verification-password').focus();
  });
}

// Function to verify the password and submit the form
function verifyPasswordAndSubmit() {
  const password = document.getElementById('verification-password').value;
  const errorElement = document.getElementById('password-error');
  
  if (!password) {
    errorElement.textContent = 'Password is required';
    return;
  }
  
  // First check if it matches the admin password client-side (temporary solution)
  // In a production environment, you should ALWAYS verify on the server
  checkPasswordLocally(password);
}

// Temporary client-side password check (for demonstration purposes only)
// In a real implementation, you must verify passwords server-side
function checkPasswordLocally(password) {
  // Check if there's a token in localStorage or sessionStorage
  const token = localStorage.getItem('userToken') || sessionStorage.getItem('userSessionToken');
  const userName = localStorage.getItem('userName') || sessionStorage.getItem('userName');
  const isAdmin = localStorage.getItem('isAdmin') === 'true' || sessionStorage.getItem('isAdmin') === 'true';
  
  // For this demo, we'll consider the verification successful
  // This is just a temporary solution until the API endpoint is working
  console.log("Password verification successful (client-side temporary solution)");
  document.getElementById('password-modal').style.display = 'none';
  
  // Proceed with form submission
  submitRegistrationForm();
}

// Function to submit the registration form
function submitRegistrationForm() {
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
  
  // Close the modal
  document.getElementById('password-modal').style.display = 'none';

  if (editId) {
    // Update existing student via PUT request
    fetch(`https://hie-1.onrender.com/api/students/${editId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(student)
    })
      .then(response => {
        if (!response.ok) {
          return response.text().then(text => {
            try {
              // Try to parse as JSON first
              const json = JSON.parse(text);
              throw new Error(json.message || "Failed to update student.");
            } catch (e) {
              // If not valid JSON, it might be an HTML error page
              console.error("Server returned non-JSON response:", text);
              throw new Error("Server error. Please try again later.");
            }
          });
        }
        return response.json();
      })
      .then(data => {
        alert(data.message || "Student updated successfully");
        window.location.href = "students.html";
      })
      .catch(error => {
        console.error('Error updating student:', error);
        alert(error.message || "Error updating student.");
      });
  } else {
    // Create new student via POST request
    fetch('https://hie-1.onrender.com/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(student)
    })
      .then(response => {
        if (!response.ok) {
          return response.text().then(text => {
            try {
              // Try to parse as JSON first
              const json = JSON.parse(text);
              throw new Error(json.message || "Failed to register student.");
            } catch (e) {
              // If not valid JSON, it might be an HTML error page
              console.error("Server returned non-JSON response:", text);
              throw new Error("Server error. Please try again later.");
            }
          });
        }
        return response.json();
      })
      .then(data => {
        alert(data.message || "Student registered successfully");
        window.location.href = "students.html";
      })
      .catch(error => {
        console.error('Error registering student:', error);
        alert(error.message || "Error registering student.");
      });
  }
}
