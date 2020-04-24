"use strict"
const TASKS = true;

// ----------------------------------------------------------------------------  
function studentdata() {

    //*** TODO_A3 : insert your data below ***
    const lastname = 'Santapaga';
    const firstname = 'Myles';
    const studentnum = '31458433';
    document.getElementById("author").innerText = ("Author: ").concat(lastname, ", ", firstname, ", ", studentnum);
    document.getElementById("title").innerText = ("A3: ").concat(lastname, ", ", firstname, ", ", studentnum);
}

function setVal(id) {
    console.log(val.toString());
    var x = document.getElementById(id);
    //x.value = val;
};

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
    console.log(gl.getParameter(gl.MAX_VERTEX_ATTRIBS));

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
    // Lookup shader attributes
    const positionAttribLocation = gl.getAttribLocation(program, "a_position");
    const colorAttribLocation = gl.getAttribLocation(program, "a_color");
    const normalAttribLocation = gl.getAttribLocation(program, "a_normal");
    const texcoordAttribLocation = gl.getAttribLocation(program, "a_tex");

    // ----------------------------------------------------------------------------  
    // Lookup shader uniforms 
    const u_timeLoc = gl.getUniformLocation(program, "u_time");
    const u_alphaLoc = gl.getUniformLocation(program, "u_alpha");
    const u_modelMatLoc = gl.getUniformLocation(program, "u_model");
    const u_viewMatLoc = gl.getUniformLocation(program, "u_view");
    const u_projMatLoc = gl.getUniformLocation(program, "u_proj");
    const u_modelViewMatLoc = gl.getUniformLocation(program, "u_modelview");
    const u_normalMatLoc = gl.getUniformLocation(program, "u_normalmat");
    const u_colorLoc = gl.getUniformLocation(program, "u_color");

    // ----------------------------------------------------------------------------
    // initialize scene objects   
    let geometryResolution = 1;
    let geometry = sphereGeometry(5 * geometryResolution, 10 * geometryResolution);
    let coordFrame = coordinateFrame();

    let vertexBuffer;
    let indexBuffer;
    setupBuffers(geometry);
    bindBuffers(geometry);

    // ----------------------------------------------------------------------------
    // Nested buffer setup function. It sets the position buffer active.     
    // If scene is static, it needs only to be called once. 
    // If the scene is dynamic, it need to be called in the render function. 
    function setupBuffers(geometry) {

        if (geometry.vertices != undefined) {
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

        if (geometry.indices != undefined) {
            // index buffer
            // Create an empty buffer object to store Index buffer
            indexBuffer = gl.createBuffer();
            // Bind appropriate array buffer to it
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            // Pass the vertex data to the buffer
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(geometry.indices), gl.STATIC_DRAW);
            // Unbind the buffer
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        }
    }

    // ----------------------------------------------------------------------------
    // Bind buffers. Since we are using the same geometry for drawing of all three spheres, 
    // we can setup them only once in the initialization part. 
    function bindBuffers(geometry) {
        // bind the vertex buffer
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
            gl.vertexAttribPointer(colorAttribLocation, 3, type, false, stride, offset);
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
        // bind the index buffer if given
        if (indexBuffer != undefined) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        }
    }


    // ----------------------------------------------------------------------------
    // Register the event for update of recursion depth with the UI slider. 
    document.getElementById("geometrySelect").onchange = function (event) {
        // choose geometry
        switch (document.getElementById("geometrySelect").value) {
            default:
            case "cube":
                geometry = cubeGeometry();
                break;
            case "sphere":
                geometry = sphereGeometry(5 * geometryResolution, 10 * geometryResolution);
                break;
            case "teapot":
                geometry = teapotGeometry();
                break;
            case "bunny":
                geometry = importObj(bunnyobj_pvn);
                break;
        }
        setupBuffers(geometry);
        bindBuffers(geometry);
    }
    // Register the event for update of resolution with the UI slider. 
    document.getElementById("resSlider").oninput = function (event) {
        // update sphere resolution
        geometryResolution = Number(document.getElementById("resSlider").value);
        if (document.getElementById("geometrySelect").value == "sphere") {
            geometry = sphereGeometry(5 * geometryResolution, 10 * geometryResolution);
            setupBuffers(geometry);
            bindBuffers(geometry);
        }
    }
    // Register the event for update of animation speed with the UI slider. 
    document.getElementById("speedSlider").oninput = function (event) {
        // speed
        timings.speed = Number(event.target.value);
    }

    // ----------------------------------------------------------------------------
    // Register event for shading selection 
    document.getElementById("shadingSelect").onchange = function (event) {
        // choose shading
        gl.uniform1i(gl.getUniformLocation(program, "u_shading"), Number(document.getElementById("shadingSelect").value));
    }

    // ----------------------------------------------------------------------------
    // Register the event for camera projection selection
    document.getElementById("projectionSelect").onchange = function (event) {
        // get the projection from GUI
        camera.projection = document.getElementById("projectionSelect").value;
    }
    // Register the eye X-rotate slider
    document.getElementById("rotXSlider").oninput = function (event) {
        camera.rotX = Number(event.target.value);
    }
    // Register the eye Y-rotate slider
    document.getElementById("rotYSlider").oninput = function (event) {
        camera.rotY = Number(event.target.value);
    }
    // Register the eye Z-rotate slider
    document.getElementById("rotZSlider").oninput = function (event) {
        camera.rotUp = Number(event.target.value);
    }
    // Register the eye distance slider
    document.getElementById("distSlider").oninput = function (event) {
        camera.dist = Number(event.target.value);
    }
    // Register the fovy slider
    document.getElementById("fovySlider").oninput = function (event) {
        camera.fovy = Number(event.target.value);
    }


    // ----------------------------------------------------------------------------
    // create and init objects used in the scene

    // --- wrap animation timing-variables to a object literal to clean up the render function
    let timings = {
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
            gl.uniform1f(u_timeLoc, 0.1 * this.speed * now);
        }
    };

    // --- camera object to wrap camera parameters and methods    
    let camera = {
        viewMatrix: function () {

            // get slider values
            let rotx = Number(document.getElementById("rotXSlider").value);
            let roty = Number(document.getElementById("rotYSlider").value);
            let rotup = Number(document.getElementById("rotZSlider").value);
            let dist = Number(document.getElementById("distSlider").value);

            // *** TODO_A3 *** Task 1a ***
            // Implement the view-transformation matrix of the camera. Given the values of
            // rotx, roty, rotup, dist, implement a simple control of the location of 
            // the camera by computing a transformation matrix for the eye location and 
            // the up vector.                     
            // To create this transformation, you would need to multiply a number of transforms, 
            // and subsequently use it for transform the eye and up. 

            // Hints: 
            //  - you can create rotation matrices using the helper-functions in 'math.js'.
            //  - you can multiply a 4x4 matrix with a 3d point/vector by extending the point/vector
            //    to a 4d point/vector using the vec4 structure. 
            //  - you can get a 3d point/vector from a 4d structure using the .splice(0,3) function, e.g., 
            //           
            //    let x = vec4();          // defines a 4d structure
            //    let y = x.splice(0,3);   // returns first 3 components of x and provides a 3d structure

            // *** begin code, replace the code below
            

            let M = mat4();
            M = mult(M, rotateX(rotx));
            M = mult(M, rotateY(roty));
            M = mult(M, rotateZ(rotup));
            M = mult(M, translate(dist, 0, 0));

            let eye = mult(M, [0,0,0,1]).splice(0,3);
            let up = mult(M, [0,1,0,0]).splice(0,3);
            let at = vec3(0,0,0);

            // let M = mult( mult(mult(rotateY(roty), rotateX(rotx)), translate(0, dist, 0, 1)), );

            return lookAt(eye, at, up);

            
            // *** end code

        },

        projMatrix: function () {

            let fovy = Number(document.getElementById("fovySlider").value);
            let near = Number(document.getElementById("nearSlider").value);
            let far = Number(document.getElementById("farSlider").value);
            let dist = Number(document.getElementById("distSlider").value);
            let d = Math.sin(radians(fovy));

            switch (document.getElementById("projectionSelect").value) {
                case "persp":

                    // *** TODO_A3 *** Task 1b ***
                    // Using the values above, implement the perspective projection matrix
                    // and replace the standard projection matrix below. 

                    
                    // M = mult(M, rotateX(rotx));
                    // M = mult(M, rotateY(roty));
                    // M = mult(M, rotateZ(rotup));
                    // M = mult(M, translate(dist, 0, 0));
        
                    // let eye = mult(M, [0,0,0,1]).splice(0,3);
                    // let up = mult(M, [0,1,0,0]).splice(0,3);
                    // let at = vec3(0,0,0);
        

                    return perspective(fovy, 1, near, far);

                case "ortho":

                    // *** TODO_A3 *** Task 1c ***
                    // Using the values above, implement the orthographic projection matrix
                    // and replace the standard projection matrix below. 
                    // Derive the values for left, right, top, bottom from dist and fovy. 
                    // Why can't you use the near-value from above? Replace near with appropriate value.  
                    
                    let aspectRatio = 1;
                    //added .0001 to avoid it reaching 0 because it broke it
                    let top = .0001 + (dist *  Math.tan(radians(fovy/2)));
                    let bottom = -top;
                    let right = top * aspectRatio;
                    let left = -right; 
                    return ortho(left, right, bottom, top, near, far);

                    // return mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1);
            }
        }
    };

    // --- object literal to wrap the light parameters and methods
    let light = {
        // light transform matrix        
        modelMatrix: function () {
            // get slider values
            let rotx = Number(document.getElementById("lightRotXSlider").value);
            let rotz = Number(document.getElementById("lightRotZSlider").value);
            let dist = Number(document.getElementById("lightDistSlider").value);
            return mult(mult(rotateX(rotx), rotateZ(rotz)), translate(0, dist, 0, 1));
        },

        // light color function
        color: function () {
            // color intensity
            const ci = Number(document.getElementById("lightSlider").value);
            // color value: convert hex to rgb
            const cv = hexToRgb(document.getElementById("lightColor").value);
            // multiply by intensity
            return cv.map(x => ci * x);
        }
    };


    // --- register materials gui-elements
    document.getElementById("materialSelect").onchange = function (event) {
        materialManager.setActiveMaterial(event.target.value);
    }
    document.getElementById("qsSlider").oninput = function (event) {
        materialManager.activeMaterial.qs = event.target.value;
        document.getElementById("qsValue").innerHTML = Number(event.target.value).toPrecision(4);
    }
    document.getElementById("kaColor").oninput = function (event) {
        materialManager.setColor("ka", event.target.value);
        const c = hexToRgb(event.target.value);
        document.getElementById("kaR").innerHTML = c[0].toFixed(2);
        document.getElementById("kaG").innerHTML = c[1].toFixed(2);
        document.getElementById("kaB").innerHTML = c[2].toFixed(2);
    }
    document.getElementById("kdColor").oninput = function (event) {
        materialManager.setColor("kd", event.target.value);
        const c = hexToRgb(event.target.value);
        document.getElementById("kdR").innerHTML = c[0].toFixed(2);
        document.getElementById("kdG").innerHTML = c[1].toFixed(2);
        document.getElementById("kdB").innerHTML = c[2].toFixed(2);
    }
    document.getElementById("ksColor").oninput = function (event) {
        materialManager.setColor("ks", event.target.value);
        const c = hexToRgb(event.target.value);
        document.getElementById("ksR").innerHTML = c[0].toFixed(2);
        document.getElementById("ksG").innerHTML = c[1].toFixed(2);
        document.getElementById("ksB").innerHTML = c[2].toFixed(2);
    }

    // --- object literal to wrap and manage materials
    let materialManager = {
        // looks up the locations in the shader progam and caches them
        u_kaLoc: gl.getUniformLocation(program, "u_ka"),
        u_kdLoc: gl.getUniformLocation(program, "u_kd"),
        u_ksLoc: gl.getUniformLocation(program, "u_ks"),
        u_qsLoc: gl.getUniformLocation(program, "u_qs"),

        // material currently active in the gui
        activeMaterial: undefined,

        // create an object as a material collection 
        materials: {
            "Reddish": {
                colors: { "ka": [0.1, 0.1, 0.1], "kd": [0.8, 0.1, 0.1], "ks": [0.2, 0.2, 0.2] },
                qs: 12,
            },
            "Greenish": {
                colors: { "ka": [0.1, 0.1, 0.1], "kd": [0.1, 0.8, 0.1], "ks": [0.2, 0.2, 0.2] },
                qs: 12,
            },
            "Bluish": {
                colors: { "ka": [0.1, 0.1, 0.1], "kd": [0.1, 0.1, 0.8], "ks": [0.2, 0.2, 0.2] },
                qs: 12,
            },

            // *** TODO_A3 : Task 3
            // Create three new materials and add them to this list using the 'Template Material'. 
            // Experiment with the sliders/colors in the GUI and be creative!
            // There is no right or wrong material setting for Phong Model, just try to make it look as good as possible.             
            //  - Create a metal-like material, for instance "Polished Copper".
            //  - Create a glossy material, e.g., "Pearl".
            //  - Create a matte material, for instance "Pewter".

            "Polished Copper": {
                colors: { "ka": [0.1, 0.08, 0.08], "kd": [0.72, 0.45, 0.2], "ks": [0.2, 0.2, 0.2] },
                qs: 12,
            },
            "Pearl": {
                colors: { "ka": [0.08, 0.1, 0.1], "kd": [0.9, 0.7, 0.7], "ks": [0.7, 0.7, 0.7] },
                qs: 12,
            },
            "Pewter": {
                colors: { "ka": [0.1, 0.1, 0.1], "kd": [0.4, 0.4, 0.4], "ks": [0.2, 0.2, 0.2] },
                qs: 12,
            },
        },

        // set the material with name as active in the gui
        setActiveMaterial: function (name) {
            // active material
            let mat = this.materials[name];
            this.activeMaterial = mat;
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
        },

        // set a color of the chosen component to the active material
        setColor: function (component, hexvalue) {
            // active material
            let mat = this.activeMaterial;
            // update gui color pickers
            mat.colors[component] = hexToRgb(hexvalue);
        },

        // setter function for all material uniforms for the chosen material name
        renderMaterial: function (name) {
            let mat = this.materials[name];
            gl.uniform3fv(this.u_kaLoc, mat.colors["ka"]);
            gl.uniform3fv(this.u_kdLoc, mat.colors["kd"]);
            gl.uniform3fv(this.u_ksLoc, mat.colors["ks"]);
            gl.uniform1f(this.u_qsLoc, mat.qs);
        }
    };
    // set initial active material    
    materialManager.setActiveMaterial("Reddish");

    // add materials to the gui select
    Object.keys(materialManager.materials).forEach(element => {
        let opt = document.createElement("option");
        opt.value = element;
        opt.text = element;
        opt.className = "uibox";
        document.getElementById("materialSelect").add(opt);
        document.getElementById("obj1MatSelect").add(opt.cloneNode(true));
        document.getElementById("obj2MatSelect").add(opt.cloneNode(true));
        document.getElementById("obj3MatSelect").add(opt.cloneNode(true));
    });


    // ----------------------------------------------------------------------------
    // set states which are static in this program        
    // Sets the color we want to use as background. 
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // Enable depth testing 
    gl.enable(gl.DEPTH_TEST);
    // Turn on culling. By default backfacing triangles will be culled.
    //gl.enable(gl.CULL_FACE);
    // Specifies whether or not front- and/or back-facing polygons can be culled.
    //gl.cullFace(gl.BACK);
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
            gl.drawElements(gl.TRIANGLES, geometry.indices.length, gl.UNSIGNED_SHORT, 0);
            gl.uniform1i(gl.getUniformLocation(program, "u_shading"), Number(document.getElementById("shadingSelect").value));
        }

        // -- draw object 1 ---------------
        if (document.getElementById("drawObj1").checked) {

            // 1. local variable for the model matrix
            let objMatrix = mat4();
            // 2. objects rotation around its y-axis wrt itself
            objMatrix = mult(objMatrix, rotateY(timings.sunday));
            // 3. objects size by scaling
            objMatrix = mult(objMatrix, scalem(0.5, 0.5, 0.5));
            // 4. compute and set the model-view matrix
            let modelView = mult(viewMatrix, objMatrix);
            gl.uniformMatrix4fv(u_modelViewMatLoc, false, flatten(modelView));
            // 5. compute and set the normal-matrix (transpose-inverse of model-view)
            let normalMat = transpose(inverse(modelView));
            gl.uniformMatrix4fv(u_normalMatLoc, false, flatten(normalMat));
            // 6. set the objects material using the method of the material object
            materialManager.renderMaterial(document.getElementById("obj1MatSelect").value);
            // 7. draw the geometry                                             
            gl.drawElements(gl.TRIANGLES, geometry.indices.length, gl.UNSIGNED_SHORT, 0);
        }

        // -- draw object 2 ---------------        
        if (document.getElementById("drawObj2").checked) {

            // local variable for the model matrix
            let objMatrix = mat4();
            // 1. earth rotation around the sun
            objMatrix = mult(objMatrix, rotateY(timings.year));
            // 2. earth orbit radius            
            objMatrix = mult(objMatrix, translate(1.8, 0.0, 0.0));
            // 3. compensate for tilt in the year
            objMatrix = mult(objMatrix, rotateY(-timings.year));
            // 4. earth tilt
            objMatrix = mult(objMatrix, rotateZ(-23.44));
            // 5. earth rotation wrt itself     
            objMatrix = mult(objMatrix, rotateY(timings.day));
            // 6. earth size by scaling            
            objMatrix = mult(objMatrix, scalem(0.4, 0.4, 0.4));
            // 7. compute and set the model-view marix
            let modelView = mult(viewMatrix, objMatrix);
            gl.uniformMatrix4fv(u_modelViewMatLoc, false, flatten(modelView));
            // 8. compute and set the normal-matrix (transpose-inverse of model-view)
            let normalMat = transpose(inverse(modelView));
            gl.uniformMatrix4fv(u_normalMatLoc, false, flatten(normalMat));
            // 9. set the objects material using the materialManager            
            materialManager.renderMaterial(document.getElementById("obj2MatSelect").value);
            // 10. draw the geometry                        
            gl.drawElements(gl.TRIANGLES, geometry.indices.length, gl.UNSIGNED_SHORT, 0);
        }

        // -- draw object 3 ---------------
        if (document.getElementById("drawObj3").checked) {

            // local variable for the model matrix
            let objMatrix = mat4();
            // 1. earth rotation around the sun
            objMatrix = mult(objMatrix, rotateY(timings.year));
            // 2. earth orbit radius
            objMatrix = mult(objMatrix, translate(1.8, 0.0, 0.0));
            // 3. moon tilt wrt earth orbit plane            
            objMatrix = mult(objMatrix, rotateZ(5.14));
            // 4. moon rotation around the earth
            objMatrix = mult(objMatrix, rotateY(timings.month));
            // 5. moon orbit radius wrt earth            
            objMatrix = mult(objMatrix, translate(0.9, 0, 0));
            // 6. moon size by scaling
            objMatrix = mult(objMatrix, scalem(0.4, 0.4, 0.4));
            // 7. compute and set the model-view marix
            let modelView = mult(viewMatrix, objMatrix);
            gl.uniformMatrix4fv(u_modelViewMatLoc, false, flatten(modelView));
            // 8. compute and set the normal-matrix (transpose-inverse of model-view)
            let normalMat = transpose(inverse(modelView));
            gl.uniformMatrix4fv(u_normalMatLoc, false, flatten(normalMat));
            // 9. set the objects material using the materialManager
            materialManager.renderMaterial(document.getElementById("obj3MatSelect").value);
            // 10. draw the geometry                                   
            gl.drawElements(gl.TRIANGLES, geometry.indices.length, gl.UNSIGNED_SHORT, 0);
        }

        // -- draw coordiante cross as orientation help
        if (document.getElementById("drawFrame").checked) {

            // This block draws the coordinate frame. 
            // It is implemented in an inefficent way since it copies the vertex data to GPU memory, renders,  
            // and copies the scene geometry back each frame. 
            // Use for debug purpose only. 

            setupBuffers(coordFrame);
            bindBuffers(coordFrame);
            gl.uniformMatrix4fv(u_modelViewMatLoc, false, flatten(viewMatrix));
            gl.uniform1i(gl.getUniformLocation(program, "u_shading"), -2);
            gl.drawArrays(gl.LINES, 0, coordFrame.vertices.length);
            gl.uniform1i(gl.getUniformLocation(program, "u_shading"), Number(document.getElementById("shadingSelect").value));
            setupBuffers(geometry);
            bindBuffers(geometry);
        }

        // request next frame from the browser and render (it is an infinite loop)
        window.requestAnimationFrame(render);
    }
}
