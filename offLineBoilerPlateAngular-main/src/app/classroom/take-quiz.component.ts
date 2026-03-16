import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { QuizService } from '@app/_services/quiz.service';
import { AlertService } from '@app/_services';

@Component({
  templateUrl: './take-quiz.component.html',
  styleUrls: ['./take-quiz.component.css']
})
export class TakeQuizComponent implements OnInit {
  quizId!: number;
  quiz: any = null;
  form!: FormGroup;
  loading = true;
  submitting = false;
  submitted = false;
  result: any = null;
  errorMessage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private quizService: QuizService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.quizId = Number(this.route.snapshot.paramMap.get('id'));
    this.form = this.fb.group({
      answers: this.fb.array([])
    });
    this.loadQuiz();
  }

  get answersArray(): FormArray {
    return this.form.get('answers') as FormArray;
  }

  private addAnswerControl(questionId: number): void {
    this.answersArray.push(
      this.fb.group({
        questionId: [questionId],
        answerText: ['', Validators.required]
      })
    );
  }

  loadQuiz(): void {
    this.loading = true;
    this.quizService.getQuiz(this.quizId)
      .pipe(first())
      .subscribe({
        next: (quiz) => {
          this.quiz = quiz;
          this.loading = false;
          // Build form controls for each question
          (quiz.questions || []).forEach((q: any) => this.addAnswerControl(q.questionId));
        },
        error: (err) => {
          console.error('Error loading quiz', err);
          this.alertService.error(err?.error?.message || 'Failed to load quiz');
          this.loading = false;
        }
      });
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) {
      return;
    }

    this.submitting = true;
    this.result = null;
    this.errorMessage = null;
    const payload = this.form.value.answers;

    this.quizService.submitQuizAnswers(this.quizId, payload)
      .pipe(first())
      .subscribe({
        next: (res) => {
          this.result = res;
          this.submitting = false;
          this.alertService.success('Quiz submitted', { keepAfterRouteChange: false });
        },
        error: (err) => {
          console.error('Error submitting quiz answers', err);
          const msg = err?.error?.message || 'Failed to submit quiz';
          this.errorMessage = msg;
          this.alertService.error(msg);
          this.submitting = false;
        }
      });
  }

  cancel(): void {
    const subjectId = this.route.snapshot.queryParamMap.get('subjectId');
    if (subjectId) {
      this.router.navigate(['/classroom/subject', subjectId]);
    } else {
      this.router.navigate(['/classroom']);
    }
  }
}

