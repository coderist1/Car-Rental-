// profile.js - Profile edit functionality

class ProfileManager {
    constructor() {
        this.form = document.getElementById('profileForm');
        this.backBtn = document.getElementById('backBtn');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.saveBtn = document.getElementById('saveBtn');
        this.successMessage = document.getElementById('successMessage');
        this.profilePicture = document.getElementById('profilePicture');
        this.pictureInput = document.getElementById('pictureInput');

        // Form fields
        this.fields = {
            firstName: document.getElementById('firstName'),
            lastName: document.getElementById('lastName'),
            middleName: document.getElementById('middleName'),
            sex: document.getElementById('sex'),
            dateOfBirth: document.getElementById('dateOfBirth'),
            email: document.getElementById('email')
        };

        // Error messages
        this.errorElements = {
            firstName: document.getElementById('firstNameError'),
            lastName: document.getElementById('lastNameError'),
            middleName: document.getElementById('middleNameError'),
            sex: document.getElementById('sexError'),
            dateOfBirth: document.getElementById('dateOfBirthError'),
            email: document.getElementById('emailError')
        };

        this.originalData = {};
        this.init();
    }

    init() {
        // Load user data
        this.loadUserData();

        // Attach event listeners
        this.attachEventListeners();
    }

    attachEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Back and cancel buttons
        this.backBtn.addEventListener('click', () => this.goBack());
        this.cancelBtn.addEventListener('click', () => this.goBack());

        // Profile picture upload
        this.pictureInput.addEventListener('change', (e) => this.handlePictureUpload(e));
        
        // Clear error on input
        Object.values(this.fields).forEach(field => {
            field.addEventListener('input', () => {
                const errorElement = this.errorElements[field.id];
                if (errorElement) {
                    errorElement.classList.remove('show');
                    field.classList.remove('error');
                }
                // Hide success message when user starts editing
                this.successMessage.style.display = 'none';
            });
        });
    }

    loadUserData() {
        // Fetch user data from localStorage (in a real app, this would be from an API)
        const userData = this.getUserDataFromStorage();

        // Set form values
        this.fields.firstName.value = userData.firstName || '';
        this.fields.lastName.value = userData.lastName || '';
        this.fields.middleName.value = userData.middleName || '';
        this.fields.sex.value = userData.sex || '';
        this.fields.dateOfBirth.value = userData.dateOfBirth || '';
        this.fields.email.value = userData.email || '';

        // Update profile picture initials
        const initials = (userData.firstName?.charAt(0) || '') + 
                        (userData.lastName?.charAt(0) || '');
        this.profilePicture.textContent = initials.toUpperCase() || '👤';

        // Store original data for comparison
        this.originalData = { ...userData };
    }

    getUserDataFromStorage() {
        // In a real application, this would fetch from an API endpoint
        // For now, we'll use localStorage as an example
        const stored = localStorage.getItem('userProfile');
        if (stored) {
            return JSON.parse(stored);
        }

        // Default data if none exists
        return {
            firstName: '',
            lastName: '',
            middleName: '',
            sex: '',
            dateOfBirth: '',
            email: ''
        };
    }

    handleSubmit(e) {
        e.preventDefault();

        // Validate form
        if (!this.validateForm()) {
            return;
        }

        // Collect form data
        const formData = {
            firstName: this.fields.firstName.value.trim(),
            lastName: this.fields.lastName.value.trim(),
            middleName: this.fields.middleName.value.trim(),
            sex: this.fields.sex.value,
            dateOfBirth: this.fields.dateOfBirth.value,
            email: this.fields.email.value.trim()
        };

        // Save to storage (in real app, send to API)
        this.saveUserData(formData);

        // Show success message
        this.showSuccessMessage();

        // Update original data
        this.originalData = { ...formData };

        // Update profile picture
        const initials = (formData.firstName?.charAt(0) || '') + 
                        (formData.lastName?.charAt(0) || '');
        this.profilePicture.textContent = initials.toUpperCase() || '👤';
    }

    validateForm() {
        let isValid = true;

        // Reset all errors
        Object.values(this.errorElements).forEach(el => {
            el.classList.remove('show');
        });
        Object.values(this.fields).forEach(field => {
            field.classList.remove('error');
        });

        // First name validation
        if (!this.fields.firstName.value.trim()) {
            this.setError('firstName', 'First name is required');
            isValid = false;
        }

        // Last name validation
        if (!this.fields.lastName.value.trim()) {
            this.setError('lastName', 'Last name is required');
            isValid = false;
        }

        // Sex validation
        if (!this.fields.sex.value) {
            this.setError('sex', 'Sex is required');
            isValid = false;
        }

        // Date of birth validation
        if (!this.fields.dateOfBirth.value) {
            this.setError('dateOfBirth', 'Date of birth is required');
            isValid = false;
        } else {
            // Validate age (must be at least 18 years old)
            const birthDate = new Date(this.fields.dateOfBirth.value);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();

            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            if (age < 18) {
                this.setError('dateOfBirth', 'You must be at least 18 years old');
                isValid = false;
            }
        }

        // Email validation
        if (!this.fields.email.value.trim()) {
            this.setError('email', 'Email is required');
            isValid = false;
        } else if (!this.isValidEmail(this.fields.email.value)) {
            this.setError('email', 'Please enter a valid email address');
            isValid = false;
        }

        return isValid;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    setError(fieldName, message) {
        const field = this.fields[fieldName];
        const errorElement = this.errorElements[fieldName];

        if (field) {
            field.classList.add('error');
        }
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    saveUserData(data) {
        // 1. Update session profile (preserve ID and other immutable fields)
        let currentProfile = {};
        try {
            currentProfile = JSON.parse(localStorage.getItem('userProfile')) || {};
        } catch (e) {}

        const updatedProfile = { ...currentProfile, ...data };
        localStorage.setItem('userProfile', JSON.stringify(updatedProfile));

        // 2. Update main user database
        try {
            const rawUsers = localStorage.getItem('carRentalUsers');
            if (rawUsers) {
                const users = JSON.parse(rawUsers);
                // Find user by ID (preferred) or Email
                const index = users.findIndex(u => u.id === currentProfile.id || u.email === currentProfile.email);
                
                if (index !== -1) {
                    users[index] = { ...users[index], ...data };
                    localStorage.setItem('carRentalUsers', JSON.stringify(users));
                }
            }
        } catch (e) {
            console.error('Error updating main user database:', e);
        }

        // Dispatch custom event for other parts of the app
        window.dispatchEvent(new CustomEvent('profileUpdated', { detail: updatedProfile }));
    }

    showSuccessMessage() {
        this.successMessage.style.display = 'flex';
        this.saveBtn.disabled = true;

        setTimeout(() => {
            this.saveBtn.disabled = false;
        }, 2000);

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (this.successMessage.style.display !== 'none') {
                this.successMessage.style.display = 'none';
            }
        }, 5000);
    }

    handlePictureUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size must be less than 5MB');
            return;
        }

        // Read and display image
        const reader = new FileReader();
        reader.onload = (event) => {
            const imageSrc = event.target.result;
            // Store image in localStorage (in real app, upload to server)
            localStorage.setItem('profilePicture', imageSrc);
            // You could update the profilePicture element to show the image
            // For now, we'll keep the initials
            console.log('Picture uploaded:', imageSrc.substring(0, 50) + '...');
        };
        reader.readAsDataURL(file);

        // Reset input
        this.pictureInput.value = '';
    }

    goBack() {
        // Check if there are unsaved changes
        const currentData = {
            firstName: this.fields.firstName.value.trim(),
            lastName: this.fields.lastName.value.trim(),
            middleName: this.fields.middleName.value.trim(),
            sex: this.fields.sex.value,
            dateOfBirth: this.fields.dateOfBirth.value,
            email: this.fields.email.value.trim()
        };

        const hasChanges = JSON.stringify(currentData) !== JSON.stringify(this.originalData);

        if (hasChanges) {
            const confirmed = confirm('You have unsaved changes. Are you sure you want to leave?');
            if (!confirmed) {
                return;
            }
        }

        // Navigate back
        window.history.back();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ProfileManager();
});