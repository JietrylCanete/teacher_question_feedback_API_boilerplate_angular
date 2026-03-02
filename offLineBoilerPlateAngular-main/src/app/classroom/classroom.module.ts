import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';


import { ClassroomRoutingModule } from './classroom-routing.module';
import { SubjectsComponent } from './subjects/subjects.component';
import { SubjectViewComponent } from './subject-view/subject-view.component';
import { ListComponent } from './list/list.component';
import { AnswerComponent } from './answer/answer.component';
import { CreateQuestionComponent } from './create-question.component';
import { ViewAnswersComponent } from './view-answers/view-answers.component';

@NgModule({
  declarations: [
    SubjectsComponent,
    SubjectViewComponent,
    ListComponent,
    AnswerComponent,
    CreateQuestionComponent,
    ViewAnswersComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    ClassroomRoutingModule
  ]
})
export class ClassroomModule {}