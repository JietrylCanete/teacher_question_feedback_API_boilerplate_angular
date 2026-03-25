import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '@environments/environment';
import { AccountService, AlertService, SubjectService } from '@app/_services'; // Import from _services
import { Account } from '@app/_models';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-list', // Add selector
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit {
  questions: any[] = [];
  filteredQuestions: any[] = [];
  subjects: any[] = [];
  loading = true;
  account: Account | null;
  selectedSubjectId: string = 'all';

  constructor(
    private http: HttpClient,
    private router: Router,
    private accountService: AccountService,
    private subjectService: SubjectService,
    private alertService: AlertService
  ) {
    this.account = this.accountService.accountValue;
  }

  ngOnInit() {
    this.loadSubjects();
    this.loadQuestions();
  }

  loadSubjects() {
    const subjects$ = this.isStudent()
      ? this.subjectService.getMySubjects()
      : this.subjectService.getAll();

    subjects$
      .pipe(first())
      .subscribe({
        next: (subjects: any[]) => {
          this.subjects = subjects;
        },
        error: (error: any) => {
          console.error('Error loading subjects:', error);
        }
      });
  }

  loadQuestions() {
    this.loading = true;
    this.http.get<any[]>(`${environment.apiUrl}/classroom/questions`)
      .subscribe({
        next: (data: any[]) => {
          this.questions = data;
          this.applyFilter();
          this.loading = false;
        },
        error: (err: any) => {
          console.error('Error loading questions:', err);
          this.alertService.error('Failed to load questions');
          this.loading = false;
        }
      });
  }

  filterBySubject(event: any) {
    this.selectedSubjectId = event.target.value;
    this.applyFilter();
  }

  applyFilter() {
    if (this.selectedSubjectId === 'all') {
      this.filteredQuestions = this.questions;
    } else {
      this.filteredQuestions = this.questions.filter(q => 
        q.subjectId == this.selectedSubjectId
      );
    }
  }

  hasUserAnswered(question: any): boolean {
    return question.hasAnswered || false;
  }

  isTeacher(): boolean {
    return this.account?.role === 'Teacher' || this.account?.role === 'Admin';
  }

  isStudent(): boolean {
    return this.account?.role === 'Student' || this.account?.role === 'User';
  }

  navigateToQuestion(question: any) {
    if (this.isStudent() && question.hasAnswered) {
      this.alertService.info('You have already answered this question');
      return;
    }
    
    this.router.navigate(['/classroom', question.questionId], {
      state: { question: question }
    });
  }

  viewAnswers(question: any) {
    this.router.navigate(['/classroom/view', question.questionId], {
      state: { question: question }
    });
  }

  refreshQuestions() {
    this.loadQuestions();
  }
}