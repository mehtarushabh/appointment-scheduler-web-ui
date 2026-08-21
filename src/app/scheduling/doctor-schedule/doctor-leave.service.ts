import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LeaveRequest, LeaveResponse } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class DoctorLeaveService {
  private readonly http = inject(HttpClient);

  listMyLeaves(): Observable<LeaveResponse[]> {
    return this.http.get<LeaveResponse[]>('/api/v1/me/leaves');
  }

  addLeave(request: LeaveRequest): Observable<LeaveResponse> {
    return this.http.post<LeaveResponse>('/api/v1/me/leaves', request);
  }
}
