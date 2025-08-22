import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { LocalstorageService } from '../../services/localstorage.service';


export interface EssenceCount {
  team: string,
  pudTela: number, 
  slastMysli: number, 
  iluzeNadvlady: number, 
  zrnkoDekadence: number,
  esenceZvrhlosti: number,
}



@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})

export class HomeComponent implements OnInit { 

  gameTime = 3 * 60 * 60; // 3 hours in seconds
  remainingTime = this.gameTime;
  currentCycle = 'Probouzení pudů';
  remainingGameTime = 0;

  essenceCount: EssenceCount[] = [];

  intervalId: any;

  constructor(
    private storageService: LocalstorageService
  ) { }

  startTimer(): void {
    this.intervalId = setInterval(() => {
      const timer = Number(this.storageService.getItem('timer')) || 0;
      this.remainingGameTime = this.gameTime - timer;
      this.remainingTime = this.storageService.getItem('cycleRemaining') || 0;
      this.currentCycle = this.storageService.getItem('currentCycle') || 'Probouzení pudů';
      this.essenceCount = this.storageService.getItem('essencesCountDisplay') || [];
    }, 1000);
  }

  ngOnInit(): void {

    this.startTimer();

  }

}
