import { ThisReceiver } from '@angular/compiler';
import { Component, NgZone, OnInit, ViewChild } from '@angular/core';
import { Environment, GoogleMap, GoogleMaps, GoogleMapOptions, GoogleMapsEvent, MyLocation, GoogleMapsAnimation, Marker, Geocoder, ILatLng } from '@ionic-native/google-maps';
import { LoadingController, Platform } from '@ionic/angular';

declare var google: any;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  //Comando abaixo 'static:true' adicionado pelo professor Rodrigo para poder renderizar o mapa
  @ViewChild('map', { static: true }) mapElement: any;
  private loading: any;
  private map: GoogleMap;
  public search: string = '';
  private googleAutocomplete = new google.maps.places.AutocompleteService();
  public searchResults = new Array<any>();
  private originMarker: Marker;
  public destination: any;
  private googleDirectionsService = new google.maps.DirectionsService();

  constructor(
    private platform: Platform,
    private loadingCtrl: LoadingController,
    private ngZone: NgZone
  ) { /*console.log(google); */ }

  ngOnInit() {
    this.mapElement = this.mapElement.nativeElement;

    this.mapElement.style.width = this.platform.width() + 'px';
    this.mapElement.style.height = this.platform.height() + 'px';

    this.loadMap();
  }

  async loadMap() {
    this.loading = await this.loadingCtrl.create({ message: 'Por favor, aguarde...' });
    await this.loading.present();

    Environment.setEnv({
      'API_KEY_FOR_BROWSER_RELEASE': 'AIzaSyAAogVAZBAiK6dS3oSp9wgeuoH6M-ffxZg',
      'API_KEY_FOR_BROWSER_DEBUG': 'AIzaSyAAogVAZBAiK6dS3oSp9wgeuoH6M-ffxZg'
    });

    const mapOptions: GoogleMapOptions = {
      controls: {
        zoom: false
      }
    };

    this.map = GoogleMaps.create(this.mapElement, mapOptions);

    try {
      await this.map.one(GoogleMapsEvent.MAP_READY);

      this.addOriginMarker();
    } catch (error) {
      console.log(error);
    }
  }

  async addOriginMarker() {
    try {
      const myLocation: MyLocation = await this.map.getMyLocation();

      await this.map.moveCamera({
        target: myLocation.latLng,
        zoom: 18
      });

      this.originMarker = this.map.addMarkerSync({
        title: 'Origem',
        icon: '#000',
        animation: GoogleMapsAnimation.DROP,
        position: myLocation.latLng
      })

      console.log(myLocation);
    } catch (error) {
      console.error(error);
    } finally {
      this.loading.dismiss();
    }
  }

  searchChanged() {
    if (!this.search.trim().length) return;

    this.googleAutocomplete.getPlacePredictions({ input: this.search }, predictions => {
      this.ngZone.run(() => {
        this.searchResults = predictions;
      })
    });
  }

  async calcRoute(item: any) {
    this.search = '';
    this.destination = item;

    const info: any = await Geocoder.geocode({ address: this.destination.description })

    let markerDestination: Marker = this.map.addMarkerSync({
      title: this.destination.description,
      icon: '#000',
      animation: GoogleMapsAnimation.DROP,
      position: info[0].position
    });

    this.googleDirectionsService.route({
      origin: this.originMarker.getPosition(),
      destination: markerDestination.getPosition(),
      travelMode: 'DRIVING'
    }, async results => {
      console.log(results);
      const points = new Array<ILatLng>();

      const routes = results.routes[0].overview_path;

      for (let i = 0; i < routes.length; i++) {
        points[i] = {
          lat: routes[i].lat(),
          lng: routes[i].lng()
        }
      }

      await this.map.addPolyline({
        points: points,
        color: '#000',
        width: 3
      });

      await this.map.moveCamera({ target: points });
      this.map.panBy(0, 100);
    });
  }

  async back() {
    try {
      await this.map.clear();
      this.destination = null;
      this.addOriginMarker();
    } catch (error) {
      console.log(error);
    }
  }
}
  


