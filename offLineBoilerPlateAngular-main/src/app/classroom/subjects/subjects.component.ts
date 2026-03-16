import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { first } from 'rxjs/operators';
import { SubjectService } from '@app/_services/subject.service';
import { AccountService, AlertService } from '@app/_services';
import { Account } from '@app/_models';

declare var bootstrap: any;

@Component({
  selector: 'app-subjects',
  templateUrl: './subjects.component.html',
  styleUrls: ['./subjects.component.css']
})
export class SubjectsComponent implements OnInit, AfterViewInit {
  subjects: any[] = [];
  filteredSubjects: any[] = [];
  loading = true;
  account: Account | null;
  viewMode: 'enrolled' | 'available' = 'enrolled'; // Default to enrolled
  
  // Modal
  modal: any;
  modalTitle = 'Create Subject';
  subjectForm!: FormGroup;
  submitting = false;
  submitted = false;
  editingSubject: any = null;

constructor(
  private subjectService: SubjectService,
  private accountService: AccountService,
  private alertService: AlertService,
  private formBuilder: FormBuilder,
  private router: Router
) {
  this.account = this.accountService.accountValue;
  
  // Debug the service
  console.log('SubjectService constructor check:', {
    service: this.subjectService,
    getAllType: typeof this.subjectService?.getAll,
    getAllExists: !!this.subjectService?.getAll,
    getMySubjectsExists: !!this.subjectService?.getMySubjects
  });
  
  // If getAll is missing, try to reassign from window (temporary fix)
  if (this.subjectService && typeof this.subjectService.getAll !== 'function') {
    console.warn('getAll method missing, attempting to fix...');
    // This is a hack - in a real app, we'd need to find the root cause
    setTimeout(() => {
      console.log('Delayed service check:', {
        service: this.subjectService,
        getAll: this.subjectService?.getAll
      });
    }, 1000);
  }
}

// Add to constructor or ngOnInit
ngOnInit() {
  console.log('Current logged-in user:', this.account);
  console.log('User AccountId:', this.account?.AccountId);
  console.log('User Role:', this.account?.role);
  
  this.initForm();
  this.loadSubjects();
}

  ngAfterViewInit() {
    this.initializeModal();
  }

  initializeModal() {
    const modalElement = document.getElementById('subjectModal');
    if (modalElement) {
      this.modal = new bootstrap.Modal(modalElement, {
        backdrop: 'static',
        keyboard: false
      });
    }
  }

  initForm() {
    this.subjectForm = this.formBuilder.group({
      subjectName: ['', Validators.required],
      subjectCode: ['', Validators.required],
      description: [''],
      schedule: [''],
      room: ['']
    });
  }

  get f() { return this.subjectForm.controls; }

loadSubjects() {
  this.loading = true;
  
  // Add defensive check
  if (!this.subjectService) {
    console.error('SubjectService is not initialized');
    this.alertService.error('Service error: Please refresh the page');
    this.loading = false;
    return;
  }
  
  if (this.isTeacher()) {
    // Teachers see all subjects they teach
    if (typeof this.subjectService.getMySubjects !== 'function') {
      console.error('getMySubjects is not a function');
      this.alertService.error('Service method error');
      this.loading = false;
      return;
    }
    
    this.subjectService.getMySubjects()
      .pipe(first())
      .subscribe({
        next: (subjects: any[]) => {
          console.log('Loaded subjects for teacher:', subjects);
          this.subjects = subjects;
          this.filterSubjects();
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error loading subjects:', error);
          this.alertService.error('Failed to load subjects');
          this.loading = false;
        }
      });
  } else {
    // Students see all subjects with enrollment status
    console.log('Loading subjects for student with ID:', this.account?.AccountId);
    
    if (typeof this.subjectService.getAll !== 'function') {
      console.error('getAll is not a function on subjectService', this.subjectService);
      this.alertService.error('Service error: Please refresh the page');
      this.loading = false;
      return;
    }
    
    this.subjectService.getAll()
      .pipe(first())
      .subscribe({
        next: (subjects: any[]) => {
          console.log('Raw subjects from API:', subjects);
          
          // Add isEnrolled flag if not present
          this.subjects = subjects.map(subject => ({
            ...subject,
            isEnrolled: subject.isEnrolled || false
          }));
          
          console.log('Processed subjects:', this.subjects);
          this.filterSubjects();
          this.loading = false;
          
          // Log enrollment status for debugging
          const enrolledCount = this.subjects.filter(s => s.isEnrolled).length;
          console.log(`Student is enrolled in ${enrolledCount} subjects`);
        },
        error: (error: any) => {
          console.error('Error loading subjects:', error);
          this.alertService.error('Failed to load subjects');
          this.loading = false;
        }
      });
  }
}

  filterSubjects() {
    if (this.isStudent()) {
      if (this.viewMode === 'enrolled') {
        this.filteredSubjects = this.subjects.filter((s: any) => s.isEnrolled === true);
        console.log('Enrolled subjects:', this.filteredSubjects); // Debug log
      } else {
        this.filteredSubjects = this.subjects.filter((s: any) => !s.isEnrolled);
        console.log('Available subjects:', this.filteredSubjects); // Debug log
      }
    } else {
      this.filteredSubjects = this.subjects;
    }
  }

  setViewMode(mode: 'enrolled' | 'available') {
    this.viewMode = mode;
    this.filterSubjects();
  }

  isTeacher(): boolean {
    return this.account?.role === 'Teacher' || this.account?.role === 'Admin';
  }

  isStudent(): boolean {
    return this.account?.role === 'Student' || this.account?.role === 'User';
  }

  openCreateSubjectModal() {
    console.log('Opening create subject modal');
    this.modalTitle = 'Create Subject';
    this.editingSubject = null;
    this.subjectForm.reset();
    this.submitted = false;
    
    if (!this.modal) {
      this.initializeModal();
    }
    
    if (this.modal) {
      this.modal.show();
    }
  }

  editSubject(subject: any) {
    console.log('Editing subject:', subject);
    this.modalTitle = 'Edit Subject';
    this.editingSubject = subject;
    this.subjectForm.patchValue({
      subjectName: subject.subjectName,
      subjectCode: subject.subjectCode,
      description: subject.description || '',
      schedule: subject.schedule || '',
      room: subject.room || ''
    });
    this.submitted = false;
    
    if (this.modal) {
      this.modal.show();
    }
  }

  saveSubject() {
    this.submitted = true;

    if (this.subjectForm.invalid) {
      return;
    }

    this.submitting = true;
    
    if (this.editingSubject) {
      this.subjectService.update(this.editingSubject.subjectId, this.subjectForm.value)
        .pipe(first())
        .subscribe({
          next: (response: any) => {
            console.log('Subject updated:', response);
            this.alertService.success('Subject updated successfully');
            this.modal.hide();
            this.loadSubjects();
            this.submitting = false;
          },
          error: (error: any) => {
            console.error('Error updating subject:', error);
            this.alertService.error(error.message || 'Failed to update subject');
            this.submitting = false;
          }
        });
    } else {
      console.log('Creating subject:', this.subjectForm.value);
      this.subjectService.create(this.subjectForm.value)
        .pipe(first())
        .subscribe({
          next: (response: any) => {
            console.log('Subject created:', response);
            this.alertService.success('Subject created successfully');
            this.modal.hide();
            this.loadSubjects();
            this.submitting = false;
          },
          error: (error: any) => {
            console.error('Error creating subject:', error);
            this.alertService.error(error.message || 'Failed to create subject');
            this.submitting = false;
          }
        });
    }
  }

enrollSubject(subject: any) {
  if (confirm(`Are you sure you want to request enrollment in ${subject.subjectName}?`)) {
    this.subjectService.enroll(subject.subjectId)
      .pipe(first())
      .subscribe({
        next: (response) => {
          this.alertService.success('Enrollment request sent! Awaiting teacher approval.');
          this.loadSubjects(); // Reload to show pending status
        },
        error: (error: any) => {
          console.error('Error enrolling:', error);
          this.alertService.error(error.message || 'Failed to request enrollment');
        }
      });
  }
}
  // Add these helper methods
getEnrolledCount(): number {
  return this.subjects.filter(s => s.isEnrolled).length;
}

getAvailableCount(): number {
  return this.subjects.filter(s => !s.isEnrolled).length;
}

  viewSubject(subject: any) {
    this.router.navigate(['/classroom/subject', subject.subjectId], {
      state: { subject: subject }
    });
  }
}