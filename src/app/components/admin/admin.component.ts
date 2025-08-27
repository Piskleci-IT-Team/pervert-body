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
import { BeService } from '../../services/be.service';
import { HttpClientModule } from '@angular/common/http';

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

export interface EssenceCount {
  team: string,
  pudTela: number, 
  slastMysli: number, 
  iluzeNadvlady: number, 
  zrnkoDekadence: number,
  esenceZvrhlosti: number,
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
    MatSelectModule,
    HttpClientModule
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
  cycleRemaining: number = 0;
  intervalId: any;

  currentCycle: string = 'Probouzení pudů';

  esenceLog: EssenceData[] = [];
  essenceCount: EssenceCount[] = [];
  essenceCountDisplay: EssenceCount[] = [];

  gameTime = 3 * 60 * 60; // 3 hours in seconds

  startTimer(): void {
    this.intervalId = setInterval(() => {
      this.timer++;
      this.storageService.setItem('timer', this.timer);
      this.storageService.setItem('timerStatus', 'run');
      this.actualCycleFn();

      this.saveVariables();
      this.saveVariablesToBe();
    }, 1000);
  }

  saveVariables(): void {
    this.storageService.setItem('cycleRemaining', this.cycleRemaining);
    this.storageService.setItem('currentCycle', this.currentCycle);
    this.storageService.setItem('essencesCountDisplay', this.essenceCountDisplay);
    this.storageService.setItem('gameTime', this.gameTime); 



  }

  saveVariablesToBe(): void {
    //send to backend
    this.beService.writeGameData(
      String(this.timer),
      this.storageService.getItem('timerStatus') || 'stop',
      String(this.gameTime),
      this.esenceLog
    ).subscribe({
      next: (data) => {
      }
    });
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
    public dialog: MatDialog,
    private beService: BeService,
  ) { 
    
  }

  ngOnInit(): void {
    const items = this.storageService.getAllItems();

    //call backend to get all teams
    this.beService.getAllTeams().subscribe({
      next: (data) => {
        console.log('Teams fetched from backend:', data);
        if (Array.isArray(data)) {
          this.teams = data.map((item: any) => item.name).sort((a, b) => a.localeCompare(b));
        } else {
          console.warn('Unexpected data format:', data);
        }
      },
      error: (error) => {
        console.error('Error fetching teams from backend:', error);
        if(items['teams']) {
          this.teams = items['teams'];
        } else {
          this.teams = [];
        }
      }
    });

    //get Gamedata from backend
    this.beService.getGameData().subscribe({
      next: (data) => {
        console.log('Game data fetched from backend:', data);

        if(data) {
          this.timer = data.timer
          this.actualCycleFn();
          if(data.timerStatus === 'run') {
            this.startTimer();
          }
          this.gameTime = data.gameTime;
          this.esenceLog = data.essences;
          //push essences to localstorage
          this.storageService.setItem('essences', data.essences);
          this.countEsences();
          this.saveVariables();
        }
        else{

          if(items['timer']) {
            this.timer = items['timer'];
            this.actualCycleFn();
            if(items['timerStatus'] === 'run') {
              this.startTimer();
            }
          } else {
            this.timer = 0;
          }
      
          if(items['gameTime']) {
            this.gameTime = items['gameTime'];
          }
      
          if(items['essences']) {
            this.esenceLog = items['essences'].reverse();
            this.countEsences();
          } else {
            this.esenceLog = [];
          }
        }

      },
      error: (error) => {
        
      }
    });



  }

  addTeam(teamName: string): void {
    console.log('Adding team:', teamName);
    if (teamName && !this.teams.includes(teamName)) {
      this.teams.push(teamName);
      this.storageService.setItem('teams', this.teams);

      //send to backend
      this.beService.addTeam(teamName).subscribe({
        next: (data) => {
          console.log('Team added to backend:', data);
        }
      });

      console.log(`Team ${teamName} added.`);
    } else {
      console.warn(`Team ${teamName} already exists or is invalid.`);
    }

    //alphabetically order teams
    this.teams.sort((a, b) => a.localeCompare(b));
  }


  deleteTeam(team: string): void {
    const index = this.teams.indexOf(team);
    if (index > -1) {
      this.teams.splice(index, 1);
      this.storageService.setItem('teams', this.teams);

      //send to backend
      this.beService.deleteTeam(team).subscribe({
        next: (data) => {
          console.log('Team deleted from backend:', data);
        }
      });

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
    this.cycleRemaining = time - (this.timer % time);
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

    this.countEsences();
    this.saveVariables();

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
      this.countEsences();
      this.saveVariablesToBe();
    } else {
    }
  }

  cleanReset(){
    this.storageService.clear();
    this.beService.deleteGameData().subscribe({
      next: (data) => {
        console.log('Game data deleted from backend:', data);
      }
    });
    this.esenceLog = [];
    this.countEsences();
    this.stopTimer();
  }

  countEsences() {
    
    this.essenceCount = [];
    this.essenceCountDisplay = [];

    const esences = this.storageService.getItem('essences') as EssenceData[] || [];

    for (const team of this.teams) {
      const counts: EssenceCount = {
        team: team,
        pudTela: 0,
        slastMysli: 0,
        iluzeNadvlady: 0,
        zrnkoDekadence: 0,
        esenceZvrhlosti: 0,
      };  

      for (const es of esences) {
        if (es.team === team) {
          switch (es.essence) {
            case 'Pud těla':
              counts.pudTela += es.totalPoints;
              break;
            case 'Slast mysli':
              counts.slastMysli += es.totalPoints;
              break;
            case 'Iluze nadvlády':
              counts.iluzeNadvlady += es.totalPoints;
              break;
            case 'Zrnko dekadence':
              counts.zrnkoDekadence += es.totalPoints;
              break;
          }
        }
      }
      const requirements = {
        pudTela: 24,
        slastMysli: 6,
        iluzeNadvlady: 2,
        zrnkoDekadence: 1
      };

      // Spočítáme celé podíly
      const quotients = [
        Math.floor(counts.pudTela / requirements.pudTela),
        Math.floor(counts.slastMysli / requirements.slastMysli),
        Math.floor(counts.iluzeNadvlady / requirements.iluzeNadvlady),
        Math.floor(counts.zrnkoDekadence / requirements.zrnkoDekadence)
      ];

      // Najdeme nejmenší nenulový podíl
      const delitel = Math.min(...quotients);

      counts.esenceZvrhlosti = delitel;

      // //remove whole parts from counts
      // counts.pudTela -= delitel * requirements.pudTela;
      // counts.slastMysli -= delitel * requirements.slastMysli;
      // counts.iluzeNadvlady -= delitel * requirements.iluzeNadvlady;
      // counts.zrnkoDekadence -= delitel * requirements.zrnkoDekadence

      this.essenceCount.push(counts);

      //remove whole parts from counts
      counts.pudTela -= delitel * requirements.pudTela;
      counts.slastMysli -= delitel * requirements.slastMysli;
      counts.iluzeNadvlady -= delitel * requirements.iluzeNadvlady;
      counts.zrnkoDekadence -= delitel * requirements.zrnkoDekadence

      this.essenceCountDisplay.push(counts);
    }

    //order alphabetically by team name essenceCount and essenceCountDisplay
    this.essenceCount.sort((a, b) => a.team.localeCompare(b.team));
    this.essenceCountDisplay.sort((a, b) => a.team.localeCompare(b.team));

    
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