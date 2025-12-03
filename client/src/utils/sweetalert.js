import Swal from 'sweetalert2';

// Success alert
export const showSuccess = (message, title = 'Success!') => {
    return Swal.fire({
        icon: 'success',
        title: title,
        text: message,
        confirmButtonColor: '#2563eb',
        confirmButtonText: 'OK',
        timer: 3000,
        timerProgressBar: true,
    });
};

// Error alert
export const showError = (message, title = 'Error!') => {
    return Swal.fire({
        icon: 'error',
        title: title,
        text: message,
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'OK',
    });
};

// Warning alert
export const showWarning = (message, title = 'Warning!') => {
    return Swal.fire({
        icon: 'warning',
        title: title,
        text: message,
        confirmButtonColor: '#f59e0b',
        confirmButtonText: 'OK',
    });
};

// Info alert
export const showInfo = (message, title = 'Info') => {
    return Swal.fire({
        icon: 'info',
        title: title,
        text: message,
        confirmButtonColor: '#2563eb',
        confirmButtonText: 'OK',
    });
};

// Confirmation dialog
export const showConfirm = (message, title = 'Are you sure?') => {
    return Swal.fire({
        icon: 'question',
        title: title,
        text: message,
        showCancelButton: true,
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
    });
};

// Loading alert
export const showLoading = (message = 'Please wait...') => {
    return Swal.fire({
        title: message,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
            Swal.showLoading();
        },
    });
};

// Close any open alert
export const closeAlert = () => {
    Swal.close();
};
