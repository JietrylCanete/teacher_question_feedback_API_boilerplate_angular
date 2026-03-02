import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@app/_helpers';

import { SubjectsComponent } from './subjects/subjects.component';
import { SubjectViewComponent } from './subject-view/subject-view.component';
import { ListComponent } from './list/list.component';
import { AnswerComponent } from './answer/answer.component';
import { CreateQuestionComponent } from './create-question.component';
import { ViewAnswersComponent } from './view-answers/view-answers.component';

const routes: Routes = [
  { 
    path: '', 
    redirectTo: 'subjects',
    pathMatch: 'full'
  },
  { 
    path: 'subjects', 
    component: SubjectsComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'subject/:id', 
    component: SubjectViewComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'all-questions', 
    component: ListComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'create', 
    component: CreateQuestionComponent,
    canActivate: [AuthGuard],
    data: { roles: ['Teacher', 'Admin'] }
  },
  { 
    path: 'view/:id', 
    component: ViewAnswersComponent,
    canActivate: [AuthGuard],
    data: { roles: ['Teacher', 'Admin'] }
  },
  { 
    path: ':id', 
    component: AnswerComponent,
    canActivate: [AuthGuard],
    data: { roles: ['User', 'Student', 'Teacher', 'Admin'] }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClassroomRoutingModule {}