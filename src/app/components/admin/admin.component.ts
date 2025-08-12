import { ChangeDetectionStrategy, Component, Inject, type OnInit } from '@angular/core';
import { LocalstorageService } from '../../services/localstorage.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import {MatListModule} from '@angular/material/list';

export interface DialogData {
  teamName: string;
}

export interface EssenceData {
  timestamp: number;
  cycle: string;
  team: string;
  essence: string;
  totalPoints: number;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatListModule,
    MatFormFieldModule, 
    MatSelectModule
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements OnInit {

  teams: string[] = [];
  newTeamName: string = '';
  esences: string[] = ['Pud těla', 'Slast mysli', 'Iluze nadvlády', 'Zrnko dekadence'];
  selectedTeam: string = '';

  toggleList: boolean = false;
  timer: number = 0;
  intervalId: any;

  currentCycle: string = '';

  esenceLog: EssenceData[] = [];

  startTimer(): void {
    this.intervalId = setInterval(() => {
      this.timer++;
      this.storageService.setItem('timer', this.timer);
      this.storageService.setItem('timerStatus', 'run');
      this.actualCycleFn();
    }, 1000);
  }

  stopTimer(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.storageService.setItem('timerStatus', 'stop');
    }
  }

  resetTimer(): void {
    this.stopTimer();
    this.timer = 0;
    this.storageService.setItem('timer', this.timer);
    this.storageService.setItem('timerStatus', 'stop');
    this.actualCycleFn();
  }

  constructor(
    private storageService: LocalstorageService,
    public dialog: MatDialog
  ) { 
    
  }

  ngOnInit(): void {
    const items = this.storageService.getAllItems();

    console.log('Items loaded from local storage:', items);

    if(items['teams']) {
      this.teams = items['teams'];
    } else {
      this.teams = [];
    }

    if(items['timer']) {
      this.timer = items['timer'];
      this.actualCycleFn();
      if(items['timerStatus'] === 'run') {
        this.startTimer();
      }
    } else {
      this.timer = 0;
    }

    if(items['essences']) {
      this.esenceLog = items['essences'].reverse();
    } else {
      this.esenceLog = [];
    }
  }

  addTeam(teamName: string): void {
    console.log('Adding team:', teamName);
    if (teamName && !this.teams.includes(teamName)) {
      this.teams.push(teamName);
      this.storageService.setItem('teams', this.teams);
      console.log(`Team ${teamName} added.`);
    } else {
      console.warn(`Team ${teamName} already exists or is invalid.`);
    }
  }


  deleteTeam(team: string): void {
    const index = this.teams.indexOf(team);
    if (index > -1) {
      this.teams.splice(index, 1);
      this.storageService.setItem('teams', this.teams);
      console.log(`Team ${team} deleted.`);
    } else {
      console.warn(`Team ${team} not found.`);
    }
  }

  openDialog() {
    const dialogRef = this.dialog.open(DialogContentExampleDialog, {
      data: {
        teamName: ''
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result)
        this.addTeam(result);
    });
  }

  // cyklus erotička based na timeru, změna co 15 minut
  actualCycleFn(): void {
    const time = 300;
    const cycles = ['Probouzení pudů', 'Mentální slast', 'Mocenská hra', 'Zpětná vlna', 'Ztráta kontroly', 'Vyrovnání sil'];
    const cycleIndex = Math.floor(this.timer / time) % cycles.length; 
    this.currentCycle = cycles[cycleIndex];
  }

  addEssence(essence: string): void{
    // Implementace přidání esence
    const data = {
      timestamp: this.timer,
      cycle: this.currentCycle,
      team: this.selectedTeam,
      essence: essence,
      totalPoints: this.countPoints(essence)
    }
    let es = this.storageService.getItem('essences') as EssenceData[] || [];
    es.push(data);
    this.storageService.setItem('essences', es);
    this.esenceLog = es.reverse();
  }

  countPoints(essence: string): number {
    const multipliers = {
      'Probouzení pudů':       { pudTěla: 5, slastMysli: 1, iluzeNadvlady: 0, zrnkoDekadence: 0 },
      'Mentální slast':        { pudTěla: 3, slastMysli: 3, iluzeNadvlady: 1, zrnkoDekadence: 0 },
      'Mocenská hra':          { pudTěla: 2, slastMysli: 2, iluzeNadvlady: 4, zrnkoDekadence: 1 },
      'Zpětná vlna':           { pudTěla: 4, slastMysli: 1, iluzeNadvlady: 2, zrnkoDekadence: 2 },
      'Ztráta kontroly':       { pudTěla: 1, slastMysli: 0, iluzeNadvlady: 1, zrnkoDekadence: 5 },
      'Vyrovnání sil':         { pudTěla: 3, slastMysli: 2, iluzeNadvlady: 2, zrnkoDekadence: 2 },
    };
    const cycleMultipliers = multipliers[this.currentCycle as keyof typeof multipliers];
    if (!cycleMultipliers) {
      console.warn('Neznámý cyklus:', this.currentCycle);
      return 0;
    }

    switch (essence) {
      case 'Pud těla':
        return cycleMultipliers.pudTěla;
      case 'Slast mysli':
        return cycleMultipliers.slastMysli;
      case 'Iluze nadvlády':
        return cycleMultipliers.iluzeNadvlady;
      case 'Zrnko dekadence':
        return cycleMultipliers.zrnkoDekadence;
      default:
        console.warn('Neznámá esence:', essence);
        return 0;
    }

  }

  deleteEssence(es: EssenceData): void {
    let esences = this.storageService.getItem('essences') as EssenceData[] || [];
    const index = esences.findIndex(e => e.timestamp === es.timestamp && e.cycle === es.cycle && e.team === es.team && e.essence === es.essence);
    
    if (index > -1) {
      esences.splice(index, 1);
      this.storageService.setItem('essences', esences);
      this.esenceLog = esences.reverse();
    } else {
    }
  }

  cleanReset(){
    this.storageService.clear();
  }

}

@Component({
  selector: 'dialog-content-example-dialog',
  templateUrl: 'dialog-content.html',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule,    MatFormFieldModule,
    MatInputModule, CommonModule, FormsModule,

  ],
})
export class DialogContentExampleDialog {
  constructor(
    public dialogRef: MatDialogRef<DialogContentExampleDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
  ) {}
}