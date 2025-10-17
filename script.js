const grid = document.getElementById('grid');
const grid_frame = document.getElementById('grid_frame');
const menu_frame = document.getElementById('menu_frame');
const main_frame = document.getElementById('main_frame');
const megumin_button = document.getElementById('megumin_button');
const main_space = document.getElementById('main_space');
const main_back = document.getElementById('main_back');
const menu_height = 48;
let main_scale = 2;
const menu = document.getElementById('menu');
const button_space = document.getElementById('button_space');
const settings = document.getElementById('settings');
let COLS = 9;
let ROWS = 9;
let USE_RBM = false;
let is_showel = true;
const max_offset = 25;
let mines_numb = new Map();
mines_numb.set("[9, 9]", 10);
mines_numb.set("[16, 16]", 40);
mines_numb.set("[30, 16]", 99);
let flag_counter = 0;
let MINES = 10;
let left = 71;
const mine_density = 0.20;
let started = false;
let field = new Array();
let is_use_rbm = false;
let seconds = 0;
let customm = false;
let custon_sc = false;
let is_settings_open = false;



function setGridSize(cols, rows) {
    document.documentElement.style.setProperty('--main-scale', `${main_scale}`);
    grid.style.gridTemplateColumns = `repeat(${cols}, 16px)`;
    grid.style.gridTemplateRows = `repeat(${rows}, 16px)`;
    let w = cols * 16;
    if (w < 16 * 9) {
        w = 16 * 9;
    }
    grid_frame.style.width = `${w}px`;
    grid_frame.style.height = `${rows * 16}px`;
    menu_frame.style.width = `${w}px`;
    menu_frame.style.height = `${menu_height}px`;
    main_frame.style.width = `${w + 8}px`;
    main_frame.style.height = `${rows * 16 + menu_height + 16}px`
    menu.style.width = `${w}px`;
    menu.style.height = `${menu_height}px`;
    main_space.style.width = `${(w + 8) * main_scale}px`;
    main_space.style.height = `${(rows * 16 + menu_height + 16) * main_scale}px`;
    main_back.style.width = `${(w + 16) * main_scale}px`;
    main_back.style.height = `${(rows * 16 + menu_height + 16 + 8) * main_scale}px`;
    button_space.style.height = `${32 * main_scale}px`;
    button_space.style.width = `${(w + 16) * main_scale}px`;
}

function fillGrid(cols, rows) {
    grid.innerHTML = "";
    COLS = cols;
    ROWS = rows;
    // console.log(cols);
    // console.log(rows);
    setGridSize(cols, rows);
    for (let i = 0; i < rows; i += 1) {
        field.push(new Array());
        for (let j = 0; j < cols; j += 1) {
            const tile = document.createElement('button');
            tile.className = 'atlas-button';

            grid.appendChild(tile);
            tile.addEventListener('contextmenu', event => {
                event.preventDefault();
            });
            field[i].push([false, tile, false, 0, false]);
            tile.value = `[${j}, ${i}]`;
            tile.addEventListener('mousedown', (e) => {
                tilePressed(tile, [j, i], e.button, e.buttons);
            });
            tile.addEventListener('mouseup', (e) => {
                if (e.buttons == 0) {
                    document.documentElement.style.setProperty('--megumin-button-offset', `${-0}px`);
                }
            });
            tile.addEventListener('mouseleave', () => {
                if (tile.disabled == false) {
                    document.documentElement.style.setProperty('--megumin-button-offset', `${-0}px`);
                }
            })
            tile.addEventListener('dblclick', (e) => {
                if (!USE_RBM && field[i][j][4]) {
                    openNine([j, i]);
                }
            });
        }
    }
    // console.log(field);
}


function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function correct_coord(coord) {
    if (coord[0] >= 0 && coord[1] >= 0 && coord[0] < COLS && coord[1] < ROWS) {
        return true;
    }
    return false;
}


function start(coord) {
    let tiles = new Array();
    // console.log(coord);
    for (let y = 0; y < ROWS; y += 1) {
        for (let x = 0; x < COLS; x += 1) {
            if (Math.abs(x - coord[0]) > 1 || Math.abs(y - coord[1]) > 1) {
                tiles.push([x, y]);
            }
        }
    }
    if (tiles.length == 0) {
        for (let y = 0; y < ROWS; y += 1) {
            for (let x = 0; x < COLS; x += 1) {
                if (Math.abs(x - coord[0]) != 0 || Math.abs(y - coord[1]) != 0) {
                    tiles.push([x, y]);
                }
            }
        }
    }
    tiles = shuffle(tiles);
    for (let i = 0; i < MINES; i += 1) {
        let xb = tiles[i][0];
        let yb = tiles[i][1];
        field[yb][xb][0] = true;
        // field[yb][xb][1].disabled = true;
        // field[yb][xb][1].style.backgroundPosition = `${-48}px ${0}px`;
        const hm = [-1, 0, 1];
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (!(i == 1 && j == 1)) {
                    let dx = xb + hm[i];
                    let dy = yb + hm[j];
                    if (correct_coord([dx, dy])) {
                        field[dy][dx][3] += 1;
                    }
                }
            }
        }
    }
    // for (let y = 0; y < ROWS; y += 1) {
    //     for (let x = 0; x < COLS; x += 1) {
    //         if (field[y][x][3] > 0 && !field[y][x][0]) {
    //             field[y][x][1].disabled = true;
    //             field[y][x][1].style.backgroundPosition = `${(-16 * (field[y][x][3] - 1))}px ${-16}px`;
    //         }
    //     }
    // }
    // console.log(tiles);
    // console.log(field);
    started = true;
    time_start();
}

let timer = null;

function time_start() {
    if (timer === null) { // чтобы не запустить дважды
        timer = setInterval(() => {

            seconds++;
            counter_print('counter_time', seconds);
            //console.log(seconds); // можно заменить на обновление DOM
        }, 1000);
    }
}

function time_stop() {
    clearInterval(timer);
    timer = null;
}


function flag(coord) {
    let t = field[coord[1]][coord[0]];
    if (!t[4]) {
        field[coord[1]][coord[0]][2] = !t[2];
        t[1].classList.toggle('flag');
        if (field[coord[1]][coord[0]][2]) {
            flag_counter += 1;
        }
        else flag_counter -= 1;
        counter_print('counter_bombs', MINES - flag_counter);
    }
}

function open_tile(coord) {
    field[coord[1]][coord[0]][1].style.backgroundPosition = `${(-16 * (field[coord[1]][coord[0]][3] - 1))}px ${-16}px`;
    field[coord[1]][coord[0]][4] = true;
    progress();

}
function gameWin() {
    for (let y = 0; y < ROWS; y += 1) {
        for (let x = 0; x < COLS; x += 1) {
            field[y][x][1].disabled = true;
            if (field[y][x][0] && !field[y][x][2]) {
                field[y][x][1].classList.toggle('flag');
            }
        }
    }
    document.documentElement.style.setProperty('--megumin-button-offset', `${-96}px`);
    counter_print('counter_bombs', 0);
    time_stop();
}

function progress() {
    left -= 1;
    //console.log(left);
    if (left == 0) {
        gameWin();
        return false;
    }
    return true;
}

function openNine(coord) {
    //console.log('mda');
    const hm = [-1, 0, 1];
    let f = 0;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (!(i == 1 && j == 1)) {
                let dx = coord[0] + hm[i];
                let dy = coord[1] + hm[j];
                if (correct_coord([dx, dy]) && !field[dy][dx][4]) {
                    if (field[dy][dx][2]) f += 1;
                }
            }
        }
    }
    if (f == field[coord[1]][coord[0]][3]) {
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (!(i == 1 && j == 1)) {
                    let dx = coord[0] + hm[i];
                    let dy = coord[1] + hm[j];
                    if (correct_coord([dx, dy]) && !field[dy][dx][4] && !field[dy][dx][2]) {
                        if (field[dy][dx][0]) {
                            gameOver([dx, dy]);
                        }
                        else if (field[dy][dx][3] > 0) {
                            open_tile([dx, dy]);
                        }
                        else {
                            openNineRe([dx, dy]);
                        }
                    }
                }
            }
        }
    }
}

function openNineRe(coord) {
    const hm = [-1, 0, 1];
    field[coord[1]][coord[0]][1].style.backgroundPosition = `${-32}px ${0}px`;
    field[coord[1]][coord[0]][4] = true;
    progress();
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (!(i == 1 && j == 1)) {
                let dx = coord[0] + hm[i];
                let dy = coord[1] + hm[j];
                if (correct_coord([dx, dy]) && !field[dy][dx][4]) {
                    if (field[dy][dx][3] > 0) {
                        open_tile([dx, dy]);
                    }
                    else {
                        openNineRe([dx, dy]);
                    }
                }
            }
        }
    }
}

function gameOver(coord) {
    field[coord[1]][coord[0]][1].style.backgroundPosition = `${-64}px ${0}px`;
    for (let y = 0; y < ROWS; y += 1) {
        for (let x = 0; x < COLS; x += 1) {
            if (field[y][x][0] && (x != coord[0] || y != coord[1])) {
                field[y][x][1].style.backgroundPosition = `${-48}px ${0}px`;
            }
            field[y][x][1].disabled = true;
        }
    }
    document.documentElement.style.setProperty('--megumin-button-offset', `${-64}px`);
    time_stop();
}



function showel(coord) {
    let x = coord[0];
    let y = coord[1];
    t = field[y][x]
    if (!t[2] && !t[4]) {
        if (!started) {
            start(coord);
        }
        if (t[0]) {
            gameOver(coord);
        }
        else {
            if (t[3] > 0) {
                open_tile([x, y]);
            }
            else {
                openNineRe(coord);
            }
        }
    }
}


function tilePressed(tile, coord, btn, btns) {
    document.documentElement.style.setProperty('--megumin-button-offset', `${-32}px`);
    if (USE_RBM) {
        if (field[coord[1]][coord[0]][4] && btns === 3) {
            openNine(coord);
        }
        else if (btn == 0) {
            showel(coord);
        }
        else if (btn == 2) {
            flag(coord);
        }
    }
    else {
        if (btn == 0) {
            if (is_showel) {
                showel(coord);
            }
            else {
                flag(coord);
            }
        }
    }
}








let sett_size_buttons;
let sett_scale_buttons;

document.addEventListener("DOMContentLoaded", () => {
    //console.log("DOM is ready!");
    new_game(9, 9);

    sett_size_buttons = Array.from(document.getElementById("size_buttns").querySelectorAll(".button-size"));
    sett_scale_buttons = Array.from(document.getElementById("sett_scale_battns").querySelectorAll(".button-size"));

    sett_size_buttons.push(document.getElementById("custom_size"));
    sett_size_buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            button_size_pressed(btn, sett_size_buttons, set_size);
        });
    });
    sett_scale_buttons.push(document.getElementById("custom_scale_butt"));
    sett_scale_buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            button_size_pressed(btn, sett_scale_buttons, set_scale);
        });

    });
    sett_size_buttons[0].disabled = true;
    sett_scale_buttons[1].disabled = true;
    set_is_use_lgbt(true, true);

});

function set_is_use_lgbt(u, b) {
    is_use_rbm = u;
    if (u) {
        document.documentElement.style.setProperty('--margin-line', `${8}px`);
        document.getElementById('u_r').style.display = 'flex';
        document.getElementById('u_r_l').style.display = 'flex';

    }
    else {
        document.documentElement.style.setProperty('--margin-line', `${15}px`);
        document.getElementById('u_r').style.display = 'none';
        document.getElementById('u_r_l').style.display = 'none';
    }
    if (b) {
        document.getElementById("change").style.display = 'none';
        document.getElementById("use_rbm").checked = true;
        USE_RBM = true;
    }
    else {
        document.getElementById("change").style.display = 'block';
        document.getElementById("use_rbm").checked = false;
        USE_RBM = false;
    }
}

function new_game(x, y) {
    field = new Array();
    time_stop();
    fillGrid(x, y);
    started = false;
    if (customm) {
        MINES = document.getElementById('custom_mines').value;
    }
    left = x * y - MINES;
    document.documentElement.style.setProperty('--megumin-button-offset', `${0}px`);
    flag_counter = 0;
    counter_print('counter_bombs', MINES - flag_counter);
    seconds = 0;
    counter_print('counter_time', 0);
}

function button_size_pressed(btn, btns, f) {
    btns.forEach(b => {
        b.disabled = false;
    });

    btn.disabled = true;
    f(btn.value);
}

function set_size(size) {
    if (size == 'custom') {
        let x = document.getElementById("custom_size_x").value;
        let y = document.getElementById("custom_size_y").value;
        MINES = document.getElementById('custom_mines').value;
        customm = true;

        new_game(x, y);

    }
    else {
        customm = false;
        let s = JSON.parse(size);
        MINES = mines_numb.get(size);
        new_game(s[0], s[1]);

    }

}
function set_scale(size) {
    if (size == 'custom') {
        let s = document.getElementById("custom_scale").value;

        main_scale = s;
        setGridSize(COLS, ROWS);
        custon_sc = true;
    }
    else {

        let s = parseInt(size);
        main_scale = s;
        custon_sc = false;
        setGridSize(COLS, ROWS);
    }
}
const overlay = document.querySelector('.modal-overlay');
const closeBtn = document.querySelector('.close-btn');
const settings_window = document.querySelector('.modal-window');

function openModal() {
    overlay.classList.add('active');
    is_settings_open = true;
}

function closeModal() {
    overlay.classList.remove('active');
    is_settings_open = false;
}
closeBtn.addEventListener('click', () => {
    if (customm) {
        //console.log("o");
        if (document.getElementById('custom_size_x').value != COLS || document.getElementById('custom_size_y').value != ROWS) {
            new_game(document.getElementById('custom_size_x').value, document.getElementById('custom_size_y').value);
        }
        if (MINES != document.getElementById('custom_mines').value) {
            new_game(COLS, ROWS);
        }

    }
    if (custon_sc && main_scale != document.getElementById('custom_scale').value) {
        //console.log("o");
        set_scale('custom');
    }
    closeModal();
});
settings.addEventListener('click', openModal);

document.querySelectorAll('.arrow.up').forEach(btn => {
    btn.addEventListener('click', () => {
        const targetSelector = btn.dataset.target;
        const target = document.querySelector(targetSelector);
        let value = parseInt(target.value) || 0;
        if (value < target.max) target.value = value + 1;
        if (target.id == "custom_size_x" || target.id == "custom_size_y") {
            let m = document.getElementById('custom_size_x').value * document.getElementById('custom_size_y').value;
            document.getElementById('custom_mines').value = Math.round(m * mine_density);
        }
    });
});

document.querySelectorAll('.arrow.down').forEach(btn => {
    btn.addEventListener('click', () => {
        const targetSelector = btn.dataset.target;
        const target = document.querySelector(targetSelector);
        let value = parseInt(target.value) || 0;
        if (value > target.min) target.value = value - 1;
        if (target.id == "custom_size_x" || target.id == "custom_size_y") {
            let m = document.getElementById('custom_size_x').value * document.getElementById('custom_size_y').value;
            document.getElementById('custom_mines').value = Math.round(m * mine_density);;
        }
    });
});

const numbs = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

document.querySelectorAll(".numb-input").forEach(inp => {
    inp.addEventListener('change', (e) => {
        let value = parseInt(inp.value) || 0;
        if (value < inp.min) inp.value = inp.min;
        if (value > inp.max) inp.value = inp.max;
        if (inp.id == "custom_size_x" || inp.id == "custom_size_y") {
            let m = document.getElementById('custom_size_x').value * document.getElementById('custom_size_y').value;
            document.getElementById('custom_mines').value = Math.round(m * mine_density);;
        }
    });
    inp.addEventListener('keydown', e => {
        if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault();
        let l = inp.value.toString().length;
        if (numbs.includes(e.key) && l + 1 > inp.max.toString().length) e.preventDefault();


    });
});
function useRBMchecked() {
    let c = document.getElementById("use_rbm");
    if (c.checked == true) {
        document.getElementById("change").style.display = 'none';
    }
    else {
        document.getElementById("change").style.display = 'block';
    }
    USE_RBM = !USE_RBM;
}

function changeIns() {
    if (is_showel) {
        document.documentElement.style.setProperty('--showel-offset', `${-24}px`);
    }
    else {
        document.documentElement.style.setProperty('--showel-offset', `${-48}px`);
    }
    is_showel = !is_showel;
}

function reloadPage() {
    if (!is_use_rbm) {
        button_size_pressed(sett_size_buttons[0], sett_size_buttons, set_size);
        button_size_pressed(sett_scale_buttons[1], sett_scale_buttons, set_scale);
        new_game(9, 9);
    }
    else { location.href = location.href; }

}

document.addEventListener('mousemove', (e) => {
    let w = window.innerWidth;
    let o_x = ((e.clientX - w / 2) / w) * max_offset;
    let o_y = ((e.clientY - w / 2) / w) * max_offset;
    document.getElementById('restart_btn').style.transform = `translate(${Math.round(o_x / 8)}px, ${Math.round(o_y / 8)}px) scale(var(--main-scale))`;
    if (!is_settings_open) {
        main_space.style.transform = `translate(${Math.round(o_x)}px, ${Math.round(o_y)}px)`;

        main_back.style.boxShadow = `${Math.round((o_x / max_offset) * 10)}px ${Math.round((o_y / max_offset) * 10)}px 0px rgba(70, 14, 43, 0.5)`;
        document.querySelectorAll(".up-button").forEach(b => {
            b.style.filter = `drop-shadow(${Math.round((o_x / max_offset) * 5)}px ${Math.round((o_y / max_offset) * 5)}px 0px rgba(70, 14, 43, 0.5))`;
        });
    }
    else {
        settings_window.style.transform = `translate(${Math.round(o_x)}px, ${Math.round(o_y)}px) scale(var(--main-scale))`;
        settings_window.style.filter = `drop-shadow(${Math.round((o_x / max_offset) * 5)}px ${Math.round((o_y / max_offset) * 5)}px 0px rgba(70, 14, 43, 0.5))`;
        document.getElementById('restart_btn').style.filter = `drop-shadow(${Math.round((o_x / max_offset) * 5)}px ${Math.round((o_y / max_offset) * 5)}px 0px rgba(70, 14, 43, 0.5))`;
    }
});

function meguminBTNPressed() {
    new_game(COLS, ROWS);
}

function counter_print(counter_id, number) {
    let c = document.getElementById(counter_id);
    //console.log(c);
    let ns = new Array();
    for (let i = 0; i < 3; i += 1) {
        ns.push(c.querySelector(`[id="${i}"]`));
        ns[i].style.backgroundPosition = `-176px 0`;
    }
    if (number > 999) {
        number = 999;
    }
    else if (number < -99) {
        number = -99;
    }
    let minus = number < 0;
    number = Math.abs(number);
    let i = 2;
    while (number >= 10) {
        let h = number % 10;
        number = Math.floor(number / 10);
        ns[i].style.backgroundPosition = `${-(16 * h)}px 0`;
        i -= 1;
    }
    ns[i].style.backgroundPosition = `${-(16 * number)}px 0`;
    i -= 1;
    if (minus) {
        ns[i].style.backgroundPosition = `${-(16 * 10)}px 0`;
    }

}
