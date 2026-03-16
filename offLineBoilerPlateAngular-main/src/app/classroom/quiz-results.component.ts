import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';

@Component({
  templateUrl: './quiz-results.component.html',
  styleUrls: ['./quiz-results.component.css']
})
export class QuizResultsComponent implements OnInit {
  quizId!: number;
  loading = true;
  data: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.quizId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadResults();
  }

  loadResults(): void {
    this.loading = true;
    this.http
      .get<any>(`${environment.apiUrl}/classroom/quizzes/${this.quizId}/results`)
      .subscribe({
        next: (res) => {
          this.data = res;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  goBack(): void {
    const subjectId = this.route.snapshot.queryParamMap.get('subjectId');
    if (subjectId) {
      this.router.navigate(['/classroom/subject', subjectId]);
    } else {
      this.router.navigate(['/classroom']);
    }
  }

  getQuestionText(questionId: number): string {
    if (!this.data || !this.data.questions) {
      return '';
    }
    const q = this.data.questions.find((x: any) => x.questionId === questionId);
    return q ? q.questionText : '';
  }
}

