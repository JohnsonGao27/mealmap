# MealMap

MealMap is a React progressive web app for keeping personal restaurant records. It records visits, ratings, spend in GBP, recommended dishes, reviews, photographs and locations.

Records can be added, viewed, edited and deleted. IndexedDB keeps records and photos on the device. The Camera and Geolocation browser APIs let users capture a photo and attach their current position. Saved locations can be viewed on an OpenStreetMap map.

## Run locally

Install Node.js 22.12 or newer. In this folder, run:

```sh
npm ci
npm run dev
```

Open the local URL printed in the terminal. Allow camera and location access when prompted. These permissions require localhost or HTTPS.

## Production preview

```sh
npm run build
npm run preview
```

Open the preview once while online to cache the app. Records can then be managed offline. The map tiles require internet access.

## Technology

React, Vite, IndexedDB, the Camera and Geolocation APIs, a service worker and OpenStreetMap.

## Demonstration

1. Select **New record**. Enter a restaurant and spend per person, then add a photo with **Open camera**.
2. Select **Use current location** and save. Open **Map** to see the saved location.
3. Reload the page and open **Records**. Check that the saved photo is still present, then edit and delete the record.
