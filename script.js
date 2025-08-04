document.addEventListener('DOMContentLoaded', () => {
    const graphContainer = document.getElementById('graph-container');
    const startBtn = document.getElementById('start-btn');
    const resetBtn = document.getElementById('reset-btn');
    const startNodeSelect = document.getElementById('startNode');
    const queueDisplay = document.getElementById('queue-display');
    const visitedDisplay = document.getElementById('visited-display');
    const addNodeBtn = document.getElementById('add-node-btn');
    const addEdgeBtn = document.getElementById('add-edge-btn');
    const clearGraphBtn = document.getElementById('clear-graph-btn');

    let graph = {};
    let nodeCount = 0;
    let mode = 'add-node';

    let queue = [];
    let visited = new Set();
    let animationInterval;
    let nodeElements = {};
    let edgeElements = {};

    let isDrawing = false;
    let startNodeForEdge = null;
    let tempEdge = null;

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

    graphContainer.addEventListener('mousedown', handleContainerInteraction);
    graphContainer.addEventListener('touchstart', handleContainerInteraction, { passive: false });

    function handleContainerInteraction(e) {
        if (e.target.id !== 'graph-container') return;
        if (mode !== 'add-node') return;

        e.preventDefault();

        const rect = graphContainer.getBoundingClientRect();
        const clientX = e.clientX ?? (e.touches?.[0]?.clientX ?? null);
        const clientY = e.clientY ?? (e.touches?.[0]?.clientY ?? null);
        if (clientX === null || clientY === null) return;

        const offsetX = clientX - rect.left;
        const offsetY = clientY - rect.top;

        nodeCount++;
        const nodeId = `Node ${nodeCount}`;
        const nodeElement = createNodeElement(nodeId, offsetX, offsetY);
        graphContainer.appendChild(nodeElement);

        graph[nodeId] = [];
        nodeElements[nodeId] = nodeElement;

        updateNodeSelection();

        nodeElement.addEventListener('mousedown', handleNodeInteraction);
        nodeElement.addEventListener('touchstart', handleNodeInteraction, { passive: false });
    }

    function createNodeElement(id, x, y) {
        const el = document.createElement('div');
        el.className = 'node';
        el.id = id;
        el.innerText = id;
        el.style.left = `${x - 25}px`;
        el.style.top = `${y - 25}px`;
        return el;
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
        const clientX = e.clientX ?? (e.touches?.[0]?.clientX ?? null);
        const clientY = e.clientY ?? (e.touches?.[0]?.clientY ?? null);
        if (clientX === null || clientY === null) return;

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

        const clientX = e.clientX ?? (e.changedTouches?.[0]?.clientX ?? null);
        const clientY = e.clientY ?? (e.changedTouches?.[0]?.clientY ?? null);
        if (clientX === null || clientY === null) return;

        let endNodeElement = null;
        for (const nodeId in nodeElements) {
            const rect = nodeElements[nodeId].getBoundingClientRect();
            if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
                endNodeElement = nodeElements[nodeId];
                break;
            }
        }

        if (endNodeElement && endNodeElement.id !== startNodeForEdge) {
            const endNodeId = endNodeElement.id;

            if (!graph[startNodeForEdge].includes(endNodeId)) {
                graph[startNodeForEdge].push(endNodeId);
                graph[endNodeId].push(startNodeForEdge);

                let svg = graphContainer.querySelector('svg');
                const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                const start = nodeElements[startNodeForEdge];
                const end = endNodeElement;

                line.setAttribute('x1', start.offsetLeft + 25);
                line.setAttribute('y1', start.offsetTop + 25);
                line.setAttribute('x2', end.offsetLeft + 25);
                line.setAttribute('y2', end.offsetTop + 25);
                line.setAttribute('class', 'edge');
                svg.appendChild(line);

                const key = startNodeForEdge < endNodeId
                    ? `${startNodeForEdge}-${endNodeId}`
                    : `${endNodeId}-${startNodeForEdge}`;
                edgeElements[key] = line;
            }
        }
    }

    function updateNodeSelection() {
        const nodes = Object.keys(graph);
        startNodeSelect.innerHTML = nodes.map(n => `<option value="${n}">${n}</option>`).join('');
        startBtn.disabled = nodes.length === 0;
        resetBtn.disabled = nodes.length === 0;
    }

    function updateVisuals() {
        queueDisplay.innerHTML = queue.map(n => `<div class="queue-item">${n}</div>`).join('');
        visitedDisplay.innerHTML = [...visited].map(n => `<div class="visited-item">${n}</div>`).join('');

        for (const node in nodeElements) {
            const el = nodeElements[node];
            el.classList.remove('start', 'current', 'queued', 'visited');

            if (node === startNodeSelect.value) el.classList.add('start');
            if (visited.has(node)) el.classList.add('visited');
            if (queue.includes(node)) el.classList.add('queued');
            if (queue[0] === node) el.classList.add('current');
        }
    }

    function animateBFS() {
        if (queue.length === 0) {
            clearInterval(animationInterval);
            const current = nodeElements[startNodeSelect.value];
            if (current) current.classList.remove('current');
            console.log("BFS complete.");
            return;
        }

        const currentNode = queue.shift();
        const prev = document.querySelector('.node.current');
        if (prev) prev.classList.remove('current');

        if (nodeElements[currentNode]) {
            nodeElements[currentNode].classList.add('current');
        }

        visited.add(currentNode);
        updateVisuals();

        setTimeout(() => {
            for (const neighbor of graph[currentNode]) {
                if (!visited.has(neighbor) && !queue.includes(neighbor)) {
                    queue.push(neighbor);
                    const key = currentNode < neighbor ? `${currentNode}-${neighbor}` : `${neighbor}-${currentNode}`;
                    const edge = edgeElements[key];
                    if (edge) edge.classList.add('active');
                }
            }
            updateVisuals();
        }, 1000);
    }

    function startTraversal() {
        const startNode = startNodeSelect.value;
        if (!startNode || !graph[startNode]) {
            alert("Please select a valid start node.");
            return;
        }

        reset();
        queue.push(startNode);
        visited.add(startNode);
        updateVisuals();

        startBtn.disabled = true;
        resetBtn.disabled = false;
        animationInterval = setInterval(animateBFS, 2000);
    }

    function reset() {
        clearInterval(animationInterval);
        queue = [];
        visited.clear();
        for (const node in nodeElements) {
            const el = nodeElements[node];
            el.classList.remove('start', 'current', 'queued', 'visited');
        }
        for (const key in edgeElements) {
            edgeElements[key].classList.remove('active');
        }
        queueDisplay.innerHTML = '';
        visitedDisplay.innerHTML = '';
        startBtn.disabled = Object.keys(graph).length === 0;
        resetBtn.disabled = true;
        updateNodeSelection();
    }

    startBtn.addEventListener('click', startTraversal);
    resetBtn.addEventListener('click', reset);

    document.body.style.cursor = 'crosshair';
});
