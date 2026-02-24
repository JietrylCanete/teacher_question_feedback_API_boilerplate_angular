import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { first } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { AlertService } from '@app/_services';

@Component({
  templateUrl: './create-question.component.html',
  styleUrls: ['./create-question.component.css']
})
export class CreateQuestionComponent implements OnInit {
  form!: FormGroup;
  submitting = false;
  submitted = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private http: HttpClient,
    private alertService: AlertService
  ) { }

  ngOnInit() {
    this.form = this.formBuilder.group({
      questionText: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(500)
      ]]
    });
  }

  // convenience getter for easy access to form fields
  get f() { return this.form.controls; }

  onSubmit() {
    this.submitted = true;

    // stop here if form is invalid
    if (this.form.invalid) {
      return;
    }

    this.submitting = true;
    this.http.post<any>(`${environment.apiUrl}/classroom/questions`, this.form.value)
      .pipe(first())
      .subscribe({
        next: () => {
          this.alertService.success('Question created successfully', { keepAfterRouteChange: true });
          this.router.navigate(['/classroom']);
        },
        error: error => {
          this.alertService.error(error);
          this.submitting = false;
        }
      });
  }
}