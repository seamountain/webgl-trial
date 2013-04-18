import "js/web.jsx";
import "Timer.jsx";

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
    //gl.bindAttribLocation(prog, 0, 'vertex');
    gl.linkProgram(prog);
    gl.useProgram(prog);

    var vertex_buf = gl.createBuffer();
    // bufferをアクティブにする
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buf);

    // データを中に入れる bufferの中に入れる
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
          0.3,   0.3,  0.0,  1.0,
          0.0,   0.3,  0.0,  1.0,
          0.3,   0.0,  0.0,  1.0,
          0.0,   0.0,  0.0,  1.0
          ]), gl.STATIC_DRAW);

    var vertex_loc = gl.getAttribLocation(prog, 'vertex');
    // ここでつなげる
    gl.vertexAttribPointer(vertex_loc, 4, gl.FLOAT, false, 0, 0);
    //データを流せるようにする
    gl.enableVertexAttribArray(vertex_loc);

    // texture座標用
    var texture_buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texture_buf);
    var textureCoordinates  = new Float32Array([
        1.0, 1.0,
        0.0, 1.0,
        1.0, 0.0,
        0.0, 0.0
        ]);

    //現在bindされているbuffer(現在アクティブなbuffer)
    gl.bufferData(gl.ARRAY_BUFFER, textureCoordinates, gl.STATIC_DRAW);

    var tex_coord_loc = gl.getAttribLocation(prog, 'vTextureCoord');
    gl.vertexAttribPointer(tex_coord_loc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(tex_coord_loc);

    var color = gl.getUniformLocation(prog, 'color');
    gl.uniform4fv(color, new Float32Array([1.0, 1.0, 1.0, 0.1]));

    //var frameNumber = 0;
    var origPosition = [
      [0.0, 0.0],
      [0.1, 0.3],
      [0.4, 0.6],
      [-0.5, 0.5],
      [-0.7, 0.8],
      [-0.9, 0.7]
        ];
    var weight = [2, 3, 0, 1, 4, 5];

    var position = gl.getUniformLocation(prog, 'position');
    var positions = origPosition;

    var UPDATE_FPS = 25;

    function update() : void {
      Timer.setTimeout(update, 1000 / UPDATE_FPS);
      for (var i = 0; i < positions.length; i++) {
        if (positions[i][1] < -1) {
          positions[i][1] = origPosition[i][1];
        } else {
          positions[i][1] -= 0.01 + weight[i]/100;
        }
      }
    }

    function render(f:number) : void {
      Timer.requestAnimationFrame(render);
      //++frameNumber;
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);

      for (var i = 0; i < positions.length; i++) {
        gl.uniform2f(position, positions[i][0], positions[i][1]);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
    }
    var raf = (dom.window.location.hash == "#raf");
    log "use native RAF: " + raf as string;
    Timer.useNativeRAF(raf);

    update();
    render(0);

    var samplerUniform = gl.getUniformLocation(prog, 'uSampler');
    var vertexPosAttrib = gl.getAttribLocation(prog, 'aVertexPosition');
    var textureCoordAttribute = gl.getAttribLocation(prog, 'vTextureCoord');
    var texture = gl.createTexture();
    var img = dom.createElement("img") as HTMLImageElement;

    gl.vertexAttribPointer(vertexPosAttrib, 4, gl.FLOAT, false, 0, 0);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);

    img.addEventListener("load", (e) -> {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // 画像の上下反転
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.uniform1i(samplerUniform, 0);
    });
    img.src = 'icon.gif';
  }
}
