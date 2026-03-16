import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { HttpClient } from "@angular/common/http";
import { environment } from "@environments/environment";

@Component({
  templateUrl: "./answer.component.html",
  styleUrls: ["./answer.component.css"],
})
export class AnswerComponent implements OnInit {
  form!: FormGroup;
  questionId!: string;
  question: any = null;
  feedback: any = null;
  errorMessage: string | null = null;
  submitting = false;
  submitted = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private http: HttpClient,
  ) {}

  ngOnInit() {
    this.questionId = this.route.snapshot.paramMap.get("id")!;

    this.form = this.fb.group({
      answerText: [
        "",
        [
          Validators.required
        ],
      ],
    });

    this.loadQuestion();
  }

  loadQuestion() {
    // First try to get from state
    const state = history.state;
    if (state && state.question) {
      this.question = this.normalizeQuestion(state.question);
    } else {
      // If not in state, fetch from API
      this.http
        .get<any>(
          `${environment.apiUrl}/classroom/questions/${this.questionId}`,
        )
        .subscribe({
          next: (data) => {
            this.question = this.normalizeQuestion(data);
          },
          error: (err) => {
            console.error("Error loading question:", err);
          },
        });
    }
  }

  private normalizeQuestion(raw: any) {
    const question = { ...raw };

    // Format teacher name if teacher object exists
    if (question.teacher && !question.teacherName) {
      question.teacherName = `${question.teacher.firstName} ${question.teacher.lastName}`;
    }

    // Ensure type has a sensible default
    if (!question.type) {
      question.type = 'ESSAY';
    }

    // Parse options if provided as JSON string
    if (question.options && typeof question.options === 'string') {
      try {
        question.options = JSON.parse(question.options);
      } catch {
        // leave as-is if parsing fails
      }
    }

    // For non-essay types, keep answer required but without long-text constraints
    // For essay, enforce min/max length
    if (question.type === 'ESSAY') {
      this.form.get('answerText')?.setValidators([
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(500),
      ]);
    } else {
      this.form.get('answerText')?.setValidators([
        Validators.required,
      ]);
    }
    this.form.get('answerText')?.updateValueAndValidity();

    return question;
  }

  // convenience getter for easy access to form fields
  get f() {
    return this.form.controls;
  }

  submit() {
    this.submitted = true;

    if (this.form.invalid) {
      // Scroll to error
      document.querySelector(".is-invalid")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }

    this.submitting = true;
    this.feedback = null;
    this.errorMessage = null;

    this.http
      .post<any>(
        `${environment.apiUrl}/classroom/questions/${this.questionId}/answer`,
        this.form.value,
      )
      .subscribe({
        next: (res) => {
          this.feedback = res;
          this.submitting = false;
          // Scroll to feedback
          setTimeout(() => {
            document.querySelector(".feedback-section")?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }, 100);
        },
        error: (err) => {
          console.error("Error submitting answer:", err);
          this.submitting = false;
          // Show friendly message if already answered
          const msg =
            err?.error?.message ||
            err?.message ||
            "Failed to submit answer. Please try again.";
          this.errorMessage = msg;
        },
      });
  }

  resetForm() {
    this.form.reset();
    this.submitted = false;
    this.feedback = null;
  }
}
