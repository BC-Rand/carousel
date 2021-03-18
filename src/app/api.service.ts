import { Injectable } from '@angular/core';
import { HttpClient, HttpRequest } from '@angular/common/http';
import { PicResponse } from './types';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // Observable to pass filtered sets of pictures
  public pictureObs$: BehaviorSubject<PicResponse[]> = new BehaviorSubject<PicResponse[]>(null);

  // Observable to signal when the modal is active/inactive
  public modalObs$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  
  constructor(private http: HttpClient) { }

  // API call to picsum for full list of pictures
  getPictures(): Observable<PicResponse[]> {
    return this.http.get<PicResponse[]>("https://picsum.photos/list").pipe(
      map(result => {
        // This boolean should be set to true once the image has gone through the height/width size reduction to prevent further shrinkage
        result.forEach(picture => picture.mapped = false);
        return result;
      })
    )
  }
}
