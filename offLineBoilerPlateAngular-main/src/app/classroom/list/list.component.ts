import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '@environments/environment';
import { AccountService } from '@app/_services';
import { Account } from '@app/_models';

@Component({
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit {
  questions: any[] = [];
  loading = true;
  account: Account | null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private accountService: AccountService
  ) {
    this.account = this.accountService.accountValue;
    console.log('Current user role:', this.account?.role); // Debug log
  }

  ngOnInit() {
    this.loadQuestions();
  }

  loadQuestions() {
    this.loading = true;
    this.http.get<any[]>(`${environment.apiUrl}/classroom/questions`)
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

  canCreateQuestion(): boolean {
    const role = this.account?.role;
    return role === 'Teacher' || role === 'Admin';
  }

  canAnswerQuestion(): boolean {
    const role = this.account?.role;
    // Allow User, Student, Teacher, Admin to answer/view
    return role === 'User' || role === 'Student' || role === 'Teacher' || role === 'Admin';
  }

  isStudent(): boolean {
    const role = this.account?.role;
    return role === 'Student' || role === 'User'; // Treat User as Student for UI purposes
  }

  navigateToQuestion(question: any) {
  const role = this.account?.role;
  
  if (role === 'Teacher' || role === 'Admin') {
    // Teachers and Admins go to view answers
    this.router.navigate(['/classroom/view', question.questionId], {
      state: { question: question }
    });
  } else {
    // Students and Users go to answer
    this.router.navigate(['/classroom', question.questionId], {
      state: { question: question }
    });
  }
}

  refreshQuestions() {
    this.loadQuestions();
  }
}