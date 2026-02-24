import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { AlertService } from '@app/_services';
import { first } from 'rxjs/operators';

@Component({
  templateUrl: './my-questions.component.html',
  styleUrls: ['./my-questions.component.css']
})
export class MyQuestionsComponent implements OnInit {
  questions: any[] = [];
  loading = true;

  constructor(
    private http: HttpClient,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.loadMyQuestions();
  }

  loadMyQuestions() {
    this.loading = true;
    this.http.get<any[]>(`${environment.apiUrl}/classroom/my-questions`)
      .subscribe({
        next: data => {
          this.questions = data;
          this.loading = false;
        },
        error: err => {
          console.error('Error loading questions:', err);
          this.loading = false;
        }
      });
  }

  deleteQuestion(questionId: number) {
    if (confirm('Are you sure you want to delete this question?')) {
      this.http.delete(`${environment.apiUrl}/classroom/questions/${questionId}`)
        .pipe(first())
        .subscribe({
          next: () => {
            this.alertService.success('Question deleted successfully');
            this.loadMyQuestions();
          },
          error: error => {
            this.alertService.error(error);
          }
        });
    }
  }
}