(() => {
  const boardEl = document.getElementById('board');
  const rowsInput = document.getElementById('rows');
  const colsInput = document.getElementById('cols');
  const minesInput = document.getElementById('mines');
  const resetBtn = document.getElementById('reset');
  const flagsEl = document.getElementById('flags');
  const timerEl = document.getElementById('timer');

  let rows = 10, cols = 10, mines = 15;
  let grid = [], revealedCount = 0, flagCount = 0, started = false, timer = null, seconds = 0;

  function startTimer(){
    clearInterval(timer);
    seconds = 0; timerEl.textContent = `時間: ${seconds}s`;
    timer = setInterval(()=>{seconds++; timerEl.textContent = `時間: ${seconds}s`;},1000);
  }

  function stopTimer(){ clearInterval(timer); timer = null; }

  function makeEmptyGrid(r,c){
    const g = new Array(r).fill(0).map(()=>new Array(c).fill(null).map(()=>({mine:false,adj:0,rev:false,flag:false})));
    return g;
  }

  function placeMines(g, r, c, m, safeR, safeC){
    let placed = 0;
    while(placed < m){
      const rr = Math.floor(Math.random()*r);
      const cc = Math.floor(Math.random()*c);
      if(g[rr][cc].mine) continue;
      // avoid placing mine on first clicked cell and neighbors
      if(Math.abs(rr-safeR)<=1 && Math.abs(cc-safeC)<=1) continue;
      g[rr][cc].mine = true; placed++;
    }
  }

  function computeAdj(g,r,c){
    for(let i=0;i<r;i++) for(let j=0;j<c;j++){
      if(g[i][j].mine) continue;
      let cnt=0;
      for(let di=-1;di<=1;di++) for(let dj=-1;dj<=1;dj++){
        const ni=i+di,nj=j+dj;
        if(ni<0||nj<0||ni>=r||nj>=c) continue;
        if(g[ni][nj].mine) cnt++;
      }
      g[i][j].adj = cnt;
    }
  }

  function render(){
    boardEl.innerHTML='';
    boardEl.style.gridTemplateColumns = `repeat(${cols}, ${getComputedStyle(document.documentElement).getPropertyValue('--cell-size') || '32px'})`;
    boardEl.className = `board`;
    for(let i=0;i<rows;i++){
      for(let j=0;j<cols;j++){
        const cell = document.createElement('div');
        cell.className='cell';
        cell.dataset.r = i; cell.dataset.c = j;
        const item = grid[i][j];
        if(item.rev){
          cell.classList.add('revealed');
          if(item.mine){ cell.classList.add('mine'); cell.textContent='💣'; }
          else if(item.adj>0){ cell.textContent = item.adj; }
        } else if(item.flag){
          cell.classList.add('flag'); cell.textContent='🚩';
        }
        cell.addEventListener('click', onLeftClick);
        cell.addEventListener('contextmenu', onRightClick);
        boardEl.appendChild(cell);
      }
    }
    flagsEl.textContent = `旗子: ${flagCount}/${mines}`;
  }

  function revealAll(){
    for(let i=0;i<rows;i++) for(let j=0;j<cols;j++) grid[i][j].rev = true;
    render();
  }

  function gameOver(win){
    stopTimer();
    started = false;
    if(!win) revealAll();
    setTimeout(()=> alert(win?`你贏了！時間 ${seconds}s`:'遊戲結束！'),10);
  }

  function checkWin(){
    const total = rows*cols; 
    if(revealedCount === total - mines) return true;
    return false;
  }

  function floodReveal(sr,sc){
    const stack = [[sr,sc]];
    while(stack.length){
      const [i,j] = stack.pop();
      const it = grid[i][j];
      if(it.rev || it.flag) continue;
      it.rev = true; revealedCount++;
      if(it.adj===0){
        for(let di=-1;di<=1;di++) for(let dj=-1;dj<=1;dj++){
          const ni=i+di,nj=j+dj;
          if(ni<0||nj<0||ni>=rows||nj>=cols) continue;
          if(!grid[ni][nj].rev && !grid[ni][nj].mine) stack.push([ni,nj]);
        }
      }
    }
  }

  function onLeftClick(e){
    const r = +this.dataset.r, c = +this.dataset.c;
    if(!started){
      // place mines avoiding this cell
      placeMines(grid, rows, cols, mines, r, c);
      computeAdj(grid, rows, cols);
      started = true; startTimer();
    }
    const it = grid[r][c];
    if(it.flag || it.rev) return;
    if(it.mine){ it.rev = true; render(); gameOver(false); return; }
    floodReveal(r,c);
    render();
    if(checkWin()) gameOver(true);
  }

  function onRightClick(e){ e.preventDefault(); const r=+this.dataset.r,c=+this.dataset.c; const it=grid[r][c];
    if(it.rev) return; 
    it.flag = !it.flag; flagCount += it.flag?1:-1; render();
  }

  function reset(){
    rows = Math.max(5, Math.min(30, parseInt(rowsInput.value)||10));
    cols = Math.max(5, Math.min(30, parseInt(colsInput.value)||10));
    mines = Math.max(1, Math.min(rows*cols-1, parseInt(minesInput.value)||15));
    grid = makeEmptyGrid(rows, cols);
    revealedCount = 0; flagCount = 0; started = false; stopTimer(); timerEl.textContent = `時間: 0s`;
    render();
  }

  resetBtn.addEventListener('click', ()=>{ reset(); });

  // init
  reset();

  // expose for debugging
  window.mineGame = {reset};
})();
