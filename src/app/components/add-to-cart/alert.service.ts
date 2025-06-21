import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon } from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  show(message: string, type: SweetAlertIcon = 'info', title?: string) {
    return Swal.fire({
      title: title || (type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Info'),
      text: message,
      icon: type,
      timer: 2000,
      showConfirmButton: false
    });
  }

  confirm(message: string, title = 'Are you sure?') {
    return Swal.fire({
      title,
      text: message,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No'
    });
  }

  input(prompt: string, title = 'Input Required') {
    return Swal.fire({
      title,
      input: 'text',
      inputLabel: prompt,
      showCancelButton: true
    });
  }

  confirmInput(prompt: string, title = 'Input Required') {
    return Swal.fire({
      title,
      input: 'text',
      inputLabel: prompt,
      showCancelButton: true,
      confirmButtonText: 'Yes',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      cancelButtonText: 'No',
      inputValidator: (value) => {
        if (!value) {
          return 'Please enter a value!';
        }
        return null;
      }
    });
  }

  confirmDelete(message: string, title = 'Are you sure?') {
    return Swal.fire({
      title,
      text: message,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Deleted!',
          text: 'Your file has been deleted.',
          icon: 'success'
        });
      }
    });
  }

  deleteItem() {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!"
    }).then((result) => {
      if (result.isConfirmed) {
        // Your delete logic here
        Swal.fire({
          title: "Deleted!",
          text: "Your file has been deleted.",
          icon: "success"
        });
      }
    });
  }
}
