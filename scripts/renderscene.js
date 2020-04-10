var view;
var ctx;
var scene;
var start_time;
var camera_velocity;
var keys_pressed;
var prev_time;

var delta_mov = 0.0005;
var max_mov = delta_mov*100;

var delta_rot = 0.000015;
var max_rot = delta_rot*100;

var NEAR =   1;  //000001
var FAR =  2;  //000010
var TOP =    4;  //000100
var BOTTOM = 8;  //001000
var RIGHT =  16; //010000
var LEFT =   32; //100000

// Initialization function - called when web page loads
function Init() {
    var w = 800;
    var h = 600;
    camera_velocity = {u:0, n:0, rot_y:0, rot_x:0};
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
            clip: [-15, 15, -11, 11, 30, 100]
        },
        models: [
            {
                type: 'cube',
                center: Vector4(20,0,-30,1),
                height: 20,
                width: 20,
                depth: 20
            },
            {
                type: 'cone',
                center: Vector4(10,0,-40,1),
                height: 5,
                radius: 4,
                sides: 3
            },
            {
                type: 'cylinder',
                center: Vector4(15,0,-40,1),
                height: 5,
                radius: 4,
                sides: 14
            },
            {
                type: 'sphere',
                center: Vector4(40,0,-30,1),
                radius: 10,
                stacks: 14,
                slices: 14,
                animation: {
                    axis: 'y',
                    rps: 0.1
                },
            },
            {
                type: 'generic',
                animation: {
                    axis: 'y',
                    rps: 2
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

    move_camera(delta_time);

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
            case 'generic': { // Copy a generic model
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
            }

            case 'cube': { // Create a cube
                for(let x = 0; x<2; x++) {
                    let x_val = model.center.x - model.width/2 + model.width*x;
                    for(let y = 0; y<2; y++) {
                        let y_val = model.center.y - model.height/2 + model.height*y;
                        for(let z = 0; z<2; z++) {
                            let z_val = model.center.z - model.depth/2 + model.depth*z;
                            my_model.vertices.push(new Vector4(x_val,y_val,z_val,1));
                        }
                    }
                }
                my_model.edges = [[0,1,3,2,0],[4,5,7,6,4],[0,4],[1,5],[3,7],[2,6]];
                break;
            }

            case 'cylinder': { // Create a cylinder
                let bottom_edge = [];
                let top_edge = [];
                for(let i=0; i<model.sides; i++) {
                    let theta = Math.PI*2/model.sides*i;
                    my_model.vertices.push(new Vector4(
                        model.center.x + model.radius*Math.cos(theta),
                        model.center.y-model.height/2,
                        model.center.z + model.radius*Math.sin(theta),
                        1
                    ));
                    my_model.vertices.push(new Vector4(
                        model.center.x + model.radius*Math.cos(theta),
                        model.center.y+model.height/2,
                        model.center.z + model.radius*Math.sin(theta),
                        1
                    ));
                    my_model.edges.push([2*i, 2*i+1]);
                    bottom_edge.push(2*i);
                    top_edge.push((2*i)+1);
                }
                bottom_edge.push(0);
                top_edge.push(1);
                my_model.edges.push(bottom_edge);
                my_model.edges.push(top_edge);
                break;
            }

            case 'cone': { // Create a cone
                my_model.vertices.push(new Vector4(model.center.x, model.center.y+model.height, model.center.z, 1));
                let bottom_edge = [];
                for(let i=0; i<model.sides; i++) {
                    let theta = Math.PI*2/model.sides*i;
                    my_model.vertices.push(new Vector4(
                        model.center.x + model.radius*Math.cos(theta),
                        model.center.y,
                        model.center.z + model.radius*Math.sin(theta),
                        1
                    ));
                    my_model.edges.push([0,i+1]);
                    bottom_edge.push(i+1);
                }
                bottom_edge.push(1);
                my_model.edges.push(bottom_edge);
                break;
            }

            case 'sphere': { // Create a sphere
                for(let i=1; i<model.stacks; i++) {
                    let layer = [];
                    let theta_i = Math.PI/model.stacks*i;
                    let y = model.center.y+ model.radius*Math.cos(theta_i);
                    let radius_layer = Math.sin(theta_i)*model.radius;
                    for(let j=0; j<model.slices; j++) {
                        let theta_j = Math.PI*2/model.slices*j;
                        my_model.vertices.push(new Vector4(
                            model.center.x + radius_layer*Math.cos(theta_j),
                            y,
                            model.center.z + radius_layer*Math.sin(theta_j),
                            1
                        ));
                        layer.push((i-1)*model.slices+j);
                    }
                    layer.push((i-1)*model.slices);
                    my_model.edges.push(layer);
                }

                my_model.vertices.push(new Vector4(model.center.x, model.center.y+model.radius, model.center.z, 1));
                let top_v=my_model.vertices.length;
                my_model.vertices.push(new Vector4(model.center.x, model.center.y-model.radius, model.center.z, 1));

                for(let i=0; i<model.slices; i++) {
                    let slice = [];
                    slice.push(top_v-1);
                    for(let j=0; j<model.stacks-1; j++) {
                        slice.push(j*model.stacks+i);
                    }
                    slice.push(top_v);
                    my_model.edges.push(slice);
                }
                break;
            }
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
        Mat4x4Parallel(projection, scene.view.prp, scene.view.srp, scene.view.vup, scene.view.clip);
    }

    for(let i=0; i< models.length; i++) {
        for (let j=0; j<models[i].vertices.length; j++) {
            models[i].vertices[j] = projection.mult(models[i].vertices[j]);
        }
    }

    //Clip
    for(let model of models) {
        clip_model(model);
    }

    //Transform
    let project_back = new Matrix(4,4);
    if(scene.view.type === 'perspective') {
        Mat4x4MPer(project_back);
    }
    else if(scene.view.type === 'parallel') {
        Mat4x4MPar(project_back);
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

function update_velocity(delta_time) {
    // Left arrow
    if(keys_pressed[37]) {
        camera_velocity.u = Math.max(camera_velocity.u - delta_mov*delta_time, -max_mov);
    }

    // Up arrow
    if(keys_pressed[38]) {
        camera_velocity.n = Math.max(camera_velocity.n - delta_mov*delta_time, -max_mov);
    }

    // Right arrow
    if(keys_pressed[39]) {
        camera_velocity.u = Math.min(camera_velocity.u + delta_mov*delta_time, max_mov);
    }

    // Down arrow
    if(keys_pressed[40]) {
        camera_velocity.n = Math.min(camera_velocity.n + delta_mov*delta_time, max_mov);
    }
    
    // A
    if(keys_pressed[68]) {
        camera_velocity.rot_y = Math.max(camera_velocity.rot_y - delta_rot*delta_time, -max_rot);
    }

    // D
    if(keys_pressed[65]) {
        camera_velocity.rot_y = Math.min(camera_velocity.rot_y + delta_rot*delta_time, max_rot);
    }

    // W
    if(keys_pressed[83]) {
        camera_velocity.rot_x = Math.max(camera_velocity.rot_x - delta_rot*delta_time, -max_rot);
    }

    // S
    if(keys_pressed[87]) {
        camera_velocity.rot_x = Math.min(camera_velocity.rot_x + delta_rot*delta_time, max_rot);
    }

    // Reduce velocity - U
    if(!(keys_pressed[37] || keys_pressed[39])) {
        if(camera_velocity.u < 0) {
            camera_velocity.u = Math.min(camera_velocity.u + delta_mov*delta_time,0)
        }
        if(camera_velocity.u > 0) {
            camera_velocity.u = Math.max(camera_velocity.u - delta_mov*delta_time,0)
        }
    }

    // Reduce velocity - N
    if(!(keys_pressed[38] || keys_pressed[40])) {
        if(camera_velocity.n < 0) {
            camera_velocity.n = Math.min(camera_velocity.n + delta_mov*delta_time,0)
        }
        if(camera_velocity.n > 0) {
            camera_velocity.n = Math.max(camera_velocity.n - delta_mov*delta_time,0)
        }
    }

    // Reduce velocity - Rot_y
    if(!(keys_pressed[65] || keys_pressed[68])) {
        if(camera_velocity.rot_y < 0) {
            camera_velocity.rot_y = Math.min(camera_velocity.rot_y + delta_rot*delta_time,0)
        }
        if(camera_velocity.rot_y > 0) {
            camera_velocity.rot_y = Math.max(camera_velocity.rot_y - delta_rot*delta_time,0)
        }
    }

    // Reduce velocity - Rot_x
    if(!(keys_pressed[87] || keys_pressed[83])) {
        if(camera_velocity.rot_x < 0) {
            camera_velocity.rot_x = Math.min(camera_velocity.rot_x + delta_rot*delta_time,0)
        }
        if(camera_velocity.rot_x > 0) {
            camera_velocity.rot_x = Math.max(camera_velocity.rot_x - delta_rot*delta_time,0)
        }
    }
}

function move_camera(delta_time) {
    update_velocity(delta_time);

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

    let n_axis_1 = scene.view.prp.subtract(scene.view.srp);
    n_axis_1.normalize();
    let u_axis_1 = scene.view.vup.cross(n_axis_1);
    u_axis_1.normalize();
    let v_axis_1 = n_axis_1.cross(u_axis_1);

    let cam_translate = new Matrix(4,4);
    let cam_rotate_forward = new Matrix(4,4);
    let cam_rotate_y = new Matrix(4,4);
    let cam_rotate_x = new Matrix(4,4);
    let cam_rotate_back = new Matrix(4,4);
    let cam_translate_back = new Matrix(4,4);


    Mat4x4Translate(cam_translate, -scene.view.prp.x, -scene.view.prp.y, -scene.view.prp.z);
    cam_rotate_forward.values = [
        [u_axis_1.x, u_axis_1.y, u_axis_1.z, 0],
        [v_axis_1.x, v_axis_1.y, v_axis_1.z, 0],
        [n_axis_1.x, n_axis_1.y, n_axis_1.z, 0],
        [0,0,0,1]
    ];
    Mat4x4RotateY(cam_rotate_y, camera_velocity.rot_y * delta_time);
    Mat4x4RotateX(cam_rotate_x, camera_velocity.rot_x * delta_time);
    cam_rotate_back.values = matrix_invert(cam_rotate_forward.values);

    Mat4x4Translate(cam_translate_back,  scene.view.prp.x, scene.view.prp.y,  scene.view.prp.z);

    let old_val = scene.view.srp;
    let new_val = Matrix.multiply([cam_translate_back, cam_rotate_back, cam_rotate_y, cam_rotate_x, cam_rotate_forward, cam_translate, new Vector4(old_val.x,old_val.y,old_val.z,1)]);
    scene.view.srp = new Vector3(new_val.x, new_val.y, new_val.z);
}

function clip_model(model) {

    let clipped_edges = []

    // Clip each edge/polygon
    for(let edge of model.edges) {
        for(i=1; i<edge.length; i++) {
            let idx_0 = edge[i-1];
            let idx_1 = edge[i];

            let keep_looping = true;
            let loop_counter = 0;
            while(keep_looping) {
                
                let pt_0 = model.vertices[idx_0].values;

                pt_0 = new Vector4(pt_0[0][0], pt_0[1][0], pt_0[2][0], pt_0[3][0]);
                let pt_1 = model.vertices[idx_1].values;
                pt_1 = new Vector4(pt_1[0][0], pt_1[1][0], pt_1[2][0], pt_1[3][0]);

                let outcode_0;
                let outcode_1;

                // Parallel view
                if(scene.view.type === 'parallel') {
                    outcode_0 = get_outcode(pt_0, -1, 1, -1, 1, 0, -1);
                    outcode_1 = get_outcode(pt_1, -1, 1, -1, 1, 0, -1);
                }

                // Perspective view
                else {
                    outcode_0 = get_outcode(pt_0, pt_0.z, -pt_0.z, pt_0.z, -pt_0.z, -(scene.view.clip[4]/scene.view.clip[5]), -1);
                    outcode_1 = get_outcode(pt_1, pt_1.z, -pt_1.z, pt_1.z, -pt_1.z, -(scene.view.clip[4]/scene.view.clip[5]), -1);
                }

                // Trivial accept
                if((outcode_0 | outcode_1) == 0) {
                    clipped_edges.push([idx_0, idx_1]);
                    keep_looping = false;
                    
                }

                // Trivial reject
                else if((outcode_0 & outcode_1) != 0) {
                    keep_looping = false;
                }
                
                // Investigate further
                else {
                    //keep_looping = false;
                    // pt_0 in bounds, pt_1 out of bounds
                    let out_idx = 1;
                    let pt_in = pt_0;
                    let pt_out = pt_1;
                    let outcode = outcode_1;

                    // pt_1 in bounds, pt_0 out of bounds
                    if(outcode_1 == 0) {
                        out_idx = 0;
                        pt_in = pt_1;
                        pt_out = pt_0;
                        outcode = outcode_0;
                    }

                    let t = 0;
                    let dx = pt_out.x - pt_in.x;
                    let dy = pt_out.y - pt_in.y;
                    let dz = pt_out.z - pt_in.z;

                    // Perspective view
                    if(scene.view.type === 'perspective') {

                        if((outcode & LEFT) != 0)
                            t = (-pt_in.x + pt_in.z) / (dx - dz);
                        else if((outcode & RIGHT) != 0)
                            t = (pt_in.x + pt_in.z) / (-dx - dz);
                        else if((outcode & BOTTOM) != 0)
                            t = (-pt_in.y + pt_in.z) / (dy - dz);
                        else if((outcode & TOP) != 0)
                            t = (pt_in.y + pt_in.z) / (-dy - dz);
                        else if((outcode & NEAR) != 0)
                            t = (pt_in.z + (scene.view.clip[4]/scene.view.clip[5])) / (-dz);
                        else if((outcode & FAR) != 0)
                            t = (-pt_in.z - 1)/dz;
                    }

                    // Parallel view
                    else {
                    //outcode_1 = get_outcode(pt_0, -1, 1, -1, 1, 0, -1);

                        if((outcode & LEFT) != 0)
                            t = (-pt_in.x - 1) / (dx);
                        else if((outcode & RIGHT) != 0)
                            t = (pt_in.x - 1) / (-dx);
                        else if((outcode & BOTTOM) != 0)
                            t = (-pt_in.y - 1) / (dy);
                        else if((outcode & TOP) != 0)
                            t = (pt_in.y - 1) / (-dy);
                        else if((outcode & NEAR) != 0)
                            t = (-pt_in.z) / dz;
                        else if((outcode & FAR) != 0)
                            t = (pt_in.z + 1) / -dz;
                    }

                    model.vertices.push(new Vector4(pt_in.x+t*dx, pt_in.y+t*dy, pt_in.z+t*dz, 1));

                    if(out_idx == 0) {
                        idx_0 = model.vertices.length-1;
                    }
                    else {
                        idx_1 = model.vertices.length-1;
                    }
                }

                //Force the loop to stop if it is getting stuck
                loop_counter++;
                if(loop_counter > 10) {
                    keep_looping = false;
                }
            }
        }
    }

    model.edges = clipped_edges;
}

function get_outcode(vertex, left, right, bottom, top, near, far) {
    let outcode = 0;
    
    if (vertex.x < left) outcode += LEFT;
    if (vertex.x > right) outcode += RIGHT;
    if (vertex.y < bottom) outcode += BOTTOM;
    if (vertex.y > top) outcode += TOP;
    if (vertex.z > near) outcode += NEAR;
    if (vertex.z < far) outcode += FAR;

    return outcode;
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


// Returns the inverse of matrix `M`.
// From http://blog.acipo.com/matrix-inversion-in-javascript/
function matrix_invert(M){
    if(M.length !== M[0].length){return;}
    var i=0, ii=0, j=0, dim=M.length, e=0, t=0;
    var I = [], C = [];
    for(i=0; i<dim; i+=1){
        I[I.length]=[];
        C[C.length]=[];
        for(j=0; j<dim; j+=1){
            if(i==j){ I[i][j] = 1; }
            else{ I[i][j] = 0; }
            C[i][j] = M[i][j];
        }
    }
    for(i=0; i<dim; i+=1){
        e = C[i][i];
        if(e==0){
            for(ii=i+1; ii<dim; ii+=1){
                if(C[ii][i] != 0){
                    for(j=0; j<dim; j++){
                        e = C[i][j];
                        C[i][j] = C[ii][j];
                        C[ii][j] = e;
                        e = I[i][j];
                        I[i][j] = I[ii][j];
                        I[ii][j] = e;
                    }

                    break;
                }
            }
            e = C[i][i];
            if(e==0){return}
        }
        for(j=0; j<dim; j++){
            C[i][j] = C[i][j]/e;
            I[i][j] = I[i][j]/e;
        }
        for(ii=0; ii<dim; ii++){
            if(ii==i){continue;}
            e = C[ii][i];
            for(j=0; j<dim; j++){
                C[ii][j] -= e*C[i][j];
                I[ii][j] -= e*I[i][j];
            }
        }
    }
    return I;
}

