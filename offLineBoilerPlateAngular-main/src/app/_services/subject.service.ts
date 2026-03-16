import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

export interface Subject {
    subjectId: number;
    subjectName: string;
    subjectCode: string;
    description?: string;
    teacherId: number;
    teacherName?: string;
    schedule?: string;
    room?: string;
    createdAt: Date;
    updatedAt: Date;
    studentCount?: number;
    questionCount?: number;
    isEnrolled?: boolean;
}

const baseUrl = `${environment.apiUrl}/subjects`;

@Injectable({
    providedIn: 'root'
})
export class SubjectService {
    constructor(private http: HttpClient) { }

    getAll(): Observable<Subject[]> {
        const url = `${baseUrl}?_t=${new Date().getTime()}`;
        console.log('Fetching subjects from:', url);
        return this.http.get<Subject[]>(url);
    }
    getMySubjects(): Observable<Subject[]> {
        return this.http.get<Subject[]>(`${baseUrl}/my-subjects`);
    }

    getById(subjectId: number): Observable<Subject> {
        return this.http.get<Subject>(`${baseUrl}/${subjectId}`);
    }

    create(params: any): Observable<Subject> {
        return this.http.post<Subject>(baseUrl, params);
    }

    update(subjectId: number, params: any): Observable<Subject> {
        return this.http.put<Subject>(`${baseUrl}/${subjectId}`, params);
    }

    delete(subjectId: number): Observable<any> {
        return this.http.delete(`${baseUrl}/${subjectId}`);
    }

    enroll(subjectId: number): Observable<any> {
        return this.http.post(`${baseUrl}/${subjectId}/enroll`, {});
    }

    addStudent(subjectId: number, studentId: number): Observable<any> {
        return this.http.post(`${baseUrl}/${subjectId}/students`, { studentId });
    }

    removeStudent(subjectId: number, studentId: number): Observable<any> {
        return this.http.delete(`${baseUrl}/${subjectId}/students/${studentId}`);
    }

    getStudents(subjectId: number): Observable<any[]> {
        return this.http.get<any[]>(`${baseUrl}/${subjectId}/students`);
    }

    getSubjectQuestions(subjectId: number): Observable<any[]> {
        return this.http.get<any[]>(`${baseUrl}/${subjectId}/questions`);
    }
    // Add these methods to the SubjectService class
    getPendingStudents(subjectId: number): Observable<any[]> {
        return this.http.get<any[]>(`${baseUrl}/${subjectId}/pending-students`);
}

    approveStudent(subjectId: number, studentId: number): Observable<any> {
        return this.http.put(`${baseUrl}/${subjectId}/approve/${studentId}`, {});
}

    rejectStudent(subjectId: number, studentId: number): Observable<any> {
        return this.http.put(`${baseUrl}/${subjectId}/reject/${studentId}`, {});
}
}