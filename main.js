/* global Png */
/* global base64ArrayBuffer */
/* VS code shitty comments so it's not giving me crap alerts */
/* global readGif */
/* global angular */
var app = angular.module('inspector', ["ngCookies"]);

app.controller('inspectorController',
function($scope, $http, $cookies) {
  $scope.results = [];
  
  $scope.zoomLevels = [0.5, 1, 2, 3, 4, 6, 8, 10, 12, 16];
  
  //{ Zoom
    
  $scope.zoomIn = function (item) {
    item.scaleIndex++;
    if (item.scaleIndex == $scope.zoomLevels.length) {
      item.scaleIndex--;
      return;
    }
    item.scale = $scope.zoomLevels[item.scaleIndex];
    updateCanvasProperties(item);
  };
  
  $scope.zoomOut = function (item) {
    if (item.scaleIndex > 0) {
      item.scaleIndex--;
      item.scale = $scope.zoomLevels[item.scaleIndex];
      updateCanvasProperties(item);
    }
  };
  
  function updateCanvasProperties(me) {
    me.canvas.width = me.width * me.scale;
    me.canvas.height = me.height * me.scale;
    me.canvas.style.width = me.canvas.width + "px";
    me.canvas.style.height = me.canvas.height + "px";
    me.context.mozImageSmoothingEnabled = false;
    me.context.webkitImageSmoothingEnabled = false;
    me.context.imageSmoothingEnabled = false;
    me.context.scale(me.scale, me.scale);
    render(me);
  }
  
  //}
  
  //{ Scroll
  
  $scope.startScrolling = function(me, $event)
  {
    me.scrolling = true;
    me.lastScroll = $event;
    if (!me.scrollDiv)
    {
      me.scrollDiv = $event.target;
      while(!me.scrollDiv.classList.contains("previewCanvas")) me.scrollDiv = me.scrollDiv.parentNode;
    }
    document.body.classList.add("no-select");
  };
  
  $scope.stopScrolling = function()
  {
    for (var i = 0; i < $scope.results.length; i++)
    {
      $scope.results[i].scrolling = false;
    }
    document.body.classList.remove("no-select");
  };
  
  $scope.updateScrolling = function($event)
  {
    var results = $scope.results;
    var len = results.length;
    for (var i = 0; i < len; i++)
    {
      var me = results[i];
      if (me.scrolling)
      {
        me.scrollDiv.scrollLeft += me.lastScroll.pageX - $event.pageX;
        me.scrollDiv.scrollTop += me.lastScroll.pageY - $event.pageY;
        me.lastScroll = $event;
        $event.preventDefault();
      }
    }
  };
  
  //}
  
  //{ Animation control
  
  $scope.togglePlayback = function(me)
  {
    if (me.forceFrame === -1)
    {
      me.forceFrame = me.frame;
      me.colors = me.frames[me.forceFrame].colors;
      me.colorsCount = me.frames[me.forceFrame].count;
    }
    else
    {
      me.frame = me.forceFrame;
      me.forceFrame = -1;
      me.colors = me.totalColors;
      me.colorsCount = me.totalColorCount;
    }
  }
  
  $scope.nextFrame = function(me)
  {
    me.forceFrame++;
    if (me.forceFrame === me.frames.length) me.forceFrame = 0;
    requestRerender(me);
  };

  $scope.prevFrame = function(me)
  {
    me.forceFrame--;
    if (me.forceFrame < 0) me.forceFrame = me.frames.length - 1;
    requestRerender(me);
  };

  //}
  
  var rerenderRequested = [];
  function requestRerender(me)
  {
    if (rerenderRequested.indexOf(me) != -1) return;
    rerenderRequested.push(me);
    requestAnimationFrame(function()
    {
      me.colors = me.frames[me.forceFrame].colors;
      me.colorsCount = me.frames[me.forceFrame].count;
      render(me);
      rerenderRequested.splice(rerenderRequested.indexOf(me), 1);
    } );
  }
  
  function render(me) {
    var frame;
    if (me.animated) {
      if (me.forceFrame != -1) frame = me.frames[me.forceFrame];
      else frame = me.frames[me.frame];
    }
    else {
      frame = me.frames[0];
    }
    var data = me.image.data;
    var pixels = frame.pixels;
    var pal = me.totalColors;
    var len = me.width * me.height;
    var j = 0;
    
    var bgColor = $scope.highlighting.backgroundColor | ((((1 - $scope.highlighting.backgroundAlpha) * 0xff) & 0xff) << 24);
    for (var i = 0; i < len; i++) {
      var idx = pixels[i];
      var color = 0;
      if (me.highlightMode)
      {
        if (idx == me.highlightIndex)
        {
          if ($scope.highlighting.showForeground)
          {
            color = 0xff000000 | $scope.highlighting.color;
          }
          else
          {
            color = pal[idx].color;
            if (((color >>> 24) & 0xff) < 64) color = 0xff000000 | $scope.highlighting.color;
          }
        }
        else if ($scope.highlighting.showBackground)
        {
          if ($scope.highlighting.backgroundAlpha == 1) color = 0xff000000 | $scope.highlighting.backgroundColor;
          else
          {
            color = blend(pal[idx].color, bgColor);
            // if (pal[idx].a <= 128)
            // {
            //   color = (($scope.highlighting.backgroundAlpha * 0xff) << 24) | blendColors(pal[idx].color, $scope.highlighting.backgroundColor, 1 - $scope.highlighting.backgroundAlpha);
            // }
            // else
            //   color = (pal[idx].a << 24) | blendColors(pal[idx].color, $scope.highlighting.backgroundColor, 1 - $scope.highlighting.backgroundAlpha);
          }
        }
        else color = pal[idx].color;
      }
      else
      {
        color = pal[idx].color;
      }
      
      data[j++] = (color >> 16) & 0xff;
      data[j++] = (color >> 8) & 0xff;
      data[j++] = color & 0xff;
      data[j++] = (color >> 24) & 0xff;
    }
    me.internalContext.putImageData(me.image, 0, 0);
    me.context.clearRect(0, 0, me.width, me.height);
    me.context.drawImage(me.internalCanvas, 0, 0);
  }
  
  function blend(dst, src)
  {
    // Overlay blending
    // Alpha: aA + aB·(1−aA)
    var aB = ((dst >> 24) & 0xff) / 0xff;
    var aA = ((src >> 24) & 0xff) / 0xff;
    var aR = aA + aB * (1 - aA);
    // Color: (xaA + xaB·(1−aA))/aR
    return (((aR * 0xff) & 0xff) << 24) |
           (blendChannel(((src >> 16) & 0xff) / 0xff, ((dst >> 16) & 0xff) / 0xff, aA, aB, aR) << 16) |
           (blendChannel(((src >> 8 ) & 0xff) / 0xff, ((dst >> 8 ) & 0xff) / 0xff, aA, aB, aR) << 8 ) |
            blendChannel(((src      ) & 0xff) / 0xff, ((dst      ) & 0xff) / 0xff, aA, aB, aR);
  }
  
  function blendChannel(xA, xB, aA, aB, aR)
  {
    return ( ( ((xA*aA) + (xB*aB) * (1 - aA)) / aR ) * 0xff ) & 0xff;
  }
  /*
  function blendColors(a, b, mul)
  {
    return blendChannel(a & 0xff, b & 0xff, mul) |
      (blendChannel((a  >> 8) & 0xff, (b >> 8) & 0xff, mul) << 8) |
      (blendChannel((a >> 16) & 0xff, (b >> 16) & 0xff, mul) << 16);// |
      // (blendChannel((a >> 24) & 0xff, (b >> 24) & 0xff, mul) << 24);
  }
  
  function blendChannel(a, b, mul)
  {
    return (a * mul + b) & 0xff;
  }
*/
  var updateId;
  var lastStamp;
  
  function updateAnimation(stamp)
  {
    if (!lastStamp) lastStamp = stamp;
    var delta = (stamp - lastStamp);
    lastStamp = stamp;
    var len = $scope.results.length;
    for (var i = 0; i < len; i++)
    {
      var me = $scope.results[i];
      if (me.animated)
      {
        if (me.forceFrame != -1) continue;
        me.dt += delta * (me.playbackSpeed / 100);
        var changed = false;
        while (me.dt >= me.frames[me.frame].delay)
        {
          me.dt -= me.frames[me.frame].delay;
          if (me.playbackReverse)
          {
            me.frame--;
            if (me.frame == -1) me.frame = me.frames.length - 1;
          }
          else
          {
            me.frame++;
            if (me.frame == me.frames.length) me.frame = 0;
          }
          changed = true;
        }
        if (changed)
        {
          render(me);
          if (!$scope.$$phase) $scope.$apply();
        }
      }
    }
    updateId = requestAnimationFrame(updateAnimation);
  }

  //{ Selection

  $scope.selectPixels = function (me, color) {
    me.highlightMode = true;
    for (var i = 0; i < me.colors.length; i++)
    {
      if (color == me.colors[i])
      {
        if (color.global) me.highlightIndex = color.global;
        else me.highlightIndex = i;
        render(me);
        return;
      }
    }
    me.highlightMode = false;
  };

  $scope.deselectPixels = function (me, color) {
    me.highlightMode = false;
    render(me);
  };
  
  //}

  //{ Sorting and results
  
  $scope.sortResultBy = function (item, property) {
    if (item.sortProperty == property) {
      item.sortReverse = !item.sortReverse;
      return;
    }
    item.sortProperty = property;
    item.sortReverse = true;
  };
  
  $scope.getPercentage = function(col, me, inverse)
  {
    if (($scope.showCount && !inverse) || (!$scope.showCount && inverse)) return col;
    else
    {
      var count = me.width * me.height;
      if (me.forceFrame === -1) count *= me.frameCount;
      return Math.ceil(col / count * 10000)/100 + "%"; // TODO: Calculate percentage. 
    }
  }
  
  //}
  
  //{ Tool: Color replacing
  
  $scope.toggleColorEdit = function(me)
  {
    me.replaceColorsMode = !me.replaceColorsMode;
  };
  
  //}

  $scope.loadImages = function () {
    
    if ($scope.files)
    {
      $scope.results = [];
      var files = $scope.files;
      for (var j = 0; j < files.length; j++)
      {
        loadFile(files[j]);
      }
      $scope.files = null;
    }
    else if ($scope.images) {
      $scope.results = [];
      var split = $scope.images.split("\n");
      changeInputValue($scope.images);
      //$scope.images = "";

      for (var j = 0; j < split.length; j++) {
        loadImage(split[j]);
      }
    }
  };
  
  function loadFile(item)
  {
    var me = {
      imageUrl: item.url,
      title: item.url,
      state: "Analyzing...",
      status: 1,
      contentRaw: new Uint8Array(item.data),
      content: base64ArrayBuffer(item.data)
    };
    initCanvas(me);
    $scope.results.push(me);
    $scope.folded = true;
    scanImage(me);
  }
  
  function loadImage(item)
  {
    var me = {imageUrl: item, title: item, state: "Pending image...", status: 0};
    $scope.results.push(me);
    $scope.folded = true;
    $http.get("getImage.php", {params: {input: item}, responseType: "text"}).success(function (data) {
      if (typeof data === "string" || data.error) {
        angular.extend(me, {title: me.imageUrl, error: "Error while pending image.", status: 2});
      }
      else {
        angular.extend(me, data);
        me.state = "Analyzing...";
        me.status = 1;
        me.contentRaw = makeBytes(me.content);
        initCanvas(me);
        scanImage(me);
      }
    });
  }
  
  function initCanvas(me)
  {
    me.internalCanvas = document.createElement("canvas");
    me.internalContext = me.internalCanvas.getContext("2d");
    me.canvas = document.createElement("canvas");
    me.context = me.canvas.getContext("2d");
    me.sortProperty = "count";
    me.sortReverse = true;
    me.scale = 1;
    me.scaleIndex = 1;
  }

  function changeInputValue(newInput) {
    var search = location.search;
    if (!search) history.pushState({}, "Image Inspector", "?input=" + encodeURIComponent(newInput));
    else {
      var results = /[\\?&]input=([^&]*)/.exec(search);
      if (results === null) {
        if (search.charAt(0) === "?") history.pushState({}, "Image Inspector", search + "&input=" + encodeURIComponent(newInput));
        else history.pushState({}, "Image Inspector", "?input=" + encodeURIComponent(newInput));
      }
      else {
        history.pushState({}, "Image Specs", search.replace(results[1], encodeURIComponent(newInput)));
      }
    }
  }

  function makeBytes(base64) {
    base64 = atob(base64);
    var len = base64.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
      bytes[i] = base64.charCodeAt(i);
    }
    return bytes;
  }
  
  function scanImage(me) {
    me.fileType = readExtension(me.contentRaw);
    me.fileSize = me.contentRaw.length;
    me.indexed = me.fileType == "GIF";
    me.replaceColorsMode = false;
    if (me.fileType == "GIF") {
      scanGif(me);
      postprocessScan(me);
      return;
    }
    else if (me.fileType == "PNG")
    {
      scanPNG(me);
      postprocessScan(me);
      return;
    }
    var img = new Image();
    img.onload = function () {
      scanDefault(me, img);
      postprocessScan(me);
    };
    img.src = "data:image/png;base64," + me.content;
  }
  
  function postprocessScan(me)
  {
    me.haveTransparency = false;
    for (var i = 0; i < me.totalColors.length; i++)
    {
      if (me.totalColors[i].a != 0xff && me.totalColors[i].a != 0)
      {
        me.haveTransparency = true;
        break;
      }
    }
    me.status = 4;
    imageLoaded(me);
    updateCanvasProperties(me);
    if (!$scope.$$phase) $scope.$apply();
  }
  
  function scanPNG(me)
  {
    var data = new Png(me.contentRaw);
    var pixels = data.pixels;
    if (data.type.indexOf("Indexed") != -1) me.indexed = true;
    me.width = data.width;
    me.height = data.height;
    me.internalCanvas.width = me.width;
    me.internalCanvas.height = me.height;
    me.animated = data.animation != null; // Lol. Not supported anyway.
    me.colors = [];
    me.framesCount = 1;
    me.image = me.internalContext.createImageData(me.width, me.height);
    var col = me.colors;
    var indexes = new Uint16Array(me.width * me.height);
    var k = 0;
    var len = pixels.length;
    for (var i = 0; i < len; i += 4)
    {
      var color;
      var alpha = pixels[i + 3];
      color = (pixels[i + 3] << 24) | (pixels[i]) | (pixels[i + 1] << 8) | (pixels[i + 2] << 16);
      var idx = colorIndexOf(col, color);
      if (idx == -1)
      {
        idx = insertColor(col, color);
      }
      else {
        col[idx].count++;
      }
      indexes[k++] = idx;
    }
    me.colorsCount = col.length;
    me.totalColors = me.colors;
    me.totalColorCount = me.colorsCount;
    me.frames = [{colors: col, count: col.length, pixels: indexes, delay: 0}];
  }

  function scanGif(me)
  {
    var gif = readGif(me.contentRaw.buffer);
    me.width = gif.width;
    me.height = gif.height;
    me.internalCanvas.width = me.width;
    me.internalCanvas.height = me.height;
    me.animated = gif.frames.length > 1;
    me.colors = [];
    me.frameCount = gif.frames.length;
    me.image = me.internalContext.createImageData(me.width, me.height);
    me.frames = [];
    
    var col = me.colors;
    var frames = gif.frames.length;
    var frame = 0;
    var prevIndexes; // Used for disposalMethod 2.
    var renderIndexes = new Uint16Array(me.width * me.height);
    
    var pal;
    while (frame < frames)
    {
      var f = gif.frames[frame];
      
      // Step 1: Render
      if (f.disposalMethod === 2) prevIndexes = renderIndexes.slice(0, renderIndexes.length);
      var pixels = f.pixels;
      pal = f.palette;
      
      var renderOffset = 0;
      var pixelsOffset = 0;
      
      var drawEndX = f.x + f.width;
      var drawEndY = f.y + f.height;
      var x = 0;
      var y = 0;
      var icol = [];
      var globalIndex, localIndex;
      for (var i = 0; i < renderIndexes.length; i++)
      {
        var color;
        // Inside frame rendering area
        if (x >= f.x && x < drawEndX && y >= f.y && y < drawEndY)
        {
          var pixelIndex = pixels[pixelsOffset];
          if (pixelIndex == f.transparentIndex)
          {
            if (frame == 0) color = 0;
            else color = col[renderIndexes[renderOffset]].color;
          }
          else
          {
            pixelIndex *= 3;
            color = 0xff000000 | (pal[pixelIndex] << 16) | (pal[pixelIndex + 1] << 8) | pal[pixelIndex + 2];
          }
          pixelsOffset++;
        }
        else
        {
          if (frame == 0) color = 0;
          else color = col[renderIndexes[renderOffset]].color;
        }
        
        globalIndex = colorIndexOf(col, color);
        if (globalIndex == -1) globalIndex = insertColor(col, color);
        else col[globalIndex].count++;
        
        localIndex = colorIndexOf(icol, color);
        if (localIndex == -1)
        {
          localIndex = insertColor(icol, color);
          icol[localIndex].global = globalIndex;
        }
        else icol[localIndex].count++;
        
        renderIndexes[renderOffset] = globalIndex;
        
        renderOffset++;
        if ((++x) == me.width) { x = 0; y++; }
      }
      
      var framePixels = renderIndexes.slice(0, renderIndexes.length);
      
      if (prevIndexes != null) // disposalMethod 2
      {
        renderIndexes = prevIndexes;
        prevIndexes = null;
      }
      else if (f.disposalMethod == 1)
      {
        renderOffset = f.y * me.width + f.x;
        x = 0;
        var len = pixels.length;
        for (i = 0; i < len; i++)
        {
          renderIndexes[renderOffset] = 0;
          if((++x) == f.width) { x = 0; renderOffset += me.width - f.width; }
          else renderOffset ++;
        }
      }
      me.frames.push({colors:icol, count:icol.length, pixels:framePixels, delay: f.delay });
      frame++;
    }
    
    me.forceFrame = -1;
    me.frame = 0;
    me.dt = 0;
    me.colorsCount = col.length;
    me.totalColors = me.colors;
    me.totalColorCount = me.colorsCount;
    me.playbackSpeed = 100;
    if (!updateId)
    {
      updateId = requestAnimationFrame(updateAnimation);
    } // TODO: cancelAnimationFrame on new load.
  }
  
  function scanDefault(me, image)
  {
    me.internalCanvas.width = image.width;
    me.internalCanvas.height = image.height;
    me.internalContext.drawImage(image, 0, 0);
    me.width = image.width;
    me.height = image.height;
    me.animated = false;
    me.colors = [];
    me.frameCount = 1;
    me.image = me.internalContext.createImageData(me.width, me.height);
    var col = me.colors;
    var pixels = me.internalContext.getImageData(0, 0, image.width, image.height).data;
    var indexes = new Uint16Array(me.width * me.height);
    var k = 0;
    var len = pixels.length;
    for (var i = 0; i < len; i += 4)
    {
      var color;
      color = (pixels[i + 3] << 24) | (pixels[i] << 16) | (pixels[i + 1] << 8) | (pixels[i + 2]); // ARGB
      var idx = colorIndexOf(col, color);
      if (idx == -1)
      {
        idx = insertColor(col, color);
      }
      else {
        col[idx].count++;
      }
      indexes[k++] = idx;
    }
    me.colorsCount = col.length;
    me.totalColors = me.colors;
    me.totalColorCount = me.colorsCount;
    me.frames = [{colors: col, count: col.length, pixels: indexes, delay: 0}];
  }

  function imageLoaded(me)
  {
    injectColorSpace(me, colorSpaces[$scope.colorSpace], $scope.colorSpace);
  }
  
  //{ Color space
  
  var colorSpaces =
  {
    "RGB": rgbInjector,
    "HSB": hsbInjector,
    "HSL": hslInjector
  };
  
  $scope.colorSpaceHeaders =
  {
    "RGB": ["Red", "Green", "Blue"],
    "HSB": ["Hue", "Saturation", "Brightness"],
    "HSL": ["Hue", "Saturation", "Lightness"]
  };
  
  $scope.updateActiveColorSpace = function()
  {
    var cs = $scope.colorSpace;
    if (colorSpaces[cs])
    {
      for (var i = 0; i < $scope.results.length; i++)
      {
        injectColorSpace($scope.results[i], colorSpaces[cs], cs);
      }
    }
    setCookie("colorSpace", $scope.colorSpace);
  }
  
  function injectColorSpace(me, injector, name)
  {
    if (me.colorSpace == name) return;
    if (me.sortProperty != "count" || me.sortProperty != "hex") me.sortProperty = "count";
    massInjector(me.totalColors, injector, $scope.colorSpaceHeaders[name]);
    if (me.animated)
    {
      for (var i = 0; i < me.frames.length; i++)
      {
        massInjector(me.frames[i].colors, injector, $scope.colorSpaceHeaders[name]);
      }
    }
    
    me.colorSpace = name;
  }
  
  function massInjector(pal, injector, headers)
  {
    for (var i = 0; i < pal.length; i++)
    {
      var col = pal[i];
      injector(col);
      for (var j = 0; j < headers.length; j++)
      {
        col["ch_" + headers[j]] = col.colorSpace[j].value;
      }
    }
  }

  $scope.updateColor = function(me, color)
  {
    var hex = parseInt(color.hex, 16);
    if (isNaN(hex)) hex = 0;
    else hex |= 0xff000000;
    color.color = hex;
    if (color.global)
    {
      color = me.totalColors[color.global];
      color.color = hex;
    }
    render(me);
  };
  
  $scope.updateChannel = function(me, color, channel)
  {
    channel.value = parseFloat(channel.value);
    channel.change(color, channel.value);
    if (color.global)
    {
      channel.change(me.totalColors[color.global], channel.value);
    }
    // TODO: Reinject for other palettes
    // TODO: Secondary palette contains parent info and parent contains child info
    render(me);
  };

  // Hex
  function updateHex(color)
  {
    color.hex = lpad((color.color & 0xffffff).toString(16), "0", 6).toUpperCase();
  }
  
  // RGB

  function rgbInjector(color)
  {
    color.colorSpace =
      [
        { value:(color.color & 0xFF0000) >> 16, size:3, type:"input", min:0, max:0xff, change:rgbUpdateRed },
        { value:(color.color & 0xFF00) >> 8, size:3, type:"input", min:0, max:0xff, change:rgbUpdateGreen },
        { value:(color.color & 0xFF), size:3, type:"input", min:0, max:0xff, change:rgbUpdateBlue }
      ];
  }

  function rgbUpdateRed(color, value)
  {
    color.color = (color.color & 0xff00ffff) | ((value & 0xff) << 16);
    updateHex(color);
  }
  
  function rgbUpdateGreen(color, value)
  {
    color.color = (color.color & 0xffff00ff) | ((value & 0xff) << 8);
    updateHex(color);
  }
  
  function rgbUpdateBlue(color, value)
  {
    color.color = (color.color & 0xffffff00) | (value & 0xff);
    updateHex(color);
  }
  
  // HSB/HSV
  
  function hsbUpdateHue(color, value)
  {
    var cs = color.colorSpace;
    color.color = 0xff000000 | hsbToRGB(value, cs[1].value, cs[2].value);
    updateHex(color);
  }
  
  function hsbUpdateSaturation(color, value)
  {
    var cs = color.colorSpace;
    color.color = 0xff000000 | hsbToRGB(cs[0].value, value, cs[2].value);
    updateHex(color);
  }
  
  function hsbUpdateBrightness(color, value)
  {
    var cs = color.colorSpace;
    color.color = 0xff000000 | hsbToRGB(cs[0].value, cs[1].value, value);
    updateHex(color);
  }
  
  function hsbToRGB(hue, saturation, brightness)
  {
    if (brightness == 0) return 0;
    
    var r = 0, g = 0, b = 0, i, f, p, q, t;
    
    hue = (hue % 360) / 60; // TODO: Loop to accept negative values.
    saturation *= 0.01;
    brightness *= 0.01;
    i = Math.floor(hue);
    f = hue - i;
    p = brightness * (1 - saturation);
    q = brightness * (1 - f * saturation);
    t = brightness * (1 - (1 - f) * saturation);
    
    switch (i % 6)
    {
      case 0: r = brightness, g = t, b = p; break;
      case 1: r = q, g = brightness, b = p; break;
      case 2: r = p, g = brightness, b = t; break;
      case 3: r = p, g = q, b = brightness; break;
      case 4: r = t, g = p, b = brightness; break;
      case 5: r = brightness, g = p, b = q; break;
    }
    
    return ((Math.round(r * 0xff) & 0xff) << 16) |
           ((Math.round(g * 0xff) & 0xff) << 8 ) |
            (Math.round(b * 0xff) & 0xff);
  }
  
  function hsbInjector(color)
  {
    var s = color.color;
    var v, h;
    var r = ((s & 0xff0000) >> 16) / 0xff;
    var g = ((s & 0xff00) >> 8) / 0xff;
    var b = (s & 0xff) / 0xff;
    var min = Math.min(r, g, b);
    var max = Math.max(r, g, b);
    
    var delta = max - min;
    
    v = max * 100;
    
    if (max != 0) s = (delta / max) * 100;
    else
    {
      color.colorSpace =
        [
          { value: -1, size:3, min:0, max:360, change:hsbUpdateHue },
          { value: 0, size:3, min:0, max:100, change:hsbUpdateSaturation },
          { value: Math.round(v), size:3, min:0, max:100, change:hsbUpdateBrightness }
        ];
      return;
    }
    
    if (delta == 0)
    {
      color.colorSpace =
        [
          { value: 0, size:3, min:0, max:360, change:hsbUpdateHue },
          { value: Math.round(s), size:3, min:0, max:100, change:hsbUpdateSaturation },
          { value: Math.round(v), size:3, min:0, max:100, change:hsbUpdateBrightness }
        ];
      return;
    }
    
    if (r == max) h = (g - b) / delta;
    else if (g == max) h = 2 + (b - r) / delta;
    else h = 4 + (r - g) / delta;
    
    h *= 60;
    if (h < 0) h += 360;

    color.colorSpace =
      [
        { value: Math.round(h), size:3, min:0, max:360, change:hsbUpdateHue },
        { value: Math.round(s), size:3, min:0, max:100, change:hsbUpdateSaturation },
        { value: Math.round(v), size:3, min:0, max:100, change:hsbUpdateBrightness }
      ];
  }
  
  // HSL
  
  function hslUpdateHue(color, value)
  {
    var cs = color.colorSpace;
    color.color = 0xff000000 | hslToRGB(value, cs[1].value, cs[2].value);
    updateHex(color);
  }
  
  function hslUpdateSaturation(color, value)
  {
    var cs = color.colorSpace;
    color.color = 0xff000000 | hslToRGB(cs[0].value, value, cs[2].value);
    updateHex(color);
  }
  
  function hslUpdateLightness(color, value)
  {
    var cs = color.colorSpace;
    color.color = 0xff000000 | hslToRGB(cs[0].value, cs[1].value, value);
    updateHex(color);
  }
  
  function hslHueToRgb(p, q, t)
  {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  }
  
  function hslToRGB(hue, saturation, lightness)
  {
    var r, g, b;
    lightness /= 100;
    if (saturation === 0)
    {
      r = g = b = lightness;
    }
    else
    {
      saturation /= 100;
      hue = (hue % 360) / 360;
      
      var q = lightness < 0.5 ?
                lightness * (1 + saturation) :
                lightness + saturation - lightness * saturation;
      var p = 2 * lightness - q;
      r = hslHueToRgb(p, q, hue + 1 / 3);
      g = hslHueToRgb(p, q, hue);
      b = hslHueToRgb(p, q, hue - 1 / 3);
    }
    
    return ((Math.round(r * 0xff) & 0xff) << 16) |
           ((Math.round(g * 0xff) & 0xff) << 8 ) |
            (Math.round(b * 0xff) & 0xff);
  }
  
  function hslInjector(color)
  {
    var l, h, d;
    var s = color.color;
    var r = ((s & 0xff0000) >> 16) / 0xff;
    var g = ((s & 0xff00) >> 8) / 0xff;
    var b = (s & 0xff) / 0xff;
    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    
    l = (max + min) / 2;
    
    if (max == min) h = s = 0;
    else
    {
      d = max - min;
      
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max)
      {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    
    color.colorSpace =
      [
        { value: Math.round(h * 360), size: 3, min: 0, max: 360, change: hslUpdateHue },
        { value: Math.round(s * 100), size: 3, min: 0, max: 100, change: hslUpdateSaturation },
        { value: Math.round(l * 100), size: 3, min: 0, max: 100, change: hslUpdateLightness }
      ];
  }
  
  
  //}
  
  //{ Tool: Palette gen
  
  $scope.generatePalette = function(me)
  {
    if (me.paletteFile != null)
    {
      me.paletteFile = null;
      return;
    }
    
    var width = me.colors.length;
    /** ImageData */
    if (!me.paletteCanvas)
    {
      me.paletteCanvas = document.createElement("canvas");
      me.paletteContext = me.paletteCanvas.getContext("2d");
    }
    var ctx = me.paletteContext;
    me.paletteCanvas.width = width;
    me.paletteCanvas.height = 1;
    var pixelData = ctx.createImageData(width, 1);
    var pixels = pixelData.data;
    var off = 0;
    for (var i = 0; i < width; i++)
    {
      var col = me.colors[i].color;
      pixels[off++] = (col & 0xff0000) >> 16;
      pixels[off++] = (col & 0xff00) >> 8;
      pixels[off++] = col & 0xff;
      pixels[off++] = 0xff;
    }
    ctx.putImageData(pixelData, 0, 0);
    me.paletteFile = me.paletteCanvas.toDataURL();
  }
  
  $scope.paletteDownloadJASC = function(me)
  {
    var result = ["JASC_PAL", "0100"];
    if (me.colors.length < 256) result.push("256");
    else result.push(me.colors.length);
    
    for (var i = 0; i < me.colors.length; i++)
    {
      var col = me.colors[i].color;
      result.push(((col & 0xff0000) >> 16) + " " + ((col & 0xff00) >> 8) + " " + (col & 0xff));
    }
    
    while (result.length < 259) result.push("0 0 0");
    saveFile(result.join("\n"), "palette.pal");
  }
  
  $scope.paletteDownloadGPL = function(me)
  {
    var result = ["GIMP Palette", "Name: " + me.title, "Columns: " + me.colorsCount, "#"];
    
    for (var i = 0; i < me.colors.length; i++)
    {
      var col = me.colors[i].color;
      result.push(((col & 0xff0000) >> 16) + " " + ((col & 0xff00) >> 8) + " " + (col & 0xff) + " Color " + i);
    }
    
    saveFile(result.join("\n"), "palette.gpl");
  }
  
  $scope.paletteDownloadHex = function(me)
  {
    var result = [];
    
    for (var i = 0; i < me.colors.length; i++)
    {
      var col = me.colors[i];
      result.push($scope.getAlpha(col.color).toString(16) + col.hex);
    }
    
    saveFile(result.join("\n"), "palette.txt");
  }
  
  var saveAnchor;
  function saveFile(data, name)
  {
    var blob = new Blob([data], { type: "octet/stream" });
    var url = window.URL.createObjectURL(blob);
    
    if (!saveAnchor)
    {
      saveAnchor = document.createElement("a");
      saveAnchor.style.display = "none";
      document.body.appendChild(saveAnchor);
    }
    saveAnchor.href = url;
    saveAnchor.download = name;
    saveAnchor.click();
    window.URL.revokeObjectURL(url);
  }
  
  //}
  
  
  // Tool: Gif->Spritesheet.
  $scope.generateSpritesheet = function(me)
  {
    
  }
  
  //{ Settings
  
  $scope.toggleSettings = function()
  {
    $scope.showSettings = !$scope.showSettings;
  }
  $scope.showSettings = false;
  
  //}
  
  $scope.handleHotkeys = function(ev)
  {
    if (ev.keyCode === 13 && (ev.ctrlKey || ev.shiftKey))
    {
      $scope.loadImages();
    }
  }
  
  $scope.handleHotkeysDown = function(ev)
  {
    if (ev.keyCode === 37)
    {
      for (var i = 0; i < $scope.results.length; i++)
      {
        $scope.prevFrame($scope.results[i]);
      }
      ev.preventDefault();
    }
    else if (ev.keyCode === 39)
    {
      for (var i = 0; i < $scope.results.length; i++)
      {
        $scope.nextFrame($scope.results[i]);
      }
      ev.preventDefault();
    }
  }
  
  $scope.isTransparent = function(col)
  {
    return ((col >> 24) & 0xff) != 0xff;
  }
  
  $scope.getAlpha = function(col)
  {
    return ((col >> 24) & 0xff);
  }
  $scope.getAlphaNormal = function(col)
  {
    return ((col >> 24) & 0xff) / 0xff;
  }
  $scope.getAlphaPercent = function(col)
  {
    return 100 - Math.round(((col >> 24) & 0xff) / 0xff * 100);
  }
  
  function numericAlign(v, alignTo)
  {
    alignTo = alignTo.toString().length;
    v = v.toString();
    while (v.length < alignTo) v = "0" + v;
    return v;
  }
  $scope.numericAlign = numericAlign;
  
  function lpad(v, pad, count)
  {
    if (v == null) v = "";
    while (v.length < count) v = pad + v;
    return v;
  }
  $scope.lpad = lpad;
  
  function insertColor(col, color)
  {
    var index = col.length;
    col.push({ color: color, a:((color >> 24) & 0xff), count: 1, hex: lpad((color & 0xffffff).toString(16), "0", 6).toUpperCase()});
    return index;
  }
  
  function colorIndexOf(col, color)
  {
    for (var i = 0; i < col.length; i++)
    {
      if (col[i].color == color) return i;
    }
    return -1;
  }
  
  function readExtension(data) {
    if (data[0] === 0x47 && data[1] === 0x49 && data[2] === 0x46) return "GIF";
    if (data[0] === 0xFF && data[1] === 0xD8) return "JPG";
    var pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];
    var png = true;
    for (var i = 0; i < pngSignature.length; i++) {
      if (data[i] != pngSignature[i]) {
        png = false;
        break;
      }
    }
    if (png) return "PNG";
    return "Unknown format";
  }

  function getParameter(name) {
    var results = new RegExp("[\\?&]" + name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]") + "=([^&#]*)").exec(window.location.href);
    if (results == null)
      return "";
    else
      return results[1];
  }

  function getCookie(key, def) {
    var obj = $cookies.getObject(key);
    if (!obj) return def;
    return obj;
  }

  function setCookie(key, val)
  {
    var date = new Date(Date.now());
    date.setFullYear(date.getFullYear() + 2);
    $cookies.putObject(key, val, { expires:date });
  }
  $scope.setCookie = setCookie;

  $scope.highlighting = getCookie("highlighting",
      { color: 0xFF0000, showForeground:true, showBackground: true, backgroundColor: 0, backgroundAlpha: 0.5});
  
  $scope.highlightingDisplayColor = function(color)
  {
    return lpad(color.toString(16), "0", 6);
  }
  
  $scope.highlightingColorUpdate = function(value)
  {
    var col = parseInt(value, 16);
    $scope.highlighting.color = col;
    setCookie("highlighting", $scope.highlighting);
  }
  
  $scope.backgroundColorUpdate = function(value)
  {
    var col = parseInt(value, 16);
    $scope.highlighting.backgroundColor = col;
    setCookie("highlighting", $scope.highlighting);
  }
  
  $scope.backgroundAlphaUpdate = function(value)
  {
    $scope.highlighting.backgroundAlpha = value / 100;
    setCookie("highlighting", $scope.highlighting);
  }
  
  $scope.saveToolbarPos = function()
  {
    setCookie("toolbarPos", $scope.toolbarPos);
  }
  
  $scope.saveUIZoomAnimation = function()
  {
    setCookie("zoomAnimation", $scope.zoomAnimation);
  }
  
  $scope.autoplayGif = getCookie("autoplayGif", true);
  $scope.showCount = getCookie("showCount", false); // Percent instead
  $scope.colorSpace = getCookie("colorSpace", "RGB");
  $scope.toolbarPos = getCookie("toolbarPos", "both");
  $scope.zoomAnimation = getCookie("zoomAnimation", true);
  
  $scope.loadFiles = function()
  {
    var files = $scope.fileDialog.files;
    var count = files.length;
    var loaded = 0;
    
    function loadNext()
    {
      if (loaded === count)
      {
        $scope.loadImages();
        return;
      }
      var reader = new FileReader();
      reader.addEventListener("loadend", onFileLoad);
      reader.readAsArrayBuffer(files[loaded]);
    }
    
    function onFileLoad(e)
    {
      var reader = e.target;
      var data = reader.result;
      if (!$scope.files) $scope.files = [];
      $scope.files.push({ data:data, url:files[loaded].name });
      loaded++;
      loadNext();
    }
    loadNext();
  }
  
  // Styles
  
  $scope.colorTheme = getCookie("colorTheme", "main.css");
  updateStyles(true);
  function updateStyles(skipCookie)
  {
    var link = document.getElementById("themeStyle");
    link.href = $scope.colorTheme;
    if (!skipCookie) setCookie("colorTheme", $scope.colorTheme);
  }
  $scope.updateStyles = updateStyles;
  
  // Detect open via share-url
  var inputs = getParameter("input");
  if (inputs)
  {
    $scope.images = decodeURIComponent(inputs);
    $scope.loadImages();
  }
});

app.directive("fileDropper", function()
{
  var textDefault = "Drag-n-drop area";
  
  function applyText(element, text)
  {
    if (element.nodeName === "TEXTAREA" && text === textDefault) element.innerHTML = "";
    else element.innerHTML = text;
  }
  
  function link($scope, $element)
  {
    var div = $element[0];
    if (!window.FileReader)
    {
      div.style.display = "none";
      return;
    }
    div.addEventListener("dragover", onDragOver);
    div.addEventListener("dragenter", onDragEnter);
    div.addEventListener("dragleave", onDragLeave);
    div.addEventListener("drop", onDrop.hxBind(null, _, $scope)); // function(e) { onDrop(e, $scope); }
  }
  
  function onDragOver(e)
  {
    e.preventDefault();
  }
  
  function onDragEnter(e)
  {
    applyText(e.target, "Drop file here to upload it");
    e.preventDefault();
  }
  
  function onDragLeave(e)
  {
    applyText(e.target, textDefault);
    e.preventDefault();
  }
  
  function onDrop(e, $scope)
  {
    var div = e.target;
    var files = e.dataTransfer.files;
    var count = files.length;
    var loaded = 0;
    e.preventDefault();
    if (count == 0)
    {
      var text = e.dataTransfer.getData("Text");
      if (text)
      {
        $scope.images = text;
        $scope.loadImages();
      }
      return;
    }
    
    applyText(div, count > 1 ? "Loading files..." : "Loading file...");
    
    for (var i = 0; i < count; i++)
    {
      var reader = new FileReader();
      reader.addEventListener("loadend", onFileLoaded.hxBind(null, _, i, div, $scope));
      reader.readAsArrayBuffer(files[i]);
    }
    
    function onFileLoaded(e, index, div, $scope)
    {
      var reader = e.target;
      var data = reader.result;
      loaded++;
      if (!$scope.files) $scope.files = [];
      $scope.files.push({ data:data, url:files[index].name });
      if (loaded === count)
      {
        applyText(div, textDefault);
        $scope.loadImages();
      }
      else
      {
        applyText(div, "Files loaded: " + loaded + "/" + count);
      }
    }
    
  }
  
  return {
    link: link
  }
});

app.directive("canvasPlaceholder", function()
{
  return {
    link: function($scope, $element, $arg) {
      var path = $arg.canvasPlaceholder.split(".");
      var root = $scope.$parent;
      while (path.length > 0)
      {
        root = root[path.shift()];
      }
      $element.append(root);
    }
  }
});

app.directive("spBind", function($parse)
{
  return {
    link: function($scope, $elem, $attr)
    {
      $parse($attr.spBind).assign($scope.$parent, $elem[0]);
    }
  };
});

app.directive("spChange", function($parse)
{
  return {
    link: function($scope, $elem, $attr)
    {
      var fn = $parse($attr.spChange);
      $elem.bind("change", function(ev)
      {
        $scope.$apply(function()
        {
          fn($scope, {$event:ev});
        });
      });
    }
  };
});

app.filter('orderObjectBy', function() {
  // Courtesy of: http://justinklemm.com/angularjs-filter-ordering-objects-ngrepeat/
  return function(items, field, reverse) {
    var filtered = [];
    
    angular.forEach(items, function(item) {
      filtered.push(item);
    });
    
    filtered.sort(function(a, b) {
      if(a[field] > b[field]) {
        return 1;
      }
      
      return -1;
    });
    
    if(reverse) {
      filtered.reverse();
    }
    
    return filtered;
  };
});
