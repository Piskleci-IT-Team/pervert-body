import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BeService {

  constructor(
    private http: HttpClient
  ) { }

  getAllTeams(): Observable<any> {
    return this.http.get<any>('http://localhost:3000/api/Pervert');
  }

  addTeam(name: string): Observable<any> {
    return this.http.post<any>(
      'http://localhost:3000/api/Pervert',
      { name },
      {}
    );
  }

  deleteTeam(id: string): Observable<any> {
    return this.http.delete<any>(
      `http://localhost:3000/api/Pervert/${id}`,
      {}
    );
  }

  writeGameData(timer: string, timerStatus: string, gameTime: string, essences: any): Observable<any> {
    return this.http.post<any>(
      'http://localhost:3000/api/Pervert/gameData',
      { timer, timerStatus, gameTime, essences },
      {}
    );
  }

  getGameData(): Observable<any> {
    return this.http.get<any>('http://localhost:3000/api/Pervert/gameData'
    );
  }

  deleteGameData(): Observable<any> {
    return this.http.delete<any>(
      'http://localhost:3000/api/Pervert/gameData',
      {}
    );
  }
  
  // confirmAttendance(requestData: {eventId: string, rowId: string}): Observable<boolean> {
  //   return this.http.patch<boolean>(
  //     this.API_URL + '/MobileApp/SetAttendance',
  //     requestData,
  //     {}
  //   );
  // }

  

}
