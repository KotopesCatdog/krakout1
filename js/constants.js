const W = 832;
const H = 640;
const BRICK_W = 64;
const BRICK_H = 32;
const ROWS = 8;
const COLS = 13;
const BRICKS_TOP_Y = 104;

const PADDLE_H = 20;
const PADDLE_Y = H - 64;

const BONUS_TYPES_LIST = ['EXTEND', 'SHRINK', 'EXTRA_LIFE', 'SLOW', 'FAST', 'MEGA', 'MAGNET', 'ATTACK', 'BOMB'];

// Типы блоков
const BRICK_TYPES = {
    NORMAL: 1,
    UNBREAKABLE: 9,
    MOVING: 13      // ← новый тип: движущийся блок
};

const BRICK_COLORS = {
    1:  { main: "#00E8FF", light: "#88FFFF", dark: "#0088AA" },
    2:  { main: "#00E8FF", light: "#88FFFF", dark: "#0088AA" },
    9:  { main: "#006666", light: "#44AAAA", dark: "#003333" },
    13: { main: "#006666", light: "#44AAAA", dark: "#003333" }, // как непробиваемый (9)
    4:  { main: "#FF4488", light: "#FF88BB", dark: "#AA2255" },
    5:  { main: "#FFEE44", light: "#FFFF88", dark: "#AA9922" },
    6:  { main: "#44FF88", light: "#88FFBB", dark: "#22AA55" },
    7:  { main: "#FF8844", light: "#FFBB77", dark: "#AA5522" },
    8:  { main: "#BB44FF", light: "#DD88FF", dark: "#7722AA" },
    10: { main: "#FF4444", light: "#FF8888", dark: "#AA2222" },
    11: { main: "#4488FF", light: "#88AAFF", dark: "#2255AA" },
    12: { main: "#EEEEEE", light: "#FFFFFF", dark: "#AAAAAA" }
};