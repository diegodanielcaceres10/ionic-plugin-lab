import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PluginsCatalogService } from './core/plugins-catalog/plugins-catalog.service';

function initializeCatalog(catalog: PluginsCatalogService) {
  return () => catalog.seedIfEmpty();
}

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeCatalog,
      deps: [PluginsCatalogService],
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
