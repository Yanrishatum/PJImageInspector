(function (console) { "use strict";
var Main = function() { };
Main.main = function() {
	window.readGif = gif_GifDecoder.readGif;
};
var gif_GifBytes = function(input) {
	this.input = new Uint8Array(input);
	this.length = this.input.length;
	this.position = 0;
};
gif_GifBytes.prototype = {
	readString: function(len) {
		var result = "";
		while(--len >= 0) result += String.fromCharCode(this.input[this.position++]);
		return result;
	}
};
var gif_GifDecoder = function() { };
gif_GifDecoder.readPalette = function(bytes,size) {
	size *= 3;
	var out = new Uint8Array(size);
	var _g = 0;
	while(_g < size) {
		var i = _g++;
		out[i] = bytes.input[bytes.position++];
	}
	return out;
};
gif_GifDecoder.deinterlace = function(f,t,step,y,off,width,height) {
	var x;
	var target;
	while(y < height) {
		x = y * width;
		target = x + width;
		while(x < target) t[x++] = f[off++];
		y += step;
	}
	return off;
};
gif_GifDecoder.readImage = function(bytes,file,gce) {
	var x = bytes.input[bytes.position++] | bytes.input[bytes.position++] << 8;
	var y = bytes.input[bytes.position++] | bytes.input[bytes.position++] << 8;
	var width = bytes.input[bytes.position++] | bytes.input[bytes.position++] << 8;
	var height = bytes.input[bytes.position++] | bytes.input[bytes.position++] << 8;
	var packed = bytes.input[bytes.position++];
	var hasLCT = (packed & 128) == 128;
	var interlaced = (packed & 64) == 64;
	var lctSize = 2 << (packed & 7);
	var ct = file.gct;
	if(hasLCT) {
		var tmp1;
		var size = lctSize;
		size *= 3;
		var out = new Uint8Array(size);
		var _g = 0;
		while(_g < size) {
			var i = _g++;
			out[i] = bytes.input[bytes.position++];
		}
		tmp1 = out;
		ct = tmp1;
	}
	if(ct == null) throw new Error("No color table!");
	var tmp;
	var len = width * height;
	var pixels1 = new Uint8Array(len);
	var minCodeSize = bytes.input[bytes.position++];
	var blockSize = bytes.input[bytes.position++] - 1;
	var bits = bytes.input[bytes.position++];
	var bitsCount = 8;
	var cc = 1 << minCodeSize;
	var eoi = cc + 1;
	var codeSize = minCodeSize + 1;
	var nextSize = 1 << codeSize;
	var codeMask = nextSize - 1;
	var i1 = 0;
	var baseDict = [];
	while(i1 < cc) {
		baseDict[i1] = [i1];
		i1++;
	}
	var dictLen = cc + 2;
	var dict = baseDict;
	var newArr;
	var code = 0;
	var last = 0;
	i1 = 0;
	while(i1 < len) {
		last = code;
		var tmp2;
		while(bitsCount < codeSize) {
			if(blockSize == 0) break;
			bits |= bytes.input[bytes.position++] << bitsCount;
			bitsCount += 8;
			blockSize--;
			if(blockSize == 0) blockSize = bytes.input[bytes.position++];
		}
		var c = bits & codeMask;
		bits >>= codeSize;
		bitsCount -= codeSize;
		tmp2 = c;
		code = tmp2;
		if(code == cc) {
			dict = baseDict.slice();
			dictLen = cc + 2;
			codeSize = minCodeSize + 1;
			nextSize = 1 << codeSize;
			codeMask = nextSize - 1;
			continue;
		}
		if(code == eoi) break;
		if(code < dictLen) {
			if(last != cc) {
				newArr = dict[last].slice();
				newArr.push(dict[code][0]);
				dict[dictLen++] = newArr;
			}
		} else {
			if(code != dictLen) throw new Error("Invalid LZW");
			newArr = dict[last].slice();
			newArr.push(dict[last][0]);
			dict[dictLen++] = newArr;
		}
		var _g1 = 0;
		var _g11 = dict[code];
		while(_g1 < _g11.length) {
			var item = _g11[_g1];
			++_g1;
			pixels1[i1++] = item;
		}
		if(dictLen == nextSize && codeSize < 12) {
			codeSize++;
			nextSize = 1 << codeSize;
			codeMask = nextSize - 1;
		}
	}
	while(blockSize > 0) {
		bytes.position += blockSize;
		blockSize = bytes.input[bytes.position++];
	}
	tmp = pixels1;
	var pixels = tmp;
	if(interlaced) {
		var tempBuffer = new Uint8Array(width * height);
		var tmp3;
		var y1 = 0;
		var off = 0;
		var x1;
		var target;
		while(y1 < height) {
			x1 = y1 * width;
			target = x1 + width;
			while(x1 < target) tempBuffer[x1++] = pixels[off++];
			y1 += 8;
		}
		tmp3 = off;
		var offset = tmp3;
		var tmp4;
		var y2 = 4;
		var off1 = offset;
		var x2;
		var target1;
		while(y2 < height) {
			x2 = y2 * width;
			target1 = x2 + width;
			while(x2 < target1) tempBuffer[x2++] = pixels[off1++];
			y2 += 8;
		}
		tmp4 = off1;
		offset = tmp4;
		var tmp5;
		var y3 = 2;
		var off2 = offset;
		var x3;
		var target2;
		while(y3 < height) {
			x3 = y3 * width;
			target2 = x3 + width;
			while(x3 < target2) tempBuffer[x3++] = pixels[off2++];
			y3 += 4;
		}
		tmp5 = off2;
		offset = tmp5;
		var y4 = 1;
		var off3 = offset;
		var x4;
		var target3;
		while(y4 < height) {
			x4 = y4 * width;
			target3 = x4 + width;
			while(x4 < target3) tempBuffer[x4++] = pixels[off3++];
			y4 += 2;
		}
		pixels = tempBuffer;
	}
	file.frames.push(new gif_GifFrame(x,y,width,height,pixels,ct,gce != null?gce.delay:10,gce != null && gce.transparentColor?gce.transparentIndex:-1,gce != null?gce.disposalMethod:0));
};
gif_GifDecoder.readGif = function(input) {
	var bytes = new gif_GifBytes(input);
	if(bytes.readString(3) != "GIF") throw new Error("Invalid header");
	bytes.position += 3;
	var file = new gif_GifFile();
	file.width = bytes.input[bytes.position++] | bytes.input[bytes.position++] << 8;
	file.height = bytes.input[bytes.position++] | bytes.input[bytes.position++] << 8;
	file.widthInBytes = file.width * 4;
	var packed = bytes.input[bytes.position++];
	var hasGCT = (packed & 128) == 128;
	var gctSize = 2 << (packed & 7);
	file.bgColorIndex = bytes.input[bytes.position++];
	bytes.position++;
	if(hasGCT) file.gct = (function($this) {
		var $r;
		var size = gctSize;
		size *= 3;
		var out = new Uint8Array(size);
		{
			var _g = 0;
			while(_g < size) {
				var i = _g++;
				out[i] = bytes.input[bytes.position++];
			}
		}
		$r = out;
		return $r;
	}(this));
	var gce = null;
	var blockId;
	while(bytes.position < bytes.length) {
		blockId = bytes.input[bytes.position++];
		switch(blockId) {
		case 59:
			return file;
		case 44:
			var x = bytes.input[bytes.position++] | bytes.input[bytes.position++] << 8;
			var y = bytes.input[bytes.position++] | bytes.input[bytes.position++] << 8;
			var width = bytes.input[bytes.position++] | bytes.input[bytes.position++] << 8;
			var height = bytes.input[bytes.position++] | bytes.input[bytes.position++] << 8;
			var packed1 = bytes.input[bytes.position++];
			var hasLCT = (packed1 & 128) == 128;
			var interlaced = (packed1 & 64) == 64;
			var lctSize = 2 << (packed1 & 7);
			var ct = file.gct;
			if(hasLCT) ct = (function($this) {
				var $r;
				var size1 = lctSize;
				size1 *= 3;
				var out1 = new Uint8Array(size1);
				{
					var _g2 = 0;
					while(_g2 < size1) {
						var i2 = _g2++;
						out1[i2] = bytes.input[bytes.position++];
					}
				}
				$r = out1;
				return $r;
			}(this));
			if(ct == null) throw new Error("No color table!");
			var pixels1 = (function($this) {
				var $r;
				var len = width * height;
				var pixels = new Uint8Array(len);
				var minCodeSize = bytes.input[bytes.position++];
				var blockSize = bytes.input[bytes.position++] - 1;
				var bits = bytes.input[bytes.position++];
				var bitsCount = 8;
				var cc = 1 << minCodeSize;
				var eoi = cc + 1;
				var codeSize = minCodeSize + 1;
				var nextSize = 1 << codeSize;
				var codeMask = nextSize - 1;
				var i1 = 0;
				var baseDict = [];
				while(i1 < cc) {
					baseDict[i1] = [i1];
					i1++;
				}
				var dictLen = cc + 2;
				var dict = baseDict;
				var newArr;
				var code = 0;
				var last = 0;
				i1 = 0;
				var j;
				while(i1 < len) {
					last = code;
					code = (function($this) {
						var $r;
						while(bitsCount < codeSize) {
							if(blockSize == 0) break;
							bits |= bytes.input[bytes.position++] << bitsCount;
							bitsCount += 8;
							blockSize--;
							if(blockSize == 0) blockSize = bytes.input[bytes.position++];
						}
						var c = bits & codeMask;
						bits >>= codeSize;
						bitsCount -= codeSize;
						$r = c;
						return $r;
					}($this));
					if(code == cc) {
						dict = baseDict.slice();
						dictLen = cc + 2;
						codeSize = minCodeSize + 1;
						nextSize = 1 << codeSize;
						codeMask = nextSize - 1;
						continue;
					}
					if(code == eoi) break;
					if(code < dictLen) {
						if(last != cc) {
							newArr = dict[last].slice();
							newArr.push(dict[code][0]);
							dict[dictLen++] = newArr;
						}
					} else {
						if(code != dictLen) throw new Error("Invalid LZW");
						newArr = dict[last].slice();
						newArr.push(dict[last][0]);
						dict[dictLen++] = newArr;
					}
					var _g1 = 0;
					var _g11 = dict[code];
					while(_g1 < _g11.length) {
						var item = _g11[_g1];
						++_g1;
						pixels[i1++] = item;
					}
					if(dictLen == nextSize && codeSize < 12) {
						codeSize++;
						nextSize = 1 << codeSize;
						codeMask = nextSize - 1;
					}
				}
				while(blockSize > 0) {
					bytes.position += blockSize;
					blockSize = bytes.input[bytes.position++];
				}
				$r = pixels;
				return $r;
			}(this));
			if(interlaced) {
				var tempBuffer = new Uint8Array(width * height);
				var offset = (function($this) {
					var $r;
					var y1 = 0;
					var off = 0;
					var x1;
					var target;
					while(y1 < height) {
						x1 = y1 * width;
						target = x1 + width;
						while(x1 < target) tempBuffer[x1++] = pixels1[off++];
						y1 += 8;
					}
					$r = off;
					return $r;
				}(this));
				offset = (function($this) {
					var $r;
					var y2 = 4;
					var off1 = offset;
					var x2;
					var target1;
					while(y2 < height) {
						x2 = y2 * width;
						target1 = x2 + width;
						while(x2 < target1) tempBuffer[x2++] = pixels1[off1++];
						y2 += 8;
					}
					$r = off1;
					return $r;
				}(this));
				offset = (function($this) {
					var $r;
					var y3 = 2;
					var off2 = offset;
					var x3;
					var target2;
					while(y3 < height) {
						x3 = y3 * width;
						target2 = x3 + width;
						while(x3 < target2) tempBuffer[x3++] = pixels1[off2++];
						y3 += 4;
					}
					$r = off2;
					return $r;
				}(this));
				var y4 = 1;
				var off3 = offset;
				var x4;
				var target3;
				while(y4 < height) {
					x4 = y4 * width;
					target3 = x4 + width;
					while(x4 < target3) tempBuffer[x4++] = pixels1[off3++];
					y4 += 2;
				}
				off3;
				pixels1 = tempBuffer;
			}
			file.frames.push(new gif_GifFrame(x,y,width,height,pixels1,ct,gce != null?gce.delay:10,gce != null && gce.transparentColor?gce.transparentIndex:-1,gce != null?gce.disposalMethod:0));
			gce = null;
			break;
		case 33:
			var extId = bytes.input[bytes.position++];
			switch(extId) {
			case 249:
				bytes.position++;
				var packed2 = bytes.input[bytes.position++];
				var disposalMethod = (packed2 & 28) >> 2;
				var delay = bytes.input[bytes.position++] | bytes.input[bytes.position++] << 8;
				var idx = bytes.input[bytes.position++];
				bytes.position++;
				gce = { disposalMethod : disposalMethod == 2 || disposalMethod == 3?disposalMethod - 1:0, transparentColor : (packed2 & 1) == 1, delay : delay, transparentIndex : idx};
				break;
			case 255:
				bytes.position++;
				var nameVer = bytes.readString(11);
				if(nameVer == "NETSCAPE2.0") {
					var len1 = bytes.input[bytes.position++];
					var type = bytes.input[bytes.position++];
					if(type == 1) {
						file.loops = bytes.input[bytes.position++] | bytes.input[bytes.position++] << 8;
						bytes.position++;
					} else bytes.position += len1 - 1;
				} else {
					var len2;
					while((len2 = bytes.input[bytes.position++]) != 0) bytes.position += len2;
				}
				break;
			default:
				var len3;
				while((len3 = bytes.input[bytes.position++]) != 0) bytes.position += len3;
			}
			break;
		}
	}
	return file;
};
var gif_GifFile = function() {
	this.loops = 1;
	this.frames = [];
};
gif_GifFile.prototype = {
	init: function(context) {
		this.context = context;
		this.imageData = context.createImageData(this.width,this.height);
		this.frame = this.frames[0];
		this.frameIndex = 0;
		this.frame.render(this.imageData.data,this.widthInBytes);
		this._t = 0;
		this.loops = 1;
	}
	,reset: function() {
		var d = this.imageData.data;
		var l = d.length;
		var i = 0;
		while(i < l) {
			d[i] = 0;
			d[i + 1] = 0;
			d[i + 2] = 0;
			d[i + 3] = 0;
			i += 4;
		}
		this.frame = this.frames[0];
		this.frameIndex = 0;
		this._t = 0;
		this.frame.render(this.imageData.data,this.widthInBytes);
	}
	,renderAt: function(idx) {
		this.reset();
		while(this.frameIndex < idx) this.update(this.frame.delay);
	}
	,update: function(dt) {
		if(this.frames.length == 1) return false;
		this._t += dt;
		if(this._t >= this.frame.delay) {
			this.frameIndex = (this.frameIndex + 1) % this.frames.length;
			if(this.frameIndex == 0) {
				var d = this.imageData.data;
				var l = d.length;
				var _g = 0;
				while(_g < l) {
					var i = _g++;
					d[i] = 0;
				}
			}
			this._t -= this.frame.delay;
			this.frame.dispose(this.imageData.data,this.widthInBytes);
			this.frame = this.frames[this.frameIndex];
			this.frame.render(this.imageData.data,this.widthInBytes);
			return true;
		}
		return false;
	}
};
var gif_GifFrame = function(x,y,width,height,pixels,palette,delay,transparentIndex,disposalMethod) {
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	this.widthInBytes = width * 4;
	this.xInBytes = x * 4;
	this.pixels = pixels;
	this.pixelsCount = width * height;
	this.palette = palette;
	if(delay < 2) delay = 10;
	this.delay = delay * 10;
	this.transparentIndex = transparentIndex;
	this.disposalMethod = disposalMethod;
	if(disposalMethod == 2) {
		this.prevState = new Uint8ClampedArray(this.pixelsCount * 4);
		this.prevStateInitialized = false;
	}
};
gif_GifFrame.prototype = {
	dispose: function(data,width) {
		var pc = this.pixelsCount;
		var x;
		var y;
		var target;
		var i = 0;
		if(this.disposalMethod == 1) {
			y = this.y * width;
			x = y + this.xInBytes;
			target = x + this.widthInBytes;
			while(i < pc) {
				data[x] = 0;
				data[x + 1] = 0;
				data[x + 2] = 0;
				data[x + 3] = 0;
				i++;
				if((x += 4) >= target) {
					y += width;
					x = y + this.xInBytes;
					target = x + this.widthInBytes;
				}
			}
		} else if(this.disposalMethod == 2 && this.prevStateInitialized) {
			y = this.y * width;
			x = y + this.xInBytes;
			target = x + this.widthInBytes;
			var s = this.prevState;
			var offset = 0;
			while(i < pc) {
				data[x] = s[offset++];
				data[x + 1] = s[offset++];
				data[x + 2] = s[offset++];
				data[x + 3] = s[offset++];
				i++;
				if((x += 4) >= target) {
					y += width;
					x = y + this.xInBytes;
					target = x + this.widthInBytes;
				}
			}
		}
	}
	,render: function(data,width) {
		var y = this.y * width;
		var x = y + this.xInBytes;
		var target = x + this.widthInBytes;
		var offset = 0;
		var i = 0;
		var pc = this.pixelsCount;
		var p = this.pixels;
		var pal = this.palette;
		if(this.disposalMethod == 2 && !this.prevStateInitialized) {
			var s = this.prevState;
			while(i < pc) {
				s[offset++] = data[x];
				s[offset++] = data[x + 1];
				s[offset++] = data[x + 2];
				s[offset++] = data[x + 3];
				i++;
				if((x += 4) >= target) {
					y += width;
					x = y + this.xInBytes;
					target = x + this.widthInBytes;
				}
			}
			this.prevStateInitialized = true;
			y = this.y * width;
			x = y + this.xInBytes;
			target = x + this.widthInBytes;
			i = 0;
			offset = 0;
		}
		if(this.transparentIndex != -1) {
			var transparent = this.transparentIndex * 3;
			while(i < pc) {
				offset = p[i] * 3;
				if(offset != transparent) {
					data[x] = pal[offset++];
					data[x + 1] = pal[offset++];
					data[x + 2] = pal[offset];
					data[x + 3] = 255;
				}
				i++;
				if((x += 4) >= target) {
					y += width;
					x = y + this.xInBytes;
					target = x + this.widthInBytes;
				}
			}
		} else while(i < pc) {
			offset = p[i] * 3;
			data[x] = pal[offset++];
			data[x + 1] = pal[offset++];
			data[x + 2] = pal[offset];
			data[x + 3] = 255;
			i++;
			if((x += 4) >= target) {
				y += width;
				x = y + this.xInBytes;
				target = x + this.widthInBytes;
			}
		}
	}
};
Main.main();
})(typeof console != "undefined" ? console : {log:function(){}});
