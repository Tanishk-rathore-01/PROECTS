document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('container');
    const fullname = document.getElementById('fullname');
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const confirm = document.getElementById('confirm');
    const submitButton = document.querySelector('button');

    submitButton.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Reset error styles
        [fullname, email, password, confirm].forEach(input => {
            input.style.borderColor = '#ccc';
        });

        // Validation
        let isValid = true;

        if (!fullname.value.trim()) {
            fullname.style.borderColor = 'red';
            isValid = false;
        }

        if (!email.value.trim() || !email.value.includes('@')) {
            email.style.borderColor = 'red';
            isValid = false;
        }

        if (password.value.length < 6) {
            password.style.borderColor = 'red';
            isValid = false;
        }

        if (password.value !== confirm.value) {
            password.style.borderColor = 'red';
            confirm.style.borderColor = 'red';
            isValid = false;
        }

        if (isValid) {
            // Create user object
            const user = {
                fullname: fullname.value,
                email: email.value,
                password: password.value
            };
            
            console.log('User registered:', user);
            alert('Registration successful!');
            
            // Reset form
            form.reset();
        } else {
            alert('Please check all fields and try again.');
        }
    });
});