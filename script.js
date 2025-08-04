document.addEventListener('DOMContentLoaded', () => {
    const graphContainer = document.getElementById('graph-container');
    const addNodeBtn = document.getElementById('add-node-btn');
    const addEdgeBtn = document.getElementById('add-edge-btn');
    const clearGraphBtn = document.getElementById('clear-graph-btn');
    const startBtn = document.getElementById('start-btn');
    const resetBtn = document.getElementById('reset-btn');
    const startNodeSelect = document.getElementById('startNode');
    const queueDisplay = document.getElementById('queue-display');
    const visitedDisplay = document.getElementById('visited-display');
  
    let graph = {};
    let nodeElements = {};
    let edgeElements = {};
    let nodeCount = 0;
    let mode = 'add-node';
  
    let isDrawing = false;
    let startNodeForEdge = null;
    let tempEdge = null;
  
    let queue = [];
    let visited = new Set();
    let animationInterval;
  
    // --- Mode Controls ---
    addNodeBtn.addEventListener('click', () => {
      mode = 'add-node';
      addNodeBtn.classList.add('active');
      addEdgeBtn.classList.remove('active');
      document.body.style.cursor = 'crosshair';
    });
  
    addEdgeBtn.addEventListener('click', () => {
      mode = 'add-edge';
      addEdgeBtn.classList.add('active');
      addNodeBtn.classList.remove('active');
      document.body.style.cursor = 'default';
    });
  
    clearGraphBtn.addEventListener('click', () => {
      reset();
      graph = {};
      nodeCount = 0;
      graphContainer.innerHTML = '';
      startNodeSelect.innerHTML = '';
      startBtn.disabled = true;
      resetBtn.disabled = true;
    });
  
    // --- Touch and Mouse Support ---
    graphContainer.addEventListener('mousedown', handleContainerInteraction);
    graphContainer.addEventListener('touchstart', handleContainerInteraction, { passive: false });
  
    function handleContainerInteraction(e) {
      if (e.target.id !== 'graph-container') return;
      if (mode !== 'add-node') return;
  
      e.preventDefault();
  
      const rect = graphContainer.getBoundingClientRect();
      const clientX = e.clientX ?? e.touches?.[0]?.clientX;
      const clientY = e.clientY ?? e.touches?.[0]?.clientY;
  
      const x = clientX - rect.left;
      const y = clientY - rect.top;
  
      nodeCount++;
      const nodeId = `Node ${nodeCount}`;
      const node = document.createElement('div');
      node.className = 'node';
      node.id = nodeId;
      node.innerText = nodeId;
      node.style.left = `${x - 25}px`;
      node.style.top = `${y - 25}px`;
      graphContainer.appendChild(node);
  
      graph[nodeId] = [];
      nodeElements[nodeId] = node;
      updateNodeSelection();
  
      node.addEventListener('mousedown', handleNodeInteraction);
      node.addEventListener('touchstart', handleNodeInteraction, { passive: false });
    }
  
    function handleNodeInteraction(e) {
      if (mode !== 'add-edge') return;
      e.preventDefault();
      e.stopPropagation();
  
      isDrawing = true;
      startNodeForEdge = e.target.id;
  
      let svg = graphContainer.querySelector('svg');
      if (!svg) {
        svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        graphContainer.appendChild(svg);
      }
  
      tempEdge = document.createElementNS("http://www.w3.org/2000/svg", "line");
      tempEdge.setAttribute('class', 'temp-edge');
  
      const startX = e.target.offsetLeft + 25;
      const startY = e.target.offsetTop + 25;
      tempEdge.setAttribute('x1', startX);
      tempEdge.setAttribute('y1', startY);
      tempEdge.setAttribute('x2', startX);
      tempEdge.setAttribute('y2', startY);
  
      svg.appendChild(tempEdge);
    }
  
    graphContainer.addEventListener('mousemove', handleDrawing);
    graphContainer.addEventListener('touchmove', handleDrawing, { passive: false });
  
    function handleDrawing(e) {
      if (!isDrawing || !tempEdge) return;
      e.preventDefault();
  
      const rect = graphContainer.getBoundingClientRect();
      const clientX = e.clientX ?? e.touches?.[0]?.clientX;
      const clientY = e.clientY ?? e.touches?.[0]?.clientY;
  
      const x = clientX - rect.left;
      const y = clientY - rect.top;
  
      tempEdge.setAttribute('x2', x);
      tempEdge.setAttribute('y2', y);
    }
  
    graphContainer.addEventListener('mouseup', handleDrawingEnd);
    graphContainer.addEventListener('touchend', handleDrawingEnd, { passive: false });
  
    function handleDrawingEnd(e) {
      if (!isDrawing) return;
      e.preventDefault();
  
      isDrawing = false;
      if (tempEdge) {
        tempEdge.remove();
        tempEdge = null;
      }
  
      const clientX = e.clientX ?? e.changedTouches?.[0]?.clientX;
      const clientY = e.clientY ?? e.changedTouches?.[0]?.clientY;
  
      let endNode = null;
      for (const id in nodeElements) {
        const el = nodeElements[id];
        const rect = el.getBoundingClientRect();
        if (clientX >= rect.left && clientX <= rect.right &&
            clientY >= rect.top && clientY <= rect.bottom) {
          endNode = id;
          break;
        }
      }
  
      if (endNode && endNode !== startNodeForEdge) {
        if (!graph[startNodeForEdge].includes(endNode)) {
          graph[startNodeForEdge].push(endNode);
          graph[endNode].push(startNodeForEdge);
  
          const svg = graphContainer.querySelector('svg');
          const start = nodeElements[startNodeForEdge];
          const end = nodeElements[endNode];
          const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  
          line.setAttribute('x1', start.offsetLeft + 25);
          line.setAttribute('y1', start.offsetTop + 25);
          line.setAttribute('x2', end.offsetLeft + 25);
          line.setAttribute('y2', end.offsetTop + 25);
          line.setAttribute('class', 'edge');
  
          svg.appendChild(line);
          const key = startNodeForEdge < endNode ? `${startNodeForEdge}-${endNode}` : `${endNode}-${startNodeForEdge}`;
          edgeElements[key] = line;
        }
      }
    }
  
    function updateNodeSelection() {
      const keys = Object.keys(graph);
      startNodeSelect.innerHTML = keys.map(n => `<option value="${n}">${n}</option>`).join('');
      startBtn.disabled = keys.length === 0;
      resetBtn.disabled = keys.length === 0;
    }
  
    function updateVisuals() {
      queueDisplay.innerHTML = queue.map(n => `<div class="queue-item">${n}</div>`).join('');
      visitedDisplay.innerHTML = Array.from(visited).map(n => `<div class="visited-item">${n}</div>`).join('');
  
      for (const id in nodeElements) {
        const el = nodeElements[id];
        el.classList.remove('start', 'current', 'queued', 'visited');
        if (id === startNodeSelect.value) el.classList.add('start');
        if (visited.has(id)) el.classList.add('visited');
        if (queue.includes(id)) el.classList.add('queued');
        if (queue[0] === id) el.classList.add('current');
      }
    }
  
    function animateBFS() {
      if (queue.length === 0) {
        clearInterval(animationInterval);
        return;
      }
  
      const current = queue.shift();
      visited.add(current);
      updateVisuals();
  
      setTimeout(() => {
        for (const neighbor of graph[current]) {
          if (!visited.has(neighbor) && !queue.includes(neighbor)) {
            queue.push(neighbor);
            const key = current < neighbor ? `${current}-${neighbor}` : `${neighbor}-${current}`;
            edgeElements[key]?.classList.add('active');
          }
        }
        updateVisuals();
      }, 1000);
    }
  
    function startTraversal() {
      const start = startNodeSelect.value;
      if (!graph[start]) return;
  
      reset();
      queue.push(start);
      visited.add(start);
      updateVisuals();
  
      startBtn.disabled = true;
      resetBtn.disabled = false;
      animationInterval = setInterval(animateBFS, 2000);
    }
  
    function reset() {
      clearInterval(animationInterval);
      queue = [];
      visited.clear();
      for (const id in nodeElements) {
        nodeElements[id].classList.remove('start', 'current', 'queued', 'visited');
      }
      for (const key in edgeElements) {
        edgeElements[key].classList.remove('active');
      }
      queueDisplay.innerHTML = '';
      visitedDisplay.innerHTML = '';
      updateNodeSelection();
    }
  
    startBtn.addEventListener('click', startTraversal);
    resetBtn.addEventListener('click', reset);
  
    document.body.style.cursor = 'crosshair';
  });
  