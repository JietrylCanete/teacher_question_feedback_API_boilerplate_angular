import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

const baseUrl = `${environment.apiUrl}/classroom/quizzes`;

export interface QuizQuestionPayload {
  questionText: string;
  options: string[];
  correctAnswer: string;
  points?: number;
}

export interface CreateQuizPayload {
  subjectId: number;
  title: string;
  description?: string;
  questions: QuizQuestionPayload[];
}

@Injectable({ providedIn: 'root' })
export class QuizService {
  constructor(private http: HttpClient) {}

  createQuiz(payload: CreateQuizPayload): Observable<any> {
    return this.http.post<any>(baseUrl, payload);
  }

  getQuiz(quizId: number): Observable<any> {
    return this.http.get<any>(`${baseUrl}/${quizId}`);
  }

  submitQuizAnswers(quizId: number, answers: { questionId: number; answerText: string }[]): Observable<any> {
    return this.http.post<any>(`${baseUrl}/${quizId}/answers`, { answers });
  }
}

