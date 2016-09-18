var $estr = function() { return js_Boot.__string_rec(this,''); };
function $extend(from, fields) {
	function Inherit() {} Inherit.prototype = from; var proto = new Inherit();
	for (var name in fields) proto[name] = fields[name];
	if( fields.toString !== Object.prototype.toString ) proto.toString = fields.toString;
	return proto;
}
var HxOverrides = function() { };
HxOverrides.__name__ = true;
HxOverrides.cca = function(s,index) {
	var x = s.charCodeAt(index);
	if(x != x) return undefined;
	return x;
};
var haxe_io_Input = function() { };
haxe_io_Input.__name__ = true;
haxe_io_Input.prototype = {
	readByte: function() {
		throw new js__$Boot_HaxeError("Not implemented");
	}
	,readBytes: function(s,pos,len) {
		var k = len;
		var b = s.b;
		if(pos < 0 || len < 0 || pos + len > s.length) throw new js__$Boot_HaxeError(haxe_io_Error.OutsideBounds);
		while(k > 0) {
			b[pos] = this.readByte();
			pos++;
			k--;
		}
		return len;
	}
	,set_bigEndian: function(b) {
		this.bigEndian = b;
		return b;
	}
	,readFullBytes: function(s,pos,len) {
		while(len > 0) {
			var k = this.readBytes(s,pos,len);
			pos += k;
			len -= k;
		}
	}
	,read: function(nbytes) {
		var s = haxe_io_Bytes.alloc(nbytes);
		var p = 0;
		while(nbytes > 0) {
			var k = this.readBytes(s,p,nbytes);
			if(k == 0) throw new js__$Boot_HaxeError(haxe_io_Error.Blocked);
			p += k;
			nbytes -= k;
		}
		return s;
	}
	,readUInt16: function() {
		var ch1 = this.readByte();
		var ch2 = this.readByte();
		return this.bigEndian?ch2 | ch1 << 8:ch1 | ch2 << 8;
	}
	,readInt32: function() {
		var ch1 = this.readByte();
		var ch2 = this.readByte();
		var ch3 = this.readByte();
		var ch4 = this.readByte();
		return this.bigEndian?ch4 | ch3 << 8 | ch2 << 16 | ch1 << 24:ch1 | ch2 << 8 | ch3 << 16 | ch4 << 24;
	}
	,readString: function(len) {
		var b = haxe_io_Bytes.alloc(len);
		this.readFullBytes(b,0,len);
		return b.toString();
	}
};
var JSBufferInput = function(buf) {
	this.position = 0;
	this.buffer = buf;
	this.bytes = new Uint8Array(buf);
};
JSBufferInput.__name__ = true;
JSBufferInput.__super__ = haxe_io_Input;
JSBufferInput.prototype = $extend(haxe_io_Input.prototype,{
	readByte: function() {
		return this.bytes[this.position++];
	}
	,readInt32: function() {
		return this.bytes[this.position++] << 24 | this.bytes[this.position++] << 16 | this.bytes[this.position++] << 8 | this.bytes[this.position++];
	}
	,readString: function(len) {
		var str = "";
		while(len > 0) {
			str += String.fromCharCode(this.bytes[this.position++]);
			len--;
		}
		return str;
	}
	,read: function(nbytes) {
		var b = haxe_io_Bytes.alloc(nbytes);
		var _g = 0;
		while(_g < nbytes) {
			var i = _g++;
			var v = this.bytes[this.position++];
			b.b[i] = v & 255;
		}
		return b;
	}
});
var List = function() {
	this.length = 0;
};
List.__name__ = true;
List.prototype = {
	add: function(item) {
		var x = [item];
		if(this.h == null) this.h = x; else this.q[1] = x;
		this.q = x;
		this.length++;
	}
};
Math.__name__ = true;
var Png = function(data) {
	var d = new format_png_Reader(new JSBufferInput(data)).read();
	var h = format_png_Tools.getHeader(d);
	{
		var _g = h.color;
		switch(_g[1]) {
		case 0:
			if(_g[2]) this.type = "PNG (Grayscale)"; else this.type = "PNG (Grayscale; w/o alpha)";
			break;
		case 1:
			if(_g[2]) this.type = "PNG (Truecolor)"; else this.type = "PNG (Truecolor; w/o alpha)";
			break;
		case 2:
			this.type = "PNG (Indexed)";
			break;
		}
	}
	this.width = h.width;
	this.height = h.height;
	var tmp;
	var _this = format_png_Tools.extract32(d);
	tmp = _this.b.bufferValue;
	this.pixels = new Uint8Array(tmp);
};
Png.__name__ = true;
var format_png_Color = { __ename__ : true, __constructs__ : ["ColGrey","ColTrue","ColIndexed"] };
format_png_Color.ColGrey = function(alpha) { var $x = ["ColGrey",0,alpha]; $x.__enum__ = format_png_Color; $x.toString = $estr; return $x; };
format_png_Color.ColTrue = function(alpha) { var $x = ["ColTrue",1,alpha]; $x.__enum__ = format_png_Color; $x.toString = $estr; return $x; };
format_png_Color.ColIndexed = ["ColIndexed",2];
format_png_Color.ColIndexed.toString = $estr;
format_png_Color.ColIndexed.__enum__ = format_png_Color;
var format_png_Chunk = { __ename__ : true, __constructs__ : ["CEnd","CHeader","CData","CPalette","CUnknown"] };
format_png_Chunk.CEnd = ["CEnd",0];
format_png_Chunk.CEnd.toString = $estr;
format_png_Chunk.CEnd.__enum__ = format_png_Chunk;
format_png_Chunk.CHeader = function(h) { var $x = ["CHeader",1,h]; $x.__enum__ = format_png_Chunk; $x.toString = $estr; return $x; };
format_png_Chunk.CData = function(b) { var $x = ["CData",2,b]; $x.__enum__ = format_png_Chunk; $x.toString = $estr; return $x; };
format_png_Chunk.CPalette = function(b) { var $x = ["CPalette",3,b]; $x.__enum__ = format_png_Chunk; $x.toString = $estr; return $x; };
format_png_Chunk.CUnknown = function(id,data) { var $x = ["CUnknown",4,id,data]; $x.__enum__ = format_png_Chunk; $x.toString = $estr; return $x; };
var format_png_Reader = function(i) {
	this.i = i;
	i.set_bigEndian(true);
	this.checkCRC = true;
};
format_png_Reader.__name__ = true;
format_png_Reader.prototype = {
	read: function() {
		var _g = 0;
		var _g1 = [137,80,78,71,13,10,26,10];
		while(_g < _g1.length) {
			var b = _g1[_g];
			++_g;
			if(this.i.readByte() != b) throw new js__$Boot_HaxeError("Invalid header");
		}
		var l = new List();
		while(true) {
			var c = this.readChunk();
			l.add(c);
			if(c == format_png_Chunk.CEnd) break;
		}
		return l;
	}
	,readHeader: function(i) {
		i.set_bigEndian(true);
		var width = i.readInt32();
		var height = i.readInt32();
		var colbits = i.readByte();
		var color = i.readByte();
		var tmp;
		switch(color) {
		case 0:
			tmp = format_png_Color.ColGrey(false);
			break;
		case 2:
			tmp = format_png_Color.ColTrue(false);
			break;
		case 3:
			tmp = format_png_Color.ColIndexed;
			break;
		case 4:
			tmp = format_png_Color.ColGrey(true);
			break;
		case 6:
			tmp = format_png_Color.ColTrue(true);
			break;
		default:
			throw new js__$Boot_HaxeError("Unknown color model " + color + ":" + colbits);
		}
		var color1 = tmp;
		var compress = i.readByte();
		var filter = i.readByte();
		if(compress != 0 || filter != 0) throw new js__$Boot_HaxeError("Invalid header");
		var interlace = i.readByte();
		if(interlace != 0 && interlace != 1) throw new js__$Boot_HaxeError("Invalid header");
		return { width : width, height : height, colbits : colbits, color : color1, interlaced : interlace == 1};
	}
	,readChunk: function() {
		var dataLen = this.i.readInt32();
		var id = this.i.readString(4);
		var data = this.i.read(dataLen);
		var crc = this.i.readInt32();
		if(this.checkCRC) {
			var c = new haxe_crypto_Crc32();
			var _g = 0;
			while(_g < 4) {
				var i = _g++;
				c["byte"](HxOverrides.cca(id,i));
			}
			c.update(data,0,data.length);
			if(c.get() != crc) throw new js__$Boot_HaxeError("CRC check failure");
		}
		var tmp;
		switch(id) {
		case "IEND":
			tmp = format_png_Chunk.CEnd;
			break;
		case "IHDR":
			tmp = format_png_Chunk.CHeader(this.readHeader(new haxe_io_BytesInput(data)));
			break;
		case "IDAT":
			tmp = format_png_Chunk.CData(data);
			break;
		case "PLTE":
			tmp = format_png_Chunk.CPalette(data);
			break;
		default:
			tmp = format_png_Chunk.CUnknown(id,data);
		}
		return tmp;
	}
};
var format_png_Tools = function() { };
format_png_Tools.__name__ = true;
format_png_Tools.getHeader = function(d) {
	var _g_head = d.h;
	var _g_val = null;
	while(_g_head != null) {
		var tmp;
		_g_val = _g_head[0];
		_g_head = _g_head[1];
		tmp = _g_val;
		var c = tmp;
		switch(c[1]) {
		case 1:
			return c[2];
		default:
		}
	}
	throw new js__$Boot_HaxeError("Header not found");
};
format_png_Tools.getPalette = function(d) {
	var _g_head = d.h;
	var _g_val = null;
	while(_g_head != null) {
		var tmp;
		_g_val = _g_head[0];
		_g_head = _g_head[1];
		tmp = _g_val;
		var c = tmp;
		switch(c[1]) {
		case 3:
			return c[2];
		default:
		}
	}
	return null;
};
format_png_Tools.filter = function(data,x,y,stride,prev,p,numChannels) {
	if(numChannels == null) numChannels = 4;
	var b = y == 0?0:data.b[p - stride];
	var c = x == 0 || y == 0?0:data.b[p - stride - numChannels];
	var k = prev + b - c;
	var pa = k - prev;
	if(pa < 0) pa = -pa;
	var pb = k - b;
	if(pb < 0) pb = -pb;
	var pc = k - c;
	if(pc < 0) pc = -pc;
	return pa <= pb && pa <= pc?prev:pb <= pc?b:c;
};
format_png_Tools.reverseBytes = function(b) {
	var p = 0;
	var _g1 = 0;
	var _g = b.length >> 2;
	while(_g1 < _g) {
		_g1++;
		var b1 = b.b[p];
		var g = b.b[p + 1];
		var r = b.b[p + 2];
		var a = b.b[p + 3];
		var p1 = p++;
		b.b[p1] = a & 255;
		var p2 = p++;
		b.b[p2] = r & 255;
		var p3 = p++;
		b.b[p3] = g & 255;
		var p4 = p++;
		b.b[p4] = b1 & 255;
	}
};
format_png_Tools.extractGrey = function(d) {
	var h = format_png_Tools.getHeader(d);
	var grey = haxe_io_Bytes.alloc(h.width * h.height);
	var data = null;
	var fullData = null;
	var _g_head = d.h;
	var _g_val = null;
	while(_g_head != null) {
		var tmp;
		_g_val = _g_head[0];
		_g_head = _g_head[1];
		tmp = _g_val;
		var c = tmp;
		switch(c[1]) {
		case 2:
			var b = c[2];
			if(fullData != null) {
				var b2 = b.b;
				var _g1 = 0;
				var _g = b.length;
				while(_g1 < _g) {
					var i = _g1++;
					fullData.b.push(b2[i]);
				}
			} else if(data == null) data = b; else {
				fullData = new haxe_io_BytesBuffer();
				var b21 = data.b;
				var _g11 = 0;
				var _g2 = data.length;
				while(_g11 < _g2) {
					var i1 = _g11++;
					fullData.b.push(b21[i1]);
				}
				var b22 = b.b;
				var _g12 = 0;
				var _g3 = b.length;
				while(_g12 < _g3) {
					var i2 = _g12++;
					fullData.b.push(b22[i2]);
				}
				data = null;
			}
			break;
		default:
		}
	}
	if(fullData != null) data = fullData.getBytes();
	if(data == null) throw new js__$Boot_HaxeError("Data not found");
	data = format_tools_Inflate.run(data);
	var r = 0;
	var w = 0;
	{
		var _g4 = h.color;
		switch(_g4[1]) {
		case 0:
			var alpha = _g4[2];
			if(h.colbits != 8) throw new js__$Boot_HaxeError("Unsupported color mode");
			var width = h.width;
			var stride = (alpha?2:1) * width + 1;
			if(data.length < h.height * stride) throw new js__$Boot_HaxeError("Not enough data");
			var rinc = alpha?2:1;
			var _g21 = 0;
			var _g13 = h.height;
			while(_g21 < _g13) {
				var y = _g21++;
				var tmp1;
				var pos = r++;
				tmp1 = data.b[pos];
				var f = tmp1;
				switch(f) {
				case 0:
					var _g31 = 0;
					while(_g31 < width) {
						_g31++;
						var v = data.b[r];
						r += rinc;
						var pos1 = w++;
						grey.b[pos1] = v & 255;
					}
					break;
				case 1:
					var cv = 0;
					var _g32 = 0;
					while(_g32 < width) {
						_g32++;
						cv += data.b[r];
						r += rinc;
						var pos2 = w++;
						grey.b[pos2] = cv & 255;
					}
					break;
				case 2:
					var stride1 = y == 0?0:width;
					var _g33 = 0;
					while(_g33 < width) {
						_g33++;
						var v1 = data.b[r] + grey.b[w - stride1];
						r += rinc;
						var pos3 = w++;
						grey.b[pos3] = v1 & 255;
					}
					break;
				case 3:
					var cv1 = 0;
					var stride2 = y == 0?0:width;
					var _g34 = 0;
					while(_g34 < width) {
						_g34++;
						cv1 = data.b[r] + (cv1 + grey.b[w - stride2] >> 1) & 255;
						r += rinc;
						var pos4 = w++;
						grey.b[pos4] = cv1 & 255;
					}
					break;
				case 4:
					var cv2 = 0;
					var _g35 = 0;
					while(_g35 < width) {
						var x = _g35++;
						var tmp2;
						var b1 = y == 0?0:grey.b[w - width];
						var c1 = x == 0 || y == 0?0:grey.b[w - width - 1];
						var k = cv2 + b1 - c1;
						var pa = k - cv2;
						if(pa < 0) pa = -pa;
						var pb = k - b1;
						if(pb < 0) pb = -pb;
						var pc = k - c1;
						if(pc < 0) pc = -pc;
						if(pa <= pb && pa <= pc) tmp2 = cv2; else if(pb <= pc) tmp2 = b1; else tmp2 = c1;
						cv2 = tmp2 + data.b[r] & 255;
						r += rinc;
						var pos5 = w++;
						grey.b[pos5] = cv2 & 255;
					}
					break;
				default:
					throw new js__$Boot_HaxeError("Invalid filter " + f);
				}
			}
			break;
		default:
			throw new js__$Boot_HaxeError("Unsupported color mode");
		}
	}
	return grey;
};
format_png_Tools.extract32 = function(d,bytes,flipY) {
	var h = format_png_Tools.getHeader(d);
	var bgra = bytes == null?haxe_io_Bytes.alloc(h.width * h.height * 4):bytes;
	var data = null;
	var fullData = null;
	var _g_head = d.h;
	var _g_val = null;
	while(_g_head != null) {
		var tmp;
		_g_val = _g_head[0];
		_g_head = _g_head[1];
		tmp = _g_val;
		var c = tmp;
		switch(c[1]) {
		case 2:
			var b = c[2];
			if(fullData != null) {
				var b2 = b.b;
				var _g1 = 0;
				var _g = b.length;
				while(_g1 < _g) {
					var i = _g1++;
					fullData.b.push(b2[i]);
				}
			} else if(data == null) data = b; else {
				fullData = new haxe_io_BytesBuffer();
				var b21 = data.b;
				var _g11 = 0;
				var _g2 = data.length;
				while(_g11 < _g2) {
					var i1 = _g11++;
					fullData.b.push(b21[i1]);
				}
				var b22 = b.b;
				var _g12 = 0;
				var _g3 = b.length;
				while(_g12 < _g3) {
					var i2 = _g12++;
					fullData.b.push(b22[i2]);
				}
				data = null;
			}
			break;
		default:
		}
	}
	if(fullData != null) data = fullData.getBytes();
	if(data == null) throw new js__$Boot_HaxeError("Data not found");
	data = format_tools_Inflate.run(data);
	var r = 0;
	var w = 0;
	var lineDelta = 0;
	if(flipY) {
		lineDelta = -h.width * 8;
		w = (h.height - 1) * (h.width * 4);
	}
	var flipY1 = flipY?-1:1;
	{
		var _g4 = h.color;
		switch(_g4[1]) {
		case 2:
			var pal = format_png_Tools.getPalette(d);
			if(pal == null) throw new js__$Boot_HaxeError("PNG Palette is missing");
			var alpha = null;
			var _g1_head = d.h;
			var _g1_val = null;
			try {
				while(_g1_head != null) {
					var tmp1;
					_g1_val = _g1_head[0];
					_g1_head = _g1_head[1];
					tmp1 = _g1_val;
					var t = tmp1;
					switch(t[1]) {
					case 4:
						switch(t[2]) {
						case "tRNS":
							alpha = t[3];
							throw "__break__";
							break;
						default:
						}
						break;
					default:
					}
				}
			} catch( e ) { if( e != "__break__" ) throw e; }
			if(alpha != null && alpha.length < 1 << h.colbits) {
				var alpha2 = haxe_io_Bytes.alloc(1 << h.colbits);
				alpha2.blit(0,alpha,0,alpha.length);
				alpha2.fill(alpha.length,alpha2.length - alpha.length,255);
				alpha = alpha2;
			}
			var width = h.width;
			var stride = Math.ceil(width * h.colbits / 8) + 1;
			if(data.length < h.height * stride) throw new js__$Boot_HaxeError("Not enough data");
			var rline = h.width * h.colbits >> 3;
			var _g21 = 0;
			var _g13 = h.height;
			while(_g21 < _g13) {
				var y = _g21++;
				var tmp2;
				var pos = r++;
				tmp2 = data.b[pos];
				var f = tmp2;
				if(f == 0) {
					r += rline;
					continue;
				}
				switch(f) {
				case 1:
					var c1 = 0;
					var _g31 = 0;
					while(_g31 < width) {
						_g31++;
						var v = data.b[r];
						c1 += v;
						var pos1 = r++;
						data.b[pos1] = c1 & 255 & 255;
					}
					break;
				case 2:
					var stride1 = y == 0?0:rline + 1;
					var _g32 = 0;
					while(_g32 < width) {
						_g32++;
						var v1 = data.b[r];
						data.b[r] = v1 + data.b[r - stride1] & 255;
						r++;
					}
					break;
				case 3:
					var c2 = 0;
					var stride2 = y == 0?0:rline + 1;
					var _g33 = 0;
					while(_g33 < width) {
						_g33++;
						var v2 = data.b[r];
						c2 = v2 + (c2 + data.b[r - stride2] >> 1) & 255;
						var pos2 = r++;
						data.b[pos2] = c2 & 255;
					}
					break;
				case 4:
					var stride3 = rline + 1;
					var c3 = 0;
					var _g34 = 0;
					while(_g34 < width) {
						var x = _g34++;
						var v3 = data.b[r];
						var tmp3;
						var b1 = y == 0?0:data.b[r - stride3];
						var c4 = x == 0 || y == 0?0:data.b[r - stride3 - 1];
						var k = c3 + b1 - c4;
						var pa = k - c3;
						if(pa < 0) pa = -pa;
						var pb = k - b1;
						if(pb < 0) pb = -pb;
						var pc = k - c4;
						if(pc < 0) pc = -pc;
						if(pa <= pb && pa <= pc) tmp3 = c3; else if(pb <= pc) tmp3 = b1; else tmp3 = c4;
						c3 = tmp3 + v3 & 255;
						var pos3 = r++;
						data.b[pos3] = c3 & 255;
					}
					break;
				default:
					throw new js__$Boot_HaxeError("Invalid filter " + f);
				}
			}
			var r1 = 0;
			if(h.colbits == 8) {
				var _g22 = 0;
				var _g14 = h.height;
				while(_g22 < _g14) {
					_g22++;
					r1++;
					var _g41 = 0;
					var _g35 = h.width;
					while(_g41 < _g35) {
						_g41++;
						var tmp4;
						var pos4 = r1++;
						tmp4 = data.b[pos4];
						var c5 = tmp4;
						var pos5 = w++;
						bgra.b[pos5] = pal.b[c5 * 3 + 2] & 255;
						var pos6 = w++;
						bgra.b[pos6] = pal.b[c5 * 3 + 1] & 255;
						var pos7 = w++;
						bgra.b[pos7] = pal.b[c5 * 3] & 255;
						var pos8 = w++;
						bgra.b[pos8] = (alpha != null?alpha.b[c5]:255) & 255;
					}
					w += lineDelta;
				}
			} else if(h.colbits < 8) {
				var req = h.colbits;
				var mask = (1 << req) - 1;
				var _g23 = 0;
				var _g15 = h.height;
				while(_g23 < _g15) {
					_g23++;
					r1++;
					var bits = 0;
					var nbits = 0;
					var _g42 = 0;
					var _g36 = h.width;
					while(_g42 < _g36) {
						_g42++;
						if(nbits < req) {
							var tmp5;
							var pos9 = r1++;
							tmp5 = data.b[pos9];
							bits = bits << 8 | tmp5;
							nbits += 8;
						}
						var c6 = bits >>> nbits - req & mask;
						nbits -= req;
						var pos10 = w++;
						bgra.b[pos10] = pal.b[c6 * 3 + 2] & 255;
						var pos11 = w++;
						bgra.b[pos11] = pal.b[c6 * 3 + 1] & 255;
						var pos12 = w++;
						bgra.b[pos12] = pal.b[c6 * 3] & 255;
						var pos13 = w++;
						bgra.b[pos13] = (alpha != null?alpha.b[c6]:255) & 255;
					}
					w += lineDelta;
				}
			} else throw new js__$Boot_HaxeError(h.colbits + " indexed bits per pixel not supported");
			break;
		case 0:
			var alpha1 = _g4[2];
			if(h.colbits != 8) throw new js__$Boot_HaxeError("Unsupported color mode");
			var width1 = h.width;
			var stride4 = (alpha1?2:1) * width1 + 1;
			if(data.length < h.height * stride4) throw new js__$Boot_HaxeError("Not enough data");
			var _g24 = 0;
			var _g16 = h.height;
			while(_g24 < _g16) {
				var y1 = _g24++;
				var tmp6;
				var pos14 = r++;
				tmp6 = data.b[pos14];
				var f1 = tmp6;
				switch(f1) {
				case 0:
					if(alpha1) {
						var _g37 = 0;
						while(_g37 < width1) {
							_g37++;
							var tmp7;
							var pos15 = r++;
							tmp7 = data.b[pos15];
							var v4 = tmp7;
							var pos16 = w++;
							bgra.b[pos16] = v4 & 255;
							var pos17 = w++;
							bgra.b[pos17] = v4 & 255;
							var pos18 = w++;
							bgra.b[pos18] = v4 & 255;
							var pos19 = w++;
							var tmp8;
							var pos20 = r++;
							tmp8 = data.b[pos20];
							var v5 = tmp8;
							bgra.b[pos19] = v5 & 255;
						}
					} else {
						var _g38 = 0;
						while(_g38 < width1) {
							_g38++;
							var tmp9;
							var pos21 = r++;
							tmp9 = data.b[pos21];
							var v6 = tmp9;
							var pos22 = w++;
							bgra.b[pos22] = v6 & 255;
							var pos23 = w++;
							bgra.b[pos23] = v6 & 255;
							var pos24 = w++;
							bgra.b[pos24] = v6 & 255;
							var pos25 = w++;
							bgra.b[pos25] = 255;
						}
					}
					break;
				case 1:
					var cv = 0;
					var ca = 0;
					if(alpha1) {
						var _g39 = 0;
						while(_g39 < width1) {
							_g39++;
							var tmp10;
							var pos26 = r++;
							tmp10 = data.b[pos26];
							cv += tmp10;
							var pos27 = w++;
							bgra.b[pos27] = cv & 255;
							var pos28 = w++;
							bgra.b[pos28] = cv & 255;
							var pos29 = w++;
							bgra.b[pos29] = cv & 255;
							var tmp11;
							var pos30 = r++;
							tmp11 = data.b[pos30];
							ca += tmp11;
							var pos31 = w++;
							bgra.b[pos31] = ca & 255;
						}
					} else {
						var _g310 = 0;
						while(_g310 < width1) {
							_g310++;
							var tmp12;
							var pos32 = r++;
							tmp12 = data.b[pos32];
							cv += tmp12;
							var pos33 = w++;
							bgra.b[pos33] = cv & 255;
							var pos34 = w++;
							bgra.b[pos34] = cv & 255;
							var pos35 = w++;
							bgra.b[pos35] = cv & 255;
							var pos36 = w++;
							bgra.b[pos36] = 255;
						}
					}
					break;
				case 2:
					var stride5 = y1 == 0?0:width1 * 4 * flipY1;
					if(alpha1) {
						var _g311 = 0;
						while(_g311 < width1) {
							_g311++;
							var tmp13;
							var pos37 = r++;
							tmp13 = data.b[pos37];
							var v7 = tmp13 + bgra.b[w - stride5];
							var pos38 = w++;
							bgra.b[pos38] = v7 & 255;
							var pos39 = w++;
							bgra.b[pos39] = v7 & 255;
							var pos40 = w++;
							bgra.b[pos40] = v7 & 255;
							var pos41 = w++;
							var tmp14;
							var pos42 = r++;
							tmp14 = data.b[pos42];
							var v8 = tmp14 + bgra.b[w - stride5];
							bgra.b[pos41] = v8 & 255;
						}
					} else {
						var _g312 = 0;
						while(_g312 < width1) {
							_g312++;
							var tmp15;
							var pos43 = r++;
							tmp15 = data.b[pos43];
							var v9 = tmp15 + bgra.b[w - stride5];
							var pos44 = w++;
							bgra.b[pos44] = v9 & 255;
							var pos45 = w++;
							bgra.b[pos45] = v9 & 255;
							var pos46 = w++;
							bgra.b[pos46] = v9 & 255;
							var pos47 = w++;
							bgra.b[pos47] = 255;
						}
					}
					break;
				case 3:
					var cv1 = 0;
					var ca1 = 0;
					var stride6 = y1 == 0?0:width1 * 4 * flipY1;
					if(alpha1) {
						var _g313 = 0;
						while(_g313 < width1) {
							_g313++;
							var tmp16;
							var pos48 = r++;
							tmp16 = data.b[pos48];
							cv1 = tmp16 + (cv1 + bgra.b[w - stride6] >> 1) & 255;
							var pos49 = w++;
							bgra.b[pos49] = cv1 & 255;
							var pos50 = w++;
							bgra.b[pos50] = cv1 & 255;
							var pos51 = w++;
							bgra.b[pos51] = cv1 & 255;
							var tmp17;
							var pos52 = r++;
							tmp17 = data.b[pos52];
							ca1 = tmp17 + (ca1 + bgra.b[w - stride6] >> 1) & 255;
							var pos53 = w++;
							bgra.b[pos53] = ca1 & 255;
						}
					} else {
						var _g314 = 0;
						while(_g314 < width1) {
							_g314++;
							var tmp18;
							var pos54 = r++;
							tmp18 = data.b[pos54];
							cv1 = tmp18 + (cv1 + bgra.b[w - stride6] >> 1) & 255;
							var pos55 = w++;
							bgra.b[pos55] = cv1 & 255;
							var pos56 = w++;
							bgra.b[pos56] = cv1 & 255;
							var pos57 = w++;
							bgra.b[pos57] = cv1 & 255;
							var pos58 = w++;
							bgra.b[pos58] = 255;
						}
					}
					break;
				case 4:
					var stride7 = width1 * 4 * flipY1;
					var cv2 = 0;
					var ca2 = 0;
					if(alpha1) {
						var _g315 = 0;
						while(_g315 < width1) {
							var x1 = _g315++;
							var tmp19;
							var b3 = y1 == 0?0:bgra.b[w - stride7];
							var c7 = x1 == 0 || y1 == 0?0:bgra.b[w - stride7 - 4];
							var k1 = cv2 + b3 - c7;
							var pa1 = k1 - cv2;
							if(pa1 < 0) pa1 = -pa1;
							var pb1 = k1 - b3;
							if(pb1 < 0) pb1 = -pb1;
							var pc1 = k1 - c7;
							if(pc1 < 0) pc1 = -pc1;
							if(pa1 <= pb1 && pa1 <= pc1) tmp19 = cv2; else if(pb1 <= pc1) tmp19 = b3; else tmp19 = c7;
							var tmp20;
							var pos59 = r++;
							tmp20 = data.b[pos59];
							cv2 = tmp19 + tmp20 & 255;
							var pos60 = w++;
							bgra.b[pos60] = cv2 & 255;
							var pos61 = w++;
							bgra.b[pos61] = cv2 & 255;
							var pos62 = w++;
							bgra.b[pos62] = cv2 & 255;
							var tmp21;
							var b4 = y1 == 0?0:bgra.b[w - stride7];
							var c8 = x1 == 0 || y1 == 0?0:bgra.b[w - stride7 - 4];
							var k2 = ca2 + b4 - c8;
							var pa2 = k2 - ca2;
							if(pa2 < 0) pa2 = -pa2;
							var pb2 = k2 - b4;
							if(pb2 < 0) pb2 = -pb2;
							var pc2 = k2 - c8;
							if(pc2 < 0) pc2 = -pc2;
							if(pa2 <= pb2 && pa2 <= pc2) tmp21 = ca2; else if(pb2 <= pc2) tmp21 = b4; else tmp21 = c8;
							var tmp22;
							var pos63 = r++;
							tmp22 = data.b[pos63];
							ca2 = tmp21 + tmp22 & 255;
							var pos64 = w++;
							bgra.b[pos64] = ca2 & 255;
						}
					} else {
						var _g316 = 0;
						while(_g316 < width1) {
							var x2 = _g316++;
							var tmp23;
							var b5 = y1 == 0?0:bgra.b[w - stride7];
							var c9 = x2 == 0 || y1 == 0?0:bgra.b[w - stride7 - 4];
							var k3 = cv2 + b5 - c9;
							var pa3 = k3 - cv2;
							if(pa3 < 0) pa3 = -pa3;
							var pb3 = k3 - b5;
							if(pb3 < 0) pb3 = -pb3;
							var pc3 = k3 - c9;
							if(pc3 < 0) pc3 = -pc3;
							if(pa3 <= pb3 && pa3 <= pc3) tmp23 = cv2; else if(pb3 <= pc3) tmp23 = b5; else tmp23 = c9;
							var tmp24;
							var pos65 = r++;
							tmp24 = data.b[pos65];
							cv2 = tmp23 + tmp24 & 255;
							var pos66 = w++;
							bgra.b[pos66] = cv2 & 255;
							var pos67 = w++;
							bgra.b[pos67] = cv2 & 255;
							var pos68 = w++;
							bgra.b[pos68] = cv2 & 255;
							var pos69 = w++;
							bgra.b[pos69] = 255;
						}
					}
					break;
				default:
					throw new js__$Boot_HaxeError("Invalid filter " + f1);
				}
				w += lineDelta;
			}
			break;
		case 1:
			var alpha3 = _g4[2];
			if(h.colbits != 8) throw new js__$Boot_HaxeError("Unsupported color mode");
			var width2 = h.width;
			var stride8 = (alpha3?4:3) * width2 + 1;
			if(data.length < h.height * stride8) throw new js__$Boot_HaxeError("Not enough data");
			var _g25 = 0;
			var _g17 = h.height;
			while(_g25 < _g17) {
				var y2 = _g25++;
				var tmp25;
				var pos70 = r++;
				tmp25 = data.b[pos70];
				var f2 = tmp25;
				switch(f2) {
				case 0:
					if(alpha3) {
						var _g317 = 0;
						while(_g317 < width2) {
							_g317++;
							var pos71 = w++;
							bgra.b[pos71] = data.b[r + 2] & 255;
							var pos72 = w++;
							bgra.b[pos72] = data.b[r + 1] & 255;
							var pos73 = w++;
							bgra.b[pos73] = data.b[r] & 255;
							var pos74 = w++;
							bgra.b[pos74] = data.b[r + 3] & 255;
							r += 4;
						}
					} else {
						var _g318 = 0;
						while(_g318 < width2) {
							_g318++;
							var pos75 = w++;
							bgra.b[pos75] = data.b[r + 2] & 255;
							var pos76 = w++;
							bgra.b[pos76] = data.b[r + 1] & 255;
							var pos77 = w++;
							bgra.b[pos77] = data.b[r] & 255;
							var pos78 = w++;
							bgra.b[pos78] = 255;
							r += 3;
						}
					}
					break;
				case 1:
					var cr = 0;
					var cg = 0;
					var cb = 0;
					var ca3 = 0;
					if(alpha3) {
						var _g319 = 0;
						while(_g319 < width2) {
							_g319++;
							cb += data.b[r + 2];
							var pos79 = w++;
							bgra.b[pos79] = cb & 255;
							cg += data.b[r + 1];
							var pos80 = w++;
							bgra.b[pos80] = cg & 255;
							cr += data.b[r];
							var pos81 = w++;
							bgra.b[pos81] = cr & 255;
							ca3 += data.b[r + 3];
							var pos82 = w++;
							bgra.b[pos82] = ca3 & 255;
							r += 4;
						}
					} else {
						var _g320 = 0;
						while(_g320 < width2) {
							_g320++;
							cb += data.b[r + 2];
							var pos83 = w++;
							bgra.b[pos83] = cb & 255;
							cg += data.b[r + 1];
							var pos84 = w++;
							bgra.b[pos84] = cg & 255;
							cr += data.b[r];
							var pos85 = w++;
							bgra.b[pos85] = cr & 255;
							var pos86 = w++;
							bgra.b[pos86] = 255;
							r += 3;
						}
					}
					break;
				case 2:
					var stride9 = y2 == 0?0:width2 * 4 * flipY1;
					if(alpha3) {
						var _g321 = 0;
						while(_g321 < width2) {
							_g321++;
							bgra.b[w] = data.b[r + 2] + bgra.b[w - stride9] & 255;
							w++;
							bgra.b[w] = data.b[r + 1] + bgra.b[w - stride9] & 255;
							w++;
							bgra.b[w] = data.b[r] + bgra.b[w - stride9] & 255;
							w++;
							bgra.b[w] = data.b[r + 3] + bgra.b[w - stride9] & 255;
							w++;
							r += 4;
						}
					} else {
						var _g322 = 0;
						while(_g322 < width2) {
							_g322++;
							bgra.b[w] = data.b[r + 2] + bgra.b[w - stride9] & 255;
							w++;
							bgra.b[w] = data.b[r + 1] + bgra.b[w - stride9] & 255;
							w++;
							bgra.b[w] = data.b[r] + bgra.b[w - stride9] & 255;
							w++;
							var pos87 = w++;
							bgra.b[pos87] = 255;
							r += 3;
						}
					}
					break;
				case 3:
					var cr1 = 0;
					var cg1 = 0;
					var cb1 = 0;
					var ca4 = 0;
					var stride10 = y2 == 0?0:width2 * 4 * flipY1;
					if(alpha3) {
						var _g323 = 0;
						while(_g323 < width2) {
							_g323++;
							cb1 = data.b[r + 2] + (cb1 + bgra.b[w - stride10] >> 1) & 255;
							var pos88 = w++;
							bgra.b[pos88] = cb1 & 255;
							cg1 = data.b[r + 1] + (cg1 + bgra.b[w - stride10] >> 1) & 255;
							var pos89 = w++;
							bgra.b[pos89] = cg1 & 255;
							cr1 = data.b[r] + (cr1 + bgra.b[w - stride10] >> 1) & 255;
							var pos90 = w++;
							bgra.b[pos90] = cr1 & 255;
							ca4 = data.b[r + 3] + (ca4 + bgra.b[w - stride10] >> 1) & 255;
							var pos91 = w++;
							bgra.b[pos91] = ca4 & 255;
							r += 4;
						}
					} else {
						var _g324 = 0;
						while(_g324 < width2) {
							_g324++;
							cb1 = data.b[r + 2] + (cb1 + bgra.b[w - stride10] >> 1) & 255;
							var pos92 = w++;
							bgra.b[pos92] = cb1 & 255;
							cg1 = data.b[r + 1] + (cg1 + bgra.b[w - stride10] >> 1) & 255;
							var pos93 = w++;
							bgra.b[pos93] = cg1 & 255;
							cr1 = data.b[r] + (cr1 + bgra.b[w - stride10] >> 1) & 255;
							var pos94 = w++;
							bgra.b[pos94] = cr1 & 255;
							var pos95 = w++;
							bgra.b[pos95] = 255;
							r += 3;
						}
					}
					break;
				case 4:
					var stride11 = width2 * 4 * flipY1;
					var cr2 = 0;
					var cg2 = 0;
					var cb2 = 0;
					var ca5 = 0;
					if(alpha3) {
						var _g325 = 0;
						while(_g325 < width2) {
							var x3 = _g325++;
							var tmp26;
							var b6 = y2 == 0?0:bgra.b[w - stride11];
							var c10 = x3 == 0 || y2 == 0?0:bgra.b[w - stride11 - 4];
							var k4 = cb2 + b6 - c10;
							var pa4 = k4 - cb2;
							if(pa4 < 0) pa4 = -pa4;
							var pb4 = k4 - b6;
							if(pb4 < 0) pb4 = -pb4;
							var pc4 = k4 - c10;
							if(pc4 < 0) pc4 = -pc4;
							if(pa4 <= pb4 && pa4 <= pc4) tmp26 = cb2; else if(pb4 <= pc4) tmp26 = b6; else tmp26 = c10;
							cb2 = tmp26 + data.b[r + 2] & 255;
							var pos96 = w++;
							bgra.b[pos96] = cb2 & 255;
							var tmp27;
							var b7 = y2 == 0?0:bgra.b[w - stride11];
							var c11 = x3 == 0 || y2 == 0?0:bgra.b[w - stride11 - 4];
							var k5 = cg2 + b7 - c11;
							var pa5 = k5 - cg2;
							if(pa5 < 0) pa5 = -pa5;
							var pb5 = k5 - b7;
							if(pb5 < 0) pb5 = -pb5;
							var pc5 = k5 - c11;
							if(pc5 < 0) pc5 = -pc5;
							if(pa5 <= pb5 && pa5 <= pc5) tmp27 = cg2; else if(pb5 <= pc5) tmp27 = b7; else tmp27 = c11;
							cg2 = tmp27 + data.b[r + 1] & 255;
							var pos97 = w++;
							bgra.b[pos97] = cg2 & 255;
							var tmp28;
							var b8 = y2 == 0?0:bgra.b[w - stride11];
							var c12 = x3 == 0 || y2 == 0?0:bgra.b[w - stride11 - 4];
							var k6 = cr2 + b8 - c12;
							var pa6 = k6 - cr2;
							if(pa6 < 0) pa6 = -pa6;
							var pb6 = k6 - b8;
							if(pb6 < 0) pb6 = -pb6;
							var pc6 = k6 - c12;
							if(pc6 < 0) pc6 = -pc6;
							if(pa6 <= pb6 && pa6 <= pc6) tmp28 = cr2; else if(pb6 <= pc6) tmp28 = b8; else tmp28 = c12;
							cr2 = tmp28 + data.b[r] & 255;
							var pos98 = w++;
							bgra.b[pos98] = cr2 & 255;
							var tmp29;
							var b9 = y2 == 0?0:bgra.b[w - stride11];
							var c13 = x3 == 0 || y2 == 0?0:bgra.b[w - stride11 - 4];
							var k7 = ca5 + b9 - c13;
							var pa7 = k7 - ca5;
							if(pa7 < 0) pa7 = -pa7;
							var pb7 = k7 - b9;
							if(pb7 < 0) pb7 = -pb7;
							var pc7 = k7 - c13;
							if(pc7 < 0) pc7 = -pc7;
							if(pa7 <= pb7 && pa7 <= pc7) tmp29 = ca5; else if(pb7 <= pc7) tmp29 = b9; else tmp29 = c13;
							ca5 = tmp29 + data.b[r + 3] & 255;
							var pos99 = w++;
							bgra.b[pos99] = ca5 & 255;
							r += 4;
						}
					} else {
						var _g326 = 0;
						while(_g326 < width2) {
							var x4 = _g326++;
							var tmp30;
							var b10 = y2 == 0?0:bgra.b[w - stride11];
							var c14 = x4 == 0 || y2 == 0?0:bgra.b[w - stride11 - 4];
							var k8 = cb2 + b10 - c14;
							var pa8 = k8 - cb2;
							if(pa8 < 0) pa8 = -pa8;
							var pb8 = k8 - b10;
							if(pb8 < 0) pb8 = -pb8;
							var pc8 = k8 - c14;
							if(pc8 < 0) pc8 = -pc8;
							if(pa8 <= pb8 && pa8 <= pc8) tmp30 = cb2; else if(pb8 <= pc8) tmp30 = b10; else tmp30 = c14;
							cb2 = tmp30 + data.b[r + 2] & 255;
							var pos100 = w++;
							bgra.b[pos100] = cb2 & 255;
							var tmp31;
							var b11 = y2 == 0?0:bgra.b[w - stride11];
							var c15 = x4 == 0 || y2 == 0?0:bgra.b[w - stride11 - 4];
							var k9 = cg2 + b11 - c15;
							var pa9 = k9 - cg2;
							if(pa9 < 0) pa9 = -pa9;
							var pb9 = k9 - b11;
							if(pb9 < 0) pb9 = -pb9;
							var pc9 = k9 - c15;
							if(pc9 < 0) pc9 = -pc9;
							if(pa9 <= pb9 && pa9 <= pc9) tmp31 = cg2; else if(pb9 <= pc9) tmp31 = b11; else tmp31 = c15;
							cg2 = tmp31 + data.b[r + 1] & 255;
							var pos101 = w++;
							bgra.b[pos101] = cg2 & 255;
							var tmp32;
							var b12 = y2 == 0?0:bgra.b[w - stride11];
							var c16 = x4 == 0 || y2 == 0?0:bgra.b[w - stride11 - 4];
							var k10 = cr2 + b12 - c16;
							var pa10 = k10 - cr2;
							if(pa10 < 0) pa10 = -pa10;
							var pb10 = k10 - b12;
							if(pb10 < 0) pb10 = -pb10;
							var pc10 = k10 - c16;
							if(pc10 < 0) pc10 = -pc10;
							if(pa10 <= pb10 && pa10 <= pc10) tmp32 = cr2; else if(pb10 <= pc10) tmp32 = b12; else tmp32 = c16;
							cr2 = tmp32 + data.b[r] & 255;
							var pos102 = w++;
							bgra.b[pos102] = cr2 & 255;
							var pos103 = w++;
							bgra.b[pos103] = 255;
							r += 3;
						}
					}
					break;
				default:
					throw new js__$Boot_HaxeError("Invalid filter " + f2);
				}
				w += lineDelta;
			}
			break;
		}
	}
	return bgra;
};
format_png_Tools.buildGrey = function(width,height,data) {
	var rgb = haxe_io_Bytes.alloc(width * height + height);
	var w = 0;
	var r = 0;
	var _g = 0;
	while(_g < height) {
		_g++;
		var pos = w++;
		rgb.b[pos] = 0;
		var _g1 = 0;
		while(_g1 < width) {
			_g1++;
			var pos1 = w++;
			var tmp;
			var pos2 = r++;
			tmp = data.b[pos2];
			var v = tmp;
			rgb.b[pos1] = v & 255;
		}
	}
	var l = new List();
	l.add(format_png_Chunk.CHeader({ width : width, height : height, colbits : 8, color : format_png_Color.ColGrey(false), interlaced : false}));
	l.add(format_png_Chunk.CData(format_tools_Deflate.run(rgb)));
	l.add(format_png_Chunk.CEnd);
	return l;
};
format_png_Tools.buildRGB = function(width,height,data) {
	var rgb = haxe_io_Bytes.alloc(width * height * 3 + height);
	var w = 0;
	var r = 0;
	var _g = 0;
	while(_g < height) {
		_g++;
		var pos = w++;
		rgb.b[pos] = 0;
		var _g1 = 0;
		while(_g1 < width) {
			_g1++;
			var pos1 = w++;
			rgb.b[pos1] = data.b[r + 2] & 255;
			var pos2 = w++;
			rgb.b[pos2] = data.b[r + 1] & 255;
			var pos3 = w++;
			rgb.b[pos3] = data.b[r] & 255;
			r += 3;
		}
	}
	var l = new List();
	l.add(format_png_Chunk.CHeader({ width : width, height : height, colbits : 8, color : format_png_Color.ColTrue(false), interlaced : false}));
	l.add(format_png_Chunk.CData(format_tools_Deflate.run(rgb)));
	l.add(format_png_Chunk.CEnd);
	return l;
};
format_png_Tools.build32ARGB = function(width,height,data) {
	var rgba = haxe_io_Bytes.alloc(width * height * 4 + height);
	var w = 0;
	var r = 0;
	var _g = 0;
	while(_g < height) {
		_g++;
		var pos = w++;
		rgba.b[pos] = 0;
		var _g1 = 0;
		while(_g1 < width) {
			_g1++;
			var pos1 = w++;
			rgba.b[pos1] = data.b[r + 1] & 255;
			var pos2 = w++;
			rgba.b[pos2] = data.b[r + 2] & 255;
			var pos3 = w++;
			rgba.b[pos3] = data.b[r + 3] & 255;
			var pos4 = w++;
			rgba.b[pos4] = data.b[r] & 255;
			r += 4;
		}
	}
	var l = new List();
	l.add(format_png_Chunk.CHeader({ width : width, height : height, colbits : 8, color : format_png_Color.ColTrue(true), interlaced : false}));
	l.add(format_png_Chunk.CData(format_tools_Deflate.run(rgba)));
	l.add(format_png_Chunk.CEnd);
	return l;
};
format_png_Tools.build32BGRA = function(width,height,data) {
	var rgba = haxe_io_Bytes.alloc(width * height * 4 + height);
	var w = 0;
	var r = 0;
	var _g = 0;
	while(_g < height) {
		_g++;
		var pos = w++;
		rgba.b[pos] = 0;
		var _g1 = 0;
		while(_g1 < width) {
			_g1++;
			var pos1 = w++;
			rgba.b[pos1] = data.b[r + 2] & 255;
			var pos2 = w++;
			rgba.b[pos2] = data.b[r + 1] & 255;
			var pos3 = w++;
			rgba.b[pos3] = data.b[r] & 255;
			var pos4 = w++;
			rgba.b[pos4] = data.b[r + 3] & 255;
			r += 4;
		}
	}
	var l = new List();
	l.add(format_png_Chunk.CHeader({ width : width, height : height, colbits : 8, color : format_png_Color.ColTrue(true), interlaced : false}));
	l.add(format_png_Chunk.CData(format_tools_Deflate.run(rgba)));
	l.add(format_png_Chunk.CEnd);
	return l;
};
var format_tools_Adler32 = function() {
	this.a1 = 1;
	this.a2 = 0;
};
format_tools_Adler32.__name__ = true;
format_tools_Adler32.read = function(i) {
	var a = new format_tools_Adler32();
	var a2a = i.readByte();
	var a2b = i.readByte();
	var a1a = i.readByte();
	var a1b = i.readByte();
	a.a1 = a1a << 8 | a1b;
	a.a2 = a2a << 8 | a2b;
	return a;
};
format_tools_Adler32.prototype = {
	update: function(b,pos,len) {
		var a1 = this.a1;
		var a2 = this.a2;
		var _g1 = pos;
		var _g = pos + len;
		while(_g1 < _g) {
			var p = _g1++;
			var c = b.b[p];
			a1 = (a1 + c) % 65521;
			a2 = (a2 + a1) % 65521;
		}
		this.a1 = a1;
		this.a2 = a2;
	}
	,equals: function(a) {
		return a.a1 == this.a1 && a.a2 == this.a2;
	}
};
var format_tools_Deflate = function() { };
format_tools_Deflate.__name__ = true;
format_tools_Deflate.run = function(b) {
	throw new js__$Boot_HaxeError("Deflate is not supported on this platform");
};
var format_tools_Huffman = { __ename__ : true, __constructs__ : ["Found","NeedBit","NeedBits"] };
format_tools_Huffman.Found = function(i) { var $x = ["Found",0,i]; $x.__enum__ = format_tools_Huffman; $x.toString = $estr; return $x; };
format_tools_Huffman.NeedBit = function(left,right) { var $x = ["NeedBit",1,left,right]; $x.__enum__ = format_tools_Huffman; $x.toString = $estr; return $x; };
format_tools_Huffman.NeedBits = function(n,table) { var $x = ["NeedBits",2,n,table]; $x.__enum__ = format_tools_Huffman; $x.toString = $estr; return $x; };
var format_tools_HuffTools = function() {
};
format_tools_HuffTools.__name__ = true;
format_tools_HuffTools.prototype = {
	treeDepth: function(t) {
		var tmp;
		switch(t[1]) {
		case 0:
			tmp = 0;
			break;
		case 2:
			throw new js__$Boot_HaxeError("assert");
			break;
		case 1:
			var da = this.treeDepth(t[2]);
			var db = this.treeDepth(t[3]);
			tmp = 1 + (da < db?da:db);
			break;
		}
		return tmp;
	}
	,treeCompress: function(t) {
		var d = this.treeDepth(t);
		if(d == 0) return t;
		if(d == 1) {
			var tmp;
			switch(t[1]) {
			case 1:
				tmp = format_tools_Huffman.NeedBit(this.treeCompress(t[2]),this.treeCompress(t[3]));
				break;
			default:
				throw new js__$Boot_HaxeError("assert");
			}
			return tmp;
		}
		var size = 1 << d;
		var table = [];
		var _g = 0;
		while(_g < size) {
			_g++;
			table.push(format_tools_Huffman.Found(-1));
		}
		this.treeWalk(table,0,0,d,t);
		return format_tools_Huffman.NeedBits(d,table);
	}
	,treeWalk: function(table,p,cd,d,t) {
		switch(t[1]) {
		case 1:
			if(d > 0) {
				this.treeWalk(table,p,cd + 1,d - 1,t[2]);
				this.treeWalk(table,p | 1 << cd,cd + 1,d - 1,t[3]);
			} else table[p] = this.treeCompress(t);
			break;
		default:
			table[p] = this.treeCompress(t);
		}
	}
	,treeMake: function(bits,maxbits,v,len) {
		if(len > maxbits) throw new js__$Boot_HaxeError("Invalid huffman");
		var idx = v << 5 | len;
		if(bits.h.hasOwnProperty(idx)) return format_tools_Huffman.Found(bits.h[idx]);
		v <<= 1;
		len += 1;
		return format_tools_Huffman.NeedBit(this.treeMake(bits,maxbits,v,len),this.treeMake(bits,maxbits,v | 1,len));
	}
	,make: function(lengths,pos,nlengths,maxbits) {
		var counts = [];
		var tmp = [];
		if(maxbits > 32) throw new js__$Boot_HaxeError("Invalid huffman");
		var _g = 0;
		while(_g < maxbits) {
			_g++;
			counts.push(0);
			tmp.push(0);
		}
		var _g1 = 0;
		while(_g1 < nlengths) {
			var i = _g1++;
			var p = lengths[i + pos];
			if(p >= maxbits) throw new js__$Boot_HaxeError("Invalid huffman");
			counts[p]++;
		}
		var code = 0;
		var _g11 = 1;
		var _g2 = maxbits - 1;
		while(_g11 < _g2) {
			var i1 = _g11++;
			code = code + counts[i1] << 1;
			tmp[i1] = code;
		}
		var bits = new haxe_ds_IntMap();
		var _g3 = 0;
		while(_g3 < nlengths) {
			var i2 = _g3++;
			var l = lengths[i2 + pos];
			if(l != 0) {
				var n = tmp[l - 1];
				tmp[l - 1] = n + 1;
				bits.h[n << 5 | l] = i2;
			}
		}
		return this.treeCompress(format_tools_Huffman.NeedBit(this.treeMake(bits,maxbits,0,1),this.treeMake(bits,maxbits,1,1)));
	}
};
var format_tools_Inflate = function() { };
format_tools_Inflate.__name__ = true;
format_tools_Inflate.run = function(bytes) {
	return format_tools_InflateImpl.run(new haxe_io_BytesInput(bytes));
};
var format_tools__$InflateImpl_Window = function(hasCrc) {
	this.buffer = haxe_io_Bytes.alloc(65536);
	this.pos = 0;
	if(hasCrc) this.crc = new format_tools_Adler32();
};
format_tools__$InflateImpl_Window.__name__ = true;
format_tools__$InflateImpl_Window.prototype = {
	slide: function() {
		if(this.crc != null) this.crc.update(this.buffer,0,32768);
		var b = haxe_io_Bytes.alloc(65536);
		this.pos -= 32768;
		b.blit(0,this.buffer,32768,this.pos);
		this.buffer = b;
	}
	,addBytes: function(b,p,len) {
		if(this.pos + len > 65536) this.slide();
		this.buffer.blit(this.pos,b,p,len);
		this.pos += len;
	}
	,addByte: function(c) {
		if(this.pos == 65536) this.slide();
		this.buffer.b[this.pos] = c & 255;
		this.pos++;
	}
	,getLastChar: function() {
		return this.buffer.b[this.pos - 1];
	}
	,available: function() {
		return this.pos;
	}
	,checksum: function() {
		if(this.crc != null) this.crc.update(this.buffer,0,this.pos);
		return this.crc;
	}
};
var format_tools__$InflateImpl_State = { __ename__ : true, __constructs__ : ["Head","Block","CData","Flat","Crc","Dist","DistOne","Done"] };
format_tools__$InflateImpl_State.Head = ["Head",0];
format_tools__$InflateImpl_State.Head.toString = $estr;
format_tools__$InflateImpl_State.Head.__enum__ = format_tools__$InflateImpl_State;
format_tools__$InflateImpl_State.Block = ["Block",1];
format_tools__$InflateImpl_State.Block.toString = $estr;
format_tools__$InflateImpl_State.Block.__enum__ = format_tools__$InflateImpl_State;
format_tools__$InflateImpl_State.CData = ["CData",2];
format_tools__$InflateImpl_State.CData.toString = $estr;
format_tools__$InflateImpl_State.CData.__enum__ = format_tools__$InflateImpl_State;
format_tools__$InflateImpl_State.Flat = ["Flat",3];
format_tools__$InflateImpl_State.Flat.toString = $estr;
format_tools__$InflateImpl_State.Flat.__enum__ = format_tools__$InflateImpl_State;
format_tools__$InflateImpl_State.Crc = ["Crc",4];
format_tools__$InflateImpl_State.Crc.toString = $estr;
format_tools__$InflateImpl_State.Crc.__enum__ = format_tools__$InflateImpl_State;
format_tools__$InflateImpl_State.Dist = ["Dist",5];
format_tools__$InflateImpl_State.Dist.toString = $estr;
format_tools__$InflateImpl_State.Dist.__enum__ = format_tools__$InflateImpl_State;
format_tools__$InflateImpl_State.DistOne = ["DistOne",6];
format_tools__$InflateImpl_State.DistOne.toString = $estr;
format_tools__$InflateImpl_State.DistOne.__enum__ = format_tools__$InflateImpl_State;
format_tools__$InflateImpl_State.Done = ["Done",7];
format_tools__$InflateImpl_State.Done.toString = $estr;
format_tools__$InflateImpl_State.Done.__enum__ = format_tools__$InflateImpl_State;
var format_tools_InflateImpl = function(i,header,crc) {
	if(crc == null) crc = true;
	if(header == null) header = true;
	this["final"] = false;
	this.htools = new format_tools_HuffTools();
	this.huffman = this.buildFixedHuffman();
	this.huffdist = null;
	this.len = 0;
	this.dist = 0;
	this.state = header?format_tools__$InflateImpl_State.Head:format_tools__$InflateImpl_State.Block;
	this.input = i;
	this.bits = 0;
	this.nbits = 0;
	this.needed = 0;
	this.output = null;
	this.outpos = 0;
	this.lengths = [];
	var _g = 0;
	while(_g < 19) {
		_g++;
		this.lengths.push(-1);
	}
	this.window = new format_tools__$InflateImpl_Window(crc);
};
format_tools_InflateImpl.__name__ = true;
format_tools_InflateImpl.run = function(i,bufsize) {
	if(bufsize == null) bufsize = 65536;
	var buf = haxe_io_Bytes.alloc(bufsize);
	var output = new haxe_io_BytesBuffer();
	var inflate = new format_tools_InflateImpl(i);
	while(true) {
		var len = inflate.readBytes(buf,0,bufsize);
		if(len < 0 || len > buf.length) throw new js__$Boot_HaxeError(haxe_io_Error.OutsideBounds);
		var b2 = buf.b;
		var _g1 = 0;
		while(_g1 < len) {
			var i1 = _g1++;
			output.b.push(b2[i1]);
		}
		if(len < bufsize) break;
	}
	return output.getBytes();
};
format_tools_InflateImpl.prototype = {
	buildFixedHuffman: function() {
		if(format_tools_InflateImpl.FIXED_HUFFMAN != null) return format_tools_InflateImpl.FIXED_HUFFMAN;
		var a = [];
		var _g = 0;
		while(_g < 288) {
			var n = _g++;
			a.push(n <= 143?8:n <= 255?9:n <= 279?7:8);
		}
		format_tools_InflateImpl.FIXED_HUFFMAN = this.htools.make(a,0,288,10);
		return format_tools_InflateImpl.FIXED_HUFFMAN;
	}
	,readBytes: function(b,pos,len) {
		this.needed = len;
		this.outpos = pos;
		this.output = b;
		if(len > 0) while(this.inflateLoop()) {
		}
		return len - this.needed;
	}
	,getBits: function(n) {
		while(this.nbits < n) {
			this.bits |= this.input.readByte() << this.nbits;
			this.nbits += 8;
		}
		var b = this.bits & (1 << n) - 1;
		this.nbits -= n;
		this.bits >>= n;
		return b;
	}
	,getBit: function() {
		if(this.nbits == 0) {
			this.nbits = 8;
			this.bits = this.input.readByte();
		}
		var b = (this.bits & 1) == 1;
		this.nbits--;
		this.bits >>= 1;
		return b;
	}
	,getRevBits: function(n) {
		return n == 0?0:this.getBit()?1 << n - 1 | this.getRevBits(n - 1):this.getRevBits(n - 1);
	}
	,resetBits: function() {
		this.bits = 0;
		this.nbits = 0;
	}
	,addBytes: function(b,p,len) {
		this.window.addBytes(b,p,len);
		this.output.blit(this.outpos,b,p,len);
		this.needed -= len;
		this.outpos += len;
	}
	,addByte: function(b) {
		this.window.addByte(b);
		this.output.b[this.outpos] = b & 255;
		this.needed--;
		this.outpos++;
	}
	,addDistOne: function(n) {
		var c = this.window.getLastChar();
		var _g = 0;
		while(_g < n) {
			_g++;
			this.addByte(c);
		}
	}
	,addDist: function(d,len) {
		this.addBytes(this.window.buffer,this.window.pos - d,len);
	}
	,applyHuffman: function(h) {
		var tmp;
		switch(h[1]) {
		case 0:
			tmp = h[2];
			break;
		case 1:
			tmp = this.applyHuffman(this.getBit()?h[3]:h[2]);
			break;
		case 2:
			tmp = this.applyHuffman(h[3][this.getBits(h[2])]);
			break;
		}
		return tmp;
	}
	,inflateLengths: function(a,max) {
		var i = 0;
		var prev = 0;
		while(i < max) {
			var n = this.applyHuffman(this.huffman);
			switch(n) {
			case 0:case 1:case 2:case 3:case 4:case 5:case 6:case 7:case 8:case 9:case 10:case 11:case 12:case 13:case 14:case 15:
				prev = n;
				a[i] = n;
				i++;
				break;
			case 16:
				var end = i + 3 + this.getBits(2);
				if(end > max) throw new js__$Boot_HaxeError("Invalid data");
				while(i < end) {
					a[i] = prev;
					i++;
				}
				break;
			case 17:
				i += 3 + this.getBits(3);
				if(i > max) throw new js__$Boot_HaxeError("Invalid data");
				break;
			case 18:
				i += 11 + this.getBits(7);
				if(i > max) throw new js__$Boot_HaxeError("Invalid data");
				break;
			default:
				throw new js__$Boot_HaxeError("Invalid data");
			}
		}
	}
	,inflateLoop: function() {
		var _g = this.state;
		switch(_g[1]) {
		case 0:
			var cmf = this.input.readByte();
			var cm = cmf & 15;
			if(cm != 8) throw new js__$Boot_HaxeError("Invalid data");
			var flg = this.input.readByte();
			var fdict = (flg & 32) != 0;
			if(((cmf << 8) + flg) % 31 != 0) throw new js__$Boot_HaxeError("Invalid data");
			if(fdict) throw new js__$Boot_HaxeError("Unsupported dictionary");
			this.state = format_tools__$InflateImpl_State.Block;
			return true;
		case 4:
			var calc = this.window.checksum();
			if(calc == null) {
				this.state = format_tools__$InflateImpl_State.Done;
				return true;
			}
			var crc = format_tools_Adler32.read(this.input);
			if(!calc.equals(crc)) throw new js__$Boot_HaxeError("Invalid CRC");
			this.state = format_tools__$InflateImpl_State.Done;
			return true;
		case 7:
			return false;
		case 1:
			this["final"] = this.getBit();
			var _g1 = this.getBits(2);
			switch(_g1) {
			case 0:
				this.len = this.input.readUInt16();
				var nlen = this.input.readUInt16();
				if(nlen != 65535 - this.len) throw new js__$Boot_HaxeError("Invalid data");
				this.state = format_tools__$InflateImpl_State.Flat;
				var r = this.inflateLoop();
				this.resetBits();
				return r;
			case 1:
				this.huffman = this.buildFixedHuffman();
				this.huffdist = null;
				this.state = format_tools__$InflateImpl_State.CData;
				return true;
			case 2:
				var hlit = this.getBits(5) + 257;
				var hdist = this.getBits(5) + 1;
				var hclen = this.getBits(4) + 4;
				var _g2 = 0;
				while(_g2 < hclen) {
					var i = _g2++;
					this.lengths[format_tools_InflateImpl.CODE_LENGTHS_POS[i]] = this.getBits(3);
				}
				var _g21 = hclen;
				while(_g21 < 19) {
					var i1 = _g21++;
					this.lengths[format_tools_InflateImpl.CODE_LENGTHS_POS[i1]] = 0;
				}
				this.huffman = this.htools.make(this.lengths,0,19,8);
				var lengths = [];
				var _g3 = 0;
				var _g22 = hlit + hdist;
				while(_g3 < _g22) {
					_g3++;
					lengths.push(0);
				}
				this.inflateLengths(lengths,hlit + hdist);
				this.huffdist = this.htools.make(lengths,hlit,hdist,16);
				this.huffman = this.htools.make(lengths,0,hlit,16);
				this.state = format_tools__$InflateImpl_State.CData;
				return true;
			default:
				throw new js__$Boot_HaxeError("Invalid data");
			}
			break;
		case 3:
			var rlen = this.len < this.needed?this.len:this.needed;
			var bytes = this.input.read(rlen);
			this.len -= rlen;
			this.addBytes(bytes,0,rlen);
			if(this.len == 0) this.state = this["final"]?format_tools__$InflateImpl_State.Crc:format_tools__$InflateImpl_State.Block;
			return this.needed > 0;
		case 6:
			var rlen1 = this.len < this.needed?this.len:this.needed;
			this.addDistOne(rlen1);
			this.len -= rlen1;
			if(this.len == 0) this.state = format_tools__$InflateImpl_State.CData;
			return this.needed > 0;
		case 5:
			while(this.len > 0 && this.needed > 0) {
				var rdist = this.len < this.dist?this.len:this.dist;
				var rlen2 = this.needed < rdist?this.needed:rdist;
				this.addDist(this.dist,rlen2);
				this.len -= rlen2;
			}
			if(this.len == 0) this.state = format_tools__$InflateImpl_State.CData;
			return this.needed > 0;
		case 2:
			var n = this.applyHuffman(this.huffman);
			if(n < 256) {
				this.addByte(n);
				return this.needed > 0;
			} else if(n == 256) {
				this.state = this["final"]?format_tools__$InflateImpl_State.Crc:format_tools__$InflateImpl_State.Block;
				return true;
			} else {
				n -= 257;
				var extra_bits = format_tools_InflateImpl.LEN_EXTRA_BITS_TBL[n];
				if(extra_bits == -1) throw new js__$Boot_HaxeError("Invalid data");
				this.len = format_tools_InflateImpl.LEN_BASE_VAL_TBL[n] + this.getBits(extra_bits);
				var dist_code = this.huffdist == null?this.getRevBits(5):this.applyHuffman(this.huffdist);
				extra_bits = format_tools_InflateImpl.DIST_EXTRA_BITS_TBL[dist_code];
				if(extra_bits == -1) throw new js__$Boot_HaxeError("Invalid data");
				this.dist = format_tools_InflateImpl.DIST_BASE_VAL_TBL[dist_code] + this.getBits(extra_bits);
				if(this.dist > this.window.available()) throw new js__$Boot_HaxeError("Invalid data");
				this.state = this.dist == 1?format_tools__$InflateImpl_State.DistOne:format_tools__$InflateImpl_State.Dist;
				return true;
			}
			break;
		}
	}
};
var haxe_IMap = function() { };
haxe_IMap.__name__ = true;
var haxe_crypto_Crc32 = function() {
	this.crc = -1;
};
haxe_crypto_Crc32.__name__ = true;
haxe_crypto_Crc32.prototype = {
	'byte': function(b) {
		var tmp = (this.crc ^ b) & 255;
		var _g = 0;
		while(_g < 8) {
			_g++;
			if((tmp & 1) == 1) tmp = tmp >>> 1 ^ -306674912; else tmp >>>= 1;
		}
		this.crc = this.crc >>> 8 ^ tmp;
	}
	,update: function(b,pos,len) {
		var b1 = b.b.bufferValue;
		var _g1 = pos;
		var _g = pos + len;
		while(_g1 < _g) {
			var i = _g1++;
			var tmp = (this.crc ^ b1.bytes[i]) & 255;
			var _g2 = 0;
			while(_g2 < 8) {
				_g2++;
				if((tmp & 1) == 1) tmp = tmp >>> 1 ^ -306674912; else tmp >>>= 1;
			}
			this.crc = this.crc >>> 8 ^ tmp;
		}
	}
	,get: function() {
		return this.crc ^ -1;
	}
};
var haxe_ds_IntMap = function() {
	this.h = { };
};
haxe_ds_IntMap.__name__ = true;
haxe_ds_IntMap.__interfaces__ = [haxe_IMap];
var haxe_io_Bytes = function(data) {
	this.length = data.byteLength;
	this.b = new Uint8Array(data);
	this.b.bufferValue = data;
	data.hxBytes = this;
	data.bytes = this.b;
};
haxe_io_Bytes.__name__ = true;
haxe_io_Bytes.alloc = function(length) {
	return new haxe_io_Bytes(new ArrayBuffer(length));
};
haxe_io_Bytes.prototype = {
	blit: function(pos,src,srcpos,len) {
		if(pos < 0 || srcpos < 0 || len < 0 || pos + len > this.length || srcpos + len > src.length) throw new js__$Boot_HaxeError(haxe_io_Error.OutsideBounds);
		if(srcpos == 0 && len == src.length) this.b.set(src.b,pos); else this.b.set(src.b.subarray(srcpos,srcpos + len),pos);
	}
	,fill: function(pos,len,value) {
		var _g = 0;
		while(_g < len) {
			_g++;
			var pos1 = pos++;
			this.b[pos1] = value & 255;
		}
	}
	,getString: function(pos,len) {
		if(pos < 0 || len < 0 || pos + len > this.length) throw new js__$Boot_HaxeError(haxe_io_Error.OutsideBounds);
		var s = "";
		var b = this.b;
		var fcc = String.fromCharCode;
		var i = pos;
		var max = pos + len;
		while(i < max) {
			var c = b[i++];
			if(c < 128) {
				if(c == 0) break;
				s += fcc(c);
			} else if(c < 224) s += fcc((c & 63) << 6 | b[i++] & 127); else if(c < 240) {
				var c2 = b[i++];
				s += fcc((c & 31) << 12 | (c2 & 127) << 6 | b[i++] & 127);
			} else {
				var c21 = b[i++];
				var c3 = b[i++];
				var u = (c & 15) << 18 | (c21 & 127) << 12 | (c3 & 127) << 6 | b[i++] & 127;
				s += fcc((u >> 10) + 55232);
				s += fcc(u & 1023 | 56320);
			}
		}
		return s;
	}
	,toString: function() {
		return this.getString(0,this.length);
	}
};
var haxe_io_BytesBuffer = function() {
	this.b = [];
};
haxe_io_BytesBuffer.__name__ = true;
haxe_io_BytesBuffer.prototype = {
	getBytes: function() {
		var bytes = new haxe_io_Bytes(new Uint8Array(this.b).buffer);
		this.b = null;
		return bytes;
	}
};
var haxe_io_BytesInput = function(b,pos,len) {
	if(pos == null) pos = 0;
	if(len == null) len = b.length - pos;
	if(pos < 0 || len < 0 || pos + len > b.length) throw new js__$Boot_HaxeError(haxe_io_Error.OutsideBounds);
	this.b = b.b;
	this.pos = pos;
	this.len = len;
	this.totlen = len;
};
haxe_io_BytesInput.__name__ = true;
haxe_io_BytesInput.__super__ = haxe_io_Input;
haxe_io_BytesInput.prototype = $extend(haxe_io_Input.prototype,{
	readByte: function() {
		if(this.len == 0) throw new js__$Boot_HaxeError(new haxe_io_Eof());
		this.len--;
		return this.b[this.pos++];
	}
	,readBytes: function(buf,pos,len) {
		if(pos < 0 || len < 0 || pos + len > buf.length) throw new js__$Boot_HaxeError(haxe_io_Error.OutsideBounds);
		if(this.len == 0 && len > 0) throw new js__$Boot_HaxeError(new haxe_io_Eof());
		if(this.len < len) len = this.len;
		var b1 = this.b;
		var b2 = buf.b;
		var _g = 0;
		while(_g < len) {
			var i = _g++;
			b2[pos + i] = b1[this.pos + i];
		}
		this.pos += len;
		this.len -= len;
		return len;
	}
});
var haxe_io_Eof = function() {
};
haxe_io_Eof.__name__ = true;
haxe_io_Eof.prototype = {
	toString: function() {
		return "Eof";
	}
};
var haxe_io_Error = { __ename__ : true, __constructs__ : ["Blocked","Overflow","OutsideBounds","Custom"] };
haxe_io_Error.Blocked = ["Blocked",0];
haxe_io_Error.Blocked.toString = $estr;
haxe_io_Error.Blocked.__enum__ = haxe_io_Error;
haxe_io_Error.Overflow = ["Overflow",1];
haxe_io_Error.Overflow.toString = $estr;
haxe_io_Error.Overflow.__enum__ = haxe_io_Error;
haxe_io_Error.OutsideBounds = ["OutsideBounds",2];
haxe_io_Error.OutsideBounds.toString = $estr;
haxe_io_Error.OutsideBounds.__enum__ = haxe_io_Error;
haxe_io_Error.Custom = function(e) { var $x = ["Custom",3,e]; $x.__enum__ = haxe_io_Error; $x.toString = $estr; return $x; };
var js__$Boot_HaxeError = function(val) {
	Error.call(this);
	this.val = val;
	this.message = String(val);
	if(Error.captureStackTrace) Error.captureStackTrace(this,js__$Boot_HaxeError);
};
js__$Boot_HaxeError.__name__ = true;
js__$Boot_HaxeError.__super__ = Error;
js__$Boot_HaxeError.prototype = $extend(Error.prototype,{
});
var js_Boot = function() { };
js_Boot.__name__ = true;
js_Boot.__string_rec = function(o,s) {
	if(o == null) return "null";
	if(s.length >= 5) return "<...>";
	var t = typeof(o);
	if(t == "function" && (o.__name__ || o.__ename__)) t = "object";
	switch(t) {
	case "object":
		if(o instanceof Array) {
			if(o.__enum__) {
				if(o.length == 2) return o[0];
				var str2 = o[0] + "(";
				s += "\t";
				var _g1 = 2;
				var _g = o.length;
				while(_g1 < _g) {
					var i1 = _g1++;
					if(i1 != 2) str2 += "," + js_Boot.__string_rec(o[i1],s); else str2 += js_Boot.__string_rec(o[i1],s);
				}
				return str2 + ")";
			}
			var l = o.length;
			var i;
			var str1 = "[";
			s += "\t";
			var _g2 = 0;
			while(_g2 < l) {
				var i2 = _g2++;
				str1 += (i2 > 0?",":"") + js_Boot.__string_rec(o[i2],s);
			}
			str1 += "]";
			return str1;
		}
		var tostr;
		try {
			tostr = o.toString;
		} catch( e ) {
			if (e instanceof js__$Boot_HaxeError) e = e.val;
			return "???";
		}
		if(tostr != null && tostr != Object.toString && typeof(tostr) == "function") {
			var s2 = o.toString();
			if(s2 != "[object Object]") return s2;
		}
		var k = null;
		var str = "{\n";
		s += "\t";
		var hasp = o.hasOwnProperty != null;
		for( var k in o ) {
		if(hasp && !o.hasOwnProperty(k)) {
			continue;
		}
		if(k == "prototype" || k == "__class__" || k == "__super__" || k == "__interfaces__" || k == "__properties__") {
			continue;
		}
		if(str.length != 2) str += ", \n";
		str += s + k + " : " + js_Boot.__string_rec(o[k],s);
		}
		s = s.substring(1);
		str += "\n" + s + "}";
		return str;
	case "function":
		return "<function>";
	case "string":
		return o;
	default:
		return String(o);
	}
};
String.__name__ = true;
Array.__name__ = true;
format_tools__$InflateImpl_Window.SIZE = 32768;
format_tools__$InflateImpl_Window.BUFSIZE = 65536;
format_tools_InflateImpl.LEN_EXTRA_BITS_TBL = [0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,-1,-1];
format_tools_InflateImpl.LEN_BASE_VAL_TBL = [3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258];
format_tools_InflateImpl.DIST_EXTRA_BITS_TBL = [0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,-1,-1];
format_tools_InflateImpl.DIST_BASE_VAL_TBL = [1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577];
format_tools_InflateImpl.CODE_LENGTHS_POS = [16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];