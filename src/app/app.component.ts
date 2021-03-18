import { Component, OnInit } from '@angular/core';
import { take } from 'rxjs/operators';
import { ApiService } from './api.service';
import { AuthorMap, PicResponse } from './types';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.css' ]
})
export class AppComponent implements OnInit  {
  // authorString is bound to the select element, authors is looped through to provide its options, and authorMap is for filtering out authors
  // with fewer than 3 pictures
  public authorString: string = "";
  public authors: string[] = [];
  private authorMap: AuthorMap = {};

  // The full array from the API response
  private fullPictureArray: PicResponse[] = [];

  // Boolean to track whether or not the modal is active
  public modalActive: boolean = false;

  constructor(private _api: ApiService) {}

  ngOnInit(): void {
    // Our singular API call, gets all 
    this._api.getPictures().pipe(
      take(1)
    ).subscribe(
      fullPictureResult => {
        this.fullPictureArray = fullPictureResult;

        // Default to "Alejandro Escamilla"
        this.prepareDisplayPictureArray(this.fullPictureArray, "Alejandro Escamilla");
        this.authorString = "Alejandro Escamilla";

        // Filter out authors with fewer than 3 pictures then sorts them from most pictures to fewest
        this.fullPictureArray.forEach(
          picture => {
            if (!this.authorMap.hasOwnProperty(picture.author)) {
              this.authorMap[picture.author] = 1;
            } else {
              this.authorMap[picture.author]++;
            }
          }
        );
        Object.keys(this.authorMap).forEach(key => {
          if (this.authorMap[key] > 2) {
            this.authors.push(key);
          }
        })
        this.authors.sort((a,b) => this.authorMap[b] - this.authorMap[a]);
      },
      error => {
        console.error(error)
      }
    );

    // Subscribes to the modal observable
    this._api.modalObs$.subscribe(x => this.modalActive = x)
  }

  // Filters the fullPictureArray down to pictures from one author and sends it through the picture observable. Called on init and on author
  // select element change
  public prepareDisplayPictureArray(array: PicResponse[] = this.fullPictureArray, author: string = this.authorString): void {
    let displayPictureArray = array.filter(x=> x.author === author);
    displayPictureArray.map(x=> {
      if ((x.width > 2800 || x.height > 2000) && !x.mapped) {
        x.width = Math.floor(x.width/2);
        x.height = Math.floor(x.height/2);
        x.mapped = true;
      }
    });
    this._api.pictureObs$.next(displayPictureArray);
  }
}
