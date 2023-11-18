import {Component, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterOutlet} from '@angular/router';
import {GoogleMap, GoogleMapsModule, MapDirectionsService, MapInfoWindow, MapMarker} from "@angular/google-maps";
import {HttpClientJsonpModule, HttpClientModule} from "@angular/common/http";
import {AutocompleteComponent} from "./components/autocomplete/autocomplete.component";
import {PlaceSearchResult} from "./models/place.search.result";
import TravelMode = google.maps.TravelMode;
import {MatIconModule} from "@angular/material/icon";
import {map} from "rxjs";
import {RouteService} from "./services/route.service";

export interface Route {
  name: string
  possibleEdges: any
}

interface RouteOptions {
  name: string
  options: google.maps.DirectionsRoute[]
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    GoogleMapsModule,
    HttpClientModule,
    HttpClientJsonpModule,
    AutocompleteComponent,
    MatIconModule
  ],
  providers: [RouteService],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  @ViewChild('map', {static: true}) map!: GoogleMap
  @ViewChild(MapInfoWindow) infoWindow!: MapInfoWindow

  title = 'Hermes';
  options: google.maps.MapOptions = {
    center: {lat: 14.628434, lng: -90.522713},
    zoom: 14,
    disableDefaultUI: true
  }

  // Lista de lugares buscados
  locations: PlaceSearchResult[] = []
  // Resultados de la búsqueda de direcciones
  directionsResults: google.maps.DirectionsResult[] = []
  // Posibles rutas a ser seleccionadas
  routeOptions: RouteOptions[] = []

  routes: Route[] = []

  constructor(
    private directionsService: MapDirectionsService,
    private routeService: RouteService
  ) {}

  setLocation(event: PlaceSearchResult | undefined) {
    const newLocation = event

    if (newLocation) {
      this.locations?.push(newLocation)
      this.goToLocation(newLocation?.location)
    }
  }

  goToLocation(location: google.maps.LatLng | undefined) {
    if (location) {
      this.map.panTo(location)
    }
  }

  requestRoute() {
    const places = this.locations.slice(1, this.locations.length)
    const waypointsCombination = this.generatePermutations(places.map(place => {
      return { location: place.location, stopover: true }
    }))

    for (let j = 0; j < waypointsCombination.length; j++) {
      for (let i = 0; i < waypointsCombination[j].length; i++) {
        const waypointName1 = this.getWaypointPlaceName(waypointsCombination[j][i])
        const locationName = this.locations[0].name

        if (i === 0) {
          const temp = this.routes.map(route => route.name).filter(name => name === `${locationName}->${waypointName1}`)

          if (temp.length === 0) {
            this.getDirections(<google.maps.LatLng> this.locations[0]?.location,
              <google.maps.LatLng> waypointsCombination[j][i].location, locationName, waypointName1)
          }
        } else {
          const waypointName = this.getWaypointPlaceName(waypointsCombination[j][i - 1])
          const temp = this.routes.map(route => route.name).filter(name => name === `${waypointName}-${waypointName1}`)

          if (temp.length === 0) {
            this.getDirections(<google.maps.LatLng> waypointsCombination[j][i - 1].location,
              <google.maps.LatLng> waypointsCombination[j][i].location, waypointName,
              this.getWaypointPlaceName(waypointsCombination[j][i]))
          }
        }
      }
    }

    this.routeService.optimizeRoutes(this.routes, <string> this.locations[0].name).subscribe(res => {
      console.log(res)
    })

    // waypointsCombination.forEach(combination => {
    //   if (this.locations[0]?.location) {
    //     this.getDirections(
    //       this.locations[0]?.location,
    //       <google.maps.LatLng> combination.slice(-1, combination.length)[0].location,
    //       combination.slice(0, -1)
    //     )
    //   }
    // })
  }

  getWaypointPlaceName(waypoint: google.maps.DirectionsWaypoint): string | undefined {
    const place = this.locations.filter(location => location.location === waypoint.location)
    return place[0].name
  }

  generatePermutations(list: google.maps.DirectionsWaypoint[],
                       size=list.length): google.maps.DirectionsWaypoint[][] {
    if (size > list.length) return [];
    else if (size == 1) return list.map(d=>[d]);
    return list.flatMap(
      d =>
        this.generatePermutations(list.filter(a => a !== d), size - 1)
          .map(item => [d, ...item])
    );
  }

  getDirections(from: google.maps.LatLng, to: google.maps.LatLng, from_name: string | undefined, to_name: string | undefined,
                wayPoints: google.maps.DirectionsWaypoint[] = []) {
    const request: google.maps.DirectionsRequest = {
      origin: from,
      destination: to,
      region: 'gt',
      travelMode: TravelMode.DRIVING,
      unitSystem: google.maps.UnitSystem.METRIC,
      provideRouteAlternatives: true,
      waypoints: wayPoints
    }
    let route: Route = {
      name: `${from_name}-${to_name}`,
      possibleEdges: []
    }

    this.directionsService.route(request).pipe(
      map(res => res.result?.routes)
    ).subscribe(routes => {
      if (routes) {
        this.routeOptions.push({name: `${from_name}-${to_name}`, options: routes})

        routes.forEach((rt, index) => {
          let edge = [`${from_name}-${to_name}-${index}`, rt.legs[0].distance?.value, rt.legs[0].duration?.value, rt.legs[0].steps.length]

          route.possibleEdges.push(edge)

          const polyline: google.maps.Polyline = new google.maps.Polyline({
            path: rt.overview_path,
            map: this.map.googleMap,
            visible: true,
            strokeColor: `#${this.getRandomColor()}`,
            strokeWeight: 3
          })
        })
      }
    })

    this.routes.push(route)

  }

  getRandomColor(): string {
    return Math.floor(Math.random() * 16777125).toString(16)
  }

  openInfoWindow(marker: MapMarker) {
    this.infoWindow.options = { content: marker.getTitle() }
    this.infoWindow.open(marker)
  }

  closeInfoWindow() {
    this.infoWindow.close()
  }
}
