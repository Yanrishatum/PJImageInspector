function ByteArray(input)
{
  this.input = input;
  this.position = 0;
  this.length = input.length;
}

ByteArray.prototype.readByte = function()
{
  if (this.position >= this.length) throw "Out of range!";
  return this.input.charCodeAt(this.position++);
}

ByteArray.prototype.readShort = function()
{
  return this.readByte() | this.readByte() << 8;
}

ByteArray.prototype.readString = function(length)
{
  if (this.position + length > this.length) throw "Out of range!";
  var result = this.input.substr(this.position, length);
  this.position += length;
  return result;
}

function parseGif(input)
{
  var bytes = new ByteArray(input);
  
  function readHeader()
  {
    var valid = bytes.readString(3) === "GIF";
    bytes.position += 3; // Ignore version.
    return valid;
  }
  
  function readColorTable(colorCount)
  {
    var result = [];
    for (var i = 0; i < colorCount; i++)
    {
      result.push([bytes.readByte(), bytes.readByte(), bytes.readByte()]);
    }
    return result;
  }
  
  function readLSD()
  {
    var width = bytes.readShort();
    var height = bytes.readShort();
    var packed = bytes.readByte();
    var globalColorTable = (packed & 128) === 128;
    var globalColorTableSize = 2 << (packed & 7);
    var backgroundColorIndex = bytes.readByte();
    bytes.position++;
    return { width:width, height:height, globalColorTable:globalColorTable, globalColorTableSize:globalColorTableSize, backgroundColorIndex:backgroundColorIndex };
  }
  
  function readBlock()
  {
    var id = bytes.readByte();
    switch(id)
    {
      case 0x2C: readImage(); break;
      case 0x21: readExtension(); break;
      case 0x3B: return;
    }
    readBlock();
  }
  
  function readExtension()
  {
    var subId = bytes.readByte();
    switch(subId)
    {
      case 0xF9: readGCE(); break;
      case 0xFF: readAppExtension(); break;
      default: skipBlock();
    }
  }
  
  function readAppExtension()
  {
    bytes.position++;
    var nameVer = bytes.readString(11);
    if (nameVer === "NETSCAPE2.0")
    {
      bytes.position += 2;
      gif.iterations = bytes.readShort();
      bytes.position++;
    }
    else skipBlock();
  }
  
  var canvas = document.createElement("canvas");
  var ctx = canvas.getContext("2d");
  function readImage()
  {
    var id = readImageDescriptor();
    var ct = gct;
    if (id.localColorTable) ct = readColorTable(id.localColorTableSize);
    if (!ct) throw "No color table!";
    
    var w = id.width;
    var h = id.height;
    var pixels = decodeImage(w * h);
    var frame = {};
    frame.x = id.x;
    frame.y = id.y;
    frame.width = w;
    frame.height = h;
    var imageData = frame.data = ctx.createImageData(gif.width, gif.height);//ctx.createImageData(w, h);
    var data = imageData.data;
    
    function applyDisposal(index)
    {
      if (index < 0) return;
      var prevFrame = gif.frames[index];
      if (prevFrame.disposalMethod === 3) // Render previous;
      {
        applyDisposal(index - 1);
        return;
      }
      else
      {
        data.set(prevFrame.data.data);
        if (prevFrame.disposalMethod === 2) // Fill background
        {
          var endX = prevFrame.x + prevFrame.width;
          var endY = prevFrame.y + prevFrame.height;
          for (var y = prevFrame.y; y < endY; y++)
          {
            for (var x = prevFrame.x; x < endX; x++)
            {
              var i = (y * gif.width + x) * 4;
              data[i] = data[i+1] = data[i+2] = data[i+3] = 0;
            }
          }
        }
      }
    }
    
    applyDisposal(gif.frames.length - 1);
    
    var transparentIndex = -1;
    if (gce)
    {
      frame.delay = gce.delay * 10;
      if (frame.delay <= 10) frame.delay = 100;
      frame.disposalMethod = gce.disposalMethod;
      if (gce.transparentColor) transparentIndex = gce.transparentIndex;
      gce = null;
    }
    else
    {
      frame.delay = 100;
      frame.disposalMethod = 0;
    }
    
    function interlaceFill(step, start, offset)
    {
      var y = start;
      while (y < h)
      {
        for (var x = 0; x < w; x++)
        {
          var idx = pixels[offset++];
          if (idx !== transparentIndex)
          {
            var i = ((y + frame.y) * gif.width + (x + frame.x)) * 4;
            var color = ct[idx];
            data[i  ] = color[0];
            data[i+1] = color[1];
            data[i+2] = color[2];
            data[i+3] = 255;
          }
        }
        y += step;
      }
      return offset;
    }
    
    if (id.interlace)
    {
      var offset = interlaceFill(8, 0, 0);
      offset = interlaceFill(8, 4, offset);
      offset = interlaceFill(4, 2, offset);
      interlaceFill(2, 1, offset);
    }
    else
    {
      interlaceFill(1, 0, 0);
    }
    
    gif.frames.push(frame);
  }
  
  function decodeImage(pixelsCount)
  {
    var blockSize;
    var b;
    var bitsCount;
    
    function readCode()
    {
      while (bitsCount < codeSize)
      {
        if (blockSize === 0) break;
        b |= bytes.readByte() << bitsCount;
        bitsCount += 8;
        blockSize--;
        if (blockSize === 0) blockSize = bytes.readByte();
      }
      var c = b & codeMask;
      b >>= codeSize;
      bitsCount -= codeSize;
      
      return c;
    }
    
    var minCodeSize = bytes.readByte();
    
    blockSize = bytes.readByte() - 1;
    b = bytes.readByte();
    bitsCount = 8;
    
    var pixels = new Uint8Array(pixelsCount);
    
    var cc = 1 << minCodeSize;
    var eoi = cc + 1;
    
    var codeSize = minCodeSize + 1;
    var nextSize = 1 << codeSize;
    var codeMask = nextSize - 1;
    
    var dict = [];
    for (var i = 0; i < cc; i++) dict[i] = [i];
    
    var dictLength = eoi + 1;
    
    var code = 0;
    var last = 0;
    var written = 0;
    while (written < pixelsCount)
    {
      last = code;
      code = readCode();
      
      if (code === cc)
      {
        dictLength = eoi + 1;
        codeSize = minCodeSize + 1;
        nextSize = 1 << codeSize;
        codeMask = nextSize - 1;
        continue;
      }
      if (code === eoi) break;
      
      if (code < dictLength)
      {
        if (last !== cc)
        {
          var newArr = dict[last].concat();
          newArr.push(dict[code][0]);
          dict[dictLength++] = newArr;
        }
      }
      else
      {
        if (code !== dictLength) throw "Invalid LZW code";
        var newArr = dict[last].concat();
        newArr.push(newArr[0]);
        dict[dictLength++] = newArr;
      }
      
      var entry = dict[code];
      var len = entry.length;
      for (var i = 0; i < len; i++) pixels[written++] = entry[i];
      
      if (dictLength === nextSize && codeSize < 12)
      {
        codeSize++;
        nextSize = 1 << codeSize;
        codeMask = nextSize - 1;
      }
    }
    
    while (blockSize > 0)
    {
      bytes.position += blockSize;
      blockSize = bytes.readByte();
    }
    return pixels;
  }
  
  function readImageDescriptor()
  {
    var x = bytes.readShort();
    var y = bytes.readShort();
    var width = bytes.readShort();
    var height = bytes.readShort();
    var packed = bytes.readByte();
    var localColorTable = (packed & 128) === 128;
    var interlace = (packed & 64) === 64;
    var localColorTableSize = 2 << (packed & 7);
    return { x:x, y:y, width:width, height:height, localColorTable:localColorTable, interlace:interlace, localColorTableSize:localColorTableSize };
  }
  
  function skipBlock()
  {
    var size = 0;
    do
    {
      size = bytes.readByte();
      bytes.position += size;
    }
    while (size !== 0);
  }
  
  function readGCE()
  {
    bytes.position++;
    var packed = bytes.readByte();
    var method = (packed & 28) >> 2;
    var transparentColor = (packed & 1) === 1;
    var delay = bytes.readShort();
    var transparentIndex = bytes.readByte();
    bytes.position++;
    gce = { disposalMethod:method, transparentColor:transparentColor, transparentIndex:transparentIndex, delay:delay };
  }
  
  var gce = null;
  var gct = null;
  var backgroundColor;
  var backgroundColorIndex;
  var gif = { frames:[] };
  if (readHeader())
  {
    var lsd = readLSD();
    gif.width = lsd.width;
    gif.height = lsd.height;
    gif.iterations = 1;
    
    if (lsd.globalColorTable)
    {
      gct = readColorTable(lsd.globalColorTableSize);
      backgroundColorIndex = lsd.backgroundColorIndex;
      backgroundColor = gct[backgroundColorIndex];
    }
    
    readBlock();
    return gif;
  }
  throw "Not a Gif";
}

var app = angular.module('app', ["ngCookies"]);

app.controller('imageResultController',
  function($scope, $http, $cookies) {
    $scope.results = [];
    
    $scope.zoomLevels = [0.5, 1, 2, 3, 4, 6, 8, 10, 12, 16];
    
    $scope.zoomIn = function(item) {
      for(var i = 0; i < $scope.zoomLevels.length; i++) {
        if($scope.zoomLevels[i] > item.scale) {
          item.scale = $scope.zoomLevels[i];
          updateCanvasProperties(item);
          break;
        }
      }
    };
    
    $scope.zoomOut = function(item) {
      for(var i = $scope.zoomLevels.length - 1; i >= 0; i--) {
        if($scope.zoomLevels[i] < item.scale) {
          item.scale = $scope.zoomLevels[i];
          updateCanvasProperties(item);
          break;
        }
      }
    };
    
    $scope.sortResultBy = function(item, property) {
      if(item.sortProperty == property) {
        item.sortReverse = !item.sortReverse;
        return;
      }
      
      item.sortProperty = property;
      item.sortReverse = false;
    };
    
    $scope.computeStyle = function(item) {
      var style = {};
      
      //style.width = (item.width * item.scale) + 'px';
      //style.height = (item.height * item.scale) + 'px';
      
      if(item.height * item.scale < 416) {
        style.marginTop = (((416 - (item.height * item.scale)) / 2) >> 0) + 'px';// 0 0 0';
      }
      
      return style;
    };
    
    $scope.getColorUsage = function(item, count) {
      var totalCount = item.width * item.height;
      if (item.colors === item.totalColors) totalCount *= item.framesCount;
      
      var percentage = (count / totalCount) * 100;
      percentage = percentage.toFixed(1);
      
      if(percentage >= 0.1) {
        return percentage + '%';
      } else {
        return '<0.1%';
      }
    };
    
    $scope.selectPixels = function(me, pixels)
    {
      if (me.selectionPixels) $scope.deselectPixels(me, false);
      if (pixels && pixels.positions === false)
      {
        me.selectionPixelsARGB = pixels.argb;
        pixels = me.frames[me.currFrame].colors[pixels.argb];
      }
      if (!pixels)
      {
        me.internalContext.putImageData(me.selectionPixelsData, 0, 0);
        render(me);
        return;
      }
      me.selectionPixels = pixels;
      me.selectionPixelsARGB = pixels.argb;
      var positions = pixels.positions;
      var len = positions.length;
      var data = me.selectionPixelsData.data;
      var w = me.width;
      
      if ($scope.highlightingForeground === "color")
        var bgColor = $scope.highlightingForegroundColorRGB;
      else if ($scope.highlightingForeground === "inverted")
        var bgColor = [255 - pixels.red, 255 - pixels.green, 255 - pixels.blue];
      else var bgColor = [pixels.red, pixels.green, pixels.blue];
      
      for (var i = 0; i < len; i++)
      {
        var pos = positions[i];
        var offset = (pos.y * w + pos.x) * 4;
        data[offset    ] = bgColor[0];
        data[offset + 1] = bgColor[1];
        data[offset + 2] = bgColor[2];
        data[offset + 3] = 255;
      }
      
      me.internalContext.putImageData(me.selectionPixelsData, 0, 0);
      render(me);
    }
    
    $scope.deselectPixels = function(me, doRender)
    {
      if (doRender === undefined) doRender = true;
      if (!me.selectionPixels)
      {
        me.selectionPixelsARGB = null;
        return;
      }
      var positions = me.selectionPixels.positions;
      var len = positions.length;
      var data = me.selectionPixelsData.data;
      var w = me.width;
      if ($scope.highlightingBackground)
      {
        bgColor = $scope.highlightingBackgroundColorRGB;
        for (var i = 0; i < len; i++)
        {
          var pos = positions[i];
          var offset = (pos.y * w + pos.x) * 4;
          data[offset    ] = bgColor[0];
          data[offset + 1] = bgColor[1];
          data[offset + 2] = bgColor[2];
          data[offset + 3] = 128;
        }
      }
      else
      {
        for (var i = 0; i < len; i++)
        {
          var pos = positions[i];
          var offset = (pos.y * w + pos.x) * 4;
          data[offset    ] = data[offset + 1] = data[offset + 2] = data[offset + 3] = 0;
        }
      }
      me.selectionPixels = null;
      me.selectionPixelsARGB = null;
      if (doRender)
      {
        me.internalContext.putImageData(me.selectionPixelsData, 0, 0);
        render(me);
      }
    }
    
    $scope.nextFrame = function(me)
    {
      me.selectedFrame++;
      if (me.selectedFrame === me.framesCount)
      {
        me.selectedFrame = -1;
        me.colors = me.totalColors;
        me.colorCount = me.totalColorCount;
      }
      else
      {
        me.colors = me.frames[me.selectedFrame].colors;
        me.colorCount = me.frames[me.selectedFrame].count;
      }
      render(me);
    }
    
    $scope.prevFrame = function(me)
    {
      me.selectedFrame--;
      if (me.selectedFrame === -1)
      {
        me.colors = me.totalColors;
        me.colorCount = me.totalColorCount;
      }
      else
      {
        if (me.selectedFrame === -2) me.selectedFrame = me.framesCount - 1;
        me.colors = me.frames[me.selectedFrame].colors;
        me.colorCount = me.frames[me.selectedFrame].count;
      }
      render(me);
    }
    
    $scope.startScrolling = function(me, $event)
    {
      me.scrolling = true;
      me.lastScroll = $event;
      if (!me.scrollDiv)
      {
        me.scrollDiv = $event.target;
        while (!angular.element(me.scrollDiv).hasClass("result-image-display")) me.scrollDiv = me.scrollDiv.parentNode;
      }
      angular.element(document.body).addClass("noSelect");
    }
    
    $scope.stopScrolling = function()
    {
      for (var i = 0; i < $scope.results.length; i++)
      {
        $scope.results[i].scrolling = false;
      }
      angular.element(document.body).removeClass("noSelect");
    }
    
    $scope.updateScrolling = function($event)
    {
      var results = $scope.results;
      var len = results.length;
      for (var i = 0; i < len; i++)
      {
        var me = results[i];
        if (me.scrolling)
        {
          var offsetX = me.lastScroll.pageX - $event.pageX;
          var offsetY = me.lastScroll.pageY - $event.pageY;
          me.scrollLeft = me.scrollDiv.scrollLeft += offsetX;
          me.scrollTop = me.scrollDiv.scrollTop += offsetY;
          me.lastScroll = $event;
        }
      }
    }
    
    $scope.onInputKeyUp = function(event)
    {
      if (event.keyCode === 13 && event.ctrlKey)
      {
        $scope.loadImages();
      }
    }
    
    $scope.rebuildHighlightData = function()
    {
      var rgb = parseInt($scope.highlightingBackgroundColor.substr(1), 16);
      $scope.highlightingBackgroundColorRGB = [(rgb >> 16) & 0xFF, (rgb >> 8) & 0xFF, rgb & 0xFF];
      rgb = parseInt($scope.highlightingForegroundColor.substr(1), 16);
      $scope.highlightingForegroundColorRGB = [(rgb >> 16) & 0xFF, (rgb >> 8) & 0xFF, rgb & 0xFF];
      for (var i = 0; i < $scope.results.length; i++)
      {
        _rebuildHighlightData($scope.results[i]);
      }
      
      $cookies.highlightingBackground = $scope.highlightingBackground ? "1" : "0";
      $cookies.highlightingBackgroundColor = $scope.highlightingBackgroundColor;
      $cookies.highlightingForeground = $scope.highlightingForeground;
      $cookies.highlightingForegroundColor = $scope.highlightingForegroundColor;
    }
    
    function _rebuildHighlightData(me)
    {
      var data = me.selectionPixelsData.data;
      var len = data.length;
      if ($scope.highlightingBackground)
      {
        var bgColor = $scope.highlightingBackgroundColorRGB;
        for (var j = 0; j < len; j += 4)
        {
          data[j  ] = bgColor[0];
          data[j+1] = bgColor[1];
          data[j+2] = bgColor[2];
          data[j+3] = 128;
        }
      }
      else
      {
        for (var j = 0; j < len; j += 4)
        {
          data[j] = data[j+1] = data[j+2] = data[j+3] = 0;
        }
      }
      if (me.selectionPixels)
      {
        var pixels = me.selectionPixels;
        me.selectionPixels = null;
        $scope.selectPixels(me, pixels);
      }
    }
    
    $scope.loadImages = function()
    {
      if ($scope.images)
      {
        if ($scope.hasFlash && !flashReady) return;
        $scope.results = [];
        var split = $scope.images.split("\n");
        changeInputValue($scope.images);//history.pushState({}, "Image Specs", "?input=" + encodeURIComponent($scope.images));
        $scope.images = "";
        angular.forEach(split, function(item)
        {
          var me = { imageUrl:item, title:item, state:"Pending image..." };
          $scope.results.push(me);
          $http.get("getImage.php", {params:{input:item}, responseType:"text"}).success(function (data)
          {
            if (typeof data === "string" || data.error)
            {
              angular.extend(me, { "title":me.imageUrl, "error":"Cannot read image!" });
              $scope.results.push(me);
            }
            else
            {
              angular.extend(me, data);
              me.state = "Decoding...";
              me.contentRaw = atob(me.content);
              me.image = new Image();
              me.internalCanvas = document.createElement("canvas");
              me.internalContext = me.internalCanvas.getContext("2d");
              me.canvas = document.createElement("canvas");
              me.context = me.canvas.getContext("2d");
              me.sortProperty = 'count';
              me.sortReverse = true;
              me.scale = 1;
              me.image.onload = function() { scanImage(me) };
              me.image.src = "data:image/png;base64," + me.content;
            }
          });
        });
      }
    }
    
    function changeInputValue(newInput)
    {
      var search = location.search;
      if (!search) history.pushState({}, "Image Specs", "?input=" + encodeURIComponent(newInput));
      else
      {
        var results = /[\\?&]input=([^&]*)/.exec(search);
        if (results === null)
        {
          if (search.charAt(0) === "?") history.pushState({}, "Image Specs", search + "&input=" + encodeURIComponent(newInput));
          else history.pushState({}, "Image Specs", "?input=" + encodeURIComponent(newInput));
        }
        else
        {
          history.pushState({}, "Image Specs", search.replace(results[1], encodeURIComponent(newInput)));
        }
      }
    }
    
    function updateCanvasProperties(me)
    {
      me.canvas.width = me.width * me.scale;
      me.canvas.height = me.height * me.scale;
      me.context.mozImageSmoothingEnabled = false;
      me.context.webkitImageSmoothingEnabled = false;
      me.context.imageSmoothingEnabled = false;
      me.context.scale(me.scale, me.scale);
      render(me);
    }
    
    function updateAnimations(timestamp)
    {
      var results = $scope.results;
      var len = results.length;
      for (var i = 0; i < len; i++)
      {
        var result = results[i];
        if (result.isAnimated && result.selectedFrame === -1)
        {
          if (!result.lastTime) result.lastTime = timestamp;
          var elapsed =  timestamp - result.lastTime;
          var currFrame = result.currFrame;
          result.lastTime = timestamp;
          result.iterationTime += elapsed;
          while (result.iterationTime >= result.iterationDelay)
          {
            result.iterationTime -= result.iterationDelay;
            result.currFrame++;
            if (result.currFrame === result.frames.length)
            {
              result.iterationsDone++;
              if (result.iterations === 0 || result.iterationsDone < result.iterations) result.currFrame = 0;
              else result.currFrame--;
            }
            result.iterationDelay = result.frames[result.currFrame].delay;
          }
          
          if (currFrame !== result.currFrame)
          {
            if (result.selectionPixelsARGB !== null)
            {
              var argb = result.selectionPixelsARGB;
              $scope.selectPixels(result, result.frames[result.currFrame].colors[argb]);
              result.selectionPixelsARGB = argb;
            }
            render(result);
          }
        }
        
        if (result.scrolling)
        {
          result.scrollDiv.scrollLeft = result.scrollLeft;
          result.scrollDiv.scrollTop = result.scrollTop;
        }
      }
      requestAnimationFrame(updateAnimations);
    }
    
    requestAnimationFrame(updateAnimations);
    
    function render(me)
    {
      if (me.selectedFrame == -1)
      {
        if (me.isAnimated)
        {
          me.context.clearRect(0, 0, me.width, me.height);
          /*if (me.flash)
          {
            //me.context.drawImage(me.image, 0, -me.height * me.currFrame);
            flashRender(me, me.currFrame, me.prevFrame);
            me.context.drawImage(me.gifCanvas, 0, 0);
          }
          else
          {*/
            var frame = me.frames[me.currFrame];
            me.gifContext.putImageData(frame.data, 0, 0);
            me.context.drawImage(me.gifCanvas, 0, 0);
          // }
        }
        else
        {
          me.context.clearRect(0, 0, me.width, me.height);
          me.context.drawImage(me.image, 0, 0);
        }
      }
      else
      {
        if (me.isAnimated)
        {
          me.context.clearRect(0, 0, me.width, me.height);
          /*if (me.flash)
          {
            //me.context.drawImage(me.image, 0, -me.height * me.selectedFrame);
            flashRender(me, me.selectedFrame, me.prevFrame);
            me.context.drawImage(me.gifCanvas, 0, 0);
          }
          else
          {*/
            var frame = me.frames[me.selectedFrame];
            me.gifContext.putImageData(frame.data, 0, 0);
            me.context.drawImage(me.gifCanvas, 0, 0);
          // }
        }
        else
        {
          me.context.clearRect(0, 0, me.width, me.height);
          me.context.drawImage(me.image, 0, 0);
        }
      }
      if (me.selectionPixelsARGB !== null) me.context.drawImage(me.internalCanvas, 0, 0);
    }
    
    function scanImage(me)
    {
      me.fileType = readExtension(me.contentRaw);
      me.isIndexed = me.fileType === "GIF";
      me.width = me.image.width;
      me.height = me.image.height;
      me.internalCanvas.width = me.canvas.width = me.width;
      me.internalCanvas.height = me.canvas.height = me.height;
      var data = me.selectionPixelsData = me.internalContext.createImageData(me.width, me.height);
      _rebuildHighlightData(me);
      me.selectionPixels = null;
      me.selectionPixelsARGB = null;
      me.fileSize = me.contentRaw.length;
      me.frames = [];
      me.colors = {};
      me.colorCount = 0;
      me.totalColors = {};
      me.totalColorCount = 0;
      me.selectedFrame = -1;
      if (me.fileType === "GIF")
      {
        gifScan(me);
      }
      else
      {
        defaultScan(me);
      }
    }
    
    function finalizeImage(me)
    {
      me.framesCount = me.frames.length;
      me.isAnimated = me.framesCount > 1;
      me.internalContext.clearRect(0, 0, me.width, me.height);
      render(me);
      me.ready = true;
      $scope.$apply();
    }
    
    function defaultScan(me)
    {
      me.internalContext.drawImage(me.image, 0, 0);
      var data = me.internalContext.getImageData(0, 0, me.width, me.height);
      var colors = me.frames[0] = scanColors(data.data, me.width);
      me.colorCount = me.totalColorCount = colors.count;
      me.colors = me.totalColors = colors.colors;
      finalizeImage(me);
    }
    
    function gifScan(me, ready)
    {
      try
      {
        var totalColors = {};
        var totalColorCount = 0;
        /*
        if ($scope.hasFlash && flashReady)
        {
          if (!ready)
          {
            registerParserWaiter(gifScan, me, $scope);
            return;
          }
          me.state = "Scanning...";
          $scope.$apply();
            
          me.gifCanvas = document.createElement("canvas");
          me.gifContext = me.gifCanvas.getContext("2d");
          me.gifCanvas.width = me.width;
          me.gifCanvas.height = me.height;
          
          var frames = me.info;
          var len = frames.length;
          var y = 0;
          for (var i = 0; i < len; i++)
          {
            flashRender(me, i, i - 1);
            var pixels = me.gifContext.getImageData(0, 0, me.width, me.height);
            var info = frames[i];
            var colors = scanColors(pixels.data, me.width);
            delete pixels;
            colors.info = info;
            colors.delay = info.delay;
            me.frames.push(colors);
            
            var keys = Object.keys(colors.colors);
            var color;
            for (var j = 0; j < keys.length; j++)
            {
              var argb = colors.colors[keys[j]];
              if (totalColors[argb.argb]) color = totalColors[argb.argb];
              else
              {
                color = { red:argb.red, green:argb.green, blue:argb.blue, alpha:argb.alpha, count:0, argb:argb.argb, positions:false, hue:argb.hue, saturation:argb.saturation, value:argb.value, hexadecimal:argb.hexadecimal };
                totalColors[argb.argb] = color;
                totalColorCount++;
              }
              color.count += argb.count;
            }
            y += me.height;
          }
          delete me.prevFrame;
        }
        else
        {
        */
        var gif = parseGif(me.contentRaw);
        me.gifCanvas = document.createElement("canvas");
        me.gifContext = me.gifCanvas.getContext("2d");
        me.gifCanvas.width = me.width = gif.width;
        me.gifCanvas.height = me.height = gif.height;
        me.iterations = gif.iterations;
        //me.flash = false;
        var frames = gif.frames;
        var len = frames.length;
        for (var i = 0; i < len; i++)
        {
          var frame = frames[i];
          var colors = scanColors(frame.data.data, me.width);
          colors.data = frame.data;
          colors.delay = frame.delay;
          me.frames.push(colors);
          
          var keys = Object.keys(colors.colors);
          var color;
          for (var j = 0; j < keys.length; j++)
          {
            var argb = colors.colors[keys[j]];
            if (totalColors[argb.argb]) color = totalColors[argb.argb];
            else
            {
              color = { red:argb.red, green:argb.green, blue:argb.blue, alpha:argb.alpha, count:0, argb:argb.argb, positions:false, hue:argb.hue, saturation:argb.saturation, value:argb.value, hexadecimal:argb.hexadecimal };
              totalColors[argb.argb] = color;
              totalColorCount++;
            }
            color.count += argb.count;
          }
        }
        // }
      }
      catch (e)
      {
        me.error = "Error at parsing Gif image!";
        if (e == "out of memory") me.error += " This Gif is too large (out of memory).";
        return;
      }
      me.totalColors = totalColors;
      me.totalColorCount = totalColorCount;
      me.colors = totalColors;
      me.colorCount = totalColorCount;
      me.iterationsDone = 0;
      me.currFrame = 0;
      me.iterationTime = 0;
      me.iterationDelay = me.frames[0].delay;
      finalizeImage(me);
    }
    
    function zerofill(value, count)
    {
      while(value.length < count) value = '0' + value;
      return value;
    }
    
    function scanColors(pixels, width)
    {
      var len = pixels.length;
      var count = len / 4;
      var result = {};
      var count = 0;
      var colorInfo;
      var x = 0;
      var y = 0;
      for (var i = 0; i < len; i += 4)
      {
        var argb = (pixels[i + 3] << 24) + (pixels[i] << 16) + (pixels[i + 1] << 8) + pixels[i + 2];
        if (result[argb]) colorInfo = result[argb];
        else
        {
          colorInfo = { "red": pixels[i], "green": pixels[i+1], "blue": pixels[i+2], "alpha": pixels[i+3], count:0, argb:argb, positions: [] };
          var hsv = RGBToHSV(colorInfo.red, colorInfo.green, colorInfo.blue);
          colorInfo.hue = hsv.hue; colorInfo.saturation = hsv.saturation; colorInfo.value = hsv.value;
          colorInfo.hexadecimal = zerofill(((colorInfo.red << 16) + (colorInfo.green << 8) + colorInfo.blue).toString(16), 6);
          result[argb] = colorInfo;
          count++;
        }
        colorInfo.count++;
        colorInfo.positions.push({ x:x, y:y });
        
        x++;
        if (x === width)
        {
          x = 0;
          y++;
        }
      }
      
      return { colors:result, count:count };
    }
    
    function RGBToHSV(r, g, b)
    {
      r = r / 255;
      g = g / 255;
      b = b / 255;
      var min = Math.min(r, g, b);
      var max = Math.max(r, g, b);
      
      var delta = max - min;
      
      var h, s, v;
      v = max;
      if (max != 0)
      {
        s = delta / max;
        if (r === max) h = (g - b) / delta;
        else if (g === max) h = 2 + (b - r) / delta;
        else h = 4 + (r - g) / delta;
        h *= 60;
        if (h < 0) h += 360;
      }
      else
      {
        s = h = 0;
      }
      if (isNaN(h)) h = 0;
      return { hue:h, saturation:s * 100, value:v * 100 }
    }

    function readExtension(decoded)
    {
      if (decoded.substr(0, 3) === "GIF") return "GIF";
      if (decoded.charCodeAt(0) === 0xFF && decoded.charCodeAt(1) === 0xD8) return "JPG";
      if (decoded.charCodeAt(0) === 0x89 && decoded.substr(1, 3) === "PNG") return "PNG";
      return "Unknown format";
    }
    
    function getParameter(name)
    {
      var results = new RegExp( "[\\?&]"+name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]")+"=([^&#]*)" ).exec( window.location.href );
      if( results == null )
          return "";
      else
          return results[1];
    }
    
    $scope.isWebkit = navigator.userAgent.indexOf("AppleWebKit/") !== -1;
    $scope.isGecko = navigator.userAgent.indexOf("Gecko/") !== -1;
    $scope.hasCanvas = window.HTMLCanvasElement !== undefined && window.CanvasRenderingContext2D !== undefined;
    $scope.fromPJ = document.referrer.indexOf("pixeljoint.com") !== -1;
    $scope.pjRefferer = document.referrer;
    
    if (angular.isDefined($cookies.highlightingBackgroundColor))
    {
      $scope.highlightingBackground = $cookies.highlightingBackground === "1";
      $scope.highlightingBackgroundColor = $cookies.highlightingBackgroundColor;
      $scope.highlightingForeground = $cookies.highlightingForeground;
      $scope.highlightingForegroundColor = $cookies.highlightingForegroundColor;
    }
    else
    {
      $scope.highlightingBackground = true;
      $cookies.highlightingBackground = "1";
      $scope.highlightingBackgroundColor = $cookies.highlightingBackgroundColor = "#000000";
      $scope.highlightingForeground = $cookies.highlightingForeground = "color";
      $scope.highlightingForegroundColor = $cookies.highlightingForegroundColor = "#FF0000";
    }
    $scope.rebuildHighlightData();
    
    $scope.oldUrl = location.host.indexOf("akira.hopto.org") != -1;
    
    /*
    function checkFlashReady()
    {
      if (flashReady)
      {
        var inputs = getParameter("input");
        if (inputs)
        {
          $scope.images = decodeURIComponent(inputs);
          $scope.loadImages();
        }
        return;
      }
      requestAnimationFrame(checkFlashReady);
    }
    
    if ($scope.hasFlash && !flashReady)
    {
      requestAnimationFrame(checkFlashReady);
    }
    else
    {*/
      var inputs = getParameter("input");
      if (inputs)
      {
        $scope.images = decodeURIComponent(inputs);
        $scope.loadImages();
      }
    // }
  }
);

app.directive("canvasPlaceholder", function()
{
  return {
    link: function($scope, $element, $attrs) {
      $element.append($scope.$parent.result.canvas);
    }
  }
});

app.directive("colorPicker", function()
{
  return {
    link: function($scope, $element, $attrs)
    {
      var el = $element[0];
      function checkoutChange()
      {
        requestAnimationFrame(checkoutChange);
        if ($scope[$attrs.ngModel] !== el.value) $scope[$attrs.ngModel] = el.value;
      }
      requestAnimationFrame(checkoutChange);
    }
  }
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
