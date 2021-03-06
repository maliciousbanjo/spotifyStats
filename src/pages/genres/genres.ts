import { Component } from '@angular/core';
import { LoadingController, NavController, NavParams, PopoverController, ActionSheetController } from 'ionic-angular';
import { RestProvider } from '../../providers/rest/rest';
import { PopoverPage } from '../popover/popover';

@Component({
  selector: 'page-genres',
  templateUrl: 'genres.html',
})
export class GenresPage {
  timeLoaded: string;
  topGenres: [string, number][];
  genreWidth = new Array(10);

  constructor(public navCtrl: NavController, public navParams: NavParams, public restProvider: RestProvider,
    public loadingCtrl: LoadingController, public popoverCtrl: PopoverController, public actionCtrl: ActionSheetController) {

  }

  ionViewWillEnter() {
    if (this.timeLoaded !== this.restProvider.timeLabel) {
      // Time range was changed on a different page; load accordingly
      this.getGenres();
    }
  }

  /**
   * Display the Popover page to "About" and "Logout"
   * @param myEvent Event object
   */
  presentPopover(myEvent) {
    let popover = this.popoverCtrl.create(PopoverPage);
    popover.present({
      ev: myEvent
    });
  }

  /**
   * Select the time range to be used
   */
  timeSelect() {
    let action = this.actionCtrl.create({
      title: 'Select a Timespan',
      cssClass: 'time-action-sheet',
      buttons: [
        {
          text: 'Past Month',
          role: 'month',
          handler: () => {
            this.restProvider.timeLabel = "Past Month";
            this.getGenres();
          }
        },
        {
          text: 'Past 6 Months',
          role: '6month',
          handler: () => {
            this.restProvider.timeLabel = "Past 6 Months";
            this.getGenres();
          }
        },
        {
          text: 'All Time',
          role: 'alltime',
          handler: () => {
            this.restProvider.timeLabel = "All Time";
            this.getGenres();
          }
        }
      ]
    })
    action.present();
  }

  /**
   * Get the top 50 tracks in a specified time range. Renews token if necessary.
   */
  getTopTracks(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.restProvider.tokenExpired()) {
        this.restProvider.requestNewToken()
        .then(() => {
          return this.restProvider.getTopTracks();
        }, (error) => {
          console.log('ERROR in genres.getTopTracks: ' + error.message);
          reject(error);
        })
        .then((data: any) => {
          resolve(data.items);
        }, (error) => {
          console.log('ERROR in genres.getTopTracks: ' + error.message);
          reject(error);
        });
      }
      else {
        this.restProvider.getTopTracks()
        .then((data: any) => {
          resolve(data.items);
        }, (error) => {
          console.log('ERROR in genres.getTopTracks: ' + error.message);
          reject(error);
        });
      }
    });
  }

  /**
   * Get a specified Artist
   * @param id Artist ID
   */
  getArtist(id) {
    // "3j4ihH7xANVDGQhcDFJby7" Landon Tewers ID
    return new Promise((resolve, reject) => {
      if (this.restProvider.tokenExpired()) {
        this.restProvider.requestNewToken()
        .then(() => {
          return this.restProvider.getArtist(id);
        }, (error) => {
          console.log('ERROR in genres.getArtist: ' + error.message);
          reject(error);
        })
        .then((data: any) => {
          resolve(data);
        }, (error) => {
          console.log('ERROR in genres.getArtist: ' + error.message);
          reject(error);
        });
      }
      else {
        this.restProvider.getArtist(id)
        .then((data: any) => {
          resolve(data);
        }, (error) => {
          console.log('ERROR in genres.getArtist: ' + error.message);
          reject(error);
        });
      }
    })
  }

  /**
   * Determine the top genres based on the Top 50 Track data
   */
  getGenres() {
    // Get tracks first
    let tracks: any;
    let genreMap: Map<string, number> = new Map<string, number>();
    let loading = this.loadingCtrl.create({
      content: 'Loading Genres...'
    });
    loading.present()
    .then(() => {
      return this.getTopTracks();
    })
    .then((results) => {
      tracks = results;
    }, (error) => {
      console.log('ERROR in genres.getGenres: ' + error.message);
      loading.dismiss();
    })
    .then(() => {
      //  Need to make an array of promises
      let promiseArray = [];
      for (let track of tracks) {
        let promise = this.getArtist(track.artists[0].id);
        promiseArray.push(promise);
      }
      return Promise.all(promiseArray); // Returns array of full Artist objects
    })
    .then((artists: any) => { // artists == array of Artists
      for (let artist of artists) {
        for (let genre of artist.genres) {
          if(genreMap.get(genre) == null) {
            // New genre
            genreMap.set(genre, 1);
          }
          else {
            // Genre already mapped, increment it
            let value = genreMap.get(genre); // Get original value
            genreMap.set(genre, value+1); // Increment
          }
        }
      }
      // Sort the map into an array, highest to lowest
      let mapArray = Array.from(genreMap).sort((a, b) => {
        return b["1"] - a["1"];
      });
      this.topGenres = mapArray.slice(0, 10); // Top 10 genres
      for (var i = 0; i < this.genreWidth.length; i++) {
        this.genreWidth[i] = (this.topGenres[i]["1"] * 2).toString() + '%';
      }
      this.timeLoaded = this.restProvider.timeLabel;
      loading.dismiss();
    }, (error) => {
      console.log('ERROR in genres.getGenres: ' + error.message);
      loading.dismiss();
    });
  }
}