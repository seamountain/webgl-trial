import "js/web.jsx";

class _Main {
  static function main(args : string[]) : void {
    var element = dom.id("world") as HTMLCanvasElement;

    var gl = element.getContext("experimental-webgl") as WebGLRenderingContext;

    var vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, (dom.id("v-shader") as HTMLScriptElement).text); // called per vertex
    gl.compileShader(vs);
    if (! gl.getShaderParameter(vs, gl.COMPILE_STATUS) as boolean) {
      dom.window.alert("failed to compile vertex shader:\n" + gl.getShaderInfoLog(vs));
      return;
    }

    var fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, (dom.id("f-shader") as HTMLScriptElement).text); // called per pixel
    gl.compileShader(fs);
    if (! gl.getShaderParameter(fs, gl.COMPILE_STATUS) as boolean) {
      dom.window.alert("failed to compile fragment shader:\n" + gl.getShaderInfoLog(fs));
      return;
    }

    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.bindAttribLocation(prog, 0, 'vertex');
    gl.linkProgram(prog);

    var vbuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbuf);

    gl.vertexAttribPointer(0 /* attrib */, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    gl.useProgram(prog);

    var color = gl.getUniformLocation(prog, 'color');
    gl.uniform4fv(color, new Float32Array([1.0, 1.0, 1.0, 0.1]));

    var frameNumber = 0;
    function drawFrame() : void {
      ++frameNumber;
      gl.clear(gl.COLOR_BUFFER_BIT);

      var slow = gl.getUniformLocation(prog, 'slow');
      gl.uniform1f(slow, (frameNumber % 100) / 100);

      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
             0.0,   0.0,  0.0,  1.0,
             0.0,   0.3,  0.0,  1.0,
             0.3,   0.0,  0.0,  1.0,
             0.3,   0.3,  0.0,  1.0,

             0.7,   0.7,  0.0,  1.0,
             0.7,   0.9,  0.0,  1.0,
             0.9,   0.7,  0.0,  1.0,
             0.9,   0.9,  0.0,  1.0,

            -0.3,  -0.3,  0.0,  1.0,
            -0.3,  -0.5,  0.0,  1.0,
            -0.5,  -0.3,  0.0,  1.0,
            -0.5,  -0.5,  0.0,  1.0
      ]), gl.STATIC_DRAW);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.drawArrays(gl.TRIANGLE_STRIP, 4, 4);
      gl.drawArrays(gl.TRIANGLE_STRIP, 8, 4);
      //gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
      //gl.drawElements(gl.TRIANGLES, 8, gl.UNSIGNED_SHORT, 0);
      //gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);

      dom.window.setTimeout(drawFrame, 100);
    }
    drawFrame();

    //prog.vertexPosAttrib = gl.getAttribLocation(prog, 'aVertexPosition');
    //prog.samplerUniform = gl.getUniformLocation(prog, 'uSampler');
    //gl.enableVertexAttribArray(prog.vertexPosArray);
    //gl.vertexAttribPointer(prog.vertexPosAttrib, vertexPosBuffer.itemSize, gl.FLOAT, false, 0, 0);
    var samplerUniform = gl.getUniformLocation(prog, 'uSampler');
    var vertexPosAttrib = gl.getAttribLocation(prog, 'aVertexPosition');
    var texture = gl.createTexture();
    //var img = new Image();
		var img = dom.createElement("img") as HTMLImageElement;

    gl.vertexAttribPointer(vertexPosAttrib, 3, gl.FLOAT, false, 0, 0);
    var textureCoordinates  = new Float32Array([
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,

        // Back face
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,

        // Top face
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0
          //0.0, 0.0,
          //1.0, 0.0,
          //1.0, 1.0,
          //0.0, 1.0

          //0.0, 0.0,
          //0.0, 1.0,
          //1.0, 0.0,
          //1.0, 1.0,

          //0.0, 0.0,
          //0.0, 1.0,
          //1.0, 0.0,
          //1.0, 1.0
          ]);
    //gl.vertexAttribPointer(vertexPosAttrib, vTexture, gl.FLOAT, false, 0, 0);
    
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);

		img.addEventListener("load", (e) -> {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
			gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // 画像の上下反転
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.uniform1i(samplerUniform, 0);
      //gl.drawArrays(gl.TRIANGLE_STRIP, 0, 3);
      
      //gl.uniform1i(samplerUniform, 0);
    });
    //img.src = 'icon.jpg';
    img.src = 'icon.gif';

  }
}
