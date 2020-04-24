"use strict"
const TASKS = true;

// ----------------------------------------------------------------------------  
function studentdata() {

    //*** TODO_A4 : insert your data below ***
    const lastname = 'Lastname';
    const firstname = 'Firstname';
    const studentnum = '010110';
    document.getElementById("author").innerText = ("Author: ").concat(lastname, ", ", firstname, ", ", studentnum);
    document.getElementById("title").innerText = ("A4: ").concat(lastname, ", ", firstname, ", ", studentnum);
}

// ----------------------------------------------------------------------------
// Main function of the WebGL program. 
// It contains further functions as nested functions used for redering.
// This avoids the usage of global variables: all variables can be 
// defined in the main function. 
function main() {

    // ----------------------------------------------------------------------------  
    // set student data
    studentdata();

    // ----------------------------------------------------------------------------  
    // Get the html-canvas element 
    const canvas = document.getElementById('canvas');
    // Get WebGL context
    const gl = canvas.getContext('webgl');
    gl.getExtension('OES_standard_derivatives');
    if (!gl) {
        console.log("WebGL not supported by your browser.");
        throw "WebGL not supported by your browser.";
    }

    // ----------------------------------------------------------------------------  
    // Output WebGL version in the console
    console.log(gl.getParameter(gl.VERSION));
    // Output GLSL version in the console
    console.log(gl.getParameter(gl.SHADING_LANGUAGE_VERSION));
    // Output GLSL max supported attributes
    // console.log(gl.getParameter(gl.MAX_VERTEX_ATTRIBS));

    // ----------------------------------------------------------------------------  
    // Compose and compile the GLSL vertex shader. 
    const vertexShaderStr = shaderSrcPreamble.concat(shaderSrcPhong, vertexShaderSrc);
    const vertexShader = compileShader(gl, vertexShaderStr, gl.VERTEX_SHADER);
    // Compose and compile the GLSL fragment shader. 
    const fragmentShaderStr = shaderSrcPreamble.concat(shaderSrcPhong, fragmentShaderSrc);
    const fragmentShader = compileShader(gl, fragmentShaderStr, gl.FRAGMENT_SHADER);
    // Setup the GLSL program from shaders on the GPU.  
    const program = createProgram(gl, vertexShader, fragmentShader);

    // ----------------------------------------------------------------------------  
    // Lookup shader uniforms 
    const u_timeLoc = gl.getUniformLocation(program, "u_time");
    //const u_alphaLoc = gl.getUniformLocation(program, "u_alpha");
    const u_viewMatLoc = gl.getUniformLocation(program, "u_view");
    const u_projMatLoc = gl.getUniformLocation(program, "u_proj");
    const u_modelViewMatLoc = gl.getUniformLocation(program, "u_modelview");
    const u_normalMatLoc = gl.getUniformLocation(program, "u_normalmat");

    // ----------------------------------------------------------------------------

    const RenderMode = {
        "Filled": 100,
        "Wireframe": 101,
        "Normals": 102
    }

    // initialize scene objects
    function GeometryObject(geometry) {

        // ----------------------------------------------------------------------------  
        // Lookup shader attributes
        const positionAttribLocation = gl.getAttribLocation(program, "a_position");
        const colorAttribLocation = gl.getAttribLocation(program, "a_color");
        const normalAttribLocation = gl.getAttribLocation(program, "a_normal");
        const texcoordAttribLocation = gl.getAttribLocation(program, "a_tex");
        const tangentAttribLocation = gl.getAttribLocation(program, "a_tangent");

        if (geometry == undefined) {
            geometry = cubeGeometry();// sphereGeometry();
        }

        geometry = computeTangentSpace(geometry);

        // default render mode is filled triangles
        let glRenderMode = gl.TRIANGLES;
        let vertexBuffer;// = gl.createBuffer();
        let triangleIndexBuffer;// = gl.createBuffer();
        let edgeIndexBuffer;// = gl.createBuffer();        
        let framesVertexBuffer;// = gl.createBuffer();
        let framesIndexBuffer;// = gl.createBuffer();
        let indexlength = 0;
        createBuffers();
        bindBuffers();

        // ----------------------------------------------------------------------------
        // Ceate and setup buffer function.
        // It needs only to be called once.         
        function createBuffers() {

            if (geometry.vertices !== undefined) {
                // vertex buffer
                // Create an empty buffer object to store vertex buffer
                vertexBuffer = gl.createBuffer();
                // Bind appropriate array buffer to it
                gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
                // Pass the vertex data to the buffer
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.vertices), gl.STATIC_DRAW);
                // Unbind the buffer
                gl.bindBuffer(gl.ARRAY_BUFFER, null);
            }

            if (geometry.indices !== undefined) {
                // vertex index buffer
                // Create an empty buffer object to store Index buffer
                triangleIndexBuffer = gl.createBuffer();
                // Bind appropriate array buffer to it
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleIndexBuffer);
                // Pass the vertex data to the buffer
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(geometry.indices), gl.STATIC_DRAW);
                // Unbind the buffer
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
            }

            if (geometry.edges !== undefined) {
                // edge index buffer
                edgeIndexBuffer = gl.createBuffer();
                // Bind appropriate array buffer to it
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, edgeIndexBuffer);
                // Pass the vertex data to the buffer
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(geometry.edges), gl.STATIC_DRAW);
                // Unbind the buffer
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
            }

            if (geometry.frames !== undefined) {
                framesVertexBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, framesVertexBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.frames.vertices), gl.STATIC_DRAW);
                gl.bindBuffer(gl.ARRAY_BUFFER, null);

                framesIndexBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, framesIndexBuffer);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(geometry.frames.indices), gl.STATIC_DRAW);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
            }
        }

        // ----------------------------------------------------------------------------
        // Bind buffers during rendering
        function bindBuffers(mode = RenderMode.Filled) {

            if (mode === RenderMode.Filled) {
                gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
                // vertex stride is now 11: 3 pos, 3 color, 3 normal, 2 texcoord        
                const stride = geometry.stride;
                // type of elements, each are 32 bit float thus type is float.        
                const type = gl.FLOAT;
                // turn on the position attribute
                if (positionAttribLocation != -1) {
                    const size = 3;
                    const offset = 0;
                    gl.enableVertexAttribArray(positionAttribLocation);
                    gl.vertexAttribPointer(positionAttribLocation, size, type, false, stride, offset);
                }
                // turn on the color attribute
                if (colorAttribLocation != -1) {
                    const size = 3;
                    const offset = 3 * Float32Array.BYTES_PER_ELEMENT;
                    gl.enableVertexAttribArray(colorAttribLocation);
                    gl.vertexAttribPointer(colorAttribLocation, size, type, false, stride, offset);
                }
                // turn on the normal attribute
                if (normalAttribLocation != -1) {
                    const size = 3;
                    const offset = 6 * Float32Array.BYTES_PER_ELEMENT;
                    gl.enableVertexAttribArray(normalAttribLocation);
                    gl.vertexAttribPointer(normalAttribLocation, size, type, false, stride, offset);
                }
                // turn on the texcoord attribute        
                if (texcoordAttribLocation != -1) {
                    const size = 2;
                    const offset = 9 * Float32Array.BYTES_PER_ELEMENT;
                    gl.enableVertexAttribArray(texcoordAttribLocation);
                    gl.vertexAttribPointer(texcoordAttribLocation, size, type, false, stride, offset);
                }
                // turn on tangent vector attribute
                if (tangentAttribLocation != -1) {
                    const size = 3;
                    const offset = 11 * Float32Array.BYTES_PER_ELEMENT;
                    gl.enableVertexAttribArray(tangentAttribLocation);
                    gl.vertexAttribPointer(tangentAttribLocation, size, gl.FLOAT, false, stride, offset);
                }

                // bind the index buffer if given
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleIndexBuffer);
                indexlength = geometry.indices.length;
                glRenderMode = gl.TRIANGLES;
            }
            else if (mode === RenderMode.Wireframe) {

                gl.disableVertexAttribArray(normalAttribLocation);
                gl.disableVertexAttribArray(texcoordAttribLocation);

                gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
                const stride = geometry.stride;
                const type = gl.FLOAT;
                // turn on the position attribute
                if (positionAttribLocation != -1) {
                    const size = 3;
                    const offset = 0;
                    gl.enableVertexAttribArray(positionAttribLocation);
                    gl.vertexAttribPointer(positionAttribLocation, size, type, false, stride, offset);
                }
                // turn on the color attribute
                if (colorAttribLocation != -1) {
                    const size = 3;
                    const offset = 3 * Float32Array.BYTES_PER_ELEMENT;
                    gl.enableVertexAttribArray(colorAttribLocation);
                    gl.vertexAttribPointer(colorAttribLocation, size, type, false, stride, offset);
                }

                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, edgeIndexBuffer);
                indexlength = geometry.edges.length;
                glRenderMode = gl.LINES;
            }
            else if (mode === RenderMode.Normals) {

                gl.disableVertexAttribArray(normalAttribLocation);
                gl.disableVertexAttribArray(texcoordAttribLocation);

                gl.bindBuffer(gl.ARRAY_BUFFER, framesVertexBuffer);
                gl.enableVertexAttribArray(positionAttribLocation);
                gl.vertexAttribPointer(positionAttribLocation, 3, gl.FLOAT, false, geometry.frames.stride, 0);
                gl.enableVertexAttribArray(colorAttribLocation);
                gl.vertexAttribPointer(colorAttribLocation, 3, gl.FLOAT, false, geometry.frames.stride, 3 * Float32Array.BYTES_PER_ELEMENT);

                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, framesIndexBuffer);
                indexlength = geometry.frames.indices.length;
                glRenderMode = gl.LINES;
            }
            else {
                console.log("No such mode.");
            }
        }

        // ----------------------------------------------------------------------------
        this.bind = function (mode = RenderMode.Filled) {
            bindBuffers(mode);
        }

        // ----------------------------------------------------------------------------
        this.unbind = function () {
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        }

        // ----------------------------------------------------------------------------
        this.render = function () {
            gl.drawElements(glRenderMode, indexlength, gl.UNSIGNED_SHORT, 0);
        }
    }

    const objectManager = new function () {
        // create geometry pool and bind the buffers
        let mesh = new GeometryObject();
        let quadmesh = new GeometryObject(quadGeometry());
        let cubemesh = new GeometryObject(cubeGeometry());
        let teapotmesh = new GeometryObject(teapotGeometry());
        let res = Number(document.getElementById("resSlider").value);
        let spheremesh = new GeometryObject(sphereGeometry(5 * res, 10 * res));
        let headmesh = new GeometryObject(importObj(head)); 
        //const coordFrame = new GeometryObject(coordinateFrame());

        this.getObject = function(selectedMesh = "sphere")
        {
            //document.getElementById("geometrySelect").value
            switch (selectedMesh) {                 
                case "quad":
                    return quadmesh;                    
                case "cube":
                    return cubemesh;  
                default:                  
                case "sphere":
                    return spheremesh;                    
                case "teapot":
                    return teapotmesh;
                case "head":
                    return headmesh;
            }            
        }

        this.getSphere = function()
        {
            return spheremesh;
        }

        // Register the event for update of resolution with the UI slider. 
        document.getElementById("resSlider").oninput = function (event) {
            let res = Number(document.getElementById("resSlider").value);
            spheremesh = new GeometryObject(sphereGeometry(5 * res, 10 * res));
            // if (document.getElementById("geometrySelect").value == "sphere") {
            //      mesh = spheremesh;
            // }
        }
        // Register the event for update of animation speed with the UI slider. 
        document.getElementById("speedSlider").oninput = function (event) {
            // speed
            timings.speed = Number(event.target.value);
        }
        // Register event for shading selection 
        document.getElementById("shadingSelect").onchange = function (event) {
            // choose shading
            gl.uniform1i(gl.getUniformLocation(program, "u_shading"), Number(document.getElementById("shadingSelect").value));
        }
        // Register event for background selection 
        document.getElementById("bgdColor").onchange = function (event) {
            const c = hexToRgb(event.target.value);
            gl.clearColor(c[0], c[1], c[2], 1.0);
        }
    }

    // --- wrap animation timing-variables to a object literal to clean up the render function
    const timings = {
        speed: 0,
        then: 0,
        step: 0,
        day: 0,
        sunday: 0,
        month: 0,
        year: 0,
        update: function (now) {
            // convert the time from milliseconds to seconds
            now *= 0.001;
            // subtract the previous time from the current time
            let delta = now - this.then;
            // remember the current time for the next frame.
            this.then = now;
            // increment the step of the animation
            this.step += this.speed * delta;
            // set the duration of a day: 360 degrees per second by default speed = 10
            this.day = 36.0 * this.step;
            // duration of a "sun-day" (one revolution of the sun takes 24 earth days): 24 times slower than an Earth day
            this.sunday = this.day / 24;
            //let month = day / 30;
            this.month = this.day / 30;
            // duration of a year: 360 times slower than an Earth day
            this.year = this.day / 360;
            // set time to vertex shader (for funny time-dependent stuff in the shader... :)
            //gl.uniform1f(u_timeLoc, 0.1 * this.speed * now);
            gl.uniform1f(u_timeLoc, 0.1 * now);
        }
    };

    // --- object literal to wrap and manage materials
    const materialManager = new function () {

        // looks up the locations in the shader progam and caches them
        const u_kaLoc = gl.getUniformLocation(program, "u_ka");
        const u_kdLoc = gl.getUniformLocation(program, "u_kd");
        const u_ksLoc = gl.getUniformLocation(program, "u_ks");
        const u_qsLoc = gl.getUniformLocation(program, "u_qs");
        const u_kdSamplerLoc = gl.getUniformLocation(program, "u_kdSampler");
        //const u_ksSamplerLoc = gl.getUniformLocation(program, "u_ksSampler");
        const u_nmSamplerLoc = gl.getUniformLocation(program, "u_nmSampler");
        const u_hasSamplerLoc = gl.getUniformLocation(program, "u_hasSampler");

        // create an object as a material collection 
        const materials = {
            "Test Material": {
                colors: { "ka": [0.1, 0.1, 0.1], "kd": [0.5, 0.5, 0.5], "ks": [0.2, 0.2, 0.2] },
                qs: 2,
                diffSampler: loadTexture(gl, './texture/checker1.jpg'),
                normSampler: loadTexture(gl, './texture/bump_normal.png'),
            },
            "Normal Map": {
                colors: { "ka": [0.1, 0.1, 0.1], "kd": [0.5, 0.5, 0.5], "ks": [0.2, 0.2, 0.2] },
                qs: 12,
                diffSampler: loadTexture(gl, './texture/DisplacementMap.png'),
                normSampler: loadTexture(gl, './texture/NormalMap.png'),
            },
            "Reddish": {
                colors: { "ka": [0.1, 0.1, 0.1], "kd": [0.8, 0.1, 0.1], "ks": [0.2, 0.2, 0.2] },
                qs: 12,
            },
            "Face": {
                colors: { "ka": [0.1, 0.1, 0.1], "kd": [0.5, 0.5, 0.5], "ks": [0.2, 0.2, 0.2] },
                qs: 10,
                diffSampler: loadTexture(gl, './texture/head_diffuse.jpg'),
                normSampler: loadTexture(gl, './texture/head_normal.jpg'),
            },
            "Custom Material": {
                // ************************************************************************
                // *** TODO_A4 : Task 4 *** 
                // 
                // Create or find your own diffuse texture for your material. 
                // Copy this texture to the ./texture/ folder. Further, 
                // add your texture to the Custom Material (you can rename it) in the material manager 
                // (search for TODO_A4 Task 4) in the 'task4.js' file.

                // Create or find a corresponding normal map. 
                // You can use tools like Normal Map Online or Crazybump or other (search in the web) for this task. 
                // Also add this texture to your material. 

                // Document your work and be creative! 
                // The standard brick or stone bump-map will hardly gain the creativity bonus! 
                // For fancy materials, additional creativity points will be given. 

                colors: { "ka": [0.1, 0.1, 0.1], "kd": [0.5, 0.5, 0.5], "ks": [0.2, 0.2, 0.2] },
                qs: 10,
                //diffSampler: loadTexture(gl, './texture/head_diffuse.bmp'),
                //normSampler: loadTexture(gl, './texture/head_normal.bmp'),
            },
        };

        // material currently active in the gui
        let activeMaterial;

        // set the material with name as active in the gui
        const setActiveMaterial = function (name) {
            // active material
            let mat = materials[name];
            activeMaterial = mat;
            // update gui sliders            
            document.getElementById("qsSlider").value = Number(mat.qs);
            document.getElementById("qsValue").innerHTML = Number(mat.qs).toPrecision(4);
            // update gui color-pickers
            setGuiColor("ka", mat.colors["ka"]);
            setGuiColor("kd", mat.colors["kd"]);
            setGuiColor("ks", mat.colors["ks"]);

            function setGuiColor(component, c) {
                document.getElementById(component.concat("Color")).value = rgbToHex(c);
                document.getElementById(component.concat("R")).innerHTML = c[0].toFixed(2);
                document.getElementById(component.concat("G")).innerHTML = c[1].toFixed(2);
                document.getElementById(component.concat("B")).innerHTML = c[2].toFixed(2);
            }
        }

        // function for all material uniforms for the chosen material name
        this.renderMaterial = function (name) {

            let hasSampler = vec4(0.0, 0.0, 0.0, 0.0);

            let mat = materials[name];
            gl.uniform3fv(u_kaLoc, mat.colors["ka"]);
            gl.uniform3fv(u_kdLoc, mat.colors["kd"]);
            gl.uniform3fv(u_ksLoc, mat.colors["ks"]);
            gl.uniform1f(u_qsLoc, mat.qs);

            // --- activate and bind the texture
            if (mat.diffSampler != undefined) {
                // Tell WebGL we want to affect texture unit 0
                gl.activeTexture(gl.TEXTURE0);
                // Bind the texture to texture unit 0
                gl.bindTexture(gl.TEXTURE_2D, mat.diffSampler);
                // Tell the shader we bound the texture to texture unit 0                
                gl.uniform1i(u_kdSamplerLoc, 0);
                // choose minification and magnification filters
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, document.getElementById("diffMinFilter").value);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, document.getElementById("diffMagFilter").value);
                // set the flag that sampler 0 is set            
                hasSampler[0] = Number(document.getElementById("diffuseMap").checked);
            }
            else {
                // set the flag that sampler 0 is not set
                hasSampler[0] = 0.0;
            }
            // --- activate and bind the texture
            // if (mat.specSampler != undefined) {
            //     // Tell WebGL we want to affect texture unit 1
            //     gl.activeTexture(gl.TEXTURE1);
            //     // Bind the texture to texture unit 1
            //     gl.bindTexture(gl.TEXTURE_2D, mat.specSampler);
            //     // Tell the shader we bound the texture to texture unit 1                
            //     gl.uniform1i(u_ksSamplerLoc, 1);
            //     // set the flag that sampler 1 is set
            //     hasSampler[1] = Number(document.getElementById("specularMap").checked);
            // }
            // else {
            //     // set the flag that sampler 1 is not set
            //     hasSampler[1] = 0.0;
            // }
            // --- activate and bind the texture
            if (mat.normSampler != undefined) {
                // Tell WebGL we want to affect texture unit 2
                gl.activeTexture(gl.TEXTURE2);
                // Bind the texture to texture unit 2
                gl.bindTexture(gl.TEXTURE_2D, mat.normSampler);
                // Tell the shader we bound the texture to texture unit 2                
                gl.uniform1i(u_nmSamplerLoc, 2);
                // choose minification and magnification filters
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, document.getElementById("normMinFilter").value);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, document.getElementById("normMagFilter").value);
                // set the flag that sampler 2 is set
                hasSampler[2] = Number(document.getElementById("normalMap").checked);
            }
            else {
                // set the flag that sampler 1 is not set
                hasSampler[2] = 0.0;
            }

            gl.uniform4fv(u_hasSamplerLoc, hasSampler);
        }

        // --- register materials gui-elements
        document.getElementById("materialSelect").onchange = function (event) {
            setActiveMaterial(event.target.value);
        }
        document.getElementById("qsSlider").oninput = function (event) {
            activeMaterial.qs = Number(event.target.value);
            document.getElementById("qsValue").innerHTML = Number(event.target.value).toPrecision(4);
        }
        document.getElementById("kaColor").oninput = function (event) {
            activeMaterial.colors["ka"] = hexToRgb(event.target.value);
            const c = hexToRgb(event.target.value);
            document.getElementById("kaR").innerHTML = c[0].toFixed(2);
            document.getElementById("kaG").innerHTML = c[1].toFixed(2);
            document.getElementById("kaB").innerHTML = c[2].toFixed(2);
        }
        document.getElementById("kdColor").oninput = function (event) {
            activeMaterial.colors["kd"] = hexToRgb(event.target.value);
            const c = hexToRgb(event.target.value);
            document.getElementById("kdR").innerHTML = c[0].toFixed(2);
            document.getElementById("kdG").innerHTML = c[1].toFixed(2);
            document.getElementById("kdB").innerHTML = c[2].toFixed(2);
        }
        document.getElementById("ksColor").oninput = function (event) {
            activeMaterial.colors["ks"] = hexToRgb(event.target.value);
            const c = hexToRgb(event.target.value);
            document.getElementById("ksR").innerHTML = c[0].toFixed(2);
            document.getElementById("ksG").innerHTML = c[1].toFixed(2);
            document.getElementById("ksB").innerHTML = c[2].toFixed(2);
        }

        // --- add materials to the gui select
        Object.keys(materials).forEach(element => {
            let opt = document.createElement("option");
            opt.value = element;
            opt.text = element;
            opt.className = "uibox";
            document.getElementById("materialSelect").add(opt);
            document.getElementById("obj1MatSelect").add(opt.cloneNode(true));
            document.getElementById("obj2MatSelect").add(opt.cloneNode(true));
            document.getElementById("obj3MatSelect").add(opt.cloneNode(true));
            // document.getElementById("obj4MatSelect").add(opt.cloneNode(true));
        });

        // --- collection of OpenGL texture filtering modes
        const textureFilters =
        {
            "Nearest": gl.NEAREST,
            "Linear": gl.LINEAR,
            "Nearest Nearest": gl.NEAREST_MIPMAP_NEAREST,
            "Nearest Linear": gl.NEAREST_MIPMAP_LINEAR,
            "Linear Nearest": gl.LINEAR_MIPMAP_NEAREST,
            "Trilinear": gl.LINEAR_MIPMAP_LINEAR,
        };

        // --- add texture filters to gui
        Object.keys(textureFilters).forEach(key => {
            let opt = document.createElement("option");
            opt.value = textureFilters[key];
            opt.text = key;
            opt.className = "uibox";
            document.getElementById("diffMinFilter").add(opt);
            document.getElementById("normMinFilter").add(opt.cloneNode(true));
            if (key.length < 8) {
                document.getElementById("diffMagFilter").add(opt.cloneNode(true));
                document.getElementById("normMagFilter").add(opt.cloneNode(true));
            }
        });

        // --- set a default material in material manager
        setActiveMaterial("Test Material");

        // --- set default materials for scene objects
        document.getElementById("obj1MatSelect").value = "Test Material";
        document.getElementById("obj2MatSelect").value = "Test Material";
        document.getElementById("obj3MatSelect").value = "Test Material";
    };

    // --- camera object to wrap camera parameters and methods    
    const camera = new function () {

        let rotx = 0;
        let roty = 0;
        let rotup = 0;
        let dist = 2;

        // --- object for mouse events tracking
        const mouse = new MouseTracker(-2.001, 25);


        this.viewMatrix = function (eye = vec3(0, 0, 0.001), at = vec3(0, 0, 0), up = vec3(0, 1, 0)) {

            // get mouse values
            rotx = -mouse.rotx(); // Number(document.getElementById("rotXSlider").value);
            roty = -mouse.roty(); // Number(document.getElementById("rotYSlider").value);                        
            rotup = Number(document.getElementById("rotZSlider").value);
            dist = 2 + mouse.dist();

            let C = [rotateX(rotx), rotateY(roty), translate(0, 0, dist)].reduce(mult);
            eye = mult(C, vec4(eye, 1)).splice(0, 3);
            up = mult(mult(C, rotateZ(rotup)), vec4(up, 0)).splice(0, 3);
            //let at = vec3(0, 0, 0);
            return lookAt(eye, at, up);
        }

        this.projMatrix = function () {

            let fovy = Number(document.getElementById("fovySlider").value);
            let near = Number(document.getElementById("nearSlider").value);
            let far = Number(document.getElementById("farSlider").value);
            let dist = 2 + mouse.dist(); //Number(document.getElementById("distSlider").value);
            let aspectRatio = canvas.width / canvas.height;

            switch (document.getElementById("projectionSelect").value) {
                case "persp": {
                    // solution 1
                    //return perspective(fovy, aspectRatio, near, far);
                    // solution 2
                    let w = near * Math.tan(radians(fovy) / 2) + 0.0001;
                    return frustum(-aspectRatio * w, aspectRatio * w, -w, w, near, far);
                }
                case "ortho": {
                    let w = dist * Math.tan(radians(fovy) / 2) + 0.0001;
                    return ortho(-aspectRatio * w, +aspectRatio * w, -w, +w, near, far);
                }
            }
        }
    };

    // --- object literal to wrap the light parameters and methods
    const light = new function () {

        // light transform matrix        
        this.modelMatrix = function () {
            // get slider values
            let rotx = Number(document.getElementById("lightRotXSlider").value);
            let rotz = Number(document.getElementById("lightRotZSlider").value);
            let dist = Number(document.getElementById("lightDistSlider").value);
            return [rotateX(rotx), rotateZ(rotz), translate(0, dist, 0)].reduce(mult);
        }

        // light color function
        this.color = function () {
            // color intensity
            const ci = Number(document.getElementById("lightSlider").value);
            // color value: convert hex to rgb
            const cv = hexToRgb(document.getElementById("lightColor").value);
            // multiply by intensity
            return cv.map(x => ci * x);
        }
    };


    // ----------------------------------------------------------------------------
    // set states which are static in this program        
    // Sets the color we want to use as background. 
    gl.clearColor(0.9, 0.9, 0.9, 1.0);
    // Enable depth testing 
    gl.enable(gl.DEPTH_TEST);
    // Turn on culling. By default backfacing triangles will be culled.
    //gl.enable(gl.CULL_FACE);
    // Specifies whether or not front- and/or back-facing polygons can be culled.
    //gl.cullFace(gl.BACK);
    // Cull faces in order ccw
    //gl.frontFace(gl.CCW);
    // since we are using only one program for rendering of all objects, we set it here in the init            
    gl.useProgram(program);

    // ----------------------------------------------------------------------------
    // call render function by requesting a frame from the browser    
    window.requestAnimationFrame(render);


    // ----------------------------------------------------------------------------
    // Nested render loop function. It performs the actual drawing of the scene and needs
    // to be called each time anything has changes and needs to be updated. 
    function render(now) {

        // --- update animation-timings ----
        timings.update(now);

        // --- clear the frame buffer for a new frame (colorbuffer and z-buffer)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // --- map NDC to window coordinates (pixel coordinates)        
        gl.viewport(0, 0, canvas.width, canvas.height);

        // --- compute and set the view-matrix                
        let viewMatrix = camera.viewMatrix();
        gl.uniformMatrix4fv(u_viewMatLoc, false, flatten(viewMatrix));

        // --- compute and set the projection-matrix
        let projMatrix = camera.projMatrix();
        gl.uniformMatrix4fv(u_projMatLoc, false, flatten(projMatrix));

        // --- light setup ---
        // get light model-matrix in world-space
        let lightModelMatrix = light.modelMatrix();
        // compute light model-view matrix
        let lightModelViewMatrix = mult(viewMatrix, lightModelMatrix);
        // transform light to view-space and set the shader uniform
        let lightPosVS = mult(lightModelViewMatrix, [0, 0, 0, 1]).splice(0, 3);
        gl.uniform3fv(gl.getUniformLocation(program, "u_lightpos"), flatten(lightPosVS));
        // set the light color uniform
        gl.uniform3fv(gl.getUniformLocation(program, "u_lightcol"), light.color());

        // -- draw light dummy object ----------
        if (document.getElementById("drawBulb").checked) {
            gl.uniformMatrix4fv(u_modelViewMatLoc, false, flatten(lightModelViewMatrix));
            gl.uniform1i(gl.getUniformLocation(program, "u_shading"), -1);
            objectManager.getSphere().bind();
            objectManager.getSphere().render();
            gl.uniform1i(gl.getUniformLocation(program, "u_shading"), Number(document.getElementById("shadingSelect").value));
        }

        // --- compute animated model matrices for rotating objects
        let sunMatrix = [rotateY(timings.sunday), scalem(0.65, 0.65, 0.65)].reduce(mult);
        let earthMatrix = [rotateY(timings.year), translate(1.8, 0.0, 0.0), rotateY(-timings.year), rotateZ(-23.44), rotateY(timings.day)].reduce(mult);
        let moonMatrix = [rotateY(timings.year), translate(1.8, 0.0, 0.0), rotateZ(5.14), rotateY(timings.month), translate(0.6, 0, 0)].reduce(mult);

        // -- draw object 1 ---------------
        if (document.getElementById("drawObj1").checked) {

            // compute and set the model-view matrix
            let modelViewMatrix = [viewMatrix, sunMatrix].reduce(mult);
            gl.uniformMatrix4fv(u_modelViewMatLoc, false, flatten(modelViewMatrix));

            // compute and set the normal-matrix (transpose-inverse of model-view)
            let normalMat = transpose(inverse(modelViewMatrix));
            gl.uniformMatrix4fv(u_normalMatLoc, false, flatten(normalMat));

            // set the objects material using the method of the material object
            materialManager.renderMaterial(document.getElementById("obj1MatSelect").value);

            // draw the geometry standard geometry                                                       
            let mesh = objectManager.getObject(document.getElementById("obj1MeshSelect").value);
            mesh.bind();
            mesh.render();

            // draw normals and tangent frame if given
            if (document.getElementById("drawFrame").checked) {
                gl.uniform1i(gl.getUniformLocation(program, "u_shading"), -2);
                mesh.bind(RenderMode.Normals);
                mesh.render();
                gl.uniform1i(gl.getUniformLocation(program, "u_shading"), Number(document.getElementById("shadingSelect").value));
            }

            // draw edges (wireframe)
            if (document.getElementById("drawWire").checked) {
                gl.uniform1i(gl.getUniformLocation(program, "u_shading"), -2);
                mesh.bind(RenderMode.Wireframe);
                mesh.render();
                gl.uniform1i(gl.getUniformLocation(program, "u_shading"), Number(document.getElementById("shadingSelect").value));
            }
        }

        // -- draw object 2 ---------------        
        if (document.getElementById("drawObj2").checked) {
            // compute and set the model-view marix
            let modelViewMatrix = [viewMatrix, earthMatrix, scalem(0.25, 0.25, 0.25)].reduce(mult);
            gl.uniformMatrix4fv(u_modelViewMatLoc, false, flatten(modelViewMatrix));
            // compute and set the normal-matrix (transpose-inverse of model-view)
            let normalMat = transpose(inverse(modelViewMatrix));
            gl.uniformMatrix4fv(u_normalMatLoc, false, flatten(normalMat));
            // set the objects material using the materialManager            
            materialManager.renderMaterial(document.getElementById("obj2MatSelect").value);
            // draw the geometry
            let mesh = objectManager.getObject(document.getElementById("obj2MeshSelect").value);                                    
            mesh.bind();
            mesh.render();
        }

        // -- draw object 3 ---------------
        if (document.getElementById("drawObj3").checked) {
            let modelView = [viewMatrix, moonMatrix, scalem(0.1, 0.1, 0.1)].reduce(mult);
            gl.uniformMatrix4fv(u_modelViewMatLoc, false, flatten(modelView));
            // compute and set the normal-matrix (transpose-inverse of model-view)
            let normalMat = transpose(inverse(modelView));
            gl.uniformMatrix4fv(u_normalMatLoc, false, flatten(normalMat));
            // set the objects material using the materialManager
            materialManager.renderMaterial(document.getElementById("obj3MatSelect").value);
            // draw the geometry                                   
            let mesh = objectManager.getObject(document.getElementById("obj3MeshSelect").value);
            mesh.bind();
            mesh.render();
        }

        // request next frame from the browser and render (it is an infinite loop)
        window.requestAnimationFrame(render);
    }
}
