document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const amountInput = document.getElementById('amount');
    const cardNumberInput = document.getElementById('card-number');
    const expiryInput = document.getElementById('expiry');
    const cvvInput = document.getElementById('cvv');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const payButton = document.getElementById('pay-button');
    const processingModal = document.getElementById('processing-modal');
    const resultModal = document.getElementById('result-modal');
    const closeModalButton = document.getElementById('close-modal');
    const processingMessage = document.getElementById('processing-message');
    const resultTitle = document.getElementById('result-title');
    const resultMessage = document.getElementById('result-message');
    const resultIcon = document.getElementById('result-icon');
    const transactionId = document.getElementById('transaction-id');
    const transactionDate = document.getElementById('transaction-date');
    const transactionCard = document.getElementById('transaction-card');
    const subtotal = document.getElementById('subtotal');
    const tax = document.getElementById('tax');
    const total = document.getElementById('total');
    const cardIcons = {
        visa: document.getElementById('visa-icon'),
        mastercard: document.getElementById('mastercard-icon'),
        amex: document.getElementById('amex-icon')
    };

    // Initialize form
    initForm();

    // Event listeners
    amountInput.addEventListener('input', updateOrderSummary);
    cardNumberInput.addEventListener('input', formatCardNumber);
    cardNumberInput.addEventListener('input', detectCardType);
    expiryInput.addEventListener('input', formatExpiryDate);
    payButton.addEventListener('click', processPayment);
    closeModalButton.addEventListener('click', closeResultModal);

    // Initialize form and order summary
    function initForm() {
        createCardDisplay();
        updateOrderSummary();
        disablePayButton();
        
        // Add event listeners for real-time updates
        cardNumberInput.addEventListener('input', updateCardDisplay);
        nameInput.addEventListener('input', updateCardDisplay);
        expiryInput.addEventListener('input', updateCardDisplay);
    }

    // Create card display element
    function createCardDisplay() {
        const cardWrapper = document.createElement('div');
        cardWrapper.className = 'card-wrapper';
        
        const cardFront = document.createElement('div');
        cardFront.className = 'card-front';
        cardFront.innerHTML = `
            <div class="card-type" style="text-align: right;">
                <i class="fab fa-cc-visa" id="display-visa" style="font-size: 40px; display: none;"></i>
                <i class="fab fa-cc-mastercard" id="display-mastercard" style="font-size: 40px; display: none;"></i>
                <i class="fab fa-cc-amex" id="display-amex" style="font-size: 40px; display: none;"></i>
            </div>
            <div class="card-number" style="font-size: 22px; letter-spacing: 1px; margin: 20px 0;">
                •••• •••• •••• ••••
            </div>
            <div style="display: flex; justify-content: space-between;">
                <div>
                    <div style="font-size: 12px; opacity: 0.8;">CARDHOLDER NAME</div>
                    <div class="card-name" style="font-size: 16px; text-transform: uppercase;">YOUR NAME</div>
                </div>
                <div>
                    <div style="font-size: 12px; opacity: 0.8;">EXPIRES</div>
                    <div class="card-expiry" style="font-size: 16px;">••/••</div>
                </div>
            </div>
        `;
        
        const cardBack = document.createElement('div');
        cardBack.className = 'card-back';
        cardBack.innerHTML = `
            <div class="card-magnetic-strip"></div>
            <div class="card-cvv">•••</div>
            <div style="text-align: center;">
                <i class="fab fa-cc-visa" style="font-size: 40px; opacity: 0.7;"></i>
            </div>
        `;
        
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.appendChild(cardFront);
        cardElement.appendChild(cardBack);
        cardWrapper.appendChild(cardElement);
        
        // Insert before the form
        document.querySelector('.payment-form').insertBefore(cardWrapper, document.querySelector('.form-group'));
        
        // Flip card when CVV field is focused
        cvvInput.addEventListener('focus', () => {
            cardElement.classList.add('flipped');
            document.querySelector('.card-cvv').textContent = cvvInput.value || '•••';
        });
        
        cvvInput.addEventListener('blur', () => {
            cardElement.classList.remove('flipped');
        });
        
        cvvInput.addEventListener('input', () => {
            document.querySelector('.card-cvv').textContent = cvvInput.value || '•••';
        });
    }

    // Update card display with user input
    function updateCardDisplay() {
        const cardNumber = cardNumberInput.value.replace(/\s+/g, '');
        const displayNumber = cardNumber.length > 0 
            ? cardNumber.match(/.{1,4}/g).join(' ') 
            : '•••• •••• •••• ••••';
        
        document.querySelector('.card-number').textContent = displayNumber;
        document.querySelector('.card-name').textContent = nameInput.value.toUpperCase() || 'YOUR NAME';
        document.querySelector('.card-expiry').textContent = expiryInput.value || '••/••';
    }

    // Update order summary based on amount
    function updateOrderSummary() {
        const amount = parseFloat(amountInput.value) || 0;
        const calculatedTax = amount * 0.18; // 18% GST for India
        const calculatedTotal = amount + calculatedTax;

        subtotal.textContent = `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        tax.textContent = `₹${calculatedTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        total.textContent = `₹${calculatedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

        // Enable/disable pay button based on amount
        if (amount > 0) {
            enablePayButton();
        } else {
            disablePayButton();
        }
    }

    // Format card number with spaces
    function formatCardNumber(e) {
        let value = e.target.value.replace(/\s+/g, '');
        if (value.length > 0) {
            value = value.match(new RegExp('.{1,4}', 'g')).join(' ');
        }
        e.target.value = value;
    }

    // Detect card type and show appropriate icon
    function detectCardType() {
        const cardNumber = cardNumberInput.value.replace(/\s+/g, '');
        
        // Reset all icons
        Object.values(cardIcons).forEach(icon => {
            icon.classList.remove('active');
        });
        
        document.querySelectorAll('#display-visa, #display-mastercard, #display-amex').forEach(el => {
            el.style.display = 'none';
        });

        // RuPay (India) - starts with 60, 6521, 81, 82, 508, 353, 356
        if (/^(60|6521|81|82|508|353|356)/.test(cardNumber)) {
            // In a real implementation, you would show a RuPay icon here
            return 'rupay';
        }
        
        // Visa: starts with 4
        if (/^4/.test(cardNumber)) {
            cardIcons.visa.classList.add('active');
            document.getElementById('display-visa').style.display = 'inline-block';
            return 'visa';
        }
        
        // Mastercard: starts with 51-55 or 2221-2720
        if (/^5[1-5]/.test(cardNumber) || /^2[2-7]/.test(cardNumber)) {
            cardIcons.mastercard.classList.add('active');
            document.getElementById('display-mastercard').style.display = 'inline-block';
            return 'mastercard';
        }
        
        // Amex: starts with 34 or 37
        if (/^3[47]/.test(cardNumber)) {
            cardIcons.amex.classList.add('active');
            document.getElementById('display-amex').style.display = 'inline-block';
            return 'amex';
        }
        
        return 'unknown';
    }

    // Format expiry date as MM/YY
    function formatExpiryDate(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        e.target.value = value;
    }

    // Enable pay button
    function enablePayButton() {
        payButton.disabled = false;
    }

    // Disable pay button
    function disablePayButton() {
        payButton.disabled = true;
    }

    // Process payment
    function processPayment(e) {
        e.preventDefault();
        
        // Validate form
        if (!validateForm()) {
            return;
        }

        // Show processing modal
        showProcessingModal();
        
        // Create progress steps
        createProgressSteps();
        
        // Simulate payment processing steps
        simulatePaymentProcessing();
    }

    // Create progress steps in modal
    function createProgressSteps() {
        const stepsContainer = document.createElement('div');
        stepsContainer.className = 'progress-steps';
        
        stepsContainer.innerHTML = `
            <div class="progress-bar"></div>
            <div class="step"><span class="step-label">Validation</span></div>
            <div class="step"><span class="step-label">Balance</span></div>
            <div class="step"><span class="step-label">Payment</span></div>
            <div class="step"><span class="step-label">Confirm</span></div>
        `;
        
        document.querySelector('.modal-content').insertBefore(stepsContainer, processingMessage);
    }

    // Update progress bar
    function updateProgress(currentStep, totalSteps) {
        const progressBar = document.querySelector('.progress-bar');
        const steps = document.querySelectorAll('.step');
        
        if (progressBar) {
            progressBar.style.width = `${(currentStep / totalSteps) * 100}%`;
        }
        
        steps.forEach((step, index) => {
            if (index < currentStep) {
                step.classList.add('completed');
                step.classList.remove('active');
            } else if (index === currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active', 'completed');
            }
        });
    }

    // Validate form inputs
    function validateForm() {
        const amount = parseFloat(amountInput.value);
        const cardNumber = cardNumberInput.value.replace(/\s+/g, '');
        const expiry = expiryInput.value;
        const cvv = cvvInput.value;
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();

        // Basic validation
        if (isNaN(amount) || amount <= 0) {
            showError('Please enter a valid payment amount');
            return false;
        }

        if (cardNumber.length < 13 || cardNumber.length > 19 || !luhnCheck(cardNumber)) {
            showError('Please enter a valid card number');
            return false;
        }

        if (!expiry || !isValidExpiry(expiry)) {
            showError('Please enter a valid expiry date (MM/YY)');
            return false;
        }

        const cardType = detectCardTypeFromNumber(cardNumber);
        if (cardType === 'amex' && cvv.length !== 4) {
            showError('American Express cards require a 4-digit CVV');
            return false;
        } else if (cardType !== 'amex' && cvv.length !== 3) {
            showError('Please enter a valid 3-digit CVV');
            return false;
        }

        if (!name) {
            showError('Please enter cardholder name');
            return false;
        }

        if (!email || !isValidEmail(email)) {
            showError('Please enter a valid email address');
            return false;
        }

        // Basic fraud detection
        if (isPotentialFraud(cardNumber, amount)) {
            showError('This transaction requires additional verification. Please contact support.');
            return false;
        }

        return true;
    }

    // Luhn algorithm for card number validation
    function luhnCheck(cardNumber) {
        let sum = 0;
        let alternate = false;
        
        for (let i = cardNumber.length - 1; i >= 0; i--) {
            let digit = parseInt(cardNumber.substring(i, i + 1));
            
            if (alternate) {
                digit *= 2;
                if (digit > 9) {
                    digit = (digit % 10) + 1;
                }
            }
            
            sum += digit;
            alternate = !alternate;
        }
        
        return (sum % 10 === 0);
    }

    // Check if expiry date is valid and not in the past
    function isValidExpiry(expiry) {
        const [month, year] = expiry.split('/');
        if (!month || !year || month.length !== 2 || year.length !== 2) return false;
        
        const expiryDate = new Date(`20${year}`, month - 1);
        const currentDate = new Date();
        
        // Set to first day of next month for comparison
        const firstOfNextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        
        return expiryDate >= firstOfNextMonth;
    }

    // Check if email is valid
    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Detect card type from number
    function detectCardTypeFromNumber(cardNumber) {
        // RuPay (India)
        if (/^(60|6521|81|82|508|353|356)/.test(cardNumber)) {
            return 'rupay';
        }
        if (/^4/.test(cardNumber)) return 'visa';
        if (/^5[1-5]/.test(cardNumber) || /^2[2-7]/.test(cardNumber)) return 'mastercard';
        if (/^3[47]/.test(cardNumber)) return 'amex';
        return 'unknown';
    }

    // Basic fraud detection
    function isPotentialFraud(cardNumber, amount) {
        // Check for test card numbers
        const testCards = [
            '4242424242424242', '4000056655665556', '5555555555554444',
            '2223003122003222', '378282246310005', '371449635398431'
        ];
        
        if (testCards.includes(cardNumber)) {
            return false; // Allow test cards for demo purposes
        }
        
        // Check for suspicious patterns (like repeating digits)
        if (/(\d)\1{3,}/.test(cardNumber)) {
            return true;
        }
        
        // Check for unusually high amount
        if (amount > 100000) { // ₹100,000
            return true;
        }
        
        // Check for BINs associated with prepaid cards (simplified)
        const prepaidBins = ['410000', '420000', '430000', '440000', '450000', '460000'];
        const bin = cardNumber.substring(0, 6);
        if (prepaidBins.includes(bin) && amount > 10000) {
            return true;
        }
        
        return false;
    }

    // Show error message
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.color = 'var(--danger-color)';
        errorDiv.style.marginTop = '10px';
        errorDiv.style.textAlign = 'center';
        errorDiv.style.animation = 'shake 0.5s';
        errorDiv.textContent = message;
        
        // Remove any existing error messages
        document.querySelectorAll('.error-message').forEach(el => el.remove());
        
        // Add the new error message
        document.querySelector('.payment-form').appendChild(errorDiv);
        
        // Remove after 3 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }

    // Show processing modal
    function showProcessingModal() {
        processingModal.style.display = 'flex';
        resultModal.style.display = 'none';
    }

    // Show result modal
    function showResultModal(success, message) {
        processingModal.style.display = 'none';
        
        if (success) {
            resultTitle.textContent = 'Payment Successful';
            resultMessage.textContent = message;
            resultIcon.innerHTML = '<i class="fas fa-check-circle success"></i>';
            showConfetti();
        } else {
            resultTitle.textContent = 'Payment Failed';
            resultMessage.textContent = message;
            resultIcon.innerHTML = '<i class="fas fa-times-circle error"></i>';
        }
        
        // Set transaction details for successful payments
        if (success) {
            const now = new Date();
            transactionId.textContent = 'TXN' + Math.floor(Math.random() * 1000000000);
            transactionDate.textContent = now.toLocaleString();
            transactionCard.textContent = '•••• •••• •••• ' + cardNumberInput.value.slice(-4);
            document.getElementById('transaction-details').style.display = 'block';
        } else {
            document.getElementById('transaction-details').style.display = 'none';
        }
        
        resultModal.style.display = 'flex';
    }

    // Show confetti effect
    function showConfetti() {
        const confettiSettings = {
            target: 'confetti-canvas',
            max: 150,
            size: 1.5,
            animate: true,
            props: ['circle', 'square', 'triangle', 'line'],
            colors: [[255,0,0], [0,255,0], [0,0,255], [255,255,0], [255,0,255], [0,255,255]],
            clock: 25,
            rotate: true,
            start_from_edge: true,
            respawn: false
        };

        const confetti = new ConfettiGenerator(confettiSettings);
        confetti.render();
        
        setTimeout(() => {
            confetti.clear();
        }, 3000);
    }

    // Close result modal
    function closeResultModal() {
        resultModal.style.display = 'none';
    }

    // Simulate payment processing with mock APIs
    function simulatePaymentProcessing() {
        const steps = [
            { label: 'Verifying card', duration: 1500 },
            { label: 'Checking balance', duration: 1500 },
            { label: 'Processing payment', duration: 1500 },
            { label: 'Confirming', duration: 1000 }
        ];
        
        updateProgress(0, steps.length);
        
        steps.forEach((step, index) => {
            setTimeout(() => {
                processingMessage.textContent = step.label + '...';
                updateProgress(index + 1, steps.length);
                
                if (index === steps.length - 1) {
                    const isSuccess = mockPaymentApi();
                    if (isSuccess) {
                        showResultModal(true, `Your payment of ₹${amountInput.value} has been processed successfully.`);
                    } else {
                        showResultModal(false, 'Payment failed. Please check your card details or try another payment method.');
                    }
                }
            }, steps.slice(0, index).reduce((acc, step) => acc + step.duration, 0));
        });
    }

    // Mock payment API with success/failure scenarios
    function mockPaymentApi() {
        const cardNumber = cardNumberInput.value.replace(/\s+/g, '');
        const amount = parseFloat(amountInput.value);
        
        // Failure scenarios
        // 1. Specific test card numbers that always fail
        const failureCards = ['4000000000000002', '4000000000009995'];
        if (failureCards.includes(cardNumber)) {
            return false;
        }
        
        // 2. Random failure (10% chance)
        if (Math.random() < 0.1) {
            return false;
        }
        
        // 3. High amount failure (over ₹50000 has 30% failure chance)
        if (amount > 50000 && Math.random() < 0.3) {
            return false;
        }
        
        // Default to success
        return true;
    }
});