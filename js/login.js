// login.js - Handles user login functionality

document.addEventListener("DOMContentLoaded", function() {
  // Check if user is already logged in
  const token = localStorage.getItem('userToken') || sessionStorage.getItem('userSessionToken');
  const isAdmin = localStorage.getItem('isAdmin') === 'true' || sessionStorage.getItem('isAdmin') === 'true';
  
  if (token) {
    // Redirect authenticated users
    if (isAdmin) {
      window.location.href = 'admin.html';
    } else {
      window.location.href = 'index.html';
    }
    return;
  }
  
  // Get form elements
  const loginForm = document.getElementById('login-form');
  const phoneInput = document.getElementById('phone');
  const passwordInput = document.getElementById('password');
  const rememberMeCheckbox = document.getElementById('remember-me');
  const errorMessage = document.getElementById('login-error');
  const registerLink = document.getElementById('register-link');
  
  // Handle form submission
  if (loginForm) {
    loginForm.addEventListener('submit', function(event) {
      event.preventDefault();
      
      // Reset error message
      errorMessage.textContent = '';
      errorMessage.style.display = 'none';
      
      // Get form values
      const phone = phoneInput.value.trim();
      const password = passwordInput.value;
      const rememberMe = rememberMeCheckbox.checked;
      
      // Validate inputs
      if (!phone || !password) {
        showError('Phone number and password are required');
        return;
      }
      
      // Validate phone format
      const phoneValidation = validatePhone(phone);
      if (!phoneValidation.valid) {
        showError(phoneValidation.message);
        return;
      }
      
      // Disable form during login attempt
      setFormLoading(true);
      
      // Attempt login
      fetch('https://hie-1.onrender.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone, password })
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(data.message || 'Invalid credentials');
          });
        }
        return response.json();
      })
      .then(data => {
        if (data.success) {
          // Always store in sessionStorage for current session
          sessionStorage.setItem('userSessionToken', data.token);
          sessionStorage.setItem('userName', data.name || 'User');
          
          // If remember me is checked, also store in localStorage
          if (rememberMe) {
            localStorage.setItem('userToken', data.token);
            localStorage.setItem('userName', data.name || 'User');
          }
          
          // Redirect to home page
          window.location.href = 'index.html';
        } else {
          showError(data.message || 'Login failed');
        }
      })
      .catch(error => {
        showError(error.message || 'An error occurred during login');
      })
      .finally(() => {
        setFormLoading(false);
      });
    });
  }
  
  // Handle register link if present
  if (registerLink) {
    registerLink.addEventListener('click', function(event) {
      event.preventDefault();
      window.location.href = 'register.html';
    });
  }
  
  // Function to show error message
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
  }
  
  // Function to toggle loading state
  function setFormLoading(isLoading) {
    const submitButton = loginForm.querySelector('button[type="submit"]');
    
    if (isLoading) {
      submitButton.disabled = true;
      submitButton.textContent = 'Logging in...';
    } else {
      submitButton.disabled = false;
      submitButton.textContent = 'Login';
    }
    
    // Disable/enable form inputs
    phoneInput.disabled = isLoading;
    passwordInput.disabled = isLoading;
    rememberMeCheckbox.disabled = isLoading;
  }
  
  // Function to validate phone number
  function validatePhone(phone) {
    // Basic validation - reusing the function from admin.js
    if (!phone) {
      return { valid: false, message: "Phone number is required" };
    }
    
    // Check that it contains only digits, spaces, and some special chars like +, -, ()
    const phoneRegex = /^[0-9+\- ()]+$/;
    if (!phoneRegex.test(phone)) {
      return { valid: false, message: "Invalid phone number format" };
    }
    
    return { valid: true, message: "Phone number is valid" };
  }
  
  // Add "Admin Login" link handler if it exists
  const adminLoginLink = document.getElementById('admin-login-link');
  if (adminLoginLink) {
    adminLoginLink.addEventListener('click', function(event) {
      event.preventDefault();
      window.location.href = 'admin.html';
    });
  }
});