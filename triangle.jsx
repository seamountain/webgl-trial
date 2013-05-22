import "js/web.jsx";
import "Timer.jsx";
import "mvq.jsx/lib/mvq.jsx";

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
    gl.linkProgram(prog);
    gl.useProgram(prog);

    var projectionMatrix = M44.frustum(-0.8, 0.8, -0.8, 0.8, 7, 1000);
    gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'projectionMatrix'), false, projectionMatrix.array());

    var vertexBuf = gl.createBuffer();
    // bufferをアクティブにする
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuf);
    // データを中に入れる bufferの中に入れる
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
           1.0,   1.0,  0.0,
          -1.0,   1.0,  0.0,
           1.0,  -1.0,  0.0,
          -1.0,  -1.0,  0.0
          ]), gl.STATIC_DRAW);

    var vertexLoc = gl.getAttribLocation(prog, 'vertex');
    // ここでつなげる
    gl.vertexAttribPointer(vertexLoc, 3, gl.FLOAT, false, 0, 0);
    //データを流せるようにする
    gl.enableVertexAttribArray(vertexLoc);

    // texture座標用
    var textureBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureBuf);
    var textureCoordinates  = new Float32Array([
        1.0, 1.0,
        0.0, 1.0,
        1.0, 0.0,
        0.0, 0.0
        ]);
    //現在bindされているbuffer(現在アクティブなbuffer)
    gl.bufferData(gl.ARRAY_BUFFER, textureCoordinates, gl.STATIC_DRAW);

    var texCoordLoc= gl.getAttribLocation(prog, 'vTextureCoord');
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texCoordLoc);

    //大量の雪データ作成
    var weight = [0.1];
    var origPosition = [[0.5, 0.5, 0.5]];
    for (var i = 0; i < 3000; i++) {
      weight.push(0.5 - Math.random() * 2);
      origPosition.push(
          //zが変なことに…
          [1 - Math.random() * 2, 4 - Math.random() * 3, -4 - Math.random() * 5]
          );
    }


    // update
    var positions = origPosition;
    var UPDATE_FPS = 15;
    function update() : void {
      Timer.setTimeout(update, 1000 / UPDATE_FPS);
      for (var i = 0; i < positions.length; i++) {
        positions[i][0] += (0.5 - Math.random() * 1) / 300;
        positions[i][1] -= 0.01 + weight[i] / 100;
      }
    }


    // render
    var positionLoc = gl.getUniformLocation(prog, 'position');
    var alphaLoc = gl.getUniformLocation(prog, 'alpha');
    var texture = gl.createTexture();
    var img = dom.createElement("img") as HTMLImageElement;
    img.addEventListener("load", (e) -> {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // 画像の上下反転
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    });
    img.src = 'snow.png';

    var video = dom.id('v') as HTMLVideoElement;
    dom.window.navigator.webkitGetUserMedia(
        {video:true}:Map.<variant>,
        function(lms:LocalMediaStream):void {
          video.src = URL.createObjectURL(lms);
        }
    );
    var cameraTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, cameraTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

    var scaleLoc = gl.getUniformLocation(prog, 'scale');
    var scale = 1.0;
    gl.uniform3fv(scaleLoc, new Float32Array([scale, scale, scale]));

    function render(f:number) : void {
      Timer.requestAnimationFrame(render);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      //gl.enable(gl.DEPTH_TEST);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);

      //カメラ
      function pot_ge(n:number):number{var r=1; while(r<n)r*=2; return r;}
      var texSizeX = pot_ge(1000);
      var texSizeY = pot_ge(1000);
      gl.bindTexture(gl.TEXTURE_2D, cameraTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, texSizeX, texSizeY, 0, gl.RGB, gl.UNSIGNED_BYTE, null);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGB, gl.UNSIGNED_BYTE, video);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.uniform3f(positionLoc, 25, 53, -400);
      gl.uniform3fv(scaleLoc, new Float32Array([100, 100, 100]));
      gl.uniform1f(alphaLoc, 1.0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      //雪
      scale = 0.02;
      gl.uniform3fv(scaleLoc, new Float32Array([scale, scale, scale]));
      gl.bindTexture(gl.TEXTURE_2D, texture);
      for (var i = 0; i < positions.length; i++) {
        gl.uniform3f(positionLoc, positions[i][0], positions[i][1], positions[i][2]);
        gl.uniform1f(alphaLoc, 0.3);

        //scale = 0.01;
        //scale += positions[i][2] / positions[i][2] / 100;
        //gl.uniform3fv(scaleLoc, new Float32Array([scale, scale, scale]));
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
    }


    var raf = (dom.window.location.hash == "#raf");
    log "use native RAF: " + raf as string;
    Timer.useNativeRAF(raf);

    update();
    render(0);
  }
}
