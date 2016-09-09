/*************************************************************************************
    radar-map.js
    
    DESCRIPTION
    An example of adding weather radar as an overlay to Google Maps. This adapts
    an example on Google's map API support page, adding instead two layers of
    radar images, then changing the images on demand to create an animation.
    
    AUTHOR      Chad M. Calsyn
    CREATED     9/7/2016
    UPDATED     9/7/2016
    VERSION     1.0
    
*************************************************************************************/

var numImages = 6;      /* Number of images to display in the loop */
var radarLooping = 0;   /* Set to 1 to animate on load, or 0 for still image */

var radarLooper;        /* Javascript loop counter variable */
        
var overlay;
RadarOverlay.prototype = new google.maps.OverlayView();

/* Assemble the radar images to use */

var imgURLBase = "http://radar.weather.gov/ridge/Conus/RadarImg/Conus_";
var imgSuffix = "_N0Ronly.gif";

/* Start with ten minutes ago to ensure the radar image has been created */
var dateTest = new Date();
dateTest.setMinutes(dateTest.getMinutes() - 10);

var theYear = dateTest.getFullYear();
var theMonth = dateTest.getUTCMonth() + 1;
var theDate = dateTest.getUTCDate();
var theHours = dateTest.getUTCHours();
var theMinutes = dateTest.getUTCMinutes();

/* Add leading zeroes where necessary */
if(theDate < 10) theDate = "0" + theDate;
if(theMonth < 10) theMonth = "0" + theMonth;
if(theHours < 10 && theHours > 0) theHours = "0" + theHours;
if(theHours == 0) theHours = "00";
if(theMinutes < 10) theMinutes = "0" + theMinutes;

var imgDate = String(theYear) + String(theMonth) + String(theDate);
var imgTime = String(theHours) + String(theMinutes);

/* Radar image times are always at 08, 18, 28, etc. */
imgTime = imgTime.substr(0, 3) + "8";        

var imgLinks = new Array();
var imgTimeStamp = new Array();
var currImage = 0;

for(i = numImages - 1; i >= 0; i--) {
    
    imgLinks[i] = imgURLBase + imgDate + "_" + imgTime + imgSuffix;

    var UTCConvert = new Date();
    UTCConvert.setUTCHours(String(imgTime).substr(0,2));
    var ampm = "AM";
    var hours = UTCConvert.getHours();
    if(hours >= 12) ampm = "PM";
    if(hours > 12) hours -= 12;
    if(hours == 0) hours == 12;

    imgTimeStamp[i] = theMonth + "/" + theDate + "/" + theYear + " " + imgTime + " UTC (" + hours + ":" + String(imgTime).substr(2,2) + " " + ampm + ")";

    dateTest.setMinutes(dateTest.getMinutes() - 10);

    theYear = dateTest.getFullYear();
    theMonth = dateTest.getUTCMonth() + 1;
    theDate = dateTest.getUTCDate();
    theHours = dateTest.getUTCHours();
    theMinutes = dateTest.getUTCMinutes();

    if(theDate < 10) theDate = "0" + theDate;
    if(theMonth < 10) theMonth = "0" + theMonth;
    if(theHours < 10 && theHours > 0) theHours = "0" + theHours;
    if(theHours == 0) theHours = "00";
    if(theMinutes < 10) theMinutes = "0" + theMinutes;            

    imgDate = String(theYear) + String(theMonth) + String(theDate);
    imgTime = String(theHours) + String(theMinutes);            
    imgTime = imgTime.substr(0, 3) + "8";        

}        

/************************************************************** 
   function: initMap
   Creates the map and the overlays
   Parameters: none
   Return value: none
**************************************************************/
function initMap() {
    var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 6,
        center: {lat: 40.5122, lng: -92.9886},
        mapTypeId: 'roadmap'
    });

    /* Two overlays are needed as the radar map doesn't quite lineup
       everywhere in the US. This uses a northern half and a southern
       half, stretching them accordingly to fit */
    var bounds = new google.maps.LatLngBounds(
    new google.maps.LatLng(21.197452, -127.658106),
    new google.maps.LatLng(37.748048, -66.541828));

    var bounds2 = new google.maps.LatLngBounds(
    new google.maps.LatLng(37.748048, -127.658106),
    new google.maps.LatLng(50.146856, -66.541828));

    /* Load the current image into the map */
    var srcImage = 'http://radar.weather.gov/ridge/Conus/RadarImg/latest_radaronly.gif';

    overlay = new RadarOverlay(bounds, srcImage, map, 'south');
    overlay = new RadarOverlay(bounds2, srcImage, map, 'north');
}

/************************************************************** 
   function: RadarOverlay
   Initialize the overlay and assign it to the map
   Parameters: bounds - coordinates for the overlay
               image - the URL for the image
               map - the map ID to assign the overlay
               pos - either 'north' or 'south' to id the layer
   Return value: none
**************************************************************/
function RadarOverlay(bounds, image, map, pos) {

    this.bounds_ = bounds;
    this.image_ = image;
    this.map_ = map;
    this.pos_ = pos;

    this.div_ = null;

    this.setMap(map);
    
}

/* Constructor */
RadarOverlay.prototype.onAdd = function() {

    var div = document.createElement('div');
    div.style.borderStyle = 'none';
    div.style.borderWidth = '0px';
    div.style.position = 'absolute';
    div.style.opacity = 0.6;
    div.style.overflow = 'hidden';

    var img = document.createElement('img');
    img.src = this.image_;
    img.style.width = '100%';
    if(this.pos_ == 'south') {
        img.style.height = '178%';
        img.style.bottom = '0';
        img.id = "radar-image-south";
    }
    else {
        img.style.height = '228%';
        img.style.top = '0';
        img.id = "radar-image-north";
    }
    img.style.position = 'absolute';
    div.appendChild(img);

    this.div_ = div;

    var panes = this.getPanes();
    panes.overlayLayer.appendChild(div);
    
};

/* Re-position the overlay on moving the map */
RadarOverlay.prototype.draw = function() {

    var overlayProjection = this.getProjection();

    var sw = overlayProjection.fromLatLngToDivPixel(this.bounds_.getSouthWest());
    var ne = overlayProjection.fromLatLngToDivPixel(this.bounds_.getNorthEast());

    var div = this.div_;
    div.style.left = sw.x + 'px';
    div.style.top = ne.y + 'px';
    div.style.width = (ne.x - sw.x) + 'px';
    div.style.height = (sw.y - ne.y) + 'px';
    
};

/* Destructor */
RadarOverlay.prototype.onRemove = function() {
    this.div_.parentNode.removeChild(this.div_);
    this.div_ = null;
};

/* Add listening event for the map to be created */
google.maps.event.addDomListener(window, 'load', initMap);

/************************************************************** 
   function: startStopRadar
   Start or stop the radar animation based on the
   global variable "radarLooping"
   Parameters: none
   Return value: none
**************************************************************/
function startStopRadar() {
    
    $("#radar-inner button").removeClass();
    if(radarLooping == 0) {
        radarLooper = setInterval(changeImage, 500);
        radarLooping = 1;
        $("#radar-inner button").addClass("pause");
    }
    else {
        clearInterval(radarLooper);
        radarLooping = 0;
        $("#radar-inner button").addClass("play");
    }
    
}

/************************************************************** 
   function: changeImage
   Chooses the next image to display on animation
   Parameters: none
   Return value: none
**************************************************************/
function changeImage() {
    
    currImage++;
    if(currImage >= numImages) currImage -= numImages;
    $("#radar-image-north").attr("src", imgLinks[currImage]);
    $("#radar-image-south").attr("src", imgLinks[currImage]);
    $("#time-stamp").html(imgTimeStamp[currImage]);
    
}      