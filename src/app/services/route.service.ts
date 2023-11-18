import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {Route} from "../app.component";
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class RouteService {
  headers: HttpHeaders

  constructor(private httpClient: HttpClient) {
    this.headers = new HttpHeaders().set('Content-Type', 'application/json')
  }

  optimizeRoutes(routes: Route[], origin: string): Observable<any> {
    return this.httpClient.post(`http://localhost:8000/routes/${origin}`, routes, { headers: this.headers })
  }
}
