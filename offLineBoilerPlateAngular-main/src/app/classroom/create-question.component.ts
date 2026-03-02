import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { first } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { AlertService } from '@app/_services';
import { SubjectService } from '@app/_services/subject.service';

@Component({
  selector: 'app-create-question',
  templateUrl: './create-question.component.html',
  styleUrls: ['./create-question.component.css']
})
export class CreateQuestionComponent implements OnInit {
  form!: FormGroup;
  subjects: any[] = [];
  submitting = false;
  submitted = false;
  subjectId: number | null = null;
  loadingSubjects = true;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private alertService: AlertService,
    private subjectService: SubjectService
  ) { }

  ngOnInit() {
    // Check if subjectId is passed in query params
    this.route.queryParams.subscribe(params => {
      this.subjectId = params['subjectId'] ? Number(params['subjectId']) : null;
      console.log('SubjectId from URL:', this.subjectId); // Debug log
    });

    this.form = this.formBuilder.group({
      subjectId: [this.subjectId || '', Validators.required],
      questionText: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(500)
      ]],
      dueDate: [''],
      points: [100]
    });

    this.loadSubjects();
  }

  loadSubjects() {
    this.loadingSubjects = true;
    console.log('Loading subjects...'); // Debug log
    
    this.subjectService.getMySubjects()
      .pipe(first())
      .subscribe({
        next: (subjects: any[]) => {
          console.log('Loaded subjects:', subjects); // Debug log
          this.subjects = subjects;
          this.loadingSubjects = false;
          
          // If we have a subjectId from URL and subjects are loaded, set it
          if (this.subjectId && subjects.length > 0) {
            const subjectExists = subjects.some(s => s.subjectId === this.subjectId);
            if (subjectExists) {
              this.form.patchValue({ subjectId: this.subjectId });
              console.log('Set subjectId from URL:', this.subjectId);
            }
          }
          
          if (subjects.length === 0) {
            this.alertService.warn('You need to create a subject first before creating questions.');
          }
        },
        error: (error: any) => {
          console.error('Error loading subjects:', error);
          this.alertService.error('Failed to load subjects');
          this.loadingSubjects = false;
        }
      });
  }

  // convenience getter for easy access to form fields
  get f() { return this.form.controls; }

  // Add this method to get the selected subject name for display
  getSelectedSubjectName(): string {
    const selectedId = this.form?.get('subjectId')?.value;
    if (!selectedId) return '';
    
    const subject = this.subjects.find(s => s.subjectId === Number(selectedId));
    return subject ? subject.subjectName : '';
  }

onSubmit() {
  this.submitted = true;

  // stop here if form is invalid
  if (this.form.invalid) {
    console.log('Form invalid:', this.form.errors);
    console.log('Form values:', this.form.value);
    return;
  }

  // Double-check subjectId is present
  const formValue = this.form.value;
  console.log('Raw form value:', formValue);
  console.log('SubjectId value:', formValue.subjectId);
  console.log('SubjectId type:', typeof formValue.subjectId);

  if (!formValue.subjectId) {
    console.error('SubjectId is missing from form');
    this.alertService.error('Please select a subject');
    return;
  }

  this.submitting = true;
  
  // Make sure subjectId is a number
  const requestData = {
    questionText: formValue.questionText,
    subjectId: Number(formValue.subjectId), // Force convert to number
    dueDate: formValue.dueDate || null,
    points: formValue.points || 100
  };
  
  console.log('Final request data being sent:', requestData);
  
  this.http.post<any>(`${environment.apiUrl}/classroom/questions`, requestData)
    .pipe(first())
    .subscribe({
      next: (response) => {
        console.log('Question created successfully:', response);
        this.alertService.success('Question created successfully', { keepAfterRouteChange: true });
        
        // Navigate back to subject
        const selectedSubjectId = requestData.subjectId;
        if (selectedSubjectId) {
          this.router.navigate(['/classroom/subject', selectedSubjectId]);
        } else {
          this.router.navigate(['/classroom/subjects']);
        }
      },
      error: (error: any) => {
        console.error('Error creating question:', error);
        
        // Log the full error response
        if (error.error) {
          console.error('Error details from server:', error.error);
        }
        
        this.alertService.error(error.message || error || 'Failed to create question');
        this.submitting = false;
      }
    });
}

  goBack() {
    if (this.subjectId) {
      this.router.navigate(['/classroom/subject', this.subjectId]);
    } else {
      this.router.navigate(['/classroom/subjects']);
    }
  }
}