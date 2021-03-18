import { Component, Directive, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { animate, AnimationBuilder, AnimationPlayer, style } from '@angular/animations';
import { ApiService } from '../api.service';
import { PicResponse } from '../types';
import { filter } from 'rxjs/operators';

@Directive({
  selector: '.carousel-item'
})
export class CarouselItemElement {
}

@Component({
  selector: 'app-carousel',
  exportAs: 'carousel',
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.css']
})
export class CarouselComponent implements OnInit {
  // Our carousel (this specifically selects the ul element)
  @ViewChild('carousel') private carousel: ElementRef;

  // Listeners/method for keydown left and right and debounce booleans
  @HostListener('window:keydown.arrowleft', ['$event'])
  @HostListener('window:keydown.arrowright', ['$event'])
  keyEvent(event: KeyboardEvent) {
    if (event.key == "ArrowRight") {
      console.log("ArrowRight")
      this.arrowRight()
    } else if (event.key == "ArrowLeft") {
      console.log("ArrowLeft")
      this.arrowLeft()
    }
  }

  private debounceLeft = true;
  private debounceRight = true;  

  // Array of pictures to display and our current picture index in it
  public displayPictureArray: PicResponse[] = [];
  public displayIndex = 0;

  // player is used to execute our animations. animationQueue holds booleans that tell us if we should animating right or left.
  // animating is used to prevent extra recursive animation calls.
  // width, timeNumber, and time are constants that may change in the future.
  private player : AnimationPlayer;
  private animationQueue: boolean[] = [];
  private animating: boolean = false;
  private width: number = 1000;
  private timeNumber: number = 175;
  private time: string = this.timeNumber.toString() + 'ms ease-in';


  // Variables used to determine when to display the spinner
  public loading: boolean = true;
  public loadingCount: number = 0;
  // ^^
  public modalActive: boolean = false;
  public modalArr: boolean[];


  constructor(
    private builder: AnimationBuilder,
    private _api: ApiService
  ) {}

  ngOnInit(): void {
    // Subscribes to our pictures observable. 
    this._api.pictureObs$.pipe(
      filter(x => !!x)
    ).subscribe(x => {
      // Reset loading, loadingCount, animation position (to loading spinner), display index, and modalArr. Store our displayPictureArray
      this.loading = true;
      this.loadingCount = 0;
      this.animate("0ms", 0);
      this.displayIndex = 0;
      this.displayPictureArray = x;
      this.modalArr = new Array(this.displayPictureArray.length).fill({loaded:false, color:{r:128,g:128,b:128}});
    })
  }
  
  // Called when an image finishes loading. Once all are loaded, turn this.loading to off and animate to displayIndex
  public imageLoad(): void {
    this.loadingCount++
    this.loading = (this.loadingCount !== this.displayPictureArray.length)
    if (!this.loading) this.animate("0ms");
  }

  // Main gallery next button
  public next(): void {
    if (this.animationQueue.length < 5) this.animationQueue.push(true);
    if (!this.animating) this.animationManager();
  }

  // Main gallery previous button
  public previous(): void {
    if (this.animationQueue.length < 5) this.animationQueue.push(false);
    if (!this.animating) this.animationManager();
  }

  

  // Navigate right on a right arrow key press
  public arrowRight(): void {
    if (this.modalActive) {
      this.modalNext();
    } else {
      if (this.debounceRight) {
        this.next();
        this.debounceRight = false;
        setTimeout(this.arrowRightCallback.bind(this), this.timeNumber);
      }
    }
  }

  public arrowRightCallback() {
    this.debounceRight = true;
  }

  // Navigate left on a left arrow key press
  public arrowLeft(): void {
    if (this.modalActive) {
      this.modalPrevious();
    } else {
      if (this.debounceLeft) {
        this.previous();
        this.debounceLeft = false;
        setTimeout(this.arrowLeftCallback.bind(this), this.timeNumber);
      }
    }
  }

  public arrowLeftCallback() {
    this.debounceLeft = true;
  }

  // animation function. animates a distance specified by this.width in a time specified by this.time
  private animate(time: string = this.time, width: number = (this.displayIndex + 1) * this.width) {
    this.player = this.builder.build([animate(time, style({transform: "translateX(-" + (width.toString()) + "px)"}))]).create(this.carousel.nativeElement);
    this.player.play();
  }

  // Recursive function that removes direction booleans (true:right, false:left) and animates based on their direction until nothing is left
  // in the queue 
  private animationManager() {
    this.animating = true;
    if (this.animationQueue.length > 0) {
      let direction = this.animationQueue.shift();
      if (direction) {
        // Animating to the right codeblock
        if (this.displayIndex !== this.displayPictureArray.length -1) {
          this.displayIndex++;
          this.animate();
        } else {
          this.animate(this.time, (this.displayIndex + 2) * this.width);
          this.displayIndex = 0;
          setTimeout(this.animate.bind(this), this.timeNumber, "0ms");
        }
      } else {
        // Animating to the left codeblock
        if (this.displayIndex !== 0) {
          this.displayIndex--;
          this.animate()
        }else {
          this.animate(this.time, this.displayIndex * this.width);
          this.displayIndex = this.displayPictureArray.length -1;
          setTimeout(this.animate.bind(this), this.timeNumber, "0ms");
        }
      }
      // Recursive function call once the animation we just started has finished
      setTimeout(this.animationManager.bind(this), this.timeNumber)
    } else {
      this.animating = false;
    }
  }

  // Toggles modal
  public toggleModal() {
    if (this.displayPictureArray.length > 0) {
      this.modalActive = !this.modalActive;
      this._api.modalObs$.next(this.modalActive);
    }
  }

  // Called when a modal image loads
  public modalImageLoad(index: number) {
    this.modalArr[index] = true;
  }

  // Next button for the modal. maintains main carousel position
  public modalNext() {
    if (this.displayIndex !== this.displayPictureArray.length -1) {
      this.displayIndex++;
    } else {
      this.displayIndex = 0;
    }
    this.animate("0ms");
  }

  // Previous button for the modal. maintains main carousel position
  public modalPrevious() {
    if (this.displayIndex !== 0) {
      this.displayIndex--;
    } else {
      this.displayIndex = this.displayPictureArray.length -1;
    }
    this.animate("0ms");
  }
}
