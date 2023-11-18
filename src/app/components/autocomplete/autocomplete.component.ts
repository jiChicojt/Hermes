import {AfterViewInit, Component, ElementRef, EventEmitter, NgZone, OnInit, Output, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {PlaceSearchResult} from "../../models/place.search.result";

@Component({
  selector: 'app-autocomplete',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './autocomplete.component.html',
  styleUrl: './autocomplete.component.scss'
})
export class AutocompleteComponent implements AfterViewInit, OnInit{
  @ViewChild('inputField') inputField!: ElementRef

  autocomplete: google.maps.places.Autocomplete | undefined

  @Output() placeChanged = new EventEmitter<PlaceSearchResult>()

  constructor(private ngZone: NgZone) {
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.autocomplete = new google.maps.places.Autocomplete(this.inputField.nativeElement, {
      componentRestrictions: { country: 'gt' },
      strictBounds: false
    })
    this.autocomplete.addListener('place_changed', () => {
      const place = this.autocomplete?.getPlace()

      const result: PlaceSearchResult = {
        name: place?.name, location: place?.geometry?.location
      }

      this.ngZone.run(() => {
        this.placeChanged.emit(result)
      })
    })
  }
}
