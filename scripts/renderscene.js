var view;
var ctx;
var scene;
var start_time;
var camera_velocity;
var keys_pressed;
var prev_time;

var delta_u = 0.0005;
var max_u = delta_u*100;
var delta_n = 0.0005;
var max_n = delta_n*100;
var delta_rot = 0.000025;
var max_rot = delta_rot*100;

// Initialization function - called when web page loads
function Init() {
    var w = 800;
    var h = 600;
    camera_velocity = {u:0, n:0, rot:0};
    view = document.getElementById('view');
    view.width = w;
    view.height = h;
    keys_pressed = Array(100).fill(false);

    ctx = view.getContext('2d');

    // initial scene... feel free to change this
    scene = {
        view: {
            type: 'perspective',
            prp: Vector3(10, 15, 0),
            srp: Vector3(10, 9, -30),
            vup: Vector3(0, 1, 0),
            clip: [-11, 11, -11, 11, 30, 100]
        },
        models: [
            {
                type: 'generic',
                animation: {
                    axis: 'y',
                    rps: 0
                },
                vertices: [
                    Vector4( 0,  0, -30, 1),
                    Vector4(20,  0, -30, 1),
                    Vector4(20, 12, -30, 1),
                    Vector4(10, 20, -30, 1),
                    Vector4( 0, 12, -30, 1),
                    Vector4( 0,  0, -60, 1),
                    Vector4(20,  0, -60, 1),
                    Vector4(20, 12, -60, 1),
                    Vector4(10, 20, -60, 1),
                    Vector4( 0, 12, -60, 1)
                ],
                edges: [
                    [0, 1, 2, 3, 4, 0],
                    [5, 6, 7, 8, 9, 5],
                    [0, 5],
                    [1, 6],
                    [2, 7],
                    [3, 8],
                    [4, 9]
                ]
            }
        ]
    };

    // event handler for pressing arrow keys
    document.addEventListener('keydown', (event) => {
        keys_pressed[event.keyCode] = true;
    }, false);
    document.addEventListener('keyup', (event) => {
        keys_pressed[event.keyCode] = false;
    }, false);
    
    // start animation loop
    start_time = performance.now(); // current timestamp in milliseconds
    prev_time = start_time;
    window.requestAnimationFrame(Animate);
}

// Animation loop - repeatedly calls rendering code
function Animate(timestamp) {
    var time = timestamp - start_time;
    var delta_time = time - prev_time;
    prev_time = time;

    // Left arrow
    if(keys_pressed[37]) {
        camera_velocity.u = Math.max(camera_velocity.u - delta_u*delta_time, -max_u);
    }

    // Up arrow
    if(keys_pressed[38]) {
        camera_velocity.n = Math.max(camera_velocity.n - delta_n*delta_time, -max_n);
    }

    // Right arrow
    if(keys_pressed[39]) {
        camera_velocity.u = Math.min(camera_velocity.u + delta_u*delta_time, max_u);
    }

    // Down arrow
    if(keys_pressed[40]) {
        camera_velocity.n = Math.min(camera_velocity.n + delta_n*delta_time, max_n);
    }
    
    // Period
    if(keys_pressed[190]) {
        camera_velocity.rot = Math.max(camera_velocity.rot - delta_rot*delta_time, -max_rot);
    }

    // Comma
    if(keys_pressed[188]) {
        camera_velocity.rot = Math.min(camera_velocity.rot + delta_rot*delta_time, max_rot);
    }

    // Reduce velocity - U
    if(!(keys_pressed[37] || keys_pressed[39])) {
        if(camera_velocity.u < 0) {
            camera_velocity.u = Math.min(camera_velocity.u + delta_u*delta_time,0)
        }
        if(camera_velocity.u > 0) {
            camera_velocity.u = Math.max(camera_velocity.u - delta_u*delta_time,0)
        }
    }

    // Reduce velocity - N
    if(!(keys_pressed[38] || keys_pressed[40])) {
        if(camera_velocity.n < 0) {
            camera_velocity.n = Math.min(camera_velocity.n + delta_n*delta_time,0)
        }
        if(camera_velocity.n > 0) {
            camera_velocity.n = Math.max(camera_velocity.n - delta_n*delta_time,0)
        }
    }

    // Reduce velocity - Rot
    if(!(keys_pressed[188] || keys_pressed[190])) {
        if(camera_velocity.rot < 0) {
            camera_velocity.rot = Math.min(camera_velocity.rot + delta_rot*delta_time,0)
        }
        if(camera_velocity.rot > 0) {
            camera_velocity.rot = Math.max(camera_velocity.rot - delta_rot*delta_time,0)
        }
    }

    var n_axis = scene.view.prp.subtract(scene.view.srp);
    n_axis.normalize();
    var u_axis = scene.view.vup.cross(n_axis);
    u_axis.normalize();

    n_axis.scale(delta_time*camera_velocity.n);
    scene.view.prp = scene.view.prp.add(n_axis);
    scene.view.srp = scene.view.srp.add(n_axis);

    u_axis.scale(delta_time*camera_velocity.u);
    scene.view.prp = scene.view.prp.add(u_axis);
    scene.view.srp = scene.view.srp.add(u_axis);

    // Rotate the camera
    n_axis = scene.view.prp.subtract(scene.view.srp);
    n_axis.normalize();
    u_axis = scene.view.vup.cross(n_axis);
    u_axis.normalize();
    let v_axis = n_axis.cross(u_axis);

    let cam_translate = new Matrix(4,4);
    let cam_rotate_forward = new Matrix(4,4);
    let cam_rotate = new Matrix(4,4);
    let cam_rotate_back = new Matrix(4,4);
    let cam_translate_back = new Matrix(4,4);
    Mat4x4Translate(cam_translate, -scene.view.prp.x, -scene.view.prp.y, -scene.view.prp.z);
    cam_rotate_forward.values = [
        [u_axis.x, u_axis.y, u_axis.z, 0],
        [v_axis.x, v_axis.y, v_axis.z, 0],
        [n_axis.x, n_axis.y, n_axis.z, 0],
        [0,0,0,1]
    ];
    Mat4x4RotateY(cam_rotate, camera_velocity.rot * delta_time);
    cam_rotate_back.values = [
        [u_axis.x, u_axis.y, -u_axis.z, 0],
        [v_axis.x, v_axis.y, v_axis.z, 0],
        [-n_axis.x, n_axis.y, n_axis.z, 0],
        [0,0,0,1]
    ];
    Mat4x4Translate(cam_translate_back, scene.view.prp.x, scene.view.prp.y, scene.view.prp.z);
    let old_val = scene.view.srp;
    let new_val = Matrix.multiply([cam_translate_back, cam_rotate_back, cam_rotate, cam_rotate_forward, cam_translate, new Vector4(old_val.x,old_val.y,old_val.z,1)]);
    //scene.view.srp = new Vector3(new_val.x, new_val.y, new_val.z);

    for(let model of scene.models) {

        if(model.animation != undefined) {
            model.animation.matrix = new Matrix(4,4);
            Mat4x4Identity(model.animation.matrix);

            // Defines the centerpoint, if it is not defined
            if(model.center == undefined) {
                let min_x = model.vertices[0].x;
                let max_x = model.vertices[0].x;
                let min_y = model.vertices[0].y;
                let max_y = model.vertices[0].y;
                let min_z = model.vertices[0].z;
                let max_z = model.vertices[0].z;
    
                for(let vertex of model.vertices) {
                    min_x = Math.min(min_x, vertex.x*vertex.w);
                    max_x = Math.max(max_x, vertex.x*vertex.w);
                    min_y = Math.min(min_y, vertex.y*vertex.w);
                    max_y = Math.max(max_y, vertex.y*vertex.w);
                    min_z = Math.min(min_z, vertex.z*vertex.w);
                    max_z = Math.max(max_z, vertex.z*vertex.w);
                }

                model.center = Vector4((min_x+max_x)/2, (min_y+max_y)/2, (min_z+max_z)/2, 1);
            }

            // Translate centerpoint to origin
            let translate_to_origin = new Matrix(4,4);
            Mat4x4Translate(translate_to_origin, -model.center.x, -model.center.y, -model.center.z); 

            // Rotate about the desired axis
            let rotate = new Matrix(4,4);
            let theta = (time/1000)*2*Math.PI*model.animation.rps;
            switch(model.animation.axis) {
                case 'x':
                    Mat4x4RotateX(rotate, theta);
                    break;

                case 'y':
                    Mat4x4RotateY(rotate, theta);
                    break;

                case 'z':
                    Mat4x4RotateZ(rotate, theta);
                    break;
            }

            // Translate back to original position
            let translate_back = new Matrix(4,4);
            Mat4x4Translate(translate_back, model.center.x, model.center.y, model.center.z);

            // Apply to the animation matrix
            model.animation.matrix = Matrix.multiply([translate_back, rotate, translate_to_origin, model.animation.matrix]);
        }
    }

    DrawScene();

    window.requestAnimationFrame(Animate);
}

// Main drawing code - use information contained in variable `scene`
function DrawScene() {
    ctx.clearRect(0,0,view.width,view.height);

    // Copy models & apply animation matrix
    let models = [];
    for(let model of scene.models) {
        my_model = {
            vertices: [],
            edges:[]
        }

        switch(model.type) {
            case 'generic': // Copy a generic model
                for (let vertex of model.vertices) {
                    my_model.vertices.push(vertex);
                }
                for(let edge of model.edges) {
                    let my_edge = [];
                    for(let point of edge) {
                        my_edge.push(point);
                    }
                    my_model.edges.push(my_edge);
                }
                break;

            case 'cube': // Create a cube
                break;

            case 'cylinder': // Create a cylinder
                break;

            case 'cone': // Create a cone
                break;

            case 'sphere': // Create a sphere
                break;
        }

        // Applies the animation matrix
        if(model.animation != undefined) {
            for (let i=0; i<my_model.vertices.length; i++) {
                my_model.vertices[i] = Matrix.multiply([model.animation.matrix, my_model.vertices[i]]);
            }
        }
        models.push(my_model);
    }

    // Project
    let projection = new Matrix(4,4);
    if(scene.view.type === 'perspective') {
        Mat4x4Projection(projection, scene.view.prp, scene.view.srp, scene.view.vup, scene.view.clip);
    }
    else if(scene.view.type === 'parallel') {

    }

    for(let i=0; i< models.length; i++) {
        for (let j=0; j<models[i].vertices.length; j++) {
            models[i].vertices[j] = projection.mult(models[i].vertices[j]);
            
        }
        
    }

    //Clip


    //Transform
    let project_back = new Matrix(4,4);
    if(scene.view.type === 'perspective') {
        Mat4x4MPer(project_back);
    }
    else if(scene.view.type === 'parallel') {

    }

    let scale = new Matrix(4,4);
    scale.values = [
        [view.width/2,0,0,view.width/2],
        [0,view.height/2,0,view.height/2],
        [0,0,1,0],
        [0,0,0,1]
    ];

    for(let i=0; i<models.length; i++) {
        for (let j=0; j<models[i].vertices.length; j++) {
            models[i].vertices[j] = new Vector(Matrix.multiply([scale, project_back, models[i].vertices[j]]));
        }
    }

    //Draw
    for (let model of models) {
        for (let edge of model.edges) {
            for(let i=1; i<edge.length; i++) {
                let point_1 = new Vector(model.vertices[edge[i-1]]);
                let point_2 = new Vector(model.vertices[edge[i]]);
                DrawLine(point_1.x/point_1.w, point_1.y/point_1.w, point_2.x/point_2.w, point_2.y/point_2.w);
            }
        }
    }
}

// Called when user selects a new scene JSON file
function LoadNewScene() {
    var scene_file = document.getElementById('scene_file');

    console.log(scene_file.files[0]);

    var reader = new FileReader();
    reader.onload = (event) => {
        scene = JSON.parse(event.target.result);
        scene.view.prp = Vector3(scene.view.prp[0], scene.view.prp[1], scene.view.prp[2]);
        scene.view.srp = Vector3(scene.view.srp[0], scene.view.srp[1], scene.view.srp[2]);
        scene.view.vup = Vector3(scene.view.vup[0], scene.view.vup[1], scene.view.vup[2]);

        for (let i = 0; i < scene.models.length; i++) {
            if (scene.models[i].type === 'generic') {
                for (let j = 0; j < scene.models[i].vertices.length; j++) {
                    scene.models[i].vertices[j] = Vector4(scene.models[i].vertices[j][0],
                                                          scene.models[i].vertices[j][1],
                                                          scene.models[i].vertices[j][2],
                                                          1);
                }
            }
            else {
                scene.models[i].center = Vector4(scene.models[i].center[0],
                                                 scene.models[i].center[1],
                                                 scene.models[i].center[2],
                                                 1);
            }
            scene.models[i].matrix = new Matrix(4, 4);
        }
    };
    reader.readAsText(scene_file.files[0], "UTF-8");
}

// Draw black 2D line with red endpoints 
function DrawLine(x1, y1, x2, y2) {
    ctx.strokeStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.fillStyle = '#FF0000';
    ctx.fillRect(x1 - 2, y1 - 2, 4, 4);
    ctx.fillRect(x2 - 2, y2 - 2, 4, 4);
}
