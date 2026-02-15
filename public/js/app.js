// CRM Application JavaScript
// Contains all frontend functionality for the CRM system

// Utility Functions
function formatDate(date) {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    // Add to top of body
    document.body.prepend(alertDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => alertDiv.remove(), 5000);
}

// Authentication Functions
function logout() {
    fetch('/api/logout', { method: 'POST' })
        .then(() => window.location.href = '/login')
        .catch(error => {
            console.error('Logout error:', error);
            window.location.href = '/login';
        });
}

// Customer Management Functions
function loadCustomers() {
    fetch('/api/customers')
        .then(response => response.json())
        .then(customers => {
            updateCustomersTable(customers);
        })
        .catch(error => {
            console.error('Error loading customers:', error);
            document.getElementById('customersTable').innerHTML = `
                <tr>
                    <td colspan="7" class="p-8 text-center text-red-500">
                        <i class="fas fa-exclamation-circle"></i> Error loading customers
                    </td>
                </tr>
            `;
        });
}

function updateCustomersTable(customers) {
    const table = document.getElementById('customersTable');
    if (!table) return;
    
    if (customers.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="7" class="p-8 text-center text-gray-500">
                    <i class="fas fa-inbox"></i> No customers found
                </td>
            </tr>
        `;
        return;
    }

    let html = '';
    customers.forEach(customer => {
        const createdDate = new Date(customer.created_at);
        html += `
            <tr class="border-b hover:bg-gray-50">
                <td class="p-3 font-medium">${customer.name}</td>
                <td class="p-3">${customer.phone}</td>
                <td class="p-3">${customer.email || 'N/A'}</td>
                <td class="p-3">${customer.address || 'N/A'}</td>
                <td class="p-3">${customer.notes || 'No notes'}</td>
                <td class="p-3">${formatDate(createdDate)}</td>
                <td class="p-3">
                    <button onclick="editCustomer(${customer.id})" class="text-blue-500 hover:text-blue-700 mr-2">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteCustomer(${customer.id})" class="text-red-500 hover:text-red-700">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    table.innerHTML = html;
}

function openAddCustomerModal() {
    const modal = document.getElementById('addCustomerModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeAddCustomerModal() {
    const modal = document.getElementById('addCustomerModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.getElementById('addCustomerForm').reset();
    }
}

function saveCustomer() {
    const form = document.getElementById('addCustomerForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        showAlert(result.message || 'Customer added successfully', 'success');
        closeAddCustomerModal();
        loadCustomers();
    })
    .catch(error => {
        showAlert('Error saving customer: ' + error.message, 'error');
    });
}

function editCustomer(id) {
    fetch(`/api/customers/${id}`)
        .then(response => response.json())
        .then(customer => {
            const form = document.getElementById('editCustomerForm');
            if (form) {
                form.querySelector('input[name="id"]').value = customer.id;
                form.querySelector('input[name="name"]').value = customer.name;
                form.querySelector('input[name="phone"]').value = customer.phone;
                form.querySelector('input[name="email"]').value = customer.email || '';
                form.querySelector('textarea[name="address"]').value = customer.address || '';
                form.querySelector('textarea[name="notes"]').value = customer.notes || '';
                
                const modal = document.getElementById('editCustomerModal');
                if (modal) {
                    modal.classList.remove('hidden');
                    modal.classList.add('flex');
                }
            }
        });
}

function closeEditCustomerModal() {
    const modal = document.getElementById('editCustomerModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function updateCustomer() {
    const form = document.getElementById('editCustomerForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    fetch(`/api/customers/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        showAlert(result.message || 'Customer updated successfully', 'success');
        closeEditCustomerModal();
        loadCustomers();
    })
    .catch(error => {
        showAlert('Error updating customer: ' + error.message, 'error');
    });
}

function deleteCustomer(id) {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    fetch(`/api/customers/${id}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(result => {
        showAlert(result.message || 'Customer deleted successfully', 'success');
        loadCustomers();
    })
    .catch(error => {
        showAlert('Error deleting customer: ' + error.message, 'error');
    });
}

// Contact Management Functions
function loadContacts() {
    fetch('/api/contacts')
        .then(response => response.json())
        .then(contacts => {
            updateContactsTable(contacts);
        })
        .catch(error => {
            console.error('Error loading contacts:', error);
            const table = document.getElementById('contactsTable');
            if (table) {
                table.innerHTML = `
                    <tr>
                        <td colspan="7" class="p-8 text-center text-red-500">
                            <i class="fas fa-exclamation-circle"></i> Error loading contacts
                        </td>
                    </tr>
                `;
            }
        });
}

function updateContactsTable(contacts) {
    const table = document.getElementById('contactsTable');
    if (!table) return;
    
    if (contacts.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="7" class="p-8 text-center text-gray-500">
                    <i class="fas fa-inbox"></i> No contacts found
                </td>
            </tr>
        `;
        return;
    }

    let html = '';
    contacts.forEach(contact => {
        const createdDate = new Date(contact.created_at);
        html += `
            <tr class="border-b hover:bg-gray-50">
                <td class="p-3 font-medium">${contact.contact_name}</td>
                <td class="p-3">${contact.position || 'N/A'}</td>
                <td class="p-3">${contact.customer_name || 'N/A'}</td>
                <td class="p-3">${contact.phone || 'N/A'}</td>
                <td class="p-3">${contact.email || 'N/A'}</td>
                <td class="p-3">${contact.notes || 'No notes'}</td>
                <td class="p-3">
                    <button onclick="editContact(${contact.id})" class="text-blue-500 hover:text-blue-700 mr-2">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteContact(${contact.id})" class="text-red-500 hover:text-red-700">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    table.innerHTML = html;
}

function loadCustomersForContactDropdown() {
    fetch('/api/customers')
        .then(response => response.json())
        .then(customers => {
            const select = document.querySelector('select[name="customer_id"]');
            if (select) {
                let html = '<option value="">Select Customer</option>';
                customers.forEach(customer => {
                    html += `<option value="${customer.id}">${customer.name}</option>`;
                });
                select.innerHTML = html;
            }
        });
}

function openAddContactModal() {
    const modal = document.getElementById('addContactModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        loadCustomersForContactDropdown();
    }
}

function closeAddContactModal() {
    const modal = document.getElementById('addContactModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        const form = document.getElementById('addContactForm');
        if (form) form.reset();
    }
}

function saveContact() {
    const form = document.getElementById('addContactForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        showAlert(result.message || 'Contact added successfully', 'success');
        closeAddContactModal();
        loadContacts();
    })
    .catch(error => {
        showAlert('Error saving contact: ' + error.message, 'error');
    });
}

function editContact(id) {
    fetch(`/api/contacts/${id}`)
        .then(response => response.json())
        .then(contact => {
            // Implementation for editing contact
            showAlert('Edit contact functionality to be implemented', 'info');
        });
}

function deleteContact(id) {
    if (!confirm('Are you sure you want to delete this contact?')) return;

    fetch(`/api/contacts/${id}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(result => {
        showAlert(result.message || 'Contact deleted successfully', 'success');
        loadContacts();
    })
    .catch(error => {
        showAlert('Error deleting contact: ' + error.message, 'error');
    });
}

// Dashboard Functions
function loadDashboardStats() {
    fetch('/api/dashboard/stats')
        .then(response => response.json())
        .then(stats => {
            updateDashboardStats(stats);
        })
        .catch(error => {
            console.error('Error loading dashboard stats:', error);
        });
}

function updateDashboardStats(stats) {
    // Update total customers
    const totalCustomersElem = document.getElementById('totalCustomers');
    if (totalCustomersElem) totalCustomersElem.textContent = stats.totalCustomers || 0;
    
    // Update total opportunities
    const totalOpportunitiesElem = document.getElementById('totalOpportunities');
    if (totalOpportunitiesElem) totalOpportunitiesElem.textContent = stats.totalOpportunities || 0;
    
    // Update total activities
    const totalActivitiesElem = document.getElementById('totalActivities');
    if (totalActivitiesElem) totalActivitiesElem.textContent = stats.totalActivities || 0;
    
    // Update pipeline value
    const pipelineValueElem = document.getElementById('pipelineValue');
    if (pipelineValueElem) pipelineValueElem.textContent = '$' + (stats.pipelineValue || 0).toLocaleString();
}

// Initialize page-specific functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check which page we're on and load appropriate data
    const path = window.location.pathname;
    
    if (path === '/dashboard' || path === '/') {
        loadDashboardStats();
    } else if (path === '/customers') {
        loadCustomers();
    } else if (path === '/contacts') {
        loadContacts();
    }
    
    // Add event listeners for modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // Close all open modals
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (modal.classList.contains('flex')) {
                    modal.classList.add('hidden');
                    modal.classList.remove('flex');
                }
            });
        }
    });
});

// Global error handling
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    showAlert('An error occurred. Please try again.', 'error');
});

// Make functions globally available
window.logout = logout;
window.loadCustomers = loadCustomers;
window.openAddCustomerModal = openAddCustomerModal;
window.closeAddCustomerModal = closeAddCustomerModal;
window.saveCustomer = saveCustomer;
window.editCustomer = editCustomer;
window.closeEditCustomerModal = closeEditCustomerModal;
window.updateCustomer = updateCustomer;
window.deleteCustomer = deleteCustomer;
window.loadContacts = loadContacts;
window.openAddContactModal = openAddContactModal;
window.closeAddContactModal = closeAddContactModal;
window.saveContact = saveContact;
window.editContact = editContact;
window.deleteContact = deleteContact;