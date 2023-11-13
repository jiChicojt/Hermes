import {Component, OnInit, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import {GoogleMap, GoogleMapsModule} from "@angular/google-maps";
import {HttpClient, HttpClientJsonpModule, HttpClientModule} from "@angular/common/http";
import {catchError, map, Observable, of} from "rxjs";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    GoogleMapsModule,
    HttpClientModule,
    HttpClientJsonpModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  @ViewChild(GoogleMap, { static: false }) set map(m: GoogleMap) {
    if (m) {
      this.initDrawingManager(m);
    }
  }

  title = 'Hermes';
  apiLoaded: Observable<boolean>
  options: google.maps.MapOptions = {
    center: { lat: 14.628434, lng: -90.522713 },
    zoom: 14,
    disableDefaultUI: true
  }
  drawingManager: google.maps.drawing.DrawingManager | undefined

  constructor(httpClient: HttpClient) {
    this.apiLoaded = httpClient.jsonp('https://maps.googleapis.com/maps/api/js?key=AIzaSyC0fQ_h7XXkkDPtw_f8jfoyAcSKyj-i7pg&libraries=drawing,places', 'callback')
      .pipe(
        map(() => true),
        catchError(() => of(false)),
      )
  }

  ngOnInit(): void {

  }

  initDrawingManager(map: GoogleMap) {
    const drawingOptions = {
      drawingMode: google.maps.drawing.OverlayType.MARKER,
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [
          google.maps.drawing.OverlayType.MARKER
        ],
      },
      polygonOptions: {
        strokeColor: '#00ff00',
      },
    };
    this.drawingManager = new google.maps.drawing.DrawingManager(drawingOptions);
    // @ts-ignore
    this.drawingManager.setMap(map.googleMap);
  }
}
