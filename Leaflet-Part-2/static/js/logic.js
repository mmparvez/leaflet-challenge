// Store our API endpoint
let queryUrl = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson';
let plateUrl = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_plates.json";

// Create Layer Groups for the Earthquakes and Tectonic Plates.
let earthquakesLayer  = L.layerGroup();
let tectonicplatesLayer = L.layerGroup();

// Perform a GET request to the plate URL.
d3.json(plateUrl).then(function (plateData) {
  console.log(plateData);
  // Give each feature a popup that describes the place and time of the earthquake.
  function onEachFeature(feature, layer) {
    layer.bindPopup(`<h3>${feature.properties.Code}</h3><hr><p>${feature.properties.PlateName} Plate</p>`,
    {autoPan: true});
  }
  // Add geojson layer to layer groups
  tectonicplatesLayer = L.geoJSON(plateData, {
    onEachFeature: onEachFeature,
    style: {
      color: "orange",
      weight: 2,
      fillOpacity: 0
    }
  });
  // Call earthquakes call function
  earthQuakesCall(queryUrl,tectonicplatesLayer);
});

// Create a function to perform a GET request to the earthquake URL.
function earthQuakesCall(queryUrl,tectonicplatesLayer) { 
// Perform a GET request to the query URL/
  d3.json(queryUrl).then(function (data) {
    //console.log(data);
    // Once we get a response, send the data.features object to the createFeatures function.
    let quakesData = data.features;
    createFeatures(quakesData,tectonicplatesLayer);
  });
}

// Function to create the features.
function createFeatures(earthquakeData, tectonicplatesLayer) {

  // Define a function that we want to run once for each feature in the features array.
  // Give each feature a popup that describes the place and time of the earthquake.
  function onEachFeature(feature, layer) {
    layer.bindTooltip(`<h3>${feature.properties.place}</h3><hr><p>Magnitude: ${feature.properties.mag}</p><p>Depth: ${feature.geometry.coordinates[2]}</p>`,
      {sticky: true},{interactive: true},{autoPan: true});
  }

  // Create a GeoJSON layer that contains the features array on the earthquakeData object.
  // Run the onEachFeature function once for each piece of data in the array.
  earthquakesLayer = L.geoJSON(earthquakeData, {
    onEachFeature: onEachFeature,
    pointToLayer: function (feature, latlng) {
      return L.circleMarker(latlng, {
        radius: markerSize(feature.properties.mag),
        fillColor: markerColor(feature.geometry.coordinates[2]),
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
      });
    }
  });


  // Send our layergroups to the createMap function/
  createMap(earthquakesLayer, tectonicplatesLayer);
}

// Create Function to determine the marker size based on the magnitude.
function markerSize(magnitude) {
  return magnitude * 2;
}

// Create Function to determine the marker color based on the earthquake depth.
function markerColor(depth) {
  if (depth >= 90) {
    return "#000000";
  }
  else if (depth >= 70) {
    return "#472048";
  }
  else if (depth >= 50) {
    return "#870014";
  }
  else if (depth >= 30) {
    return "#F00024";
  }
  else if (depth >= 10) {
    return "#FFC80D";
  }
  else if (depth < 10) {
    return "#f9f136";
  }
}

// Function to create the map.
function createMap(earthquakesLayer, tectonicplatesLayer) {

  // Create the base layer.
  let street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  })
  // Create the tographical layer.
  let topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
  });

  // Create a baseMaps object.
  let baseMaps = {
    "Street Map": street,
    "Topographic Map": topo
  };

  // Create an overlay object to hold our overlay.
  let overlayMaps = {
    "Earthquakes": earthquakesLayer,
    "Tactonic Plates": tectonicplatesLayer
  };

  // Create our map, giving it the streetmap and earthquakes layers to display on load.
  let myMap = L.map("map", {
    center: [
      27.09, 10.71
    ],
    zoom: 2,
    layers: [street, earthquakesLayer]
  });

  // Create a layer control.
  // Pass it our baseMaps and overlayMaps.
  // Add the layer control to the map.
  L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
  }).addTo(myMap);

 // Set up the legend.
 let legend = L.control({ position: "bottomright",
                          collapsed: true,
                          labels: "Depth",
                          color: "#000000",
                          type: "rectangle",
                          opacity: 0.8 });
 legend.onAdd = function() {
   let div = L.DomUtil.create("div", "info legend");
   let depths = [0, 10, 30, 50, 70, 90];
  
  //Loop through depths to generate a label with a colored square for each depth.
  for (let i = 0; i < depths.length; i++) { 
    div.innerHTML += "<li style='background-color: " + markerColor(depths[i]) + "'></li> " 
      + depths[i] + (depths[i + 1] ? "&ndash;" + depths[i + 1] + "<br>" : "+");
   }

   return div;
 };

 // Adding the legend to the map
  legend.addTo(myMap);
}


