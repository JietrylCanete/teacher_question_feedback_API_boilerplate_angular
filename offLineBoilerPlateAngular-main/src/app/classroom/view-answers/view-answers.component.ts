import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { environment } from "@environments/environment";

@Component({
  templateUrl: "./view-answers.component.html",
  styleUrls: ["./view-answers.component.css"],
})
export class ViewAnswersComponent implements OnInit {
  questionId!: string;
  question: any = null;
  answers: any[] = [];
  loading = true;
  loadingAnswers = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
  ) {}

  ngOnInit() {
    this.questionId = this.route.snapshot.paramMap.get("id")!;
    this.loadQuestion();
    this.loadAnswers();
  }

  loadQuestion() {
    // Try to get from state first
    const state = history.state;
    if (state && state.question) {
      this.question = state.question;
    } else {
      // If not in state, fetch from API
      this.http
        .get<any>(
          `${environment.apiUrl}/classroom/questions/${this.questionId}`,
        )
        .subscribe({
          next: (data) => {
            this.question = data;
            // Format teacher name if not already formatted
            if (data.teacher) {
              this.question.teacherName = `${data.teacher.firstName} ${data.teacher.lastName}`;
            }
          },
          error: (err) => {
            console.error("Error loading question:", err);
          },
        });
    }
  }

  loadAnswers() {
    this.loadingAnswers = true;
    this.http
      .get<
        any[]
      >(`${environment.apiUrl}/classroom/questions/${this.questionId}/answers`)
      .subscribe({
        next: (data) => {
          this.answers = data;
          this.loadingAnswers = false;
          this.loading = false;
        },
        error: (err) => {
          console.error("Error loading answers:", err);
          this.loadingAnswers = false;
          this.loading = false;
        },
      });
  }

  goBack() {
    this.router.navigate(["/classroom"]);
  }

  getRelevanceClass(isRelevant: boolean): string {
    return isRelevant ? "relevant" : "not-relevant";
  }

  getRelevanceBadge(isRelevant: boolean): string {
    return isRelevant ? "Relevant" : "Not Relevant";
  }

  getRelevanceIcon(isRelevant: boolean): string {
    return isRelevant ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill";
  }
}
