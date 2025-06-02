const board = document.getElementById("board");
const statusText = document.getElementById("status");
const resetBtn = document.getElementById("reset");

let currentPlayer = "X";
let grid = Array(9).fill(null);

const winningCombinations = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8], // lignes
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8], // colonnes
  [0, 4, 8],
  [2, 4, 6], // diagonales
];

function checkWinner() {
  for (const combo of winningCombinations) {
    const [a, b, c] = combo;
    if (grid[a] && grid[a] === grid[b] && grid[a] === grid[c]) {
      return grid[a];
    }
  }
  if (!grid.includes(null)) return "Egalité";
  return null;
}

function handleClick(e) {
  const index = e.target.dataset.index;
  if (grid[index] || checkWinner()) return;

  grid[index] = currentPlayer;
  e.target.textContent = currentPlayer;
  e.target.classList.add("taken");

  const winner = checkWinner();
  if (!statusText) return;
  if (winner) {
    statusText.textContent =
      winner === "Egalité" ? "Match nul !" : `Joueur ${winner} a gagné !`;
  } else {
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    statusText.textContent = `À ${currentPlayer} de jouer`;
  }
}

function resetGame() {
  grid = Array(9).fill(null);
  currentPlayer = "X";
  if (!statusText) return;
  statusText.textContent = "Joueur X commence";
  board.querySelectorAll(".cell").forEach((cell) => {
    cell.textContent = "";
    cell.classList.remove("taken");
  });
}

function createBoard() {
  board.innerHTML = "";
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.dataset.index = i;
    cell.addEventListener("click", handleClick);
    board.appendChild(cell);
  }
}

resetBtn.addEventListener("click", resetGame);

createBoard();

// === SHADER BACKGROUND ===
const canvas = document.getElementById("shader-canvas");
const gl = canvas.getContext("webgl");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const vertexShaderSource = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const fragmentShaderSource = `
precision mediump float;
uniform float iTime;
uniform vec2 iResolution;

vec2 pointA = vec2(0.6,0.3);
vec2 pointB = vec2(-0.2,0.7);
vec2 pointC = vec2(-0.8,-0.2);
vec2 pointD = vec2(0.5,-0.6);

vec3 image(vec2 st) {
  vec2 point[5];
  point[0] = pointA * sin(iTime * 0.43) * 0.53;
  point[1] = pointB * sin(-iTime * 0.85) * 0.63;
  point[2] = pointC * cos(iTime * -0.32 + cos(iTime*0.84)) * 0.73;
  point[3] = pointD * sin(iTime*0.52) * cos(iTime * 0.21);
  point[4] = vec2(0.6) * sin(iTime * 0.3 + cos(iTime * 0.34));	

  float minDist = 1.0;
  for(int i = 0; i < 5; ++i) {
    minDist = min(minDist, distance(st, point[i]));
  }

  vec3 color = vec3(0.0);
  color += minDist;
  return color;
}

void main() {
  vec2 pos = (gl_FragCoord.xy * 2.0 - iResolution.xy) / min(iResolution.x, iResolution.y);
  gl_FragColor = vec4(image(pos), 1.0);
}
`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
  }
  return shader;
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(
  gl,
  gl.FRAGMENT_SHADER,
  fragmentShaderSource
);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
gl.useProgram(program);

const posAttrib = gl.getAttribLocation(program, "a_position");
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
  gl.STATIC_DRAW
);
gl.enableVertexAttribArray(posAttrib);
gl.vertexAttribPointer(posAttrib, 2, gl.FLOAT, false, 0, 0);

const iTimeLoc = gl.getUniformLocation(program, "iTime");
const iResLoc = gl.getUniformLocation(program, "iResolution");

function renderShader(t) {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.uniform1f(iTimeLoc, t * 0.001);
  gl.uniform2f(iResLoc, canvas.width, canvas.height);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  requestAnimationFrame(renderShader);
}
renderShader();

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});
