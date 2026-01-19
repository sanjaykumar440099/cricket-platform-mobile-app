import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { StadiumPage } from './stadium.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    StadiumPage,
    RouterModule.forChild([{ path: '', component: StadiumPage }]),
  ],
})
export class StadiumPageModule {}
