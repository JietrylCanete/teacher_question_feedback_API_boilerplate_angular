import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { ClassroomRoutingModule } from './classroom-routing.module';
import { ListComponent } from './list/list.component';
import { AnswerComponent } from './answer/answer.component';
import { CreateQuestionComponent } from './create-question.component';
import { ViewAnswersComponent } from './view-answers/view-answers.component';

@NgModule({
  declarations: [
    ListComponent,
    AnswerComponent,
    CreateQuestionComponent,
    ViewAnswersComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ClassroomRoutingModule
  ]
})
export class ClassroomModule {}