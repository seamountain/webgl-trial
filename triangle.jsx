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
    //gl.bindAttribLocation(prog, 0, 'vertex');
    gl.linkProgram(prog);
    gl.useProgram(prog);

    //var projectionMatrix = M44.frustum(-1, 1, -1, 1, 7, 1000);
    var projectionMatrix = M44.frustum(-0.8, 0.8, -0.8, 0.8, 7, 1000);
    var projectionMatrix_location = gl.getUniformLocation(prog, 'projectionMatrix');
    gl.uniformMatrix4fv(projectionMatrix_location, false, projectionMatrix.array());

    var vertex_buf = gl.createBuffer();
    // bufferをアクティブにする
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buf);

    // データを中に入れる bufferの中に入れる
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
           1.0,   1.0,  0.0,
          -1.0,   1.0,  0.0,
           1.0,  -1.0,  0.0,
          -1.0,  -1.0,  0.0
          ]), gl.STATIC_DRAW);

    var vertex_loc = gl.getAttribLocation(prog, 'vertex');
    // ここでつなげる
    gl.vertexAttribPointer(vertex_loc, 3, gl.FLOAT, false, 0, 0);
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

    //texture座標用
    //var back_texture_buf = gl.createBuffer();
    //gl.bindBuffer(gl.ARRAY_BUFFER, back_texture_buf);
    //var textureCoordinates  = new Float32Array([

        //]);
    //現在bindされているbuffer(現在アクティブなbuffer)
    //gl.bufferData(gl.ARRAY_BUFFER, textureCoordinates, gl.STATIC_DRAW);
    //var back_corrd_loc = gl.getAttribLocation(prog, 'backTextureCoord');
    //gl.vertexAttribPointer(back_corrd_loc, 1, gl.Float, false, 0, 0);
    //gl.enableVertexAttribArray(back_corrd_loc);

    var color = gl.getUniformLocation(prog, 'color');
    gl.uniform4fv(color, new Float32Array([1.0, 1.0, 1.0, 0.1]));

    var alphaLoc = gl.getUniformLocation(prog, 'alpha');

    var scale = 1.0;
    var scale_loc = gl.getUniformLocation(prog, 'scale');

    var uBackImagePosition = gl.getUniformLocation(prog, 'backImagePosition');
    gl.uniform3f(uBackImagePosition, 0.5, 0.5, 0.5);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.uniform3fv(scale_loc, new Float32Array([scale, scale, scale]));

    var UPDATE_FPS = 25;
    //var weight = [1.0, 0.3, 0.0, 0.8, 0.4, 0.5];
    //var origPosition = [
      //[ 0.0, 0.8, -0.5],
      //[ 0.1, 1.0, -1.0],
      //[ 0.4, 1.0, 0.5],
      //[-0.5, 1.0, 0.0],
      //[-0.7, 1.0, 0.8],
      //[-0.9, 1.3, 0.0]
        //];

    var weight = [0.1, 0.2];
    var origPosition = [[0.5, 0.5, 0.5]];
    for (var i = 0; i < 3000; i++) {
      weight.push(0.5 - Math.random() * 2);
      origPosition.push(
          [1 - Math.random() * 2, 4 - Math.random() * 3, -4 - Math.random() * 5]
          //[1 - Math.random() * 2, 4 - Math.random() * 3, -1 + Math.random() * 2]
          );
    }

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
    //img.src = 'icon.gif';
    img.src = 'snow.png';

    var texture2 = gl.createTexture();
    var img2 = dom.createElement("img") as HTMLImageElement;
    img2.addEventListener("load", (e) -> {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture2);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // 画像の上下反転
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img2);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    });
    img2.src = 'icon.jpg';

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

    var positions = origPosition;
    function update() : void {
      Timer.setTimeout(update, 1000 / UPDATE_FPS);
      for (var i = 0; i < positions.length; i++) {
        if (positions[i][1] < -1) {
          positions[i][1] = origPosition[i][1];
        } else {
          positions[i][1] -= 0.01 + weight[i] / 100;
        }
      }
    }

    //scale = 0.03;
    //gl.uniform3fv(scale_loc, new Float32Array([scale, scale, scale]));
    var position = gl.getUniformLocation(prog, 'position');
    function render(f:number) : void {
      Timer.requestAnimationFrame(render);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      //gl.enable(gl.DEPTH_TEST);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);

      gl.bindTexture(gl.TEXTURE_2D, texture2);
      gl.uniform3f(position, -20, -20, -900);
      gl.uniform3fv(scale_loc, new Float32Array([100, 100, 100]));
      gl.uniform1f(alphaLoc, 1.0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);


      gl.bindTexture(gl.TEXTURE_2D, cameraTex);
      //if (video.videoWidth >= 16 && video.videoHeight >= 16) {
        function pot_ge(n:number):number{var r=1; while(r<n)r*=2; return r;}
        //var texSizeX = pot_ge(video.videoWidth);
        //var texSizeY = pot_ge(video.videoHeight);
        //次にココの調整する！
        var texSizeX = pot_ge(1000);
        var texSizeY = pot_ge(1000);
        //var texSizeX = pot_ge(100);
        //var texSizeY = pot_ge(100);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, texSizeX, texSizeY, 0, gl.RGB, gl.UNSIGNED_BYTE, null);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGB, gl.UNSIGNED_BYTE, video);
        gl.generateMipmap(gl.TEXTURE_2D);
        //var texCoordScaleX = video.videoWidth / texSizeX;
        //var texCoordScaleY = video.videoHeight / texSizeY;
        //gl.uniform2f(gl.getUniformLocation(prog, 'texCoordScale'), texCoordScaleX, texCoordScaleY);
      //}
      //gl.uniform3f(position, -20, -18, -150);
      //gl.uniform3f(position, -25, -23, -200);
      gl.uniform3f(position, 25, 53, -400);
      
      gl.uniform3fv(scale_loc, new Float32Array([100, 100, 100]));
      gl.uniform1f(alphaLoc, 1.0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      scale = 0.02;
      gl.uniform3fv(scale_loc, new Float32Array([scale, scale, scale]));
      gl.bindTexture(gl.TEXTURE_2D, texture);
      for (var i = 0; i < positions.length; i++) {
        //gl.uniform3f(position, positions[i][0] / scale, positions[i][1] / scale, positions[i][2] / scale);
        gl.uniform3f(position, positions[i][0] * scale, positions[i][1] * scale, positions[i][2] * scale);
        gl.uniform3f(position, positions[i][0], positions[i][1], positions[i][2]);
        gl.uniform1f(alphaLoc, 0.3);
        // 座標系を-1から1にしたからpositionの調整いりそう
        //scale = 0.03;
        //scale = positions[i][2] / 200 + 0.01;
        //gl.uniform3fv(scale_loc, new Float32Array([scale, scale, scale]));
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
    }
    var raf = (dom.window.location.hash == "#raf");
    log "use native RAF: " + raf as string;
    Timer.useNativeRAF(raf);

    update();
    render(0);

    var vertexPosAttrib = gl.getAttribLocation(prog, 'aVertexPosition');
    gl.vertexAttribPointer(vertexPosAttrib, 4, gl.FLOAT, false, 0, 0);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);
  }
}
