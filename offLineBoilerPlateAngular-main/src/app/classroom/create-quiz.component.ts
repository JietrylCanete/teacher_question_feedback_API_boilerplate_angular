import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { AlertService } from '@app/_services';
import { SubjectService } from '@app/_services/subject.service';
import { QuizService } from '@app/_services/quiz.service';

@Component({
  templateUrl: './create-quiz.component.html',
  styleUrls: ['./create-quiz.component.css']
})
export class CreateQuizComponent implements OnInit {
  form!: FormGroup;
  subjects: any[] = [];
  subjectId: number | null = null;
  loadingSubjects = true;
  submitting = false;
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private subjectService: SubjectService,
    private quizService: QuizService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.subjectId = params['subjectId'] ? Number(params['subjectId']) : null;
    });

    this.form = this.fb.group({
      subjectId: [this.subjectId || '', Validators.required],
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      questions: this.fb.array([])
    });

    this.addQuestion(); // start with one question
    this.loadSubjects();
  }

  get f() { return this.form.controls; }

  get questionsArray(): FormArray {
    return this.form.get('questions') as FormArray;
  }

  questionGroup(): FormGroup {
    return this.fb.group({
      questionText: ['', [Validators.required, Validators.minLength(3)]],
      options: this.fb.array([
        this.fb.control(''),
        this.fb.control(''),
        this.fb.control(''),
        this.fb.control('')
      ]),
      correctAnswer: ['', Validators.required],
      points: [1, [Validators.min(1)]]
    });
  }

  getOptionsArray(index: number): FormArray {
    return (this.questionsArray.at(index) as FormGroup).get('options') as FormArray;
  }

  addQuestion(): void {
    this.questionsArray.push(this.questionGroup());
  }

  removeQuestion(index: number): void {
    if (this.questionsArray.length > 1) {
      this.questionsArray.removeAt(index);
    }
  }

  loadSubjects(): void {
    this.loadingSubjects = true;
    this.subjectService.getMySubjects()
      .pipe(first())
      .subscribe({
        next: (subjects) => {
          this.subjects = subjects;
          this.loadingSubjects = false;
          if (this.subjectId) {
            const exists = subjects.some(s => s.subjectId === this.subjectId);
            if (exists) {
              this.form.patchValue({ subjectId: this.subjectId });
            }
          }
        },
        error: (err) => {
          console.error('Error loading subjects', err);
          this.alertService.error('Failed to load subjects');
          this.loadingSubjects = false;
        }
      });
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) {
      return;
    }

    const raw = this.form.value;
    const questionsPayload = raw.questions.map((q: any) => {
      const options: string[] = (q.options || [])
        .map((o: string) => (o || '').trim())
        .filter((o: string) => o.length > 0);

      return {
        questionText: q.questionText,
        options,
        correctAnswer: q.correctAnswer,
        points: q.points || 1
      };
    }).filter((q: any) => q.questionText && q.options.length >= 2);

    if (questionsPayload.length === 0) {
      this.alertService.error('Please add at least one valid question with two options.');
      return;
    }

    const payload = {
      subjectId: Number(raw.subjectId),
      title: raw.title,
      description: raw.description || '',
      questions: questionsPayload
    };

    this.submitting = true;
    this.quizService.createQuiz(payload)
      .pipe(first())
      .subscribe({
        next: (quiz) => {
          this.alertService.success('Quiz created successfully', { keepAfterRouteChange: true });
          this.router.navigate(['/classroom/subject', payload.subjectId]);
        },
        error: (err) => {
          console.error('Error creating quiz', err);
          this.alertService.error(err?.error?.message || 'Failed to create quiz');
          this.submitting = false;
        }
      });
  }

  cancel(): void {
    if (this.subjectId) {
      this.router.navigate(['/classroom/subject', this.subjectId]);
    } else {
      this.router.navigate(['/classroom/subjects']);
    }
  }
}

