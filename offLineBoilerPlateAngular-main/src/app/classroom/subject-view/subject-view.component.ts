import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { SubjectService } from '@app/_services/subject.service';
import { AccountService, AlertService } from '@app/_services';
import { Account } from '@app/_models';

@Component({
  templateUrl: './subject-view.component.html',
  styleUrls: ['./subject-view.component.css']
})
export class SubjectViewComponent implements OnInit {
  subjectId!: number;
  subject: any = null;
  questions: any[] = [];
  quizzes: any[] = [];
  students: any[] = [];
  account: Account | null;
  pendingStudents: any[] = [];
  loadingPending = false;
  
  activeTab: 'questions' | 'students' | 'pending' = 'questions';
  
  loading = true;
  loadingQuestions = true;
  loadingStudents = true;
  loadingQuizzes = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private subjectService: SubjectService,
    private accountService: AccountService,
    private alertService: AlertService
  ) {
    this.account = this.accountService.accountValue;
  }

  ngOnInit() {
    this.subjectId = Number(this.route.snapshot.paramMap.get('id'));
    
    // Try to get from state
    const state = history.state;
    if (state && state.subject) {
      this.subject = state.subject;
    }
    
    this.loadSubject();
    this.loadQuestions();
    this.loadQuizzes();
    
    if (this.isTeacher()) {
      this.loadStudents();
      this.loadPendingStudents();
    }
  }
  
  loadPendingStudents() {
    this.loadingPending = true;
    this.subjectService.getPendingStudents(this.subjectId)
      .pipe(first())
      .subscribe({
        next: (students) => {
          this.pendingStudents = students;
          this.loadingPending = false;
        },
        error: (error) => {
          console.error('Error loading pending students:', error);
          this.alertService.error('Failed to load pending requests');
          this.loadingPending = false;
        }
      });
  }

  approveStudent(studentId: number) {
    this.subjectService.approveStudent(this.subjectId, studentId)
      .pipe(first())
      .subscribe({
        next: () => {
          this.alertService.success('Student approved');
          this.loadPendingStudents(); // refresh pending list
          this.loadStudents();        // refresh enrolled students list
        },
        error: (error) => this.alertService.error(error)
      });
  }

  rejectStudent(studentId: number) {
    this.subjectService.rejectStudent(this.subjectId, studentId)
      .pipe(first())
      .subscribe({
        next: () => {
          this.alertService.success('Student rejected');
          this.loadPendingStudents(); // refresh pending list
        },
        error: (error) => this.alertService.error(error)
      });
  }

  loadSubject() {
    this.loading = true;
    this.subjectService.getById(this.subjectId)
      .pipe(first())
      .subscribe({
        next: (subject: any) => {
          this.subject = subject;
          this.loading = false;
        },
        error: (error: any) => {
          this.alertService.error(error);
          this.loading = false;
        }
      });
  }

  loadQuestions() {
    this.loadingQuestions = true;
    this.subjectService.getSubjectQuestions(this.subjectId)
      .pipe(first())
      .subscribe({
        next: (questions: any[]) => {
          this.questions = questions;
          this.loadingQuestions = false;
        },
        error: (error: any) => {
          this.alertService.error(error);
          this.loadingQuestions = false;
        }
      });
  }

  loadQuizzes() {
    this.loadingQuizzes = true;
    this.subjectService.getSubjectQuizzes(this.subjectId)
      .pipe(first())
      .subscribe({
        next: (quizzes: any[]) => {
          this.quizzes = quizzes;
          this.loadingQuizzes = false;
        },
        error: (error: any) => {
          this.alertService.error(error);
          this.loadingQuizzes = false;
        }
      });
  }

  loadStudents() {
    this.loadingStudents = true;
    this.subjectService.getStudents(this.subjectId)
      .pipe(first())
      .subscribe({
        next: (students: any[]) => {
          this.students = students;
          this.loadingStudents = false;
        },
        error: (error: any) => {
          this.alertService.error(error);
          this.loadingStudents = false;
        }
      });
  }

  setActiveTab(tab: 'questions' | 'students' | 'pending') {
    this.activeTab = tab;
  }

  isTeacher(): boolean {
    return this.account?.role === 'Teacher' || this.account?.role === 'Admin';
  }

  isStudent(): boolean {
    return this.account?.role === 'Student' || this.account?.role === 'User';
  }

  goBack() {
    this.router.navigate(['/classroom/subjects']);
  }

  answerQuestion(question: any) {
    this.router.navigate(['/classroom', question.questionId], {
      state: { question: question, subject: this.subject }
    });
  }

  takeQuiz(quiz: any) {
    this.router.navigate(['/classroom/quiz', quiz.quizId, 'take'], {
      state: { quiz }
    });
  }

  viewAnswers(question: any) {
    this.router.navigate(['/classroom/view', question.questionId], {
      state: { question: question, subject: this.subject }
    });
  }
}